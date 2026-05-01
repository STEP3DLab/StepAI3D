const topbar = document.querySelector('.topbar');

const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('mainNav');
const backToTopButton = document.querySelector('.back-to-top');
const progressBar = document.getElementById('readingProgressBar');
const countdown = document.getElementById('countdown');

function closeNav() {
  nav?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
  if (navToggle) navToggle.textContent = '☰';
}

navToggle?.addEventListener('click', () => {
  const isOpen = nav?.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
  navToggle.textContent = isOpen ? '✕' : '☰';
});

document.addEventListener('click', (event) => {
  if (!nav?.classList.contains('open')) return;
  if (event.target instanceof Element && (event.target.closest('.nav') || event.target.closest('.nav-toggle'))) return;
  closeNav();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNav();
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => closeNav());
});

backToTopButton?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


function updateTopbarState() {
  topbar?.classList.toggle('scrolled', window.scrollY > 6);
  backToTopButton?.classList.toggle('visible', window.scrollY > 420);
  const h = document.documentElement;
  const progress = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
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
  choices.forEach((choice) => choice.classList.toggle('selected', choice.querySelector('input')?.checked));
}
document.querySelectorAll('input[type="radio"]').forEach((radio) => radio.addEventListener('change', updateChoices));
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

function normalizePhone(rawPhone) {
  const digits = rawPhone.replace(/[\s()\-]/g, '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+7')) return `+7${digits.slice(2).replace(/\D/g, '')}`;
  if (digits.startsWith('8')) return `+7${digits.slice(1).replace(/\D/g, '')}`;
  return digits;
}

function parseAndValidateContacts({ phone, contact }) {
  const normalizedPhone = normalizePhone(phone);
  const telegramPattern = /^@[a-zA-Z0-9_]{5,32}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let telegram = '';
  let email = '';

  if (contact) {
    if (contact.startsWith('@')) {
      if (!telegramPattern.test(contact)) return { isValid: false, error: 'Telegram укажите в формате @username.' };
      telegram = contact;
    } else {
      if (!emailPattern.test(contact)) return { isValid: false, error: 'Укажите корректный e-mail или Telegram.' };
      email = contact;
    }
  }

  if (normalizedPhone && normalizedPhone.length !== 12) {
    return { isValid: false, error: 'Телефон укажите в формате +79991234567 или 89991234567.' };
  }

  return { isValid: true, phone: normalizedPhone, telegram, email };
}

signupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (isSubmitted) return;

  const name = document.getElementById('name')?.value.trim() || '';
  const contact = document.getElementById('contact')?.value.trim() || '';
  const phone = document.getElementById('phone')?.value.trim() || '';
  const experience = document.getElementById('experience')?.value.trim() || '';
  const projectIdea = document.getElementById('projectIdea')?.value.trim() || '';
  const comment = document.getElementById('comment')?.value.trim() || '';
  const consent = Boolean(document.getElementById('consent')?.checked);
  const participationFormat = document.querySelector('input[name="format"]:checked')?.value || 'free';
  const contacts = parseAndValidateContacts({ phone, contact });

  if (!name || !contact || !projectIdea) {
    setFormMessage('Заполните обязательные поля: имя, контакт и идея проекта.');
    return;
  }
  if (!contacts.isValid) return setFormMessage(contacts.error);
  if (!consent) return setFormMessage('Подтвердите согласие на обработку персональных данных.');

  const payload = {
    name,
    phone: contacts.phone,
    telegram: contacts.telegram,
    email: contacts.email,
    experience,
    projectIdea,
    comment,
    participationFormat,
    page: window.location.href,
    userAgent: navigator.userAgent
  };

  setFormMessage('Отправляем заявку…', 'success');
  submitButton.textContent = 'Отправка...';
  submitButton.disabled = true;

  try {
    await fetch(FORM_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    isSubmitted = true;
    signupForm.reset();
    updateChoices();
    setFormMessage('Заявка принята. Мы свяжемся с вами для подтверждения места.', 'success');
  } catch {
    setFormMessage('Ошибка отправки. Пожалуйста, напишите нам в Telegram.', 'error');
  } finally {
    submitButton.textContent = defaultButtonText;
    submitButton.disabled = isSubmitted;
  }
});

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  const temp = document.createElement('input');
  temp.value = value;
  document.body.append(temp);
  temp.select();
  const ok = document.execCommand('copy');
  temp.remove();
  return ok;
}

document.querySelectorAll('.copy-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await copyText(button.dataset.copy || '');
      const original = button.textContent;
      button.textContent = 'Скопировано';
      setTimeout(() => { button.textContent = original; }, 1500);
    } catch {
      button.textContent = 'Скопируйте вручную';
    }
  });
});


function updateCountdown() {
  if (!countdown) return;
  const eventDate = new Date('2026-05-23T14:00:00+03:00');
  const diff = eventDate - new Date();
  if (diff <= 0) {
    countdown.textContent = 'Мастер-класс уже сегодня. Оставьте заявку для подтверждения участия.';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  countdown.textContent = `До старта осталось ${d} дн. ${h} ч.`;
}
updateCountdown();
setInterval(updateCountdown, 60000);

const requiredFields = ['name','contact','projectIdea'];
requiredFields.forEach((id) => {
  const el = document.getElementById(id);
  el?.addEventListener('blur', () => el.classList.toggle('error', !el.value.trim()));
  el?.addEventListener('input', () => el.classList.remove('error'));
});

const STORAGE_KEY = 'stepai3d_form_draft_v2';
const draftFields = ['name','contact','phone','experience','projectIdea','comment'];
function saveDraft() {
  if (!signupForm || isSubmitted) return;
  const data = Object.fromEntries(draftFields.map((id)=>[id, document.getElementById(id)?.value || '']));
  data.format = document.querySelector('input[name="format"]:checked')?.value || 'free';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    draftFields.forEach((id)=>{ const el=document.getElementById(id); if (el && data[id]) el.value = data[id]; });
    const radio = document.querySelector(`input[name=format][value="${data.format}"]`);
    if (radio) radio.checked = true;
    updateChoices();
  } catch {}
}
loadDraft();
signupForm?.addEventListener('input', saveDraft);
