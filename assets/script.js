const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout(el._t);
  el._t = window.setTimeout(()=> el.classList.remove('show'), 2600);
}

function smoothLinks(){
  $$('a[data-scroll]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href');
      if(id && id.startsWith('#')){
        const target = $(id);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    });
  });
}

function mobileMenu(){
  const btn = $('#mobileToggle');
  const menu = $('#mobileMenu');
  if(!btn || !menu) return;
  btn.addEventListener('click', ()=>{
    menu.hidden = !menu.hidden;
  });
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', ()=> menu.hidden = true));
}

function quoteForm(){
  const form = $('#quoteForm');
  if(!form) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // Basic validation
    const required = ['name','email','phone','suburb','wallType','message'];
    for(const k of required){
      if(!String(data[k]||'').trim()){
        toast('Please fill in all required fields.');
        return;
      }
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))){
      toast('Please enter a valid email address.');
      return;
    }

    const endpoint = form.getAttribute('action');
    if(!endpoint || endpoint.includes('REPLACE_ME')){
      toast('Form is not connected yet. Paste your Formspree form ID into the form action URL.');
      return;
    }

    // Send via Formspree (no email client)
    const fd = new FormData(form);
    // Optional: include a clearer subject line for the email you receive
    fd.set('_subject', `VertiPrint Quote Request — ${data.name}`);

    fetch(endpoint, {
      method: 'POST',
      body: fd,
      headers: { 'Accept': 'application/json' }
    })
    .then(async (res)=>{
      if(res.ok){
        form.reset();
        toast('Thanks! Your request has been sent.');
      } else {
        let msg = 'Could not send your request. Please try again.';
        try{
          const j = await res.json();
          if(j && j.errors && j.errors[0] && j.errors[0].message) msg = j.errors[0].message;
        }catch(e){}
        toast(msg);
      }
    })
    .catch(()=>{
      toast('Network error — please try again.');
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  smoothLinks();
  mobileMenu();
  quoteForm();
});
// Mobile menu toggle (coarse pointers only)
(() => {
  const btn = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  const isCoarse = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  if (!isCoarse) {
    // Desktop: keep menu collapsed unless hovered (CSS handles display)
    // Ensure it starts hidden so it doesn't take layout space.
    menu.setAttribute('hidden', '');
    return;
  }

  btn.addEventListener('click', () => {
    const isHidden = menu.hasAttribute('hidden');
    if (isHidden) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
  });
})();


// Lightbox for Print Concepts (Print Concepts page)
(function () {
  const overlay = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightboxImg');
  const closeBtn = overlay ? overlay.querySelector('.lightbox-close') : null;

  if (!overlay || !imgEl) return;

  function open(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || '';
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
  }

  function close() {
    overlay.hidden = true;
    imgEl.src = '';
    document.body.classList.remove('no-scroll');
  }

  document.querySelectorAll('.concept-card img').forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (e) => {
      e.preventDefault();
      open(img.currentSrc || img.src, img.alt);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!overlay.hidden && e.key === 'Escape') close();
  });
})();


// ===== Header menu: tap to open on mobile, hover on desktop =====
(() => {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !mobileMenu) return;

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const openMenu = () => {
    mobileMenu.hidden = false;
    menuBtn.setAttribute('aria-expanded','true');
  };
  const closeMenu = () => {
    mobileMenu.hidden = true;
    menuBtn.setAttribute('aria-expanded','false');
  };

  // Tap behaviour (mobile)
  menuBtn.addEventListener('click', (e) => {
    if (!isTouch) return; // desktop handled by hover CSS
    e.stopPropagation();
    if (mobileMenu.hidden) openMenu(); else closeMenu();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!isTouch) return;
    if (!mobileMenu.hidden && !mobileMenu.contains(e.target) && e.target !== menuBtn) closeMenu();
  });

  // Accordion
  const accBtn = mobileMenu.querySelector('.accordion-btn');
  const panel = mobileMenu.querySelector('.accordion-panel');
  if (accBtn && panel){
    const toggle = () => {
      const expanded = accBtn.getAttribute('aria-expanded') === 'true';
      accBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.hidden = expanded;
    };
    accBtn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
    // default open
    accBtn.setAttribute('aria-expanded','true');
    panel.hidden = false;
  }

  // Desktop: allow menu to close on escape if open due to hover state (best-effort)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();
