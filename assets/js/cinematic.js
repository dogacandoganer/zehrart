(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer:fine)');
  const allowed = () => !reduced.matches && document.documentElement.dataset.motion !== 'off' && !document.body.classList.contains('motion-paused');
  const animations = new Set();
  function animate(el, frames, options) {
    if (!allowed() || !el.animate) return Promise.resolve();
    if(document.documentElement.dataset.motionIntensity==='calm')options={...options,duration:Math.round(options.duration*.7)};
    const animation = el.animate(frames, options); animations.add(animation);
    return animation.finished.catch(() => {}).finally(() => animations.delete(animation));
  }
  function stopMotion() {
    if (allowed()) return;
    animations.forEach(a => a.finish());
    document.querySelectorAll('.art-frame').forEach(el => {el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y');});
  }
  reduced.addEventListener('change', stopMotion);
  new MutationObserver(stopMotion).observe(document.documentElement, {attributes:true,attributeFilter:['data-motion']});
  new MutationObserver(stopMotion).observe(document.body, {attributes:true,attributeFilter:['class']});

  const progress = document.createElement('div'); progress.className='reading-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
  const sections = [...document.querySelectorAll('main>section[id]')];
  const links = [...document.querySelectorAll('#site-nav a')];
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame=0;
    const max = document.documentElement.scrollHeight-innerHeight;
    document.documentElement.style.setProperty('--read-progress', max>0 ? Math.min(1,scrollY/max) : 0);
    const current=sections.filter(s=>s.getBoundingClientRect().top<=innerHeight*.32).at(-1)?.id||'ana-sayfa';
    const target = ['manifesto','manifesto-tam','biyografi'].includes(current) ? 'sanatci' : current;
    links.forEach(a => {if(a.hash==='#'+target)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  addEventListener('resize',updateScroll);updateScroll();

  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}
  }),{threshold:.08});
  document.querySelectorAll('.collection-preview,.artist-intro,.manifesto-full,.artist-page,.contact-page,.inquiry-band').forEach(section=>{
    const seam=document.createElement('div');seam.className='section-seam';seam.setAttribute('aria-hidden','true');
    seam.innerHTML='<span class="seam-plane"></span><svg viewBox="0 0 1400 70" preserveAspectRatio="none"><path pathLength="1" d="M0 8 168 35 420 13 658 45 938 23 1162 44 1400 1"/><path pathLength="1" opacity=".35" d="M0 1 250 15 480 9 700 32 1050 14 1400 18"/></svg>';
    section.prepend(seam);observer.observe(seam);
  });
  document.querySelectorAll('.manifesto-full .rich-text p,.portfolio-heading,.artist-page-copy,.contact-page>div:not(.section-seam),.inquiry-band h2').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
  function observeCards(){
    document.querySelectorAll('.art-frame img').forEach(img=>{
      const size=()=>{if(img.naturalWidth&&img.naturalHeight)img.closest('.art-card').style.setProperty('--art-ratio',img.naturalWidth/img.naturalHeight);};
      if(img.complete)size();else img.addEventListener('load',size,{once:true});
    });
    document.querySelectorAll('[data-portfolio] .art-card').forEach((el,i)=>{el.classList.remove('in-view');el.style.transitionDelay=(i%3)*65+'ms';observer.observe(el);});
  }
  document.addEventListener('zehrart:gallery-updated',observeCards);observeCards();

  // Temporary slices of the SAME approved image assemble without changing its proportions.
  const scene=document.querySelector('.hero-scene');
  async function intro(){
    if(!scene||!allowed()||innerWidth<981||document.documentElement.dataset.motionHero==='off')return;
    const clips=['polygon(0 0,36% 0,22% 100%,0 100%)','polygon(36% 0,57% 0,48% 100%,22% 100%)','polygon(57% 0,100% 0,100% 100%,48% 100%)'];
    await Promise.all(clips.map(async(clip,i)=>{
      const layer=document.createElement('div');layer.className='hero-slice';layer.setAttribute('aria-hidden','true');layer.style.clipPath=clip;
      const copy=scene.cloneNode();copy.removeAttribute('class');copy.alt='';layer.append(copy);scene.parentElement.append(layer);
      await animate(layer,[{opacity:0,transform:`translate(${(i-1)*18}px,${i===1?12:-8}px)`},{opacity:1,transform:'translate(0,0)'}],{duration:1150,delay:i*95,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});layer.remove();
    }));
  }
  if(scene?.complete)intro();else scene?.addEventListener('load',intro,{once:true});
  document.addEventListener('pointermove',event=>{
    const frame=event.target.closest?.('.art-frame');if(!frame||!allowed()||!fine.matches||innerWidth<981||document.documentElement.dataset.motionCards==='off')return;
    const r=frame.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;
    frame.style.setProperty('--tilt-x',((.5-y)*3)+'deg');frame.style.setProperty('--tilt-y',((x-.5)*4)+'deg');
    frame.style.setProperty('--shine-x',x*100+'%');frame.style.setProperty('--shine-y',y*100+'%');
  },{passive:true});
  document.addEventListener('pointerout',event=>{
    const frame=event.target.closest?.('.art-frame');if(frame&&!frame.contains(event.relatedTarget)){frame.style.setProperty('--tilt-x','0deg');frame.style.setProperty('--tilt-y','0deg');}
  });

  const dialog=document.querySelector('[data-lightbox]');if(!dialog)return;
  const image=dialog.querySelector('img'),heading=dialog.querySelector('h3'),meta=dialog.querySelector('p');
  let origin=null,items=[],index=0,busy=false,previousOverflow='';
  const imageBounds=el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el),w=r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),h=r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom);
    const scale=Math.min(w/el.naturalWidth,h/el.naturalHeight),width=el.naturalWidth*scale,height=el.naturalHeight*scale;
    return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height};
  };
  function fill(button){image.src=button.dataset.src;image.alt=button.dataset.title||'Eser';heading.textContent=button.dataset.title;meta.textContent=button.dataset.meta;dialog.querySelector('[data-art-position]').textContent=`${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;dialog.querySelector('a').href='mailto:'+(document.documentElement.dataset.email||'ariogluzehra@gmail.com')+'?subject='+encodeURIComponent('Eser hakkında: '+button.dataset.title);let description=dialog.querySelector('.lightbox-description'),detail=dialog.querySelector('.lightbox-detail');if(!description){description=document.createElement('p');description.className='lightbox-description';meta.after(description);}description.textContent=button.dataset.description||'';description.hidden=!description.textContent;if(!detail){detail=document.createElement('a');detail.className='lightbox-detail';detail.textContent='Eserin tüm bilgileri →';dialog.querySelector('.lightbox-navigation').before(detail);}detail.href=button.dataset.detail||'#';detail.hidden=!button.dataset.detail;}
  async function open(button){
    if(busy||dialog.open)return;busy=true;origin=button;
    items=[...button.closest('[data-gallery],[data-portfolio]').querySelectorAll('[data-art-open]')].filter(b=>!b.closest('[hidden]'));index=items.indexOf(button);fill(button);
    previousOverflow=document.body.style.overflow;document.body.classList.add('art-open');dialog.showModal();
    try{await image.decode();}catch{}
    if(!dialog.open){busy=false;return;}
    const from=imageBounds(button.querySelector('img')),to=imageBounds(image);
    if(to.width&&from.width){const dx=from.left+from.width/2-to.left-to.width/2,dy=from.top+from.height/2-to.top-to.height/2;
      await animate(image,[{transform:`translate(${dx}px,${dy}px) scale(${from.width/to.width},${from.height/to.height})`,opacity:.65},{transform:'none',opacity:1}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    busy=false;
  }
  async function close(){
    if(!dialog.open)return;if(busy){dialog.close();busy=false;return;}busy=true;
    await animate(image,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.96)'}],{duration:220,easing:'ease-in'});
    dialog.close();busy=false;
  }
  dialog.addEventListener('close',()=>{document.body.classList.remove('art-open');document.body.style.overflow=previousOverflow;origin?.focus({preventScroll:true});});
  async function change(direction){
    if(busy||!items.length)return;busy=true;index=(index+direction+items.length)%items.length;
    await animate(image,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*18}px)`}],{duration:150});
    fill(items[index]);try{await image.decode();}catch{}
    await animate(image,[{opacity:0,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'none'}],{duration:300,easing:'ease-out'});busy=false;
  }
  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-art-open]');if(button&&!event.ctrlKey&&!event.metaKey){event.preventDefault();open(button);}});
  dialog.querySelector('[data-lightbox-close]').addEventListener('click',close);
  dialog.querySelector('[data-art-prev]').addEventListener('click',()=>change(-1));
  dialog.querySelector('[data-art-next]').addEventListener('click',()=>change(1));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();change(event.key==='ArrowRight'?1:-1);}});
})();
