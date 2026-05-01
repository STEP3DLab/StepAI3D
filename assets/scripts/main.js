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

document.getElementById('signupForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const box = document.getElementById('successBox');
  if (box) {
    box.textContent = 'Спасибо! Форма заполнена. На этом этапе отправка пока не подключена: техническая интеграция будет добавлена отдельно.';
    box.classList.add('show');
  }
});
