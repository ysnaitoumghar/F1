/* Composants partagés : carte pilote */
(function (P) {
  P.driverCard = function (d, mini) {
    const t = P.team(d.team), a = document.createElement('a');
    a.className = 'dc' + (mini ? ' mini' : ''); a.href = 'driver.html?id=' + d.id; a.style.setProperty('--c', t.color);
    a.dataset.id = d.id; a.setAttribute('aria-label', d.first + ' ' + d.last + ', numéro ' + d.number + ', ' + t.name);
    const wrap = document.createElement('div'); wrap.className = 'ph-wrap';
    const im = P.img('drivers/' + d.id + '-1', d.first + ' ' + d.last, t.color, '', false); im.dataset.px = 18; wrap.appendChild(im);
    a.appendChild(wrap);
    a.insertAdjacentHTML('beforeend', '<div class="no" data-px="34" aria-hidden="true">' + d.number + '</div><div class="meta"><div class="tm"><i style="width:10px;height:10px;border-radius:50%;background:#fff;opacity:.9"></i>' + t.name +
      '</div><h2><small>' + d.first + '</small>' + d.last + '</h2><div class="nat">' + P.flag(d.country, d.nationality) + ' ' + d.nationality + '</div></div>');
    return a;
  };
})(window.PITWALL);
