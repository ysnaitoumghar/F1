(function (P) {
  const { $, $$ } = P;
  const CATS = [['all', 'Tout'], ['drivers', 'Pilotes'], ['cars', 'Voitures'], ['circuits', 'Circuits']];
  const label = (key) => {
    const [cat, rest] = key.split('/'), id = rest.replace(/-\d+$/, '');
    if (cat === 'drivers') { const d = P.driver(id); return d ? d.first + ' ' + d.last : id; }
    if (cat === 'cars') { const t = P.team(id); return t ? t.full : id; }
    const c = P.circuit(id); return c ? c.name : id;
  };
  // une seule entrée par photo, catégories entrelacées pour un mur varié
  const by = { drivers: [], cars: [], circuits: [] };
  Object.keys(P.images).forEach((k) => { const cat = k.split('/')[0]; if (by[cat] && !/-layout$/.test(k)) by[cat].push(k); });
  const items = []; for (let i = 0; i < Math.max(by.drivers.length, by.cars.length, by.circuits.length); i++) ['drivers', 'cars', 'circuits'].forEach((c) => { if (by[c][i]) items.push(by[c][i]); });
  const count = (c) => (c === 'all' ? items.length : by[c].length);

  $('#app').innerHTML = '<div class="page-head"><p class="crumb"><a href="index.html">Accueil</a> / Galerie</p><h1>Le mur <span class="o">photo</span></h1>' +
    '<p class="sub">' + items.length + ' photos, toutes stockées en local. Cliquez pour ouvrir en plein écran.</p></div>' +
    '<div class="wrap"><div class="filters" id="fl" role="group" aria-label="Filtrer les photos"></div><div class="masonry" id="mz"></div></div>' +
    '<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Visionneuse photo"><div class="count" id="lbc"></div><button class="x" aria-label="Fermer">×</button><button class="pv" aria-label="Photo précédente">‹</button>' +
    '<img id="lbi" alt=""><div class="cap" id="lbt"></div><button class="nx" aria-label="Photo suivante">›</button></div>';
  CATS.forEach((c) => { const b = document.createElement('button'); b.className = 'fbtn'; b.dataset.c = c[0]; b.textContent = c[1] + ' (' + count(c[0]) + ')'; b.setAttribute('aria-pressed', c[0] === 'all'); $('#fl').appendChild(b); });

  const mz = $('#mz');
  items.forEach((k) => {
    const b = document.createElement('button'); b.className = 'gi'; b.dataset.k = k; b.dataset.c = k.split('/')[0]; b.dataset.cap = label(k);
    b.setAttribute('aria-label', 'Agrandir : ' + label(k));
    const im = new Image(); im.src = P.src(k); im.alt = label(k); im.loading = 'lazy'; im.decoding = 'async'; b.appendChild(im);
    mz.appendChild(b);
  });

  $('#fl').addEventListener('click', (e) => {
    const b = e.target.closest('.fbtn'); if (!b) return;
    $$('.fbtn', $('#fl')).forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('.gi', mz).forEach((g) => g.classList.toggle('hidden', b.dataset.c !== 'all' && g.dataset.c !== b.dataset.c));
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  /* ── Visionneuse plein écran ── */
  let attr = {}; fetch('assets/img/attribution.json').then((r) => r.json()).then((j) => { attr = j; }).catch(() => {});
  const lb = $('#lb'), lbi = $('#lbi'); let cur = -1, opener = null;
  const visible = () => $$('.gi', mz).filter((g) => !g.classList.contains('hidden'));
  function show(i) {
    const list = visible(); if (!list.length) return;
    cur = (i + list.length) % list.length;
    const g = list[cur], k = g.dataset.k, f = k + '.' + P.images[k], a = attr[f] || {};
    lbi.src = P.src(k); lbi.alt = g.dataset.cap;
    $('#lbt').innerHTML = g.dataset.cap + '<small>' + [a.author, a.license].filter(Boolean).join(' · ') + '</small>';
    $('#lbc').textContent = P.pad(cur + 1) + ' / ' + P.pad(list.length);
  }
  function open(g) {
    opener = g; lb.classList.add('open'); document.body.classList.add('lb-open');
    show(visible().indexOf(g));
    if (window.gsap && !P.reduced) gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    $('.x', lb).focus();
  }
  function close() {
    lb.classList.remove('open'); document.body.classList.remove('lb-open'); lbi.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  }
  mz.addEventListener('click', (e) => { const g = e.target.closest('.gi'); if (g) open(g); });
  $('.x', lb).addEventListener('click', close);
  $('.pv', lb).addEventListener('click', () => show(cur - 1));
  $('.nx', lb).addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });
  let sx = 0; lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); });

  P.init();
})(window.PITWALL);
