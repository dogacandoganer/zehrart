(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => root.dataset.motion !== 'off' && !reduced.matches && !document.body.classList.contains('motion-paused');
  if (motionAllowed()) requestAnimationFrame(() => document.body.classList.add('motion-ready'));

  const header = document.querySelector('[data-header]');
  const onScroll = () => header?.classList.toggle('scrolled', scrollY > 28);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  const menu = document.querySelector('.menu-toggle');
  menu?.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menu.setAttribute('aria-expanded', String(open));
    if (open) document.querySelector('#site-nav a')?.focus();
  });
  document.querySelectorAll('#site-nav a').forEach(a => a.addEventListener('click', () => {
    document.body.classList.remove('menu-open'); menu?.setAttribute('aria-expanded','false');
  }));

  const toggle = document.querySelector('[data-motion-toggle]');
  toggle?.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Hareketi sürdür' : 'Hareketi duraklat';
  });

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
  }, {threshold:.12}) : null;
  document.querySelectorAll('.reveal').forEach(el => observer ? observer.observe(el) : el.classList.add('in-view'));

  const depth = document.querySelector('[data-depth]');
  if (depth && matchMedia('(pointer:fine)').matches && motionAllowed()) {
    let x=0,y=0,tx=0,ty=0,frame=0;
    const render=()=>{x+=(tx-x)*.08;y+=(ty-y)*.08;depth.style.transform=`translate3d(${x}px,${y}px,0) rotateX(${-y*.08}deg) rotateY(${x*.08}deg)`;frame=requestAnimationFrame(render)};
    depth.addEventListener('pointermove',e=>{const r=depth.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*12;ty=((e.clientY-r.top)/r.height-.5)*10});
    depth.addEventListener('pointerleave',()=>{tx=ty=0}); frame=requestAnimationFrame(render);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else frame=requestAnimationFrame(render)});
  }

  const gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    const cards=()=>[...gallery.children], count=document.querySelector('[data-gallery-count]');
    const update=()=>{const list=cards();let idx=0,best=Infinity;list.forEach((c,i)=>{const d=Math.abs(c.offsetLeft-(list[0]?.offsetLeft||0)-gallery.scrollLeft);if(d<best){best=d;idx=i}});if(count)count.textContent=String(idx+1).padStart(2,'0')+' / '+String(list.length).padStart(2,'0');document.querySelector('[data-gallery-prev]').disabled=gallery.scrollLeft<2;document.querySelector('[data-gallery-next]').disabled=gallery.scrollLeft>=gallery.scrollWidth-gallery.clientWidth-2};
    const go=d=>{const list=cards();if(!list.length)return;const step=list[0].offsetWidth+parseFloat(getComputedStyle(gallery).gap);gallery.scrollBy({left:d*step,behavior:motionAllowed()?'smooth':'auto'})};
    document.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>go(-1));
    document.querySelector('[data-gallery-next]')?.addEventListener('click',()=>go(1));
    gallery.addEventListener('scroll',update,{passive:true});gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(e.key==='ArrowRight'?1:-1)}});document.addEventListener('zehrart:gallery-updated',update);addEventListener('resize',update);update();
  }

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
  document.querySelector('[data-share]')?.addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);alert('Bağlantı kopyalandı.')}}catch{}});

  reduced.addEventListener?.('change',()=>{if(reduced.matches)document.body.classList.remove('motion-ready')});
})();

