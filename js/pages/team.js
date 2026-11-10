(function (P) {
  const { $ } = P;
  const t = P.team(P.qs.get('id'));
  if (!t) { location.replace('teams.html'); return; }
  document.title = t.name + ' — PIT WALL';
  P.setAccent(t.color);
  const logo = P.src('teams/' + t.id);
  $('#app').innerHTML =
    '<section class="t-hero"><div class="bg" id="tbg"></div><div class="in"><p class="crumb"><a href="index.html">Accueil</a> / <a href="teams.html">Écuries</a> / ' + t.name + '</p>' +
    '<h1>' + t.name + '</h1><div class="full">' + (logo ? '<img src="' + logo + '" alt="Logo ' + t.name + '">' : '') + '<span>' + t.full + '</span></div></div></section>' +
    '<div class="wrap sec"><dl class="specs"><div><dt>Base</dt><dd>' + t.base + '</dd></div><div><dt>Moteur</dt><dd>' + t.engine + '</dd></div><div><dt>Châssis</dt><dd>' + t.chassis + '</dd></div><div><dt>Fondation</dt><dd>' + t.founded + '</dd></div></dl></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Les pilotes</h2><div class="t-drivers" id="td"></div></div>' +
    '<div class="wrap sec"><h2 class="sec-title">La voiture</h2><div class="gal3" id="g3"></div><p style="margin-top:2rem"><a class="btn" href="index.html?team=' + t.id + '">Voir la voiture en 3D →</a></p></div>' +
    '<div class="wrap sec"><h2 class="sec-title">Histoire</h2><p class="history">' + t.history + '</p></div>';
  $('#tbg').appendChild(P.img('cars/' + t.id + '-1', t.name, t.color, '', true));
  t.drivers.forEach((id) => { const c = P.driverCard(P.driver(id), true); $('#td').appendChild(c); P.tilt(c, 6); });
  [1, 2, 3].forEach((n) => { const f = document.createElement('figure'); f.appendChild(P.img('cars/' + t.id + '-' + n, t.name + ' — photo ' + n, t.color)); $('#g3').appendChild(f); });
  P.init(); P.reveal('.sec-title,.specs,.history'); P.maskReveal($('#tbg'), 'left');
})(window.PITWALL);
