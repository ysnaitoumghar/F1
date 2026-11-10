(function (P) {
  const { $, $$ } = P;
  const next = P.nextRace();
  $('#app').innerHTML = '<div class="page-head"><p class="crumb"><a href="index.html">Accueil</a> / Circuits</p><h1>Le <span class="o">calendrier</span></h1>' +
    '<p class="sub">' + P.circuits.length + ' Grands Prix en 2026, de Melbourne à Abou Dhabi. Cliquez sur une ligne pour la fiche du circuit.</p></div>' +
    '<div class="wrap"><div class="filters" id="fl" role="group" aria-label="Filtrer le calendrier"></div><ol class="cal" id="cal"></ol></div>';
  [['all', 'Toutes'], ['next', 'À venir'], ['past', 'Disputées'], ['sprint', 'Sprints']].forEach((f) => {
    const b = document.createElement('button'); b.className = 'fbtn'; b.dataset.f = f[0]; b.textContent = f[1]; b.setAttribute('aria-pressed', f[0] === 'all'); $('#fl').appendChild(b);
  });
  P.circuits.forEach((c) => {
    const past = P.startOf(c).getTime() < Date.now();
    const li = document.createElement('li'); li.dataset.past = past; li.dataset.sprint = c.sprint;
    const a = document.createElement('a'); a.className = 'cr' + (past ? ' past' : '') + (next && next.id === c.id ? ' next-r' : ''); a.href = 'circuit.html?id=' + c.id; a.dataset.id = c.id;
    a.setAttribute('aria-label', 'Manche ' + c.round + ' — ' + c.gp);
    a.innerHTML = '<div class="rd">' + P.pad(c.round) + '</div><div class="dt">' + P.fmtDate(c) + '</div><div class="gp">' + c.gp + (c.sprint ? '<span class="badge">Sprint</span>' : '') +
      '<small>' + c.name + ' · ' + P.flag(c.code, c.country) + ' ' + c.city + '</small></div><div class="len">' + P.fmtKm(c.length) + '</div><div class="th"></div><div class="arrow" aria-hidden="true">→</div>';
    $('.th', a).appendChild(P.img('circuits/' + c.id + '-1', c.name, '#E10600'));
    li.appendChild(a); $('#cal').appendChild(li);
  });
  $('#fl').addEventListener('click', (e) => {
    const b = e.target.closest('.fbtn'); if (!b) return;
    $$('.fbtn', $('#fl')).forEach((x) => x.setAttribute('aria-pressed', x === b));
    $$('#cal li').forEach((li) => {
      const f = b.dataset.f, show = f === 'all' || (f === 'next' && li.dataset.past === 'false') || (f === 'past' && li.dataset.past === 'true') || (f === 'sprint' && li.dataset.sprint === 'true');
      li.style.display = show ? '' : 'none';
    });
  });
  P.init(); P.reveal('.cr', { y: 30, duration: 0.8 });
})(window.PITWALL);
