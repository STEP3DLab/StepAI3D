import { initViewer } from './viewer.js';

const VERSION='20260501';
async function applyContent(){try{const r=await fetch(`assets/content/site-config.json?v=${VERSION}`);if(!r.ok)return;const c=await r.json();document.querySelectorAll('[data-text]').forEach(el=>{const k=el.dataset.text;if(c[k])el.textContent=c[k]});document.querySelectorAll('[data-event]').forEach(el=>{const k=el.dataset.event;if(k==='timeText'&&c.start_time)el.textContent=c.start_time;else if(c[k])el.textContent=c[k]});document.querySelectorAll('[data-price]').forEach(el=>{const k=el.dataset.price;if(c.prices?.[k])el.textContent=c.prices[k]});const factsContainer=document.querySelector('.facts');if(factsContainer){const facts=[];if(c.date_short)facts.push({label:'Дата',value:c.date_short});if(c.start_time)facts.push({label:'Начало',value:c.start_time});if(c.from_price)facts.push({label:'Цена',value:c.from_price});if(c.places)facts.push({label:'Мест',value:c.places});factsContainer.innerHTML=facts.map(f=>`<div class="fact"><span>${f.label}</span><strong>${f.value}</strong></div>`).join('');}}catch{}}

const topbar=document.querySelector('.topbar'),floating=document.querySelector('.floating'),formCard=document.getElementById('form');
function chrome(){topbar.classList.toggle('scrolled',scrollY>8);if(floating&&formCard){const r=formCard.getBoundingClientRect();floating.classList.toggle('hide',scrollY<420||(r.top<innerHeight*.74&&r.bottom>120))}}
chrome();addEventListener('scroll',chrome,{passive:true});addEventListener('resize',chrome);
const freeRadio=document.getElementById('freeRadio'),freeBlock=document.getElementById('freeBlock'),reason=document.getElementById('reason'),radios=[...document.querySelectorAll('input[type=radio]')],choices=[...document.querySelectorAll('.choice')];
function updateChoices(){freeBlock.classList.toggle('show',freeRadio.checked);reason.required=freeRadio.checked;choices.forEach(c=>c.classList.toggle('selected',c.querySelector('input')?.checked))}
radios.forEach(r=>r.addEventListener('change',updateChoices));updateChoices();
document.querySelectorAll('[data-format]').forEach(link=>{link.addEventListener('click',()=>{const radio=document.querySelector('input[name=format][value="'+link.dataset.format+'"]');if(radio){radio.checked=true;updateChoices()}})});

const formStartedAt=document.getElementById('formStartedAt');
if(formStartedAt){formStartedAt.value=String(Date.now());}
if(document.getElementById('name')){document.querySelectorAll('input,textarea').forEach(field=>field.addEventListener('input',()=>{if(formStartedAt)formStartedAt.value=String(Date.now());}));}

const CONTACT_EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_TG=/^@?[a-zA-Z0-9_]{5,32}$/;
function validContact(value){const normalized=value.trim().replace(/\s/g,'');return CONTACT_EMAIL.test(normalized.toLowerCase())||CONTACT_TG.test(normalized);}
function setStatus(message,error=false){const successBox=document.getElementById('successBox');if(!successBox)return;successBox.textContent=message;successBox.classList.add('show');successBox.classList.toggle('error',error);}
async function submitFallback(body){
  location.href='mailto:projects.step3d@gmail.com?subject='+encodeURIComponent('Заявка на мастер-класс')+'&body='+encodeURIComponent(body);
}

document.getElementById('signupForm').addEventListener('submit',async e=>{e.preventDefault();const name=document.getElementById('name').value.trim();const contact=document.getElementById('contact').value.trim();const phone=document.getElementById('phone').value.trim();const projectIdea=document.getElementById('projectIdea').value.trim();const comment=document.getElementById('comment').value.trim();const selected=document.querySelector('input[name=format]:checked').value;const experience=document.querySelector('input[name=experience]:checked').value;
if(!name||name.length<2){setStatus('Укажите корректное имя.',true);document.getElementById('name').focus();return}
if(!contact||!validContact(contact)){setStatus('Введите корректный Telegram или e-mail.',true);document.getElementById('contact').focus();return}
if(!projectIdea){setStatus('Опишите, что хотите сделать или разобрать.',true);document.getElementById('projectIdea').focus();return}
if(document.getElementById('consent')&&!document.getElementById('consent').checked){setStatus('Нужно согласие на обработку персональных данных.',true);return}
if(freeRadio.checked&&!reason.value.trim()){setStatus('Кратко укажите причину участия бесплатно.',true);reason.focus();return}
const formatText=selected==='vip'?'VIP — 5000 ₽':selected==='free'?'Бесплатно — без статуэтки':'Стандарт — 2500 ₽';
const body=['Заявка на мастер-класс','Источник: сайт мастер-класса','','Дата: 23 мая, 14:00','Формат: '+formatText,'Имя: '+name,'Контакт: '+contact,phone?'Телефон: '+phone:'','Опыт: '+experience,'Что хочет сделать или разобрать: '+projectIdea,freeRadio.checked?'Причина бесплатного участия: '+reason.value.trim():'',comment?'Комментарий: '+comment:'','Оплата: только после подтверждения места','Согласие на связь: да'].filter(Boolean).join('\n');
const payload={name,contact,phone,projectIdea,comment,freeReason:freeRadio.checked?reason.value.trim():'',format:selected,experience,formStartedAt:formStartedAt?.value||'',honeypot:document.getElementById('company')?.value||'',consent:document.getElementById('consent')?.checked||false};
const submitButton=document.querySelector('#signupForm button[type=submit]');
if(submitButton)submitButton.disabled=true;
let submitted=false;
try{
  const response=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(response.ok){
    const result=await response.json();
    if(result.ok){
      submitted=true;
      setStatus('Заявка принята. Мы ответим в течение 2 часов в рабочее время.',false);
    }
  }
}catch(_){ }
if(!submitted){
  setStatus('Не удалось отправить форму на сервер. Откроется почтовый клиент для отправки заявки вручную.',true);
  await submitFallback(body);
}
if(submitButton)submitButton.disabled=false;
});

document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item'),open=item.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))}));
document.querySelectorAll('[data-doc]').forEach(btn=>btn.addEventListener('click',()=>{const t=document.getElementById(btn.dataset.doc);document.querySelectorAll('.doc').forEach(d=>{if(d!==t)d.classList.remove('show')});t.classList.toggle('show')}));
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(btn.dataset.copy);const old=btn.textContent;btn.textContent='Скопировано';btn.classList.add('copied');setTimeout(()=>{btn.textContent=old;btn.classList.remove('copied')},1500)}catch{alert(btn.dataset.copy)}}));
document.getElementById('essayMore')?.addEventListener('click',e=>{const full=document.getElementById('essayFull'),open=full.classList.toggle('show');e.currentTarget.textContent=open?'Свернуть':'Подробнее...';e.currentTarget.setAttribute('aria-expanded',String(open))});
applyContent();initViewer();
