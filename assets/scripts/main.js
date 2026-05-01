import { initViewer } from './viewer.js';

const VERSION='20260501';
async function applyContent(){try{const r=await fetch(`assets/content/site-config.json?v=${VERSION}`);if(!r.ok)return;const c=await r.json();document.querySelectorAll('[data-text]').forEach(el=>{const k=el.dataset.text;if(c[k])el.textContent=c[k]});document.querySelectorAll('[data-price]').forEach(el=>{const k=el.dataset.price;if(c.prices?.[k])el.textContent=c.prices[k]});}catch{}}

const topbar=document.querySelector('.topbar'),floating=document.querySelector('.floating'),formCard=document.getElementById('form');
function chrome(){topbar.classList.toggle('scrolled',scrollY>8);if(floating&&formCard){const r=formCard.getBoundingClientRect();floating.classList.toggle('hide',scrollY<420||(r.top<innerHeight*.74&&r.bottom>120))}}
chrome();addEventListener('scroll',chrome,{passive:true});addEventListener('resize',chrome);
const freeRadio=document.getElementById('freeRadio'),freeBlock=document.getElementById('freeBlock'),reason=document.getElementById('reason'),radios=[...document.querySelectorAll('input[type=radio]')],choices=[...document.querySelectorAll('.choice')];
function updateChoices(){freeBlock.classList.toggle('show',freeRadio.checked);reason.required=freeRadio.checked;choices.forEach(c=>c.classList.toggle('selected',c.querySelector('input')?.checked))}
radios.forEach(r=>r.addEventListener('change',updateChoices));updateChoices();
document.querySelectorAll('[data-format]').forEach(link=>{link.addEventListener('click',()=>{const radio=document.querySelector('input[name=format][value="'+link.dataset.format+'"]');if(radio){radio.checked=true;updateChoices()}})});

document.getElementById('signupForm').addEventListener('submit',e=>{e.preventDefault();if(freeRadio.checked&&!reason.value.trim()){reason.focus();return}
const name=document.getElementById('name').value.trim(),contact=document.getElementById('contact').value.trim(),phone=document.getElementById('phone').value.trim(),projectIdea=document.getElementById('projectIdea').value.trim(),comment=document.getElementById('comment').value.trim(),selected=document.querySelector('input[name=format]:checked').value,experience=document.querySelector('input[name=experience]:checked').value,formatText=selected==='vip'?'VIP — 5000 ₽':selected==='free'?'Бесплатно — без статуэтки':'Стандарт — 2500 ₽';
const body=['Заявка на мастер-класс','Источник: сайт мастер-класса','','Дата: 23 мая, 14:00','Формат: '+formatText,'Имя: '+name,'Контакт: '+contact,phone?'Телефон: '+phone:'','Опыт: '+experience,'Что хочет сделать или разобрать: '+projectIdea,freeRadio.checked?'Причина бесплатного участия: '+reason.value.trim():'',comment?'Комментарий: '+comment:'','Оплата: только после подтверждения места','Согласие на связь: да'].filter(Boolean).join('\n');
location.href='mailto:projects.step3d@gmail.com?subject='+encodeURIComponent('Заявка на мастер-класс')+'&body='+encodeURIComponent(body);document.getElementById('successBox').classList.add('show');
});

document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item'),open=item.classList.toggle('open');btn.setAttribute('aria-expanded',String(open))}));
document.querySelectorAll('[data-doc]').forEach(btn=>btn.addEventListener('click',()=>{const t=document.getElementById(btn.dataset.doc);document.querySelectorAll('.doc').forEach(d=>{if(d!==t)d.classList.remove('show')});t.classList.toggle('show')}));
document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(btn.dataset.copy);const old=btn.textContent;btn.textContent='Скопировано';btn.classList.add('copied');setTimeout(()=>{btn.textContent=old;btn.classList.remove('copied')},1500)}catch{alert(btn.dataset.copy)}}));
document.getElementById('essayMore')?.addEventListener('click',e=>{const full=document.getElementById('essayFull'),open=full.classList.toggle('show');e.currentTarget.textContent=open?'Свернуть':'Подробнее...';e.currentTarget.setAttribute('aria-expanded',String(open))});
applyContent();initViewer();
