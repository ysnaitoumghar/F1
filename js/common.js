/* PIT WALL — socle commun : données, images, en-tête, curseur, transitions de page */
(function (P) {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  P.$ = $; P.$$ = $$;
  P.team = (id) => P.teams.find((t) => t.id === id);
  P.driver = (id) => P.drivers.find((d) => d.id === id);
  P.circuit = (id) => P.circuits.find((c) => c.id === id);
  P.qs = new URLSearchParams(location.search);
  P.touch = matchMedia('(hover: none), (pointer: coarse)').matches;
  P.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  P.pad = (n, l = 2) => String(n).padStart(l, '0');
  P.hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  P.fmtKm = (n) => n.toFixed(3).replace('.', ',') + ' km';
  P.fmtDate = (c, opt) => new Date(c.date + 'T12:00:00').toLocaleDateString('fr-FR', opt || { day: 'numeric', month: 'long' });

  /** Chemin local d'une image (ex. 'drivers/norris-1'), ou null si absente. */
  P.src = (key) => (P.images[key] ? 'assets/img/' + key + '.' + P.images[key] : null);
  P.firstSrc = (...keys) => { for (const k of keys) { const s = P.src(k); if (s) return s; } return null; };

  /** <img> avec repli : bloc dégradé aux couleurs de l'équipe si l'image manque. */
  P.img = function (key, alt, color, cls, eager) {
    const src = P.src(key);
    if (src) {
      const i = new Image(); i.src = src; i.alt = alt || ''; i.decoding = 'async'; i.draggable = false;
      i.loading = eager ? 'eager' : 'lazy';
      if (cls) i.className = cls;
      return i;
    }
    const d = document.createElement('div');
    d.className = 'ph' + (cls ? ' ' + cls : '');
    d.style.setProperty('--c', color || '#444');
    d.setAttribute('role', 'img'); d.setAttribute('aria-label', alt || '');
    d.innerHTML = '<span>' + (alt || '') + '</span>';
    return d;
  };
  P.flag = (code, name) => {
    const s = P.src('flags/' + code);
    return s ? '<img class="flag" src="' + s + '" alt="' + (name || code) + '" loading="lazy">' : '<span class="flag-code">' + code + '</span>';
  };
  P.setAccent = (color) => {
    const r = document.documentElement.style, [R, G, B] = P.hexToRgb(color);
    r.setProperty('--accent', color); r.setProperty('--accent-rgb', R + ',' + G + ',' + B);
  };

  /** Prochaine course d'après la date du jour. */
  const START = { lasvegas: '2026-11-22T04:00:00Z' };
  P.startOf = (c) => new Date(START[c.id] || c.date + 'T14:00:00Z');
  P.nextRace = () => P.circuits.find((c) => P.startOf(c).getTime() > Date.now()) || null;

  /* ── En-tête / curseur / rideau, injectés sur toutes les pages ── */
  const NAV = [['index.html', 'Accueil', 'home'], ['teams.html', 'Écuries', 'teams'], ['drivers.html', 'Pilotes', 'drivers'], ['compare.html', 'Comparer', 'compare'], ['circuits.html', 'Circuits', 'circuits'], ['gallery.html', 'Galerie', 'gallery']];
  P.section = () => {
    const f = location.pathname.split('/').pop() || 'index.html';
    const m = { 'index.html': 'home', 'teams.html': 'teams', 'team.html': 'teams', 'drivers.html': 'drivers', 'driver.html': 'drivers', 'compare.html': 'compare', 'circuits.html': 'circuits', 'circuit.html': 'circuits', 'gallery.html': 'gallery' };
    return m[f] || 'home';
  };
  function layout() {
    const cur = P.section();
    document.body.insertAdjacentHTML('afterbegin',
      '<div class="curtain" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="cursor" aria-hidden="true"><i class="c-ring"></i><i class="c-dot"></i></div>' +
      '<div class="toast" role="status"></div>' +
      '<header class="top"><a class="logo" href="index.html" aria-label="PIT WALL — accueil"><svg viewBox="0 0 32 20" width="30" height="19" aria-hidden="true"><path d="M0 20L10 0h6L6 20zM12 20L22 0h6L18 20z" fill="currentColor"/></svg><span>PIT WALL</span></a>' +
      '<nav class="nav" id="nav" aria-label="Navigation principale">' + NAV.map((n) => '<a href="' + n[0] + '"' + (n[2] === cur ? ' class="active" aria-current="page"' : '') + '>' + n[1] + '</a>').join('') + '</nav>' +
      '<button class="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav"><i></i><i></i></button></header>');
    const burger = $('.burger'), nav = $('.nav');
    burger.addEventListener('click', () => {
      const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
      burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu'); document.body.classList.toggle('menu-open', o);
    });
    // en-tête : se masque en descendant, se teinte en haut de page
    const top = $('.top'); let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      top.classList.toggle('solid', y > 40);
      top.classList.toggle('hide', y > last && y > 400 && !document.body.classList.contains('menu-open'));
      last = y;
    }, { passive: true });
  }

  /* ── Curseur : point (8 px) + anneau fin (30 px), mix-blend-mode: difference ── */
  function cursor() {
    const el = $('.cursor');
    if (!el || P.touch || !window.gsap) return;
    document.documentElement.classList.add('has-cursor');
    const dot = $('.c-dot', el), ring = $('.c-ring', el);
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', (e) => { el.classList.add('on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('mouseleave', () => el.classList.remove('on'));
    addEventListener('pointerdown', () => el.classList.add('down'));
    addEventListener('pointerup', () => el.classList.remove('down'));
    const sel = 'a,button,[data-hover],.chip,input,select,[role=button]';
    document.addEventListener('pointerover', (e) => { if (e.target.closest(sel)) el.classList.add('hover'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest(sel)) el.classList.remove('hover'); });
  }

  /* ── Transitions de page : rideau de bandes ── */
  function transitions() {
    const curtain = $('.curtain'); if (!curtain) return;
    const bars = $$('i', curtain);
    if (document.documentElement.classList.contains('arriving')) {
      sessionStorage.removeItem('pwT');
      gsap.set(bars, { yPercent: 0 });
      gsap.to(bars, { yPercent: -101, duration: 0.7, ease: 'power4.inOut', stagger: 0.05, delay: 0.05, onComplete() { document.documentElement.classList.remove('arriving'); } });
    }
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      if (u.hash && u.pathname === location.pathname) return;
      if (P.reduced) return;
      e.preventDefault();
      $('.nav') && $('.nav').classList.remove('open'); document.body.classList.remove('menu-open');
      sessionStorage.setItem('pwT', '1');
      gsap.set(curtain, { visibility: 'visible' });
      gsap.fromTo(bars, { yPercent: 101 }, { yPercent: 0, duration: 0.5, ease: 'power3.inOut', stagger: 0.04, onComplete() { location.href = u.href; } });
    });
    // retour navigateur (bfcache) : rideau relevé
    addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(bars, { yPercent: -101 }); document.documentElement.classList.remove('arriving'); } });
  }

  P.toast = function (msg) {
    const t = $('.toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(P._tt); P._tt = setTimeout(() => t.classList.remove('show'), 2400);
  };

  /** Tilt 3D + parallax interne (img / .no / .px). */
  P.tilt = function (el, max = 8) {
    if (P.touch || P.reduced || !window.gsap) return;
    const px = $$('[data-px]', el);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: x * max * 2, rotateX: -y * max * 2, transformPerspective: 1000, duration: 0.5, ease: 'power3.out' });
      px.forEach((p) => gsap.to(p, { x: -x * (+p.dataset.px), y: -y * (+p.dataset.px) * 0.6, duration: 0.6, ease: 'power3.out' }));
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' });
      px.forEach((p) => gsap.to(p, { x: 0, y: 0, duration: 0.8, ease: 'power3.out' }));
    });
  };

  /** Apparition au scroll (opacité + translation). */
  P.reveal = function (sel, opts) {
    if (!window.gsap || P.reduced) return;
    gsap.utils.toArray(sel).forEach((el) => gsap.from(el, Object.assign({ y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }, opts || {})));
  };
  /** Image révélée par masque. */
  P.maskReveal = function (el, dir = 'left') {
    if (!window.gsap || P.reduced) return;
    const from = dir === 'left' ? 'inset(0 100% 0 0)' : 'inset(100% 0 0 0)';
    gsap.fromTo(el, { clipPath: from }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  };
  /** Compteur animé. */
  P.countUp = function (el, to, opts) {
    opts = opts || {};
    const o = { v: 0 }, dec = opts.dec || 0;
    const fmt = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (P.reduced || !window.gsap) { el.textContent = fmt(to); return; }
    const run = () => gsap.to(o, { v: to, duration: opts.dur || 1.6, ease: 'power3.out', onUpdate() { el.textContent = fmt(o.v); }, onComplete() { el.textContent = fmt(to); } });
    if (opts.now) run(); else ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: run });
  };

  P.init = function () {
    layout();
    if (window.gsap) { gsap.ticker.lagSmoothing(0); if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger); cursor(); transitions(); }
    // titre de page : apparition
    if (window.gsap && !P.reduced) {
      const h = $('main h1'); if (h) gsap.from(h, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', delay: document.documentElement.classList.contains('arriving') ? 0.6 : 0.1 });
    }
  };
})(window.PITWALL);
