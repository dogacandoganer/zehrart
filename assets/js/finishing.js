(() => {
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#site-nav'),toggle=document.querySelector('[data-motion-toggle]');
  const mobile=matchMedia('(max-width:980px)');
  const sync=()=>{const open=document.body.classList.contains('menu-open');if(nav)nav.inert=mobile.matches&&!open;};
  menu?.addEventListener('click',()=>{sync();if(document.body.classList.contains('menu-open'))nav?.querySelector('a')?.focus();});mobile.addEventListener('change',()=>{document.body.classList.remove('menu-open');menu?.setAttribute('aria-expanded','false');sync();});
  nav?.addEventListener('click',()=>{sync();});sync();
  document.addEventListener('keydown',e=>{if(!document.body.classList.contains('menu-open'))return;if(e.key==='Escape'){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');sync();menu.focus();}if(e.key==='Tab'){const items=[menu,...nav.querySelectorAll('a'),toggle].filter(Boolean);const i=items.indexOf(document.activeElement);e.preventDefault();items[(i+(e.shiftKey?-1:1)+items.length)%items.length].focus();}});
  const label=()=>{if(toggle){toggle.setAttribute('aria-label',toggle.textContent.trim());toggle.title=toggle.textContent.trim();}};toggle?.addEventListener('click',label);label();
  const email=document.querySelector('[data-cms-email]');const host=document.querySelector('.static-contact');
  if(email&&host){const button=document.createElement('button');button.type='button';button.className='email-copy';button.textContent='E-posta adresini kopyala';const result=document.createElement('p');result.className='contact-feedback';result.setAttribute('role','status');button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(email.textContent.trim());result.textContent='E-posta adresi kopyalandı.';}catch{result.textContent=email.textContent.trim();}});host.append(button,result);}
  // PHP supplies its own archive filters; add these only to the static export.
  if(document.documentElement.dataset.cms==='server')return;
  const grid=document.querySelector('[data-portfolio]');if(!grid)return;
  const filter=document.createElement('div');filter.className='archive-filter';filter.innerHTML='<label>Eser ara<input type="search" placeholder="Eser adı…" aria-controls="artwork-archive"></label><label>Durum<select aria-controls="artwork-archive"><option value="">Tüm eserler</option value="available">Satışta</option><option value="private">Özel koleksiyon</option><option value="sold">Satıldı</option><option value="reserved">Rezerve</option></select></label><p role="status" aria-live="polite"></p>';grid.id='artwork-archive';grid.before(filter);
  const run=()=>{const term=filter.querySelector('input').value.toLocaleLowerCase('tr').trim(),status=filter.querySelector('select').value;let count=0;grid.querySelectorAll('.art-card').forEach(card=>{card.hidden=!card.textContent.toLocaleLowerCase('tr').includes(term)||(status&&!card.querySelector('.status-'+status));if(!card.hidden)count++;});filter.querySelector('p').textContent=count?`${count} eser`:'Eşleşen eser bulunamadı.';};filter.addEventListener('input',run);run();
})();
