/* PIT WALL — accueil : chargement, voiture 3D, sélecteur d'écurie, compte à rebours, sections */
import { createCarScene } from './car3d.js';

const P = window.PITWALL, { $, $$ } = P;
gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0); // les animations suivent l'horloge réelle même si le rendu 3D est lent

P.init();

/* ── Écurie courante (accent global) ── */
function setAccent(t) { P.setAccent(t.color); }

/* ── Scène 3D ── */
let car = null;
try {
  const first = P.team(P.team(P.qs.get('team')) ? P.qs.get('team') : 'mclaren');
  setAccent(first);
  car = createCarScene($('#scene'), { color: first.color, accent: first.color2 });
  const camTl = car.bindScroll($('#hero'));
  const qp = new URLSearchParams(location.search).get('p'); // test : ?p=0.5 fige la caméra
  if (qp !== null) { camTl.scrollTrigger.kill(); camTl.progress(+qp); }
  $('#zIn').onclick = () => car.zoom(0.88); $('#zOut').onclick = () => car.zoom(1.14);
} catch (e) {
  console.warn('WebGL indisponible', e);
  $('#scene').replaceWith(Object.assign(document.createElement('div'), { className: 'ph', textContent: 'WebGL indisponible' }));
}

/* ── Sélecteur d'écurie ── */
const chips = $('#chips');
function selectTeam(id, instant) {
  const t = P.team(id); setAccent(t);
  $$('.chip', chips).forEach((c) => c.setAttribute('aria-selected', c.dataset.id === id));
  if (car) car.setTeam(t.color, t.color2, instant ? 0.01 : 0.9);
  const nm = $('#selName');
  gsap.fromTo(nm, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  nm.textContent = t.name;
  $('#selNums').textContent = t.drivers.map((d) => '#' + P.driver(d).number + ' ' + P.driver(d).last.toUpperCase()).join('  ·  ');
}
P.teams.forEach((t) => {
  const b = document.createElement('button');
  b.className = 'chip'; b.dataset.id = t.id; b.setAttribute('role', 'option'); b.style.setProperty('--c', t.color);
  b.innerHTML = '<i></i>' + t.name; b.addEventListener('click', () => selectTeam(t.id));
  chips.appendChild(b);
});
selectTeam(P.team(P.qs.get('team')) ? P.qs.get('team') : 'mclaren', true);

/* ── Panneaux d'angle + barre de progression ── */
const panels = $$('.angle'), ranges = [[0.14, 0.36], [0.49, 0.72], [0.84, 1.01]];
ScrollTrigger.create({
  trigger: '#hero', start: 'top top', end: 'bottom bottom',
  onUpdate(self) {
    const p = self.progress;
    panels.forEach((el, i) => el.classList.toggle('on', p > ranges[i][0] && p < ranges[i][1]));
    $('#hudTitle').classList.toggle('gone', p > 0.05);
    $('#dragHint').classList.toggle('gone', p > 0.05);
    $('.scroll-cue').style.opacity = p > 0.03 ? 0 : 1;
    gsap.set('#heroBar', { scaleX: p });
  }
});
/* ── Prochaine course ── */
const next = P.nextRace();
const lastRound = P.circuits[P.circuits.length - 1];
const race = next || lastRound;
$('#roundInfo').textContent = next ? 'Manche ' + next.round + ' / ' + P.circuits.length : 'Saison terminée';
$('#nextKicker').textContent = next ? 'Prochaine course · manche ' + next.round : 'Dernière course de la saison';
$('#nextGp').textContent = race.gp.replace('Grand Prix', 'GP');
$('#nextPlace').textContent = race.name + ' — ' + race.city + ', ' + race.country + '  ·  ' + race.length.toFixed(3).replace('.', ',') + ' km' + (race.sprint ? '  ·  Sprint' : '');
$('#nextNote').textContent = race.note || '';
const bgSrc = P.firstSrc('circuits/' + race.id + '-1', 'circuits/' + race.id + '-2');
if (bgSrc) $('#nextBg').style.backgroundImage = 'url(' + bgSrc + ')';
else $('#nextBg').style.background = 'radial-gradient(circle at 70% 30%,rgba(var(--accent-rgb),.35),transparent 60%)';
const target = P.startOf(race).getTime();
const units = { d: $('[data-u=d]'), h: $('[data-u=h]'), m: $('[data-u=m]'), s: $('[data-u=s]') };
function tick() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const v = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  for (const k in units) {
    const t = P.pad(v[k]);
    if (units[k].textContent !== t) { units[k].textContent = t; if (k === 's') { units[k].classList.add('tick'); setTimeout(() => units[k].classList.remove('tick'), 220); } }
  }
}
tick(); setInterval(tick, 1000);

/* ── Compteurs ── */
const nums = { 0: P.teams.length, 1: P.drivers.length, 2: P.circuits.length, 3: P.circuits.filter((c) => c.sprint).length };
$$('[data-n]').forEach((el, i) => {
  const n = nums[i], o = { v: 0 };
  ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter() {
    gsap.to(o, { v: n, duration: location.search.includes('static') ? 0.01 : 1.8, ease: 'power3.out', onUpdate() { el.textContent = Math.round(o.v); } });
  } });
});

/* ── Cartes d'écuries (tilt 3D) ── */
const strip = $('#strip');
P.teams.forEach((t, i) => {
  const a = document.createElement('a');
  a.href = 'team.html?id=' + t.id; a.className = 'tcard'; a.style.setProperty('--c', t.color);
  a.dataset.hover = ''; a.dataset.cursor = 'Voir';
  a.appendChild(P.img('cars/' + t.id + '-1', t.name, t.color));
  a.insertAdjacentHTML('beforeend', '<div class="bar"></div><div class="tno">' + P.pad(i + 1) + '</div><div class="meta"><div class="tn">' + t.name + '</div><div class="td">' +
    t.drivers.map((d) => P.driver(d).last).join(' · ') + '</div></div>');
  strip.appendChild(a);
});
function tilt(el, max = 9) {
  if (P.touch || P.reduced) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: x * max * 2, rotateX: -y * max * 2, transformPerspective: 900, duration: 0.5, ease: 'power3.out' });
  });
  el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' }));
}
$$('.tcard').forEach((c) => tilt(c));

/* ── Mur de pilotes (deux bandes) ── */
function fillMarquee(el, list) {
  const make = (d) => {
    const t = P.team(d.team), c = document.createElement('a'); c.href = 'driver.html?id=' + d.id; c.className = 'dcard'; c.style.setProperty('--c', t.color);
    c.appendChild(P.img('drivers/' + d.id + '-1', d.first + ' ' + d.last, t.color));
    c.insertAdjacentHTML('beforeend', '<div class="no">' + d.number + '</div><div class="nm"><small>' + d.first + '</small>' + d.last + '</div>');
    return c;
  };
  [...list, ...list].forEach((d) => el.appendChild(make(d)));
}
fillMarquee($('#mq1'), P.drivers.slice(0, 11)); fillMarquee($('#mq2'), P.drivers.slice(11));

/* ── Circuits : les trois dernières manches à venir ── */
const upcoming = P.circuits.filter((c) => P.startOf(c).getTime() > Date.now());
const trio = (upcoming.length >= 3 ? upcoming : P.circuits).slice(0, 3);
trio.forEach((c) => {
  const el = document.createElement('a');
  el.href = 'circuit.html?id=' + c.id; el.className = 'ccard'; el.dataset.hover = '';
  el.appendChild(P.img('circuits/' + c.id + '-1', c.name, '#E10600'));
  const lay = P.src('circuits/' + c.id + '-layout');
  const d = new Date(c.date + 'T12:00:00');
  el.insertAdjacentHTML('beforeend', (lay ? '<img class="lay" alt="" src="' + lay + '">' : '') + '<div class="meta"><div class="rd">R' + P.pad(c.round) + ' · ' +
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }).toUpperCase() + '</div><h3>' + c.gp + '</h3><p>' + c.name + ' · ' + c.length.toFixed(3).replace('.', ',') + ' km</p></div>');
  $('#ctGrid').appendChild(el);
});

/* ── Révélations au scroll (masques) ── */
if (!P.reduced && !location.search.includes('static')) {
  gsap.utils.toArray('.big, .tcard, .ccard, .count, .stats > div').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.utils.toArray('.ccard img.lay').forEach(() => {});
  gsap.fromTo('#nextBg', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power4.inOut', scrollTrigger: { trigger: '#next', start: 'top 70%', once: true } });
}

/* ── Chargement : feux de départ puis révélation ── */
if (location.search.includes('skip')) { $('#loader').remove(); document.body.classList.remove('is-loading'); }
const lights = $$('#loader .ld-lights i'), num = $('#ldNum');
const ready = Promise.all([document.fonts ? document.fonts.ready : 0, new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)))]);
const prog = { v: 0 };
const ld = gsap.timeline();
if ($('#loader')) ld.to(prog, { v: 100, duration: 1.6, ease: 'power1.inOut', onUpdate() {
  num.textContent = P.pad(Math.round(prog.v), 3);
  lights.forEach((l, i) => l.classList.toggle('on', prog.v > (i + 1) * 20 - 10));
} });
Promise.all([ready, new Promise((r) => setTimeout(r, 2200))]).then(() => {
  if (!$('#loader')) return;
  lights.forEach((l) => l.classList.remove('on'));
  gsap.to('#loader', { yPercent: -100, duration: 1, ease: 'power4.inOut', delay: 0.35, onComplete() { $('#loader').remove(); document.body.classList.remove('is-loading'); ScrollTrigger.refresh(); } });
  gsap.from('.hud-title > *', { y: 60, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14, delay: 1.0 });
  gsap.from('.selector', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 1.3 });
});

if (location.search.includes('nohero')) { $('#hero').style.display = 'none'; ScrollTrigger.refresh(); } // test : voir les sections du bas
