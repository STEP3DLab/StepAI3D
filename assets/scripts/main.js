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
  const telegram = contact.startsWith('@') ? contact : '';
  const email = contact.includes('@') && !contact.startsWith('@') ? contact : '';

  // Валидация MVP: обязательно имя, контакт (телефон или Telegram) и согласие.
  if (!name) {
    setFormMessage('Укажите, пожалуйста, ваше имя.');
    return;
  }
  if (!phone && !telegram) {
    setFormMessage('Укажите телефон или Telegram для связи.');
    return;
  }
  if (!consent) {
    setFormMessage('Нужно согласие на обработку персональных данных.');
    return;
  }

  const payload = {
    name,
    phone,
    telegram,
    email,
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
