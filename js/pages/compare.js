(function (P) {
  const { $, $$ } = P;
  const ROWS = [['titles', 'Titres mondiaux'], ['wins', 'Victoires'], ['podiums', 'Podiums'], ['poles', 'Pole positions'], ['fastest', 'Meilleurs tours'], ['races', 'Grands Prix'], ['points', 'Points en carrière']];
  let sel = [P.driver(P.qs.get('a')) ? P.qs.get('a') : null, P.driver(P.qs.get('b')) ? P.qs.get('b') : null];

  $('#app').innerHTML = '<div class="page-head"><p class="crumb"><a href="index.html">Accueil</a> / Comparer</p><h1>Face à <span class="o">face</span></h1>' +
    '<p class="sub">Choisissez deux pilotes dans la grille : leurs statistiques de carrière s\'affichent côte à côte.</p></div>' +
    '<div class="wrap"><div class="cmp-top"><div class="slot" id="sa" data-slot="a"></div><div class="vs" aria-hidden="true">VS</div><div class="slot" id="sb" data-slot="b"></div></div>' +
    '<div class="picker" id="pk" role="group" aria-label="Choisir un pilote"></div>' +
    '<div class="cmp" id="cmp" aria-live="polite"></div><p class="note-src" style="padding-bottom:10vh">Source : Wikipédia, arrêtée au ' + P.statsAsOf + '.</p></div>';

  const pk = $('#pk');
  P.drivers.forEach((d) => {
    const t = P.team(d.team), b = document.createElement('button');
    b.className = 'pick'; b.dataset.id = d.id; b.style.setProperty('--c', t.color); b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', d.first + ' ' + d.last);
    b.appendChild(P.img('drivers/' + d.id + '-1', d.first + ' ' + d.last, t.color, '', true));
    b.insertAdjacentHTML('beforeend', '<span class="pn">' + d.last + '</span>');
    pk.appendChild(b);
  });
  pk.addEventListener('click', (e) => {
    const b = e.target.closest('.pick'); if (!b) return;
    const id = b.dataset.id, i = sel.indexOf(id);
    if (i > -1) sel[i] = null;
    else if (!sel[0]) sel[0] = id;
    else if (!sel[1]) sel[1] = id;
    else sel[1] = id; // deux déjà choisis : on remplace le second
    render();
  });
  $$('.slot').forEach((s) => s.addEventListener('click', () => { const i = s.dataset.slot === 'a' ? 0 : 1; if (sel[i]) { sel[i] = null; render(); } }));

  function slot(el, id) {
    el.innerHTML = '';
    if (!id) { el.style.removeProperty('--c'); el.insertAdjacentHTML('beforeend', '<div class="empty">Choisir un pilote</div>'); return; }
    const d = P.driver(id), t = P.team(d.team);
    el.style.setProperty('--c', t.color);
    const w = document.createElement('div'); w.className = 'ph-wrap'; w.appendChild(P.img('drivers/' + id + '-1', d.first + ' ' + d.last, t.color, '', true)); el.appendChild(w);
    el.insertAdjacentHTML('beforeend', '<div class="no" aria-hidden="true">' + d.number + '</div><div class="nm"><small>' + d.first + ' · ' + t.name + '</small>' + d.last + '</div>');
    if (window.gsap && !P.reduced) gsap.from(w, { scale: 1.15, opacity: 0, duration: 0.8, ease: 'power3.out' });
  }

  function render() {
    $$('.pick', pk).forEach((b) => b.setAttribute('aria-pressed', sel.includes(b.dataset.id)));
    slot($('#sa'), sel[0]); slot($('#sb'), sel[1]);
    const u = new URL(location.href); u.search = ''; if (sel[0]) u.searchParams.set('a', sel[0]); if (sel[1]) u.searchParams.set('b', sel[1]);
    history.replaceState(null, '', u.pathname.split('/').pop() + u.search);
    const box = $('#cmp');
    if (!sel[0] || !sel[1]) { box.innerHTML = '<p class="cmp-hint">Sélectionnez ' + (!sel[0] && !sel[1] ? 'deux pilotes' : 'un second pilote') + ' pour lancer la comparaison.</p>'; return; }
    const A = P.driver(sel[0]), B = P.driver(sel[1]), cA = P.team(A.team).color, cB = P.team(B.team).color;
    box.innerHTML = ROWS.map((r) => {
      const a = A.stats[r[0]], b = B.stats[r[0]], max = Math.max(a, b, 1);
      const cls = a > b ? 'win-l' : b > a ? 'win-r' : '';
      return '<div class="cmp-row ' + cls + '" data-k="' + r[0] + '"><div class="side l" style="--c:' + cA + '"><span class="val" data-v="' + a + '">0</span><div class="track"><div class="fill" data-s="' + (a / max) + '"></div></div></div>' +
        '<div class="lbl">' + r[1] + '</div><div class="side r" style="--c:' + cB + '"><span class="val" data-v="' + b + '">0</span><div class="track"><div class="fill" data-s="' + (b / max) + '"></div></div></div></div>';
    }).join('');
    $$('.cmp-row', box).forEach((row, i) => {
      $$('.val', row).forEach((v) => P.countUp(v, +v.dataset.v, { dec: (+v.dataset.v % 1) ? 1 : 0, now: true, dur: 1.2 }));
      $$('.fill', row).forEach((f) => {
        if (window.gsap && !P.reduced) gsap.to(f, { scaleX: +f.dataset.s, duration: 1.3, ease: 'power3.out', delay: i * 0.07 });
        else f.style.transform = 'scaleX(' + f.dataset.s + ')';
      });
    });
  }
  P.init(); render();
})(window.PITWALL);
