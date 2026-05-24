/* =========================================================
   Zelala Design Studio · behavior
   Language toggle (AR/EN · RTL/LTR) · Reveals · Nav · Projects render
   · Case-study view (deep-linked) · Hero light · WhatsApp · Form
   ========================================================= */

(function(){
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============ i18n ============ */
  function t(key, lang){
    const v = (window.I18N || {})[key];
    return (v && v[lang]) || (v && v.en) || key;
  }
  function applyI18n(){
    const lang = root.lang === 'en' ? 'en' : 'ar';
    $$('[data-i18n]').forEach(el => {
      const tr = (window.I18N || {})[el.dataset.i18n];
      if (tr && tr[lang] !== undefined) el.textContent = tr[lang];
    });
    $$('[data-i18n-placeholder]').forEach(el => {
      const tr = (window.I18N || {})[el.dataset.i18nPlaceholder];
      if (tr && tr[lang]) el.setAttribute('placeholder', tr[lang]);
    });
    $$('[data-i18n-aria]').forEach(el => {
      const tr = (window.I18N || {})[el.dataset.i18nAria];
      if (tr && tr[lang]) el.setAttribute('aria-label', tr[lang]);
    });
    $$('[data-lang-btn]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.langBtn === lang);
    });
    // title — keep bilingual always; nothing to do
  }
  function setLang(lang){
    if (lang !== 'ar' && lang !== 'en') lang = 'ar';
    body.classList.add('lang-switching');
    root.lang = lang;
    root.dir  = (lang === 'ar') ? 'rtl' : 'ltr';
    try { localStorage.setItem('zelala.lang', lang); } catch(_){}
    applyI18n();
    renderProjects(currentFilter);
    if (root.dataset.caseSlug) renderCase(root.dataset.caseSlug, /*keepOpen*/true);
    setTimeout(() => body.classList.remove('lang-switching'), 260);
  }
  function initLang(){
    let saved = null;
    try { saved = localStorage.getItem('zelala.lang'); } catch(_){}
    const initial = (saved === 'en' || saved === 'ar') ? saved : 'ar';
    root.lang = initial;
    root.dir  = (initial === 'ar') ? 'rtl' : 'ltr';
    applyI18n();
  }

  /* ============ Wire SITE-wide contact links ============ */
  function waLink(){
    const num = ((window.SITE && SITE.whatsapp) || '').replace(/[^0-9]/g, '');
    return num ? `https://wa.me/${num}` : '#';
  }
  function igLink(){
    const u = ((window.SITE && SITE.instagram) || '').replace(/^@/, '');
    return u ? `https://instagram.com/${u}` : '#';
  }
  function wireSite(){
    if (!window.SITE) return;
    const wa = waLink();
    const ig = igLink();
    const mailto = `mailto:${SITE.email}`;
    const tel    = `tel:${(SITE.phone || '').replace(/\s+/g,'')}`;

    [['#contact-email', mailto, SITE.email],
     ['#footer-email',  mailto, SITE.email],
     ['#contact-phone', tel,    SITE.phone],
     ['#footer-phone',  tel,    SITE.phone]
    ].forEach(([sel, href, txt]) => {
      const el = $(sel); if (!el) return;
      el.href = href; el.textContent = txt;
    });
    ['#social-ig', '#footer-ig'].forEach(sel => {
      const e = $(sel); if (!e) return;
      e.href = ig; e.target = '_blank'; e.rel = 'noopener';
    });
    ['#social-wa', '#footer-wa'].forEach(sel => {
      const e = $(sel); if (!e) return;
      e.href = wa; e.target = '_blank'; e.rel = 'noopener';
    });
    const fab = $('#fab-wa'); if (fab) fab.href = wa;
  }

  /* ============ Projects grid ============ */
  let currentFilter = 'all';
  const grid = $('#projects-grid');

  function pickYear(year, lang){
    if (typeof year !== 'string') return String(year);
    if (year.includes('/')) {
      const [ar, en] = year.split('/');
      return lang === 'ar' ? ar : en;
    }
    return year;
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function projectCard(p, idx, lang){
    const title = escapeHtml(p.title[lang]);
    const loc   = escapeHtml(p.location[lang]);
    const yr    = escapeHtml(pickYear(p.year, lang));
    const typeLabel = escapeHtml(t(`filter.${p.type}`, lang));
    return `
      <a class="project-card reveal" data-type="${p.type}" data-slug="${p.slug}"
         href="#project/${p.slug}" style="--i:${idx % 6}" aria-label="${title} — ${typeLabel}">
        <div class="project-card__media">
          <img src="${p.cover}" alt="${title} — ${typeLabel}" loading="lazy" />
        </div>
        <div class="project-card__meta">
          <h3 class="project-card__title">${title}</h3>
          <p class="project-card__sub"><span>${typeLabel}</span><span>${loc}</span><span>${yr}</span></p>
        </div>
        <span class="project-card__chev" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="6" y1="12" x2="18" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>
        </span>
      </a>`;
  }
  function renderProjects(filter){
    if (!grid || !window.PROJECTS) return;
    currentFilter = filter || 'all';
    const lang = root.lang === 'en' ? 'en' : 'ar';
    const list = currentFilter === 'all'
      ? PROJECTS
      : PROJECTS.filter(p => p.type === currentFilter);
    grid.innerHTML = list.map((p, i) => projectCard(p, i, lang)).join('');
    observeReveals();
  }
  // filter chips
  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.filter-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      renderProjects(chip.dataset.filter);
    });
  });
  // card click → hash → renderCase
  if (grid){
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.project-card');
      if (!card) return;
      e.preventDefault();
      const slug = card.dataset.slug;
      if (slug) location.hash = `#project/${slug}`;
    });
  }

  /* ============ Case study ============ */
  const caseEl      = $('#case');
  const caseContent = $('#case-content');
  const caseClose   = $('#case-close');
  let lastFocused = null;

  function findProject(slug){ return (window.PROJECTS || []).find(p => p.slug === slug); }
  function adjacent(slug, dir){
    const i = PROJECTS.findIndex(p => p.slug === slug);
    if (i < 0) return null;
    const n = (i + dir + PROJECTS.length) % PROJECTS.length;
    return PROJECTS[n];
  }

  function renderCase(slug, keepOpen){
    const p = findProject(slug); if (!p || !caseContent) return;
    const lang = root.lang === 'en' ? 'en' : 'ar';
    const yr   = escapeHtml(pickYear(p.year, lang));
    const typeLabel = escapeHtml(t(`filter.${p.type}`, lang));
    const conceptParas = (p.concept[lang] || []).map(par => `<p>${escapeHtml(par)}</p>`).join('');
    const materialsHTML = (p.materials || []).map(m => `<span>${escapeHtml(m[lang])}</span>`).join('');
    const gallery = (p.gallery && p.gallery.length)
      ? `<section class="case__section">
           <h3>${t('case.gallery', lang)}</h3>
           <div class="case__gallery">${p.gallery.map(src => `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.title[lang])}" loading="lazy" />`).join('')}</div>
         </section>`
      : `<section class="case__section">
           <h3>${t('case.gallery', lang)}</h3>
           <div class="case__empty">${t('case.empty', lang)}</div>
         </section>`;
    const prev = adjacent(slug, -1);
    const next = adjacent(slug, +1);

    caseContent.innerHTML = `
      <div class="case__hero">
        <img src="${p.cover}" alt="${escapeHtml(p.title[lang])}" />
        <div class="case__hero-title">
          <div class="case__hero-eyebrow">${t('case.eyebrow', lang)} · ${typeLabel}</div>
          <h2 id="case-title">${escapeHtml(p.title[lang])}</h2>
        </div>
      </div>
      <div class="case__body">
        <dl class="case__meta">
          <div><dt>${t('case.type', lang)}</dt><dd>${typeLabel}</dd></div>
          <div><dt>${t('case.location', lang)}</dt><dd>${escapeHtml(p.location[lang])}</dd></div>
          <div><dt>${t('case.year', lang)}</dt><dd>${yr}</dd></div>
          <div><dt>${t('case.area', lang)}</dt><dd>${escapeHtml(p.area[lang])} ${t('case.areaUnit', lang)}</dd></div>
        </dl>
        <section class="case__section case__brief">
          <h3>${t('case.brief', lang)}</h3>
          <p>${escapeHtml(p.brief[lang])}</p>
        </section>
        <section class="case__section case__concept">
          <h3>${t('case.concept', lang)}</h3>
          ${conceptParas}
        </section>
        <section class="case__section">
          <h3>${t('case.materials', lang)}</h3>
          <div class="case__materials">${materialsHTML}</div>
        </section>
        ${gallery}
        <nav class="case__nav" aria-label="Project navigation">
          <a href="#project/${prev.slug}" data-case-nav="prev"><small>${t('case.prev', lang)}</small>${escapeHtml(prev.title[lang])}</a>
          <a href="#project/${next.slug}" data-case-nav="next"><small>${t('case.next', lang)}</small>${escapeHtml(next.title[lang])}</a>
        </nav>
      </div>
    `;
    if (!keepOpen){
      lastFocused = document.activeElement;
      caseEl.classList.add('is-open');
      body.classList.add('no-scroll');
      caseEl.scrollTop = 0;
      // focus the dialog after the transition starts
      setTimeout(() => caseEl.focus(), 30);
    }
    root.dataset.caseSlug = slug;
  }
  function closeCase(){
    caseEl.classList.remove('is-open');
    body.classList.remove('no-scroll');
    delete root.dataset.caseSlug;
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  function handleHash(){
    const m = location.hash.match(/^#project\/([\w-]+)/);
    if (m) renderCase(m[1]);
    else if (caseEl && caseEl.classList.contains('is-open')) closeCase();
  }
  window.addEventListener('hashchange', handleHash);
  if (caseClose) caseClose.addEventListener('click', closeCase);
  if (caseContent){
    caseContent.addEventListener('click', (e) => {
      const link = e.target.closest('[data-case-nav]');
      if (!link) return;
      e.preventDefault();
      const slug = link.getAttribute('href').replace('#project/', '');
      location.hash = `#project/${slug}`;
    });
  }
  // backdrop click closes
  if (caseEl){
    caseEl.addEventListener('click', (e) => {
      if (e.target === caseEl) closeCase();
    });
  }

  /* ============ Reveal observer ============ */
  let revealObserver;
  function observeReveals(){
    const items = $$('.reveal:not(.is-visible)');
    if (prefersReduced || !('IntersectionObserver' in window)){
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    if (!revealObserver){
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting){
            en.target.classList.add('is-visible');
            revealObserver.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    }
    items.forEach(el => revealObserver.observe(el));
  }

  /* ============ Nav scroll state ============ */
  const nav = $('#nav');
  function navState(){
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', navState, { passive: true });

  /* ============ Mobile menu ============ */
  const menuOverlay = $('#menu-overlay');
  const menuOpen    = $('#menu-open');
  const menuClose   = $('#menu-close');
  function openMenu(){
    if (!menuOverlay) return;
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden','false');
    body.classList.add('no-scroll');
  }
  function closeMenu(){
    if (!menuOverlay) return;
    menuOverlay.classList.remove('is-open');
    menuOverlay.setAttribute('aria-hidden','true');
    body.classList.remove('no-scroll');
  }
  if (menuOpen)  menuOpen.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  $$('[data-menu-link]').forEach(a => a.addEventListener('click', () => setTimeout(closeMenu, 80)));

  /* ============ Lang toggle ============ */
  const langBtn = $('#lang-toggle');
  if (langBtn){
    langBtn.addEventListener('click', (e) => {
      const target = e.target.closest('[data-lang-btn]');
      const cur = root.lang === 'en' ? 'en' : 'ar';
      if (target) setLang(target.dataset.langBtn);
      else        setLang(cur === 'ar' ? 'en' : 'ar');
    });
  }

  /* ============ Hero light interaction ============ */
  const hero = $('#hero');
  if (hero && !prefersReduced){
    let tx = 50, ty = 38, cx = 50, cy = 38, raf = null;
    function tick(){
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      hero.style.setProperty('--mx', cx.toFixed(2) + '%');
      hero.style.setProperty('--my', cy.toFixed(2) + '%');
      if (Math.abs(tx - cx) > 0.15 || Math.abs(ty - cy) > 0.15) {
        raf = requestAnimationFrame(tick);
      } else { raf = null; }
    }
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width)  * 100;
      ty = ((e.clientY - r.top)  / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener('mouseleave', () => {
      tx = 50; ty = 38;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    // slight scroll parallax of the glow
    window.addEventListener('scroll', () => {
      if (window.scrollY > window.innerHeight) return;
      const p = window.scrollY / window.innerHeight; // 0..1
      ty = 38 + p * 8;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ============ Contact form ============ */
  const form = $('#contact-form');
  if (form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name    = (data.get('name')    || '').toString().trim();
      const contact = (data.get('contact') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();
      if (!name || !contact || !message) {
        form.querySelector('input, textarea').focus();
        return;
      }
      const to = (window.SITE && SITE.email) || '';
      const subject = encodeURIComponent(`Zelala — project enquiry from ${name}`);
      const bodyTxt = encodeURIComponent(`${message}\n\n—\n${name}\n${contact}`);
      window.location.href = `mailto:${to}?subject=${subject}&body=${bodyTxt}`;
    });
  }

  /* ============ Keyboard ============ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){
      if (caseEl && caseEl.classList.contains('is-open')) { closeCase(); return; }
      if (menuOverlay && menuOverlay.classList.contains('is-open')) { closeMenu(); return; }
    }
  });

  /* ============ Init ============ */
  initLang();
  wireSite();
  renderProjects('all');
  navState();
  observeReveals();
  // give the renderer a tick so observer attaches before potential hash render
  setTimeout(handleHash, 0);

})();
