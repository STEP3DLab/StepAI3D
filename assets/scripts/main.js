const topbar=document.querySelector('.topbar');
function chrome(){topbar?.classList.toggle('scrolled',window.scrollY>6);}chrome();addEventListener('scroll',chrome,{passive:true});

document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item');const open=item.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));}));

const freeRadio=document.getElementById('freeRadio');
const choices=[...document.querySelectorAll('.choice')];
function updateChoices(){choices.forEach(c=>c.classList.toggle('selected',c.querySelector('input')?.checked));}
document.querySelectorAll('input[type=radio]').forEach(r=>r.addEventListener('change',updateChoices));updateChoices();
document.querySelectorAll('[data-format]').forEach(link=>link.addEventListener('click',()=>{const radio=document.querySelector(`input[name=format][value="${link.dataset.format}"]`);if(radio){radio.checked=true;updateChoices();}}));

document.getElementById('signupForm')?.addEventListener('submit',e=>{
  e.preventDefault();
  const box=document.getElementById('successBox');
  if(box){box.textContent='Спасибо! Форма заполнена. На этом этапе отправка пока не подключена: техническая интеграция будет добавлена отдельно.';box.classList.add('show');}
});
