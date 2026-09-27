/* Crisna se Kombuis — wolk-rugsteun (Cloudflare Worker + D1).
   Die hoofkopie bly in localStorage (crisna_kombuis_v1) en die app werk steeds aflyn.
   - Skryf-kode (Crisna se foon): na elke stoor() gaan 'n kopie na die wolk.
   - Lees-kode (IP se toestel): haal die nuutste data af en stuur niks terug nie.
   Die kodes staan NOOIT in die repo nie. Hulle word een keer in Instellings geplak.
   Laai hierdie lêer NA app.js. */
(function () {
  var WOLK_URL = 'https://kombuis-api.zimmerman-payroll.workers.dev';
  var WSLEUTEL = 'crisna_kombuis_wolk'; // aparte key; raak nooit crisna_kombuis_v1 nie
  var WAG = 3000;                        // ms na die laaste stoor() voor ons stuur

  var W = leesW(), tyd = null, besig = false, weer = false;
  function leesW() { try { return JSON.parse(localStorage.getItem(WSLEUTEL)) || {}; } catch (e) { return {}; } }
  function skryfW() { try { localStorage.setItem(WSLEUTEL, JSON.stringify(W)); } catch (e) {} }
  function stoorPlaaslik() { try { localStorage.setItem(SLEUTEL, JSON.stringify(S)); } catch (e) {} }

  function roep(metode, liggaam, token) {
    return fetch(WOLK_URL + '/data', {
      method: metode, cache: 'no-store',
      headers: { 'Authorization': 'Bearer ' + (token || W.token), 'Content-Type': 'application/json' },
      body: liggaam ? JSON.stringify(liggaam) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._s = r.status; return j; });
    });
  }

  /* ---------- skryf: stuur na die wolk ---------- */
  function gestoor() {
    if (W.rol !== 'skryf') return;
    W.vuil = (W.vuil || 0) + 1; skryfW();
    clearTimeout(tyd); tyd = setTimeout(stuur, WAG);
  }
  function stuur() {
    clearTimeout(tyd);
    if (!W.token || W.rol !== 'skryf' || !W.vuil || W.fout === 'botsing') return;
    if (besig) { weer = true; return; }
    besig = true;
    var n = W.vuil;
    roep('PUT', { data: S, basis: W.weergawe == null ? null : W.weergawe }).then(function (j) {
      if (j._s === 200) { W.weergawe = j.weergawe; W.laas = Date.now(); W.fout = null; if (W.vuil === n) W.vuil = 0; }
      else if (j._s === 409) { W.fout = 'botsing'; W.wolkWeergawe = j.weergawe; }
      else if (j._s === 401) W.fout = 'kode';
      else W.fout = 'bediener';
    }, function () { W.fout = 'aflyn'; })
    .then(function () { skryfW(); besig = false; verfris(); if (weer) { weer = false; stuur(); } });
  }

  /* ---------- lees: haal van die wolk af ---------- */
  function haal(stil) {
    if (!W.token || W.rol !== 'lees') return;
    roep('GET').then(function (j) {
      if (j._s !== 200) { W.fout = j._s === 401 ? 'kode' : 'bediener'; return; }
      W.fout = null; W.laas = Date.now(); W.weergawe = j.weergawe;
      if (j.data && JSON.stringify(j.data) !== kiekie()) {
        S = j.data; migreer(); stoorPlaaslik(); teken();
        if (!stil) toon('Bygewerk');
      }
    }, function () { W.fout = 'aflyn'; })
    .then(function () { skryfW(); verfris(); });
  }

  /* ---------- status ---------- */
  function tydTeks(ms) {
    if (!ms) return 'nog nooit';
    var d = new Date(ms), iso = isoVan(d), hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    var g = new Date(); g.setDate(g.getDate() - 1);
    if (iso === vandagISO()) return 'vandag ' + hm;
    if (iso === isoVan(g)) return 'gister ' + hm;
    return dKort(iso) + ' ' + hm;
  }
  function statusTeks() {
    if (!W.token) return 'Nie aan die wolk gekoppel nie. Die data is net op hierdie foon.';
    if (W.fout === 'kode') return 'Die wolk-kode werk nie meer nie. Ontkoppel en koppel weer.';
    if (W.rol === 'lees') {
      if (W.fout) return 'Lees-alleen. Geen verbinding nie; data van ' + tydTeks(W.laas) + '.';
      return 'Lees-alleen. Crisna se data, bygewerk ' + tydTeks(W.laas) + '.';
    }
    if (W.fout === 'botsing') return 'Die wolk het ander data as hierdie foon. Kies hieronder watter een moet bly.';
    if (W.vuil) return 'Wag vir internet om die jongste veranderinge in die wolk te stoor. Laas gestoor: ' + tydTeks(W.laas) + '.';
    return 'Alles is in die wolk gestoor, ' + tydTeks(W.laas) + '.';
  }
  function verfris() {
    var st = document.getElementById('wolk-status'); if (st) st.textContent = statusTeks();
    var el = document.getElementById('wolk-strook');
    if (W.rol !== 'lees') { if (el) el.remove(); document.body.classList.remove('wolk-lees'); return; }
    if (!el) { el = document.createElement('div'); el.id = 'wolk-strook'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    document.body.classList.add('wolk-lees');
    el.textContent = W.fout ? 'Lees-alleen. Data van ' + tydTeks(W.laas) + '.' : 'Lees-alleen. Bygewerk ' + tydTeks(W.laas) + '.';
  }

  /* ---------- Instellings-afdeling (app.js roep dit) ---------- */
  function afdeling() {
    var k;
    if (!W.token) k = '<button class="knop sag" data-wolk="koppel">Koppel aan die wolk</button>';
    else if (W.rol === 'lees') k = '<button class="knop sag" data-wolk="haal">Werk nou by</button>'
                                 + '<button class="knop sag" data-wolk="ontkoppel">Ontkoppel</button>';
    else if (W.fout === 'botsing') k = '<button class="knop sag" data-wolk="hou">Hou hierdie foon s&rsquo;n</button>'
                                     + '<button class="knop sag" data-wolk="afhaal">Haal die wolk s&rsquo;n af</button>';
    else k = '<button class="knop sag" data-wolk="nou">Stoor nou</button>'
           + '<button class="knop sag" data-wolk="herstel">Herstel uit die wolk</button>';
    return '<div class="afdeling"><span class="eyebrow">Wolk</span>'
      + (W.token && W.rol === 'skryf' ? '<button class="skakel" data-wolk="ontkoppel">Ontkoppel</button>' : '') + '</div>'
      + '<p class="hint" id="wolk-status">' + h(statusTeks()) + '</p>'
      + '<div class="knoppe">' + k + '</div>';
  }

  function haalEnVervang(boodskap) {
    roep('GET').then(function (j) {
      if (j._s !== 200 || !j.data) { toon(j._s === 200 ? 'Die wolk is nog leeg' : 'Kon nie die wolk bereik nie'); return; }
      var voor = kiekie();
      S = j.data; migreer(); stoorPlaaslik();
      W.weergawe = j.weergawe; W.fout = null; W.vuil = 0; W.laas = Date.now(); skryfW();
      teken(); toon(boodskap, voor);
    }, function () { toon('Geen internet nie. Probeer weer.'); });
  }

  function bladKoppel() {
    bladOop('<h3>Koppel aan die wolk</h3>'
      + '<p class="hint">Plak die kode wat IP vir jou gestuur het.</p>'
      + '<div class="veld"><label for="wk-kode">Kode</label>'
      + '<input id="wk-kode" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></div>'
      + '<div class="knoppe"><button class="knop sag" data-toe>Kanselleer</button>'
      + '<button class="knop" id="wk-koppel">Koppel</button></div>');
    $('#wk-koppel').onclick = function () {
      var knop = this, kode = $('#wk-kode').value.trim();
      if (!kode) { toon('Plak eers die kode'); return; }
      knop.disabled = true; knop.textContent = 'Besig…';
      roep('GET', null, kode).then(function (j) {
        knop.disabled = false; knop.textContent = 'Koppel';
        if (j._s === 401) { toon('Die kode werk nie'); return; }
        if (j._s !== 200) { toon('Kon nie die wolk bereik nie'); return; }
        W = { token: kode, rol: j.rol, weergawe: j.weergawe, vuil: 0, laas: Date.now() };
        if (j.rol === 'lees') {
          if (j.data) { S = j.data; migreer(); stoorPlaaslik(); }
          skryfW(); bladToe(); teken(); verfris();
          toon(j.data ? 'Gekoppel (lees-alleen)' : 'Gekoppel, maar die wolk is nog leeg');
          return;
        }
        if (!j.data) { W.vuil = 1; skryfW(); bladToe(); stuur(); teken(); toon('Gekoppel. Jou data word nou in die wolk gestoor.'); return; }
        if (JSON.stringify(j.data) === kiekie()) { skryfW(); bladToe(); teken(); toon('Gekoppel'); return; }
        W.fout = 'botsing'; W.wolkWeergawe = j.weergawe; W.weergawe = null; skryfW();
        bladToe(); teken(); toon('Die wolk het reeds data. Kies watter een moet bly.');
      }, function () { knop.disabled = false; knop.textContent = 'Koppel'; toon('Geen internet nie. Probeer weer.'); });
    };
  }

  document.getElementById('app').addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-wolk]'); if (!el) return;
    var a = el.getAttribute('data-wolk');
    if (a === 'koppel') bladKoppel();
    else if (a === 'haal') haal(false);
    else if (a === 'nou') { W.vuil = (W.vuil || 0) + 1; stuur(); toon('Besig om te stoor…'); }
    else if (a === 'herstel') bladBevestig('Herstel uit die wolk?',
      'Dit vervang alles op hierdie foon met die wolk se kopie. Jy kan dit dadelik ontdoen.',
      'Ja, herstel', function () { haalEnVervang('Herstel uit die wolk'); });
    else if (a === 'afhaal') haalEnVervang('Die wolk se data is afgehaal');
    else if (a === 'hou') { W.weergawe = W.wolkWeergawe; W.fout = null; W.vuil = (W.vuil || 0) + 1; skryfW(); stuur(); teken(); }
    else if (a === 'ontkoppel') bladBevestig('Ontkoppel van die wolk?',
      'Die data op hierdie foon bly net so. Dit word net nie meer in die wolk gestoor of bygewerk nie.',
      'Ontkoppel', function () { W = {}; skryfW(); verfris(); teken(); toon('Ontkoppel'); });
  });

  /* ---------- wanneer om te stuur / te haal ---------- */
  window.addEventListener('online', function () { stuur(); haal(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') stuur();
    else haal(false);
  });

  var styl = document.createElement('style');
  styl.textContent =
    '#wolk-strook{position:fixed;left:0;right:0;top:0;z-index:45;padding:calc(4px + env(safe-area-inset-top)) 16px 5px;'
    + 'background:var(--merk);color:var(--merk-ink);font-size:12px;font-weight:600;text-align:center;line-height:1.3}'
    + 'body.wolk-lees .kop{padding-top:calc(44px + env(safe-area-inset-top))}'
    + 'body.wolk-lees .terug{margin-top:calc(36px + env(safe-area-inset-top))}';
  document.head.appendChild(styl);

  window.wolk = { gestoor: gestoor, afdeling: afdeling };

  verfris();
  if (W.rol === 'skryf') { if (W.fout === 'botsing') toon('Die wolk-rugsteun het aandag nodig. Kyk in Instellings.'); else stuur(); }
  if (W.rol === 'lees') haal(true);
})();
