/* PIT WALL — test de bout en bout (Playwright). Usage : npm test  (ou node tests/check-site.js)
   Démarre un serveur local, parcourt toutes les pages en bureau puis mobile, écrit tests/report.md et tests/screenshots/. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const httpServer = require('http-server');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
const PORT = 8123, BASE = 'http://127.0.0.1:' + PORT + '/';
fs.mkdirSync(SHOTS, { recursive: true });
fs.readdirSync(SHOTS).forEach((f) => f.endsWith('.png') && fs.unlinkSync(path.join(SHOTS, f)));

const MENU = [
  { label: 'Écuries', file: 'teams.html', h1: /écuries/i, key: 'teams' },
  { label: 'Pilotes', file: 'drivers.html', h1: /grille/i, key: 'drivers' },
  { label: 'Comparer', file: 'compare.html', h1: /face/i, key: 'compare' },
  { label: 'Circuits', file: 'circuits.html', h1: /calendrier/i, key: 'circuits' },
  { label: 'Galerie', file: 'gallery.html', h1: /photo/i, key: 'gallery' }
];

const results = [];
let current = '';
const record = (name, ok, detail) => { results.push({ view: current, name, ok, detail: detail || '' }); console.log((ok ? '  ✅ ' : '  ❌ ') + name + (ok || !detail ? '' : ' — ' + detail)); };
async function check(name, fn) {
  try { const r = await fn(); if (r === true || r === undefined) record(name, true); else record(name, false, String(r)); }
  catch (e) { record(name, false, (e.message || String(e)).split('\n')[0].slice(0, 300)); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function shot(page, file, full) {
  try {
    if (full) {
      const h = await page.evaluate(() => document.documentElement.scrollHeight), w = page.viewportSize().width;
      await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, 7000) }, scale: 'css', timeout: 45000 });
    } else await page.screenshot({ path: file, scale: 'css', timeout: 30000 });
  } catch (e) { try { await page.screenshot({ path: file, scale: 'css', timeout: 20000 }); } catch (e2) { console.log('  (capture impossible : ' + path.basename(file) + ')'); } }
}

async function loadAllImages(page) {
  await page.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }));
  // fait défiler pour déclencher les chargements différés
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += innerHeight * 0.9) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
  await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 25000 }).catch(() => {});
  return page.evaluate(() => Array.from(document.images).filter((i) => i.getAttribute('src') && !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')));
}

async function settle(page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => !document.documentElement.classList.contains('arriving'), null, { timeout: 8000 }).catch(() => {});
  await sleep(500);
}

async function openMenuIfMobile(page, mobile) {
  if (!mobile) return;
  const nav = page.locator('.nav');
  if (!(await nav.evaluate((n) => n.classList.contains('open')))) { await page.locator('.burger').click(); await page.waitForFunction(() => document.querySelector('.nav').classList.contains('open')); await sleep(450); }
}

async function run(browser, mobile) {
  current = mobile ? 'MOBILE 390×844' : 'BUREAU 1440×900';
  const tag = mobile ? 'mobile' : 'desktop';
  console.log('\n══ ' + current + ' ══');
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [], failed = [];
  let where = 'home';
  page.on('console', (m) => { if (m.type() === 'error') errors.push(where + ': ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push(where + ': ' + (e.message || e).toString().slice(0, 200)));
  page.on('requestfailed', (r) => failed.push(where + ': ' + r.url().replace(BASE, '') + ' (' + (r.failure() && r.failure().errorText) + ')'));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(where + ': ' + r.status() + ' ' + r.url().replace(BASE, '')); });
  const flush = (label) => {
    const e = errors.splice(0), f = failed.splice(0);
    record(label + ' — aucune erreur JavaScript', e.length === 0, e.join(' | '));
    record(label + ' — aucune requête en échec (404…)', f.length === 0, f.join(' | '));
  };

  /* ── Accueil ── */
  await check('Accueil : charge et le préchargeur disparaît', async () => {
    await page.goto(BASE + 'index.html', { waitUntil: 'load' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 25000 });
  });
  await check('Accueil : titre de page et titre principal', async () => {
    const t = await page.title(), h = await page.locator('main h1').first().innerText();
    return /PIT WALL/i.test(t) && /PIT\s*WALL/i.test(h) ? true : `title="${t}" h1="${h}"`;
  });
  await check('Accueil : menu actif = Accueil', async () => {
    const a = await page.locator('.nav a.active').allInnerTexts();
    return a.length === 1 && /accueil/i.test(a[0]) ? true : 'actif: ' + JSON.stringify(a);
  });
  await check('Accueil : canvas 3D présent et dessiné', async () => {
    const ok = await page.evaluate(() => { const c = document.querySelector('#scene'); return !!c && c.tagName === 'CANVAS' && c.width > 0; });
    return ok ? true : 'canvas #scene absent (WebGL indisponible ?)';
  });
  await check('Accueil : le sélecteur d\'écurie change la couleur d\'accent', async () => {
    if (mobile) await page.locator('.chip', { hasText: 'Ferrari' }).scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    await page.locator('.chip', { hasText: 'Ferrari' }).click();
    await sleep(300);
    const after = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    return before !== after && /E80020/i.test(after) ? true : `${before} → ${after}`;
  });
  await check('Accueil : compte à rebours de la prochaine course', async () => {
    const t = await page.locator('#nextGp').innerText();
    return t.length > 3 && t !== '—' ? true : 'vide';
  });
  await check('Accueil : toutes les images se chargent', async () => { const b = await loadAllImages(page); return b.length === 0 ? true : b.length + ' cassée(s): ' + b.slice(0, 4).join(', '); });
  await check('Accueil : pas de défilement horizontal', async () => (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) ? true : 'scrollWidth > largeur');
  await page.evaluate(() => scrollTo(0, 0)); await sleep(300);
  await shot(page, path.join(SHOTS, `${tag}-01-home.png`), false);
  flush('Accueil');

  /* ── Curseur (bureau) / masqué (mobile) ── */
  await check(mobile ? 'Curseur : masqué sur écran tactile' : 'Curseur : point 8 px + anneau 30 px, mix-blend difference, pointer-events none', async () => {
    const r = await page.evaluate(() => {
      const c = document.querySelector('.cursor'), d = c.querySelector('.c-dot'), g = c.querySelector('.c-ring');
      const cs = getComputedStyle(c), ds = getComputedStyle(d), gs = getComputedStyle(g);
      return { display: cs.display, blend: cs.mixBlendMode, pe: cs.pointerEvents, dot: ds.width, ring: gs.width };
    });
    if (mobile) return r.display === 'none' ? true : 'display=' + r.display;
    return r.blend === 'difference' && r.pe === 'none' && r.dot === '8px' && r.ring === '30px' ? true : JSON.stringify(r);
  });

  /* ── Menu : chaque lien ── */
  for (const m of MENU) {
    await check(`Menu « ${m.label.toUpperCase()} » : ouvre ${m.file}`, async () => {
      where = m.key;
      await openMenuIfMobile(page, mobile);
      await page.locator('.nav a', { hasText: new RegExp('^' + m.label + '$') }).click();
      await page.waitForURL(new RegExp(m.file.replace('.', '\\.') + '$'), { timeout: 15000 });
      await settle(page);
      return true;
    });
    await check(`${m.label} : titre de page + titre principal`, async () => {
      const t = await page.title(), h = await page.locator('main h1').first().innerText();
      return t.toLowerCase().startsWith(m.label.toLowerCase()) && m.h1.test(h) ? true : `title="${t}" h1="${h}"`;
    });
    await check(`${m.label} : élément de menu actif correct`, async () => {
      const a = await page.locator('.nav a.active').allInnerTexts();
      return a.length === 1 && a[0].trim().toLowerCase() === m.label.toLowerCase() ? true : 'actif: ' + JSON.stringify(a);
    });
    await check(`${m.label} : toutes les images se chargent`, async () => { const b = await loadAllImages(page); return b.length === 0 ? true : b.length + ' cassée(s): ' + b.slice(0, 4).join(', '); });
    await check(`${m.label} : pas de défilement horizontal`, async () => (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)) ? true : 'scrollWidth > largeur');
    await sleep(400);
    await shot(page, path.join(SHOTS, `${tag}-0${MENU.indexOf(m) + 2}-${m.key}.png`), m.key !== 'gallery');
    flush(m.label);
  }

  /* ── Menu mobile ── */
  if (mobile) {
    await check('Menu mobile : le burger ouvre et ferme le panneau', async () => {
      await page.goto(BASE + 'teams.html'); await settle(page);
      const burger = page.locator('.burger');
      if (!(await burger.isVisible())) return 'burger invisible';
      await burger.click(); await sleep(500);
      const open = await page.evaluate(() => document.querySelector('.nav').classList.contains('open') && document.querySelector('.burger').getAttribute('aria-expanded') === 'true');
      const vis = await page.locator('.nav a').first().isVisible();
      await shot(page, path.join(SHOTS, 'mobile-menu-open.png'), false);
      await burger.click(); await sleep(500);
      const closed = await page.evaluate(() => !document.querySelector('.nav').classList.contains('open'));
      return open && vis && closed ? true : `open=${open} visible=${vis} closed=${closed}`;
    });
  }

  /* ── Écuries → page écurie → pilote → retour ── */
  await check('Écuries : un clic sur une carte ouvre la page de l\'écurie', async () => {
    where = 'team';
    await page.goto(BASE + 'teams.html'); await settle(page);
    const first = page.locator('.tc').first();
    await first.scrollIntoViewIfNeeded(); await first.click();
    await page.waitForURL(/team\.html\?id=mclaren/, { timeout: 15000 }); await settle(page);
    const h = await page.locator('main h1').first().innerText();
    return /mclaren/i.test(h) ? true : 'h1=' + h;
  });
  await check('Page écurie : 2 pilotes, galerie, accent de l\'écurie', async () => {
    const n = await page.locator('.t-drivers .dc').count(), g = await page.locator('.gal3 figure').count();
    const acc = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
    const b = await loadAllImages(page);
    return n === 2 && g === 3 && /FF8000/i.test(acc) && !b.length ? true : `pilotes=${n} photos=${g} accent=${acc} cassées=${b.length}`;
  });
  await shot(page, path.join(SHOTS, `${tag}-07-team-mclaren.png`), true);
  flush('Écurie');
  await check('Page écurie : un clic sur un pilote ouvre son profil', async () => {
    where = 'driver';
    const c = page.locator('.t-drivers .dc').first(); await c.scrollIntoViewIfNeeded(); await c.click();
    await page.waitForURL(/driver\.html\?id=/, { timeout: 15000 }); await settle(page);
    const h = await page.locator('main h1').first().innerText(), id = new URL(page.url()).searchParams.get('id');
    const d = await page.evaluate((id) => window.PITWALL.driver(id), id);
    return h.toLowerCase().includes(d.last.toLowerCase()) ? true : `h1=${h} attendu ${d.last}`;
  });
  await check('Profil pilote : stats, faits marquants, galerie, images chargées', async () => {
    await sleep(2200);
    const stats = await page.locator('.statgrid b').allInnerTexts(), hl = await page.locator('.hl li').count();
    const b = await loadAllImages(page);
    const zeros = stats.every((s) => s.trim() === '0');
    return stats.length >= 8 && hl >= 4 && !zeros && !b.length ? true : `stats=${stats.length} faits=${hl} toutZero=${zeros} cassées=${b.length}`;
  });
  await shot(page, path.join(SHOTS, `${tag}-08-driver-profile.png`), true);
  flush('Profil pilote');
  await check('Bouton retour du navigateur : revient à la page écurie', async () => {
    await page.goBack(); await page.waitForURL(/team\.html\?id=mclaren/, { timeout: 15000 }); await settle(page);
    const h = await page.locator('main h1').first().innerText();
    return /mclaren/i.test(h) ? true : 'h1=' + h;
  });
  await check('Bouton retour (2e fois) : revient à la liste des écuries', async () => {
    await page.goBack(); await page.waitForURL(/teams\.html$/, { timeout: 15000 }); await settle(page);
    return (await page.locator('.tc').count()) === 11 ? true : 'cartes: ' + (await page.locator('.tc').count());
  });
  await check('Pilotes : un clic sur une grande carte ouvre le profil', async () => {
    where = 'drivers';
    await page.goto(BASE + 'drivers.html'); await settle(page);
    const n = await page.locator('.dc').count();
    const c = page.locator('.dc[data-id="verstappen"]'); await c.scrollIntoViewIfNeeded(); await c.click();
    await page.waitForURL(/driver\.html\?id=verstappen/, { timeout: 15000 }); await settle(page);
    const h = await page.locator('main h1').first().innerText();
    return n === 22 && /verstappen/i.test(h) ? true : `cartes=${n} h1=${h}`;
  });
  flush('Pilotes (cartes)');

  /* ── Comparer ── */
  await check('Comparer : choisir 2 pilotes affiche les statistiques', async () => {
    where = 'compare';
    await page.goto(BASE + 'compare.html'); await settle(page);
    const before = await page.locator('.cmp-row').count();
    await page.locator('.pick[data-id="norris"]').scrollIntoViewIfNeeded(); await page.locator('.pick[data-id="norris"]').click();
    await page.locator('.pick[data-id="verstappen"]').click();
    await page.waitForSelector('.cmp-row', { timeout: 5000 }); await sleep(1800);
    const rows = await page.locator('.cmp-row').count();
    const vals = await page.locator('.cmp-row .val').allInnerTexts();
    const wins = await page.locator('.cmp-row[data-k="wins"] .val').allInnerTexts();
    const fills = await page.locator('.cmp-row .fill').evaluateAll((f) => f.map((x) => x.style.transform || getComputedStyle(x).transform));
    const animated = fills.some((t) => t && t !== 'none' && !/scaleX\(0\)|matrix\(0,/.test(t));
    await shot(page, path.join(SHOTS, `${tag}-06b-compare-result.png`), true);
    return before === 0 && rows === 7 && vals.some((v) => v.trim() !== '0') && wins.join('|') === '14|74' && animated ? true : `avant=${before} lignes=${rows} victoires=${wins.join('|')} barres animées=${animated}`;
  });
  await check('Comparer : désélectionner retire la comparaison', async () => {
    await page.locator('.pick[data-id="norris"]').click(); await sleep(300);
    return (await page.locator('.cmp-row').count()) === 0 ? true : 'lignes encore présentes';
  });
  flush('Comparer (interaction)');

  /* ── Circuits ── */
  await check('Circuits : un clic sur une ligne ouvre la fiche du circuit', async () => {
    where = 'circuit';
    await page.goto(BASE + 'circuits.html'); await settle(page);
    const n = await page.locator('.cr').count();
    const r = page.locator('.cr[data-id="monaco"]'); await r.scrollIntoViewIfNeeded(); await r.click();
    await page.waitForURL(/circuit\.html\?id=monaco/, { timeout: 15000 }); await settle(page);
    const h = await page.locator('main h1').first().innerText(), t = await page.locator('.specs').innerText();
    const b = await loadAllImages(page);
    return n === 22 && /monaco/i.test(h) && /3,337/.test(t) && !b.length ? true : `lignes=${n} h1=${h} images cassées=${b.length}`;
  });
  await shot(page, path.join(SHOTS, `${tag}-09-circuit-monaco.png`), true);
  flush('Circuit');
  await check('Circuits : le filtre « Sprints » réduit la liste', async () => {
    await page.goto(BASE + 'circuits.html'); await settle(page);
    await page.locator('.fbtn', { hasText: 'Sprints' }).click(); await sleep(200);
    const visible = await page.locator('#cal li').evaluateAll((l) => l.filter((x) => x.style.display !== 'none').length);
    return visible === 6 ? true : 'visibles=' + visible;
  });

  /* ── Galerie : filtres + visionneuse ── */
  await check('Galerie : le filtre « Pilotes » masque les autres photos', async () => {
    where = 'gallery';
    await page.goto(BASE + 'gallery.html'); await settle(page);
    const all = await page.locator('.gi:not(.hidden)').count();
    await page.locator('.fbtn', { hasText: /^Pilotes/ }).click(); await sleep(200);
    const only = await page.locator('.gi:not(.hidden)').count(), cats = await page.locator('.gi:not(.hidden)').evaluateAll((g) => [...new Set(g.map((x) => x.dataset.c))]);
    return only < all && cats.length === 1 && cats[0] === 'drivers' ? true : `tout=${all} filtré=${only} cats=${cats}`;
  });
  await check('Galerie : la visionneuse plein écran s\'ouvre, navigue et se ferme', async () => {
    await page.locator('.fbtn', { hasText: /^Tout/ }).click(); await sleep(200);
    const g = page.locator('.gi:not(.hidden)').nth(2); await g.scrollIntoViewIfNeeded(); await g.click();
    await page.waitForSelector('.lb.open', { timeout: 4000 }); await sleep(500);
    const src1 = await page.locator('#lbi').getAttribute('src');
    const loaded = await page.waitForFunction(() => { const i = document.querySelector('#lbi'); return i.complete && i.naturalWidth > 0; }, null, { timeout: 8000 }).then(() => true).catch(() => false);
    await shot(page, path.join(SHOTS, `${tag}-10-gallery-lightbox.png`), false);
    await page.locator('.lb .nx').click(); await sleep(250);
    const src2 = await page.locator('#lbi').getAttribute('src');
    await page.keyboard.press('Escape'); await sleep(300);
    const closedEsc = await page.evaluate(() => !document.querySelector('.lb').classList.contains('open'));
    await g.click(); await page.waitForSelector('.lb.open'); await page.locator('.lb .x').click(); await sleep(300);
    const closedBtn = await page.evaluate(() => !document.querySelector('.lb').classList.contains('open') && !document.body.classList.contains('lb-open'));
    return loaded && src1 && src2 && src1 !== src2 && closedEsc && closedBtn ? true : `image=${loaded} suivante=${src1 !== src2} ferme(Échap)=${closedEsc} ferme(bouton)=${closedBtn}`;
  });
  flush('Galerie (interaction)');

  /* ── Focus : pas de cadre au clic souris, présent au clavier ── */
  if (!mobile) {
    await check('Focus : pas de cadre blanc au clic souris (:focus-visible seulement)', async () => {
      await page.goto(BASE + 'index.html?skip'); await page.waitForSelector('#loader', { state: 'detached', timeout: 25000 }).catch(() => {}); await settle(page);
      const link = page.locator('.nav a', { hasText: /^Écuries$/ });
      await link.hover(); await page.mouse.down(); await page.mouse.up().catch(() => {});
      // on évite la navigation : on teste via un bouton
      await page.goto(BASE + 'drivers.html'); await settle(page);
      const btn = page.locator('.fbtn').nth(1); await btn.click();
      const mouse = await btn.evaluate((b) => { const s = getComputedStyle(b); return { focused: document.activeElement === b, st: s.outlineStyle, w: s.outlineWidth }; });
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      const kb = await page.evaluate(() => { const b = document.activeElement, s = getComputedStyle(b); return { st: s.outlineStyle, w: s.outlineWidth, fv: b.matches(':focus-visible') }; });
      return (mouse.st === 'none' || mouse.w === '0px') && kb.fv && kb.st !== 'none' ? true : `souris=${JSON.stringify(mouse)} clavier=${JSON.stringify(kb)}`;
    });
    flush('Focus');
  }

  await ctx.close();
}

(async () => {
  const server = httpServer.createServer({ root: ROOT, cache: -1, silent: true });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  try {
    await run(browser, false);
    await run(browser, true);
  } finally { await browser.close(); server.close(); }

  // rapport
  const ok = results.filter((r) => r.ok).length, ko = results.filter((r) => !r.ok);
  let md = '# Rapport de test — PIT WALL\n\n' + new Date().toLocaleString('fr-FR') + '\n\n**' + ok + ' ✅ / ' + ko.length + ' ❌** sur ' + results.length + ' contrôles.\n';
  for (const v of [...new Set(results.map((r) => r.view))]) {
    md += '\n## ' + v + '\n\n| | Contrôle | Détail |\n|---|---|---|\n';
    results.filter((r) => r.view === v).forEach((r) => { md += '| ' + (r.ok ? '✅' : '❌') + ' | ' + r.name + ' | ' + r.detail.replace(/\|/g, '\\|') + ' |\n'; });
  }
  fs.writeFileSync(path.join(__dirname, 'report.md'), md);
  console.log('\n══ BILAN : ' + ok + ' ✅  /  ' + ko.length + ' ❌  (rapport : tests/report.md, captures : tests/screenshots/)');
  ko.forEach((r) => console.log('  ❌ [' + r.view + '] ' + r.name + ' — ' + r.detail));
  process.exit(ko.length ? 1 : 0);
})();
