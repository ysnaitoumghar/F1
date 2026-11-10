/* Télécharge les images depuis Wikimedia Commons vers assets/img/* (jamais de hotlink).
   Usage : node scripts/fetch-images.mjs [drivers|cars|teams|circuits ...]
   Écrit : assets/img/attribution.json (auteur + licence) et MISSING_IMAGES.md */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const P = require(path.join(root, 'js/data.js'));
const UA = 'PitWallDemo/0.1 (private learning project; contact: local)';
const API = 'https://commons.wikimedia.org/w/api.php';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const attrPath = path.join(root, 'assets/img/attribution.json');
const attribution = fs.existsSync(attrPath) ? JSON.parse(fs.readFileSync(attrPath, 'utf8')) : {};
const missing = [];
const used = new Set(Object.values(attribution).map((a) => a.title));

async function search(q, limit = 40) {
  const url = API + '?' + new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: String(limit),
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600'
  });
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      const j = await r.json();
      return Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index);
    }
    await sleep(1500 * (i + 1));
  }
  return [];
}

function score(page, opt) {
  const t = norm(page.title);
  const ii = page.imageinfo && page.imageinfo[0];
  if (!ii) return -1;
  if (opt.must && !opt.must.every((m) => new RegExp(m).test(t))) return -1;
  if (/signature|autograph|crest|flag of|map of|cropped|poster|sticker|stamp|lego|toy|model car|scale/.test(t)) return -1;
  if (opt.svg) { if (!/svg|png/.test(ii.mime)) return -1; }
  else if (!/jpeg|png/.test(ii.mime) || /logo/.test(t)) return -1;
  if (!opt.svg && ii.width < (opt.minW || 1200)) return -1;
  if (used.has(page.title)) return -1;
  let s = 10 - page.index * 0.15;
  if (/2026/.test(t)) s += 4; else if (/2025/.test(t)) s += 3; else if (/2024/.test(t)) s += 1;
  if (opt.prefer) opt.prefer.forEach((p) => { if (new RegExp(p).test(t)) s += 3; });
  if (opt.avoid) opt.avoid.forEach((p) => { if (new RegExp(p).test(t)) s -= 6; });
  return s;
}

function download(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    execFileSync('curl', ['-sSL', '-f', '--retry', '4', '--retry-delay', '3', '-A', UA, '-o', dest, url], { stdio: 'pipe' });
    const st = fs.statSync(dest);
    if (st.size < 4000) { fs.unlinkSync(dest); return false; }
    return true;
  } catch { try { fs.unlinkSync(dest); } catch {} return false; }
}

/** Cherche, choisit les `count` meilleures images et les enregistre sous <rel>-N.ext */
async function grab(rel, queries, opt, count = 1) {
  let got = 0;
  const base = path.join(root, 'assets/img', rel);
  for (const q of queries) {
    if (got >= count) break;
    const pages = await search(q);
    await sleep(400);
    const ranked = pages.map((p) => [score(p, opt), p]).filter((x) => x[0] >= 0).sort((a, b) => b[0] - a[0]);
    for (const [, p] of ranked) {
      if (got >= count) break;
      const ii = p.imageinfo[0];
      const isSvg = /svg/.test(ii.mime);
      const ext = isSvg ? 'png' : (ii.mime.includes('png') ? 'png' : 'jpg');
      const key = count === 1 ? rel : rel + '-' + (got + 1);
      const dest = path.join(root, 'assets/img', key + '.' + ext);
      const src = ii.thumburl || ii.url;
      if (!download(src, dest)) continue;
      const em = ii.extmetadata || {};
      const strip = (s) => (s ? s.replace(/<[^>]+>/g, '').trim() : '');
      attribution[key + '.' + ext] = {
        title: p.title, source: ii.descriptionurl, author: strip(em.Artist && em.Artist.value),
        license: strip(em.LicenseShortName && em.LicenseShortName.value), licenseUrl: em.LicenseUrl && em.LicenseUrl.value || ''
      };
      used.add(p.title);
      got++;
      console.log('  ✓', key + '.' + ext, '←', p.title);
    }
  }
  if (got < count) { for (let i = got; i < count; i++) missing.push(rel + (count === 1 ? '' : '-' + (i + 1))); console.log('  ✗ manquant :', rel, `(${got}/${count})`); }
  return got;
}

const what = process.argv.slice(2);
const want = (k) => !what.length || what.includes(k);

if (want('drivers')) {
  console.log('== PILOTES');
  for (const d of P.drivers) {
    const n = norm(d.last);
    console.log(d.first, d.last);
    await grab('drivers/' + d.id, [`${d.first} ${d.last} 2026`, `${d.first} ${d.last} 2025 Grand Prix`, `${d.first} ${d.last}`], { must: [n], avoid: ['team principal', 'press conference'] }, 3);
  }
}

if (want('cars')) {
  console.log('== VOITURES');
  const kw = { mclaren: ['mclaren'], mercedes: ['mercedes'], redbull: ['red bull|redbull'], ferrari: ['ferrari'], williams: ['williams'], racingbulls: ['racing bulls|rb ?\\d|vcarb|alphatauri'], astonmartin: ['aston martin'], haas: ['haas'], audi: ['audi|sauber'], alpine: ['alpine'], cadillac: ['cadillac'] };
  for (const t of P.teams) {
    console.log(t.name);
    await grab('cars/' + t.id, [`${t.name} 2026 Formula 1 car`, `${t.name} F1 2026`, `${t.name} Formula 1 2025 car`, `${t.name} Formula One car`], { must: kw[t.id], prefer: ['car|mcl|w1|rb2|sf-|fw|vf-|a52|a526|amr|c44|c45|gp|f1'], avoid: ['logo', 'driver', 'pit'] }, 3);
  }
}

if (want('teams')) {
  console.log('== LOGOS');
  for (const t of P.teams) {
    console.log(t.name);
    await grab('teams/' + t.id, [`${t.name} F1 logo`, `${t.name} Formula One Team logo svg`, `${t.name} logo`], { svg: true, must: [norm(t.name.split(' ')[0])], prefer: ['logo'] }, 1);
  }
}

if (want('circuits')) {
  console.log('== CIRCUITS');
  for (const c of P.circuits) {
    console.log(c.name);
    const w = norm(c.name.split(/[ -]/).filter((x) => x.length > 3)[0] || c.name);
    await grab('circuits/' + c.id, [`${c.name} 2025`, `${c.name} aerial`, `${c.name}`, `${c.city} Grand Prix`], { must: [w], avoid: ['layout', 'map', 'track'] }, 2);
    await grab('circuits/' + c.id + '-layout', [`${c.name} track layout`, `Circuit ${c.name} layout svg`, `${c.city} circuit map`], { svg: true, must: [w], prefer: ['layout|track|circuit|map'], minW: 0 }, 1);
  }
}

fs.writeFileSync(attrPath, JSON.stringify(attribution, null, 1));
const mdPath = path.join(root, 'MISSING_IMAGES.md');
let old = [];
if (what.length && fs.existsSync(mdPath)) old = fs.readFileSync(mdPath, 'utf8').split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
const sect = new Set(what.length ? what : ['drivers', 'cars', 'teams', 'circuits']);
old = old.filter((m) => !sect.has(m.split('/')[0]));
const all = Array.from(new Set(old.concat(missing))).sort();
fs.writeFileSync(mdPath, '# Images manquantes\n\nChemins relatifs à `assets/img/` (le site affiche un placeholder aux couleurs de l\'équipe). Déposez le fichier ici avec ce nom pour le remplacer.\n\n' + (all.length ? all.map((m) => '- ' + m).join('\n') : '_Aucune._') + '\n');
console.log('\nTerminé. Manquantes :', missing.length);
