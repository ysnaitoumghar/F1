(function (P) {
  const { $ } = P;
  const d = P.driver(P.qs.get('id'));
  if (!d) { location.replace('drivers.html'); return; }
  const t = P.team(d.team), s = d.stats, age = P.season - d.born;
  document.title = d.first + ' ' + d.last + ' — PIT WALL';
  P.setAccent(t.color);
  const mate = P.driver(t.drivers.find((x) => x !== d.id));
  const hl = [];
  if (s.titles) hl.push([s.titles + '×', 'champion du monde']);
  if (s.wins) hl.push([s.wins, 'victoire' + (s.wins > 1 ? 's' : '') + ' en Grand Prix']);
  if (s.podiums) hl.push([s.podiums, 'podium' + (s.podiums > 1 ? 's' : '')]);
  if (s.poles) hl.push([s.poles, 'pole position' + (s.poles > 1 ? 's' : '')]);
  hl.push(['#' + d.number, 'numéro de course en 2026, chez ' + t.full]);
  hl.push([s.races, 'Grands Prix disputés — ' + (s.races < 60 ? 'encore au début de sa carrière' : 'une carrière bien installée')]);
  $('#app').innerHTML =
    '<section class="d-hero"><div class="no" id="dno" aria-hidden="true">' + d.number + '</div><div class="ph-wrap" id="dph"></div><div class="in">' +
    '<p class="crumb"><a href="index.html">Accueil</a> / <a href="drivers.html">Pilotes</a> / ' + d.last + '</p><h1><small>' + d.first + '</small>' + d.last + '</h1>' +
    '<div class="d-meta"><span>' + P.flag(d.country, d.nationality) + d.nationality + '</span><span>' + age + ' ans</span><a href="team.html?id=' + t.id + '"><span>' + t.name + ' →</span></a></div></div></section>' +
    '<div class="wrap sec"><h2 class="sec-title">Statistiques de carrière</h2><div class="statgrid">' +
    [['titles', 'Titres mondiaux'], ['wins', 'Victoires'], ['podiums', 'Podiums'], ['poles', 'Pole positions'], ['fastest', 'Meilleurs tours'], ['races', 'Grands Prix'], ['points', 'Points en carrière']]
      .map((k) => '<div><b data-v="' + s[k[0]] + '">0</b><span>' + k[1] + '</span></div>').join('') + '<div><b>#' + d.number + '</b><span>Numéro 2026</span></div></div>' +
    '<p class="note-src">Source : Wikipédia, arrêtée au ' + P.statsAsOf + '.</p></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Faits marquants</h2><ul class="hl">' + hl.map((h) => '<li><b>' + h[0] + '</b><span>' + h[1] + '</span></li>').join('') + '</ul></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Galerie</h2><div class="gal3" id="g3"></div></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Coéquipier</h2><div class="t-drivers" id="mate"></div><p style="margin-top:2rem"><a class="btn" href="compare.html?a=' + d.id + '&b=' + mate.id + '">Comparer avec ' + mate.last + ' →</a></p></div>';
  $('#dph').appendChild(P.img('drivers/' + d.id + '-1', d.first + ' ' + d.last, t.color, '', true));
  [1, 2, 3].forEach((n) => { const f = document.createElement('figure'); f.appendChild(P.img('drivers/' + d.id + '-' + n, d.first + ' ' + d.last + ' — photo ' + n, t.color)); $('#g3').appendChild(f); });
  const mc = P.driverCard(mate, true); $('#mate').appendChild(mc); P.tilt(mc, 6);
  document.querySelectorAll('.statgrid b[data-v]').forEach((b) => P.countUp(b, +b.dataset.v, { dec: (+b.dataset.v % 1) ? 1 : 0 }));
  P.init(); P.reveal('.sec-title,.hl li');
  if (window.gsap && !P.reduced) gsap.from('#dno', { xPercent: 12, opacity: 0, duration: 1.6, ease: 'expo.out' });
  if (window.gsap && !P.reduced && !P.touch) addEventListener('pointermove', (e) => { const x = e.clientX / innerWidth - 0.5; gsap.to('#dno', { x: x * -50, duration: 0.8 }); gsap.to('#dph', { x: x * 18, duration: 0.8 }); });
})(window.PITWALL);
