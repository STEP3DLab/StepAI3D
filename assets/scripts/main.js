const topbar = document.querySelector('.topbar');

function updateTopbarState() {
  topbar?.classList.toggle('scrolled', window.scrollY > 6);
}

updateTopbarState();
addEventListener('scroll', updateTopbarState, { passive: true });

document.querySelectorAll('.faq-q').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const open = item.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
  });
});

const choices = [...document.querySelectorAll('.choice')];

function updateChoices() {
  choices.forEach((choice) => {
    choice.classList.toggle('selected', choice.querySelector('input')?.checked);
  });
}

document.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener('change', updateChoices);
});

updateChoices();

document.querySelectorAll('[data-format]').forEach((link) => {
  link.addEventListener('click', () => {
    const radio = document.querySelector(`input[name=format][value="${link.dataset.format}"]`);
    if (radio) {
      radio.checked = true;
      updateChoices();
    }
  });
});

// Endpoint Google Apps Script для отправки заявок в таблицу.
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz6yb9pHwKY9-6zhvkmKMTD1BBo66ehL5FKEJ-FZAMUYiW6NWpqjcMue3K6gagh_bfn/exec';

const signupForm = document.getElementById('signupForm');
const formMessage = document.getElementById('formMessage');
const submitButton = signupForm?.querySelector('button[type="submit"]');
const defaultButtonText = submitButton?.textContent || 'Отправить заявку';
let isSubmitted = false;

function setFormMessage(text, status = 'error') {
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.className = `form-message ${status}`;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmContent: params.get('utm_content') || '',
    utmTerm: params.get('utm_term') || ''
  };
}

function normalizePhone(rawPhone) {
  const digits = rawPhone.replace(/[\s()\-]/g, '').replace(/[^\d+]/g, '');

  if (!digits) {
    return '';
  }

  if (digits.startsWith('+7')) {
    return `+7${digits.slice(2).replace(/\D/g, '')}`;
  }

  if (digits.startsWith('8')) {
    return `+7${digits.slice(1).replace(/\D/g, '')}`;
  }

  return digits;
}

function parseAndValidateContacts({ phone, contact }) {
  const normalizedPhone = normalizePhone(phone);
  const expectedPhoneLength = 12; // +7 и 10 цифр номера.
  const minPhoneLength = 11;
  const telegramPattern = /^@[a-zA-Z0-9_]{5,32}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  let telegram = '';
  let email = '';

  if (contact) {
    if (contact.startsWith('@')) {
      if (!telegramPattern.test(contact)) {
        return {
          isValid: false,
          error: 'Telegram укажите в формате @username (латиница, цифры, _, 5–32 символа).'
        };
      }
      telegram = contact;
    } else {
      if (!emailPattern.test(contact)) {
        return {
          isValid: false,
          error: 'Email укажите в формате name@example.com или используйте Telegram в формате @username.'
        };
      }
      email = contact;
    }
  }

  if (normalizedPhone && normalizedPhone.length < minPhoneLength) {
    return {
      isValid: false,
      error: 'Телефон слишком короткий. Укажите номер в формате +79991234567 или 89991234567.'
    };
  }

  if (normalizedPhone && normalizedPhone.length !== expectedPhoneLength) {
    return {
      isValid: false,
      error: 'Телефон укажите в формате +79991234567 или 89991234567.'
    };
  }

  return {
    isValid: true,
    phone: normalizedPhone,
    telegram,
    email
  };
}

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (isSubmitted) {
    return;
  }

  const name = document.getElementById('name')?.value.trim() || '';
  const contact = document.getElementById('contact')?.value.trim() || '';
  const phone = document.getElementById('phone')?.value.trim() || '';
  const comment = document.getElementById('projectIdea')?.value.trim() || '';
  const consent = Boolean(document.getElementById('consent')?.checked);
  const formatNode = document.querySelector('input[name="format"]:checked');
  const participationFormat = formatNode?.value || 'standard';
  const contacts = parseAndValidateContacts({ phone, contact });

  // Валидация MVP: обязательно имя, контакт (телефон, Telegram или email) и согласие.
  if (!name) {
    setFormMessage('Укажите, пожалуйста, ваше имя.');
    return;
  }
  if (!contacts.isValid) {
    setFormMessage(contacts.error);
    return;
  }
  if (!contacts.phone && !contacts.telegram && !contacts.email) {
    setFormMessage('Укажите телефон в формате +79991234567 (или 89991234567), Telegram @username или email name@example.com.');
    return;
  }
  if (!consent) {
    setFormMessage('Нужно согласие на обработку персональных данных.');
    return;
  }

  const payload = {
    name,
    phone: contacts.phone,
    telegram: contacts.telegram,
    email: contacts.email,
    participationFormat,
    needFigure: participationFormat !== 'free',
    tariff: participationFormat,
    seats: 1,
    comment,
    consent,
    page: window.location.href,
    ...getUtmParams(),
    userAgent: navigator.userAgent
  };

  setFormMessage('');
  if (submitButton) {
    submitButton.textContent = 'Отправляем...';
    submitButton.disabled = true;
  }

  try {
    // Для no-cors нельзя прочитать ответ, успехом считаем отсутствие исключения fetch.
    await fetch(FORM_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    isSubmitted = true;
    signupForm.reset();
    updateChoices();
    setFormMessage('Заявка отправлена. Мы свяжемся с вами.', 'success');
  } catch {
    setFormMessage('Не удалось отправить заявку. Напишите нам в Telegram.');
  } finally {
    if (submitButton) {
      submitButton.textContent = defaultButtonText;
      submitButton.disabled = isSubmitted;
    }
  }
});
