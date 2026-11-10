(function (P) {
  const { $ } = P;
  const c = P.circuit(P.qs.get('id'));
  if (!c) { location.replace('circuits.html'); return; }
  document.title = c.gp + ' — PIT WALL';
  const i = P.circuits.indexOf(c), prev = P.circuits[i - 1], nxt = P.circuits[i + 1];
  const past = P.startOf(c).getTime() < Date.now();
  const lay = P.src('circuits/' + c.id + '-layout');
  $('#app').innerHTML =
    '<section class="t-hero"><div class="bg" id="cbg"></div><div class="in"><p class="crumb"><a href="index.html">Accueil</a> / <a href="circuits.html">Circuits</a> / Manche ' + c.round + '</p>' +
    '<h1>' + c.gp.replace('Grand Prix', 'GP') + '</h1><div class="full"><span>' + c.name + ' — ' + P.flag(c.code, c.country) + ' ' + c.city + ', ' + c.country + '</span></div></div></section>' +
    '<div class="wrap sec"><dl class="specs"><div><dt>Manche</dt><dd>' + c.round + ' / ' + P.circuits.length + '</dd></div><div><dt>Date</dt><dd>' + P.fmtDate(c, { day: 'numeric', month: 'long', year: 'numeric' }) + '</dd></div>' +
    '<div><dt>Longueur</dt><dd>' + P.fmtKm(c.length) + '</dd></div><div><dt>Format</dt><dd>' + (c.sprint ? 'Week-end sprint' : 'Standard') + '</dd></div></dl>' +
    (c.note ? '<p class="note-src">' + c.note + '</p>' : '') + '<p class="note-src">' + (past ? 'Course disputée.' : 'Course à venir.') + '</p></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Tracé</h2><div class="layout-card">' + (lay ? '<img src="' + lay + '" alt="Tracé du circuit ' + c.name + '">' : '<p class="muted">Tracé non disponible (voir MISSING_IMAGES.md).</p>') + '</div></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Photos</h2><div class="c-two" id="c2"></div>' +
    '<div class="pn-nav">' + (prev ? '<a href="circuit.html?id=' + prev.id + '">← ' + prev.gp + '</a>' : '<span></span>') + (nxt ? '<a href="circuit.html?id=' + nxt.id + '">' + nxt.gp + ' →</a>' : '<span></span>') + '</div></div>';
  $('#cbg').appendChild(P.img('circuits/' + c.id + '-2', c.name, '#E10600', '', true));
  [1, 2].forEach((n) => { const f = document.createElement('figure'); f.appendChild(P.img('circuits/' + c.id + '-' + n, c.name + ' — photo ' + n, '#E10600')); $('#c2').appendChild(f); });
  P.init(); P.reveal('.sec-title,.specs'); P.maskReveal($('#cbg'), 'left');
})(window.PITWALL);
