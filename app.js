const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let siteData=window.ZEHRART_FALLBACK||null;
let activeArtId=null,activeCollection=null,zoomScale=1,panX=0,panY=0,dragging=false,dragStart=null;
const DEFAULT_AMBIENT='#b86a32';
const STATIC_KEY='zehrart_demo_site_v8', INQUIRY_KEY='zehrart_demo_inquiries_v8';
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n)>0?new Intl.NumberFormat('tr-TR').format(Number(n))+' ₺':'Fiyat için iletişime geçin';
const isStatic=()=>true; // GitHub/client demo: always static, no backend required

function hexRgb(hex){const h=String(hex||'').replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return '184,106,50';return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`}
function setAtmosphere(hex=DEFAULT_AMBIENT){document.documentElement.style.setProperty('--ambient-rgb',hexRgb(hex))}
function safeText(sel,value){const el=$(sel);if(el&&value!==undefined&&value!==null)el.textContent=value}

/* intro: short, elegant, fail-safe */
function finishIntro(){const i=$('#intro');if(!i)return;i.classList.add('exit');setTimeout(()=>i.classList.add('done'),760)}
function setupIntro(){
  const intro=$('#intro');if(!intro)return;
  const replay=new URLSearchParams(location.search).has('intro');let seen=false;try{seen=sessionStorage.getItem('zehrIntroSeenV7')==='1'}catch{}
  if(seen&&!replay){intro.classList.add('done');return}
  $('#introSkip')?.addEventListener('click',finishIntro);
  setTimeout(finishIntro,1250);setTimeout(()=>{try{sessionStorage.setItem('zehrIntroSeenV7','1')}catch{}},900);setTimeout(()=>intro.classList.add('done'),2400);
}
setupIntro();

async function loadSite(){
  if(isStatic()){
    try{const local=localStorage.getItem(STATIC_KEY);if(local)return JSON.parse(local)}catch{}
    return window.ZEHRART_FALLBACK;
  }
  try{const c=new AbortController(),t=setTimeout(()=>c.abort(),1800);const r=await fetch('/api/site',{cache:'no-store',signal:c.signal});clearTimeout(t);if(!r.ok)throw 0;return await r.json()}
  catch{return window.ZEHRART_FALLBACK}
}

function bindData(d){
  if(!d)return;siteData=d;
  document.documentElement.style.setProperty('--copper',d.theme?.accent||'#b86a32');document.documentElement.style.setProperty('--gold',d.theme?.gold||'#d5a365');setAtmosphere(d.theme?.accent||DEFAULT_AMBIENT);
  $$('[data-brand]').forEach(x=>x.textContent=d.brand?.name||'ZehrArt');$$('[data-tagline]').forEach(x=>x.textContent=d.brand?.tagline||'MODERN CUBIST LIVING');$$('[data-manifesto]').forEach(x=>x.textContent=d.brand?.manifesto||'Gerçeklik tek bir açıdan ibaret değildir.');safeText('#introLine',d.brand?.introLine);
  safeText('[data-hero-eyebrow]',d.hero?.eyebrow);safeText('[data-hero-a]',d.hero?.titleA);safeText('[data-hero-b]',d.hero?.titleB);safeText('[data-hero-subtitle]',d.hero?.subtitle);if(d.hero?.image)$('#heroImage').src=d.hero.image;safeText('#heroWorkTitle',d.hero?.workTitle);safeText('#heroWorkMeta',d.hero?.workMeta);
  const cta=$('[data-hero-cta]');if(cta)cta.childNodes[0].nodeValue=(d.hero?.cta||'Eserleri Keşfet')+' ';const sec=$('[data-hero-secondary]');if(sec)sec.childNodes[0].nodeValue=(d.hero?.secondary||'Atölyeye Gir')+' ';
  safeText('[data-atelier-eyebrow]',d.atelier?.eyebrow);safeText('[data-atelier-title]',d.atelier?.title);safeText('[data-atelier-text]',d.atelier?.text);
  safeText('[data-artist-eyebrow]',d.artist?.eyebrow);safeText('[data-artist-title]',d.artist?.title);safeText('[data-artist-text]',d.artist?.text);safeText('[data-artist-quote]','“'+String(d.artist?.quote||'').replace(/[“”"]/g,'')+'”');safeText('[data-artist-signature]',d.artist?.signature||'ZehrArt');if(d.artist?.image)$('#artistImage').src=d.artist.image;
  safeText('[data-immersive-eyebrow]',d.immersive?.eyebrow);safeText('[data-immersive-title]',d.immersive?.title);safeText('[data-immersive-text]',d.immersive?.text);
  safeText('[data-collector-eyebrow]',d.collector?.eyebrow);safeText('[data-collector-title]',d.collector?.title);safeText('[data-collector-text]',d.collector?.text);const cc=$('[data-collector-cta]');if(cc)cc.childNodes[0].nodeValue=(d.collector?.cta||'Koleksiyon Danışmanı ile Görüş')+' ';
  if(d.contact){const mail=$('#contactMail');if(mail){mail.href='mailto:'+d.contact.email;mail.childNodes[0].nodeValue=(d.contact.email||'hello@zehrart.com')+' '}const phone=$('#contactPhone');if(phone){phone.textContent=d.contact.phone||'';phone.href='tel:'+String(d.contact.phone||'').replace(/\s/g,'')}safeText('#contactCity',d.contact.city);$('#instagramLink').href=d.contact.instagram||'#';$('#pinterestLink').href=d.contact.pinterest||'#';$('#behanceLink').href=d.contact.behance||'#'}
  if(d.seo){document.title=d.seo.title||document.title;const md=document.querySelector('meta[name="description"]');if(md&&d.seo.description)md.content=d.seo.description}
  renderWorks('all');renderCollections();renderAtelierCards();renderExhibitions();renderPress();renderServices();renderSearch('');safeText('#metricWorks',String(d.works?.length||0).padStart(2,'0'));safeText('#metricCollections',String(new Set((d.works||[]).map(w=>w.collection)).size).padStart(2,'0'));safeText('#year',new Date().getFullYear());
}

function renderWorks(filter='all',collection=''){
  const all=siteData?.works||[];const works=all.filter(w=>(!collection||w.collection===collection)&&(filter==='all'||(filter==='sold'?w.sold:!w.sold)));const grid=$('#workGrid');if(!grid)return;
  grid.innerHTML=works.map((w,i)=>`<article class="work-card ${w.sold?'sold':''}" tabindex="0" data-id="${w.id}" data-atmosphere="${esc(w.atmosphere||DEFAULT_AMBIENT)}" aria-label="${esc(w.title)} eserini incele"><img src="${esc(w.image)}" alt="${esc(w.title)}" loading="${i<3?'eager':'lazy'}" decoding="async"><span class="work-no">${String(i+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}</span>${w.isNew&&!w.sold?'<span class="new-badge">YENİ / NEW</span>':''}${w.sold?'<span class="sold-ribbon">ÖZEL KOLEKSİYONDA</span>':''}<div class="meta"><div><h3>${esc(w.title)}</h3><p>${esc(w.series||w.collection)} · ${esc(w.size)} · ${esc(w.year)}</p></div><b class="price">${w.sold?'PRIVATE COLLECTION':money(w.price)}</b></div></article>`).join('') || '<p class="empty-state">Bu seçkide eser bulunmuyor.</p>';
}
function renderCollections(){
  const stories=siteData?.collectionStories||[];const counts=new Map();(siteData?.works||[]).forEach(w=>counts.set(w.collection,(counts.get(w.collection)||0)+1));const box=$('#collectionGrid');if(!box)return;
  const list=stories.length?stories:[...counts.keys()].slice(0,4).map(n=>({name:n,subtitle:'Koleksiyon hikâyesi',manifesto:'',image:(siteData.works.find(w=>w.collection===n)||{}).image,accent:DEFAULT_AMBIENT}));
  box.innerHTML=list.map(s=>`<article class="collection-card" tabindex="0" data-collection="${esc(s.name)}" data-atmosphere="${esc(s.accent||DEFAULT_AMBIENT)}"><img src="${esc(s.image)}" alt="${esc(s.name)}"><div class="collection-info"><h3>${esc(s.name)}</h3><p>${esc(s.subtitle||'')}</p><span>${counts.get(s.name)||0} ESER · HİKÂYEYİ OKU</span><b>↗</b></div></article>`).join('');
}
function renderAtelierCards(){const box=$('#atelierCards');if(!box)return;box.innerHTML=(siteData?.atelierCards||[]).map(c=>`<article class="atelier-card ${c.tall?'tall':''} reveal"><img src="${esc(c.image)}" alt="${esc(c.title)}"><div><small>${esc(c.eyebrow)}</small><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div></article>`).join('');observeReveals()}
function renderExhibitions(){const box=$('#exhibitionList');if(!box)return;box.innerHTML=(siteData?.exhibitions||[]).map(x=>`<article class="exhibition reveal"><span class="date">${esc(x.date)}</span><h3>${esc(x.title)}</h3><span class="place">${esc(x.venue)}<br>${esc(x.city)}</span><span class="status">${esc(x.status)}</span></article>`).join('');observeReveals()}
function renderPress(){const box=$('#pressGrid');if(!box)return;box.innerHTML=(siteData?.press||[]).map(x=>`<article class="press-card reveal ${x.placeholder?'placeholder':''}"><small>${esc(x.source)} · ${esc(x.date)}</small><h3>${esc(x.title)}</h3><p>${esc(x.excerpt)}</p><a href="${esc(x.link||'#')}">${x.placeholder?'İÇERİK BEKLENİYOR':'OKU ↗'}</a></article>`).join('');observeReveals()}
function renderServices(){const box=$('#serviceGrid');if(!box)return;box.innerHTML=(siteData?.services||[]).map(s=>`<article class="service"><i>${esc(s.icon||'◇')}</i><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}

function setupReveal(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.classList.add('motion-ready');observeReveals()}
function observeReveals(){if(!document.documentElement.classList.contains('motion-ready'))return;const els=$$('.reveal:not([data-observed])');if(!els.length)return;const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -5%'});els.forEach(e=>{e.dataset.observed='1';io.observe(e)})}

function signatureTransition(cb){if(matchMedia('(prefers-reduced-motion: reduce)').matches){cb();return}const t=$('#signatureTransition');t.classList.remove('active');void t.offsetWidth;t.classList.add('active');setTimeout(cb,270);setTimeout(()=>t.classList.remove('active'),760)}
function setupNav(){
  const nav=$('#nav'),toggle=$('#navToggle');toggle?.addEventListener('click',()=>{nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(nav.classList.contains('open')))});$$('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
  $$('.signature-link').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(!id?.startsWith('#'))return;e.preventDefault();signatureTransition(()=>$(id)?.scrollIntoView({behavior:'smooth'}))}));
  const onScroll=()=>{$('#header')?.classList.toggle('scrolled',scrollY>24);const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);$('#scrollProgress').style.width=(scrollY/max*100)+'%';let current='#top';$$('main section[id]').forEach(s=>{if(s.getBoundingClientRect().top<innerHeight*.36)current='#'+s.id});$$('.nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===current))};addEventListener('scroll',onScroll,{passive:true});onScroll();
}
function setupDepth(){
  if(matchMedia('(pointer:coarse)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const stage=$('#heroStage');stage?.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;$$('[data-depth]',stage).forEach(el=>{const d=Number(el.dataset.depth)||1;el.style.transform=`translate3d(${x*d*8}px,${y*d*6}px,${d*6}px) rotateY(${x*d*.6}deg) rotateX(${-y*d*.4}deg)`})});stage?.addEventListener('pointerleave',()=>$$('[data-depth]',stage).forEach(el=>el.style.transform=''));
  const v=$('#artistVisual');v?.addEventListener('pointermove',e=>{const r=v.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;$('#artistImage').style.transform=`scale(1.012) translate(${x*-4}px,${y*-3}px)`;$$('.artist-facet',v).forEach((f,i)=>{const base=[-18,31,58][i]??31;f.style.transform=`translate(${x*(i+1)*5}px,${y*(i+1)*4}px) rotate(${base+x*1.2}deg)`})});v?.addEventListener('pointerleave',()=>{$('#artistImage').style.transform='';const a=$('.af1'),b=$('.af2'),c=$('.af3');if(a)a.style.transform='rotate(-18deg)';if(b)b.style.transform='rotate(31deg)';if(c)c.style.transform='rotate(58deg)'});
}

function currentWork(){return (siteData?.works||[]).find(w=>Number(w.id)===Number(activeArtId))}
function workIndex(){return (siteData?.works||[]).findIndex(w=>Number(w.id)===Number(activeArtId))}
function openArt(id){
  const w=(siteData?.works||[]).find(x=>Number(x.id)===Number(id));if(!w)return;activeArtId=Number(id);setAtmosphere(w.atmosphere||DEFAULT_AMBIENT);resetZoom();$('#modalImage').src=w.image;$('#modalImage').alt=w.title;safeText('#modalCollection',`${w.collection} / ${w.series||''}`);safeText('#modalTitle',w.title);safeText('#modalMeta',`${w.year} · ${w.size} · ${w.technique}`);safeText('#modalDescription',w.description);safeText('#modalStory',w.story||w.description);safeText('#modalArtistNote',w.artistNote||'');safeText('#modalPrice',w.sold?'Özel koleksiyonda':money(w.price));safeText('#modalState',w.sold?'PRIVATE COLLECTION / ÖZEL KOLEKSİYONDA':'AVAILABLE / MEVCUT');$('#modalAction').textContent=w.sold?'Benzer Eserler İçin Bilgi Al ↗':'Eser Hakkında Bilgi Al ↗';renderModalDetails(w);$('#artModal').classList.add('open');$('#artModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open')
}
function renderModalDetails(w){const box=$('#modalDetails');box.innerHTML=(w.detailImages||[]).slice(0,3).map((x,i)=>`<div class="detail-crop" title="${esc(x.caption||'Eser detayı')}"><img src="${esc(x.image||w.image)}" alt="${esc(x.caption||'Eser detayı')}" style="object-position:${esc(x.position||'50% 50%')}"><span>${esc(x.caption||'')}</span></div>`).join('')}
function closeArt(){const a=$('#artModal');a.classList.remove('open');a.setAttribute('aria-hidden','true');if(!$('#roomModal').classList.contains('open')&&!$('#inquiryModal').classList.contains('open'))document.body.classList.remove('modal-open');activeArtId=null;setAtmosphere(siteData?.theme?.accent||DEFAULT_AMBIENT)}
function changeArt(dir){const list=siteData?.works||[];if(!list.length)return;let i=workIndex();i=(i+dir+list.length)%list.length;openArt(list[i].id)}

function applyZoom(){const img=$('#modalImage');if(!img)return;img.style.transform=`translate(${panX}px,${panY}px) scale(${zoomScale})`;safeText('#zoomValue',Math.round(zoomScale*100)+'%');$('#zoomRange').value=Math.round(zoomScale*100)}
function resetZoom(){zoomScale=1;panX=0;panY=0;dragging=false;$('#modalVisual')?.classList.remove('inspect');applyZoom()}
function setZoom(v){zoomScale=Math.max(1,Math.min(3,Number(v)));if(zoomScale===1){panX=0;panY=0}applyZoom()}
function setupZoom(){
  $('#zoomToggle')?.addEventListener('click',()=>{const m=$('#modalVisual');m.classList.toggle('inspect');if(!m.classList.contains('inspect'))resetZoom();else setZoom(1.4)});$('#zoomPlus')?.addEventListener('click',()=>setZoom(zoomScale+.2));$('#zoomMinus')?.addEventListener('click',()=>setZoom(zoomScale-.2));$('#zoomReset')?.addEventListener('click',()=>{panX=panY=0;setZoom(1)});$('#zoomRange')?.addEventListener('input',e=>setZoom(Number(e.target.value)/100));
  const stage=$('#zoomStage');stage?.addEventListener('wheel',e=>{if(!$('#modalVisual').classList.contains('inspect'))return;e.preventDefault();setZoom(zoomScale+(e.deltaY<0?.12:-.12))},{passive:false});stage?.addEventListener('pointerdown',e=>{if(zoomScale<=1||!$('#modalVisual').classList.contains('inspect'))return;dragging=true;dragStart={x:e.clientX-panX,y:e.clientY-panY};stage.setPointerCapture?.(e.pointerId);stage.classList.add('dragging')});stage?.addEventListener('pointermove',e=>{if(!dragging)return;panX=e.clientX-dragStart.x;panY=e.clientY-dragStart.y;applyZoom()});const stop=()=>{dragging=false;stage?.classList.remove('dragging')};stage?.addEventListener('pointerup',stop);stage?.addEventListener('pointercancel',stop);
}

function parseSize(size=''){const nums=String(size).match(/\d+(?:[.,]\d+)?/g)?.map(x=>Number(x.replace(',','.')))||[100,100];return {w:nums[0]||100,h:nums[1]||nums[0]||100}}
function openRoom(){const w=currentWork();if(!w)return;const s=parseSize(w.size),vw=Math.max(180,Math.min(330,s.w*2.35)),vh=vw*(s.h/s.w);$('#roomArtImage').src=w.image;safeText('#roomArtLabel',w.title);safeText('#roomTitle',w.title);safeText('#roomMeta',`${w.size} · ${w.technique}`);safeText('#roomMeasure',`${s.w} cm`);const art=$('#roomArt');art.style.setProperty('--room-w',vw+'px');art.style.setProperty('--room-ratio',`${s.w}/${s.h}`);$('#roomScene').style.setProperty('--room-w',vw+'px');$('#roomScene').style.setProperty('--room-h',vh+'px');$('#roomModal').classList.add('open');$('#roomModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeRoom(){const r=$('#roomModal');r.classList.remove('open');r.setAttribute('aria-hidden','true');if(!$('#artModal').classList.contains('open')&&!$('#inquiryModal').classList.contains('open'))document.body.classList.remove('modal-open')}
function setupRoom(){$('#roomOpen')?.addEventListener('click',openRoom);$('#roomClose')?.addEventListener('click',closeRoom);$('#roomBg')?.addEventListener('click',closeRoom);$$('[data-room]').forEach(b=>b.addEventListener('click',()=>{$$('[data-room]').forEach(x=>x.classList.toggle('active',x===b));$('#roomScene').className='room room-'+b.dataset.room}));$('#roomInquiry')?.addEventListener('click',()=>{closeRoom();openInquiry(currentWork())})}

function openStory(name){const s=(siteData?.collectionStories||[]).find(x=>x.name===name);if(!s)return;activeCollection=s.name;setAtmosphere(s.accent||DEFAULT_AMBIENT);$('#storyImage').src=s.image;safeText('#storyName',s.name);safeText('#storySubtitle',s.subtitle);safeText('#storyManifesto',s.manifesto);$('#storyModal').classList.add('open');$('#storyModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeStory(){const s=$('#storyModal');s.classList.remove('open');s.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');setAtmosphere(siteData?.theme?.accent||DEFAULT_AMBIENT)}
function setupCollections(){const box=$('#collectionGrid');box?.addEventListener('click',e=>{const c=e.target.closest('[data-collection]');if(c)openStory(c.dataset.collection)});box?.addEventListener('keydown',e=>{const c=e.target.closest('[data-collection]');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openStory(c.dataset.collection)}});$('#storyClose')?.addEventListener('click',closeStory);$('#storyBg')?.addEventListener('click',closeStory);$('#storyWorks')?.addEventListener('click',()=>{const c=activeCollection;closeStory();signatureTransition(()=>{renderWorks('all',c);$('#works').scrollIntoView({behavior:'smooth'})})})}

function setupWorks(){
  $('#filters')?.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;$$('#filters button').forEach(x=>x.classList.toggle('active',x===b));renderWorks(b.dataset.filter)});const grid=$('#workGrid');grid?.addEventListener('click',e=>{const c=e.target.closest('[data-id]');if(c)openArt(c.dataset.id)});grid?.addEventListener('keydown',e=>{const c=e.target.closest('[data-id]');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openArt(c.dataset.id)}});grid?.addEventListener('pointerover',e=>{const c=e.target.closest('[data-atmosphere]');if(c)setAtmosphere(c.dataset.atmosphere)});grid?.addEventListener('pointerleave',()=>setAtmosphere(siteData?.theme?.accent||DEFAULT_AMBIENT));
  $('#modalBg')?.addEventListener('click',closeArt);$('#modalClose')?.addEventListener('click',closeArt);$('#prevArt')?.addEventListener('click',()=>changeArt(-1));$('#nextArt')?.addEventListener('click',()=>changeArt(1));$('#modalAction')?.addEventListener('click',()=>openInquiry(currentWork()));$('#immersiveOpen')?.addEventListener('click',()=>{const first=siteData?.works?.[0];if(first)openArt(first.id)});
}

function openInquiry(work=null){const modal=$('#inquiryModal');const w=work&&work.id?work:null;$('#inquiryWorkId').value=w?.id||'';safeText('#inquiryContext',w?`${w.title} (${w.size}) için özel bilgi talebi.`:'Eser, özel sipariş veya koleksiyon danışmanlığı için bilgilerinizi bırakın.');$('#inquiryMessage').value=w?`${w.title} eseri hakkında bilgi almak istiyorum.`:'';modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>$('#inquiryName')?.focus(),100)}
function closeInquiry(){const m=$('#inquiryModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');if(!$('#artModal').classList.contains('open')&&!$('#roomModal').classList.contains('open'))document.body.classList.remove('modal-open')}
async function submitInquiry(payload){if(isStatic()){let list=[];try{list=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]')}catch{}list.unshift({id:Date.now(),createdAt:new Date().toISOString(),status:'new',...payload});localStorage.setItem(INQUIRY_KEY,JSON.stringify(list));return {ok:true,demo:true}}const r=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Talep gönderilemedi.');return j}
function setupInquiry(){$$('[data-inquiry-general]').forEach(b=>b.addEventListener('click',()=>openInquiry(null)));$('#inquiryClose')?.addEventListener('click',closeInquiry);$('#inquiryBg')?.addEventListener('click',closeInquiry);$('#inquiryForm')?.addEventListener('submit',async e=>{e.preventDefault();const status=$('#inquiryStatus');status.textContent='Gönderiliyor...';const wid=Number($('#inquiryWorkId').value)||null,w=(siteData?.works||[]).find(x=>Number(x.id)===wid);const payload={workId:wid,workTitle:w?.title||'',name:$('#inquiryName').value.trim(),email:$('#inquiryEmail').value.trim(),phone:$('#inquiryPhone').value.trim(),type:$('#inquiryType').value,message:$('#inquiryMessage').value.trim()};try{await submitInquiry(payload);status.textContent=isStatic()?'Demo talebi kaydedildi ✓':'Talebiniz alındı. En kısa sürede dönüş yapılacak ✓';e.currentTarget.reset();setTimeout(closeInquiry,1300)}catch(err){status.textContent=err.message}})}

function renderSearch(query=''){const q=String(query).trim().toLocaleLowerCase('tr-TR'),list=(siteData?.works||[]).filter(w=>!q||`${w.title} ${w.collection} ${w.year} ${w.series||''}`.toLocaleLowerCase('tr-TR').includes(q)).slice(0,8),box=$('#searchResults');if(!box)return;box.innerHTML=list.map(w=>`<article class="search-result" data-id="${w.id}"><img src="${esc(w.image)}" alt=""><div><h3>${esc(w.title)}</h3><p>${esc(w.collection)} · ${esc(w.year)}</p></div><b>${w.sold?'PRIVATE':'↗'}</b></article>`).join('')}
function setupSearch(){const search=$('#search'),open=()=>{search.classList.add('open');search.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');setTimeout(()=>$('#searchInput').focus(),80)},close=()=>{search.classList.remove('open');search.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')};$('#searchOpen')?.addEventListener('click',open);$('#searchBg')?.addEventListener('click',close);$('#searchClose')?.addEventListener('click',close);$('#searchInput')?.addEventListener('input',e=>renderSearch(e.target.value));$('#searchResults')?.addEventListener('click',e=>{const r=e.target.closest('[data-id]');if(r){close();openArt(r.dataset.id)}});addEventListener('keydown',e=>{if(e.key==='Escape'){close();closeRoom();closeStory();closeInquiry();closeArt()}if($('#artModal').classList.contains('open')&&e.key==='ArrowRight')changeArt(1);if($('#artModal').classList.contains('open')&&e.key==='ArrowLeft')changeArt(-1)})}
function setupForms(){$('#newsletter')?.addEventListener('submit',e=>{e.preventDefault();safeText('#newsletterStatus','Teşekkürler — demo listesine eklendiniz.');e.currentTarget.reset()})}
function showStaticHint(){if($('#staticHint'))return;const n=document.createElement('div');n.id='staticHint';n.className='static-hint';n.innerHTML='<b>DEMO MODU</b><span>Site tam demo olarak çalışıyor. Kalıcı panel kaydı için START_ZEHRART.bat kullanın.</span><a href="admin/index.html">PANEL ↗</a>';document.body.appendChild(n);setTimeout(()=>n.remove(),7000)}

(async()=>{setupReveal();try{const loaded=await loadSite();bindData(loaded||siteData)}catch(err){console.error(err);bindData(siteData)}finally{setupNav();setupDepth();setupWorks();setupCollections();setupZoom();setupRoom();setupInquiry();setupSearch();setupForms();observeReveals()}})();
