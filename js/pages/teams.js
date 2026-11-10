(function (P) {
  const { $ } = P;
  $('#app').innerHTML = '<div class="page-head"><p class="crumb"><a href="index.html">Accueil</a> / Écuries</p><h1>Les <span class="o">écuries</span></h1>' +
    '<p class="sub">' + P.teams.length + ' équipes sur la grille 2026. Survolez une carte, cliquez pour la fiche complète : pilotes, galerie, histoire.</p></div><div class="wrap"><div class="tgrid" id="tg"></div></div>';
  P.teams.forEach((t, i) => {
    const a = document.createElement('a');
    a.className = 'tc'; a.href = 'team.html?id=' + t.id; a.style.setProperty('--c', t.color); a.dataset.id = t.id;
    a.setAttribute('aria-label', t.full);
    a.appendChild(P.img('cars/' + t.id + '-1', t.name, t.color));
    const logo = P.src('teams/' + t.id);
    a.insertAdjacentHTML('beforeend', '<div class="bar"></div><div class="idx" aria-hidden="true">' + P.pad(i + 1) + '</div>' + (logo ? '<img class="logo-t" src="' + logo + '" alt="" loading="lazy">' : '') +
      '<div class="meta"><h2>' + t.name + '</h2><p>' + t.drivers.map((d) => P.driver(d).last).join(' · ') + '</p></div>');
    $('#tg').appendChild(a); P.tilt(a, 7);
  });
  P.init(); P.reveal('.tc', { y: 60 });
})(window.PITWALL);
