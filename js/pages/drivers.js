(function (P) {
  const { $, $$ } = P;
  $('#app').innerHTML = '<div class="page-head"><p class="crumb"><a href="index.html">Accueil</a> / Pilotes</p><h1>La <span class="o">grille</span></h1>' +
    '<p class="sub">' + P.drivers.length + ' pilotes, ' + P.teams.length + ' écuries. Survolez pour l\'effet 3D, cliquez pour le profil.</p></div>' +
    '<div class="wrap"><div class="filters" id="fl" role="group" aria-label="Filtrer par écurie"></div><div class="dgrid" id="dg"></div></div>';
  const fl = $('#fl'), dg = $('#dg');
  const mk = (id, label) => { const b = document.createElement('button'); b.className = 'fbtn'; b.dataset.id = id; b.textContent = label; b.setAttribute('aria-pressed', id === 'all'); fl.appendChild(b); };
  mk('all', 'Tous'); P.teams.forEach((t) => mk(t.id, t.name));
  P.drivers.forEach((d) => { const c = P.driverCard(d); dg.appendChild(c); P.tilt(c, 7); });
  fl.addEventListener('click', (e) => {
    const b = e.target.closest('.fbtn'); if (!b) return;
    $$('.fbtn', fl).forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('.dc', dg).forEach((c) => { c.style.display = b.dataset.id === 'all' || P.driver(c.dataset.id).team === b.dataset.id ? '' : 'none'; });
  });
  P.init(); P.reveal('.dc', { y: 70 });
})(window.PITWALL);
