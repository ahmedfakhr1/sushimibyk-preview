(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; }

  /* ---------- fonts and first screen ---------- */
  var FONTS = ['600 1em "Cormorant Garamond"', 'italic 500 1em "Cormorant Garamond"', '300 1em Poppins', '400 1em Poppins', '500 1em Poppins'];
  function fontsReady() {
    if (!d.fonts || !d.fonts.load) return Promise.resolve();
    return Promise.all(FONTS.map(function (f) { return d.fonts.load(f, 'Aa'); })).catch(function () { });
  }
  function decoded(img) {
    if (!img) return Promise.resolve();
    if (img.decode) return img.decode().catch(function () { });
    return new Promise(function (r) { if (img.complete) r(); else { img.onload = img.onerror = r; } });
  }
  var heroImg = $('.hero-ph img');
  var firstScreen = [fontsReady(), decoded(heroImg), decoded($('.hero-logo img'))];

  function release() { root.classList.remove('fl'); }
  var veil = $('.veil');
  if (root.classList.contains('veiled') && veil) {
    var t0 = Date.now(), bar = $('.fill', veil), lifted = false, done = 0, total = firstScreen.length + 1;
    function paint() { bar.style.clipPath = 'inset(0 ' + (100 - Math.round(100 * done / total)) + '% 0 0)'; }
    function lift() {
      if (lifted) return; lifted = true;
      done = total; paint();
      setTimeout(function () {
        veil.classList.add('out');
        setTimeout(function () { root.classList.remove('veiled'); }, reduce ? 0 : 850);
      }, reduce ? 0 : 260);
    }
    requestAnimationFrame(function () { veil.classList.add('go'); });
    firstScreen.forEach(function (p) { p.then(function () { done++; paint(); }); });
    var minWait = new Promise(function (r) { setTimeout(r, reduce ? 0 : 1200); });
    Promise.all(firstScreen.concat([minWait])).then(lift);
    setTimeout(lift, 2500);
    ['click', 'keydown', 'touchstart'].forEach(function (ev) { veil.addEventListener(ev, lift, { passive: true }); d.addEventListener(ev, lift, { passive: true, once: true }); });
    store('sbk-intro', '1');
  } else {
    Promise.all(firstScreen).then(release);
    setTimeout(release, 3000);
  }

  /* ---------- header ---------- */
  var hd = $('.hd');
  if (hd && !hd.classList.contains('always')) {
    var heroLogo = $('.hero-logo');
    if ('IntersectionObserver' in window) {
      var s1 = d.createElement('i');
      s1.setAttribute('aria-hidden', 'true');
      s1.style.cssText = 'position:absolute;top:40px;left:0;width:1px;height:1px;pointer-events:none';
      d.body.insertBefore(s1, d.body.firstChild);
      new IntersectionObserver(function (es) { hd.classList.toggle('solid', !es[0].isIntersecting); }, { threshold: 0 }).observe(s1);
      if (heroLogo) {
        var hh = hd.offsetHeight;
        new IntersectionObserver(function (es) { hd.classList.toggle('showlogo', !es[0].isIntersecting); }, { rootMargin: '-' + hh + 'px 0px 0px 0px', threshold: 0 }).observe(heroLogo);
      } else { hd.classList.add('showlogo'); }
    } else { hd.classList.add('solid'); hd.classList.add('showlogo'); }
  }

  /* ---------- dialogs ---------- */
  function openDlg(dlg, trigger) {
    if (!dlg) return;
    dlg._from = trigger || d.activeElement;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeDlg(dlg) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  $$('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(dlg); });
    dlg.addEventListener('close', function () { if (dlg._from && dlg._from.focus) try { dlg._from.focus({ preventScroll: true }); } catch (e) { } });
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { closeDlg(dlg); }); });
  });
  var drawer = $('#drawer');
  $$('[data-open="drawer"]').forEach(function (b) { b.addEventListener('click', function () { openDlg(drawer, b); }); });
  if (drawer) $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { closeDlg(drawer); }); });
  $$('[data-open="ar"]').forEach(function (b) { b.addEventListener('click', function () { openDlg($('#ar-dialog'), b); }); });
  var picker = $('#picker');
  function pick(mode, trigger) {
    $$('[data-mode]', picker).forEach(function (el) { el.hidden = el.getAttribute('data-mode') !== mode; });
    openDlg(picker, trigger);
  }
  $$('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-pick'), b); }); });

  /* ---------- reveal once per section ---------- */
  var rv = $$('.rv');
  if (rv.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px 15% 0px', threshold: 0.05 });
      rv.forEach(function (el) { io.observe(el); });
    } else { rv.forEach(function (el) { el.classList.add('in'); }); }
  }

  /* ---------- bottom bar: hides on scroll down, over the footer, the walk-in block and the basket ---------- */
  var bb = $('.bb'), tkbar = $('.tk-bar'), inter = {}, lastY = window.scrollY, tick = false, down = false;
  function blocked() { return !!(inter.ft || inter.walkin); }
  function barState() {
    if (bb) bb.classList.toggle('off', down || blocked());
    if (tkbar) tkbar.classList.toggle('off', !!inter.ft);
  }
  if ('IntersectionObserver' in window && (bb || tkbar)) {
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { inter[e.target.classList.contains('ft') ? 'ft' : 'walkin'] = e.isIntersecting; });
      barState();
    }, { threshold: 0.01 });
    $$('.ft, .walkin').forEach(function (el) { bio.observe(el); });
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, dy = y - lastY;
      if (Math.abs(dy) > 8) { down = dy > 0 && y > 160; lastY = y; }
      if (y < 120) down = false;
      tick = false; barState();
    });
  }, { passive: true });

  /* ---------- the signature in the footer ---------- */
  (function () { var a = document.querySelector('a.sig'); if (!a) return; function play() { a.classList.remove('on'); void a.getBoundingClientRect(); a.classList.add('on') } a.addEventListener('mouseenter', function () { if (!a.classList.contains('on')) play() }); if (!matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return; var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(play, 400) } }, { threshold: .9 }); io.observe(a) })();

  /* ---------- menu page ---------- */
  var chips = $('.chips');
  if (chips) {
    var links = $$('a', chips), secs = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
    var inner = $('.chips-in', chips);
    function setCur(i) {
      links.forEach(function (a, j) { if (j === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      var a = links[i];
      if (a && inner) { var target = a.offsetLeft - (inner.clientWidth - a.offsetWidth) / 2; inner.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' }); }
    }
    if ('IntersectionObserver' in window) {
      var cur = -1, vis = {};
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
        var first = -1;
        for (var i = 0; i < secs.length; i++) { if (secs[i] && vis[secs[i].id]) { first = i; break; } }
        if (first > -1 && first !== cur) { cur = first; setCur(first); }
      }, { rootMargin: '-' + (140) + 'px 0px -55% 0px', threshold: 0 });
      secs.forEach(function (s) { if (s) sio.observe(s); });
    }
    links.forEach(function (a, i) { a.addEventListener('click', function () { setCur(i); }); });
  }

  /* ---------- takeaway basket ---------- */
  var panel = $('#tk-panel');
  if (panel) {
    var WA = '201019192522';
    var BR = {
      polaris: { name: 'Polaris', hrs: function (day) { return [840, 1440]; } },
      east: { name: 'Park St East', hrs: function (day) { return (day === 4 || day === 5) ? [900, 1380] : [840, 1320]; } },
      west: { name: 'Park St West', hrs: function (day) { return [840, 1440]; } }
    };
    var items = {};
    $$('.it').forEach(function (li) { items[li.getAttribute('data-id')] = { id: li.getAttribute('data-id'), name: li.getAttribute('data-name'), price: +li.getAttribute('data-price'), btn: $('.add', li) }; });
    var cart = {};
    try { cart = JSON.parse(store('sbk-basket') || '{}') || {}; } catch (e) { cart = {}; }
    Object.keys(cart).forEach(function (k) { if (!items[k] || !(cart[k] > 0)) delete cart[k]; });
    var fmt = function (n) { return 'EGP ' + n.toLocaleString('en-US'); };
    var listEl = $('#tk-list'), emptyEl = $('#tk-empty'), totalEl = $('#tk-total'), send = $('#tk-send'), timeEl = $('#tk-time'), nameEl = $('#tk-name');
    var barCount = $('#tk-bar-count'), barTotal = $('#tk-bar-total'), openBtns = $$('[data-open="basket"]');

    function cairo() {
      var o = {}, dm = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      try {
        new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
        return { day: dm[o.weekday], min: (+o.hour % 24) * 60 + (+o.minute) };
      } catch (e) { var n = new Date(); return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
    }
    function clock(m) { var h = Math.floor(m / 60) % 24, mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12; return h12 + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
    function slots(branch, dayOff) {
      var now = cairo(), day = (now.day + dayOff) % 7, h = BR[branch].hrs(day), start = h[0], out = [];
      if (dayOff === 0) start = Math.max(start, Math.ceil((now.min + 30) / 30) * 30);
      for (var m = start; m <= h[1] - 30; m += 30) out.push(m);
      return out;
    }
    function val(name) { var r = $('input[name="' + name + '"]:checked', panel); return r ? r.value : ''; }

    function count() { var n = 0; Object.keys(cart).forEach(function (k) { n += cart[k]; }); return n; }
    function total() { var t = 0; Object.keys(cart).forEach(function (k) { t += cart[k] * items[k].price; }); return t; }

    function persist() { store('sbk-basket', JSON.stringify(cart)); }
    function paintButtons() {
      Object.keys(items).forEach(function (k) {
        var b = items[k].btn, q = cart[k] || 0;
        b.classList.toggle('on', q > 0);
        $('.n', b).textContent = q;
        b.setAttribute('aria-label', (q ? 'Add one more ' : 'Add ') + items[k].name + ' to takeaway' + (q ? ', ' + q + ' in your order' : ''));
      });
    }
    function paintList() {
      var keys = Object.keys(cart);
      listEl.innerHTML = '';
      keys.forEach(function (k) {
        var it = items[k], li = d.createElement('li'); li.className = 'tk-row';
        li.innerHTML = '<span class="nm"></span><span class="pr"></span><div class="step"><button type="button" data-d="-1" aria-label="One less"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><output></output><button type="button" data-d="1" aria-label="One more"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg></button></div>';
        $('.nm', li).textContent = it.name;
        $('.pr', li).textContent = cart[k] + ' x ' + fmt(it.price);
        $('output', li).textContent = cart[k];
        $$('button', li).forEach(function (b) { b.setAttribute('aria-label', b.getAttribute('aria-label') + ': ' + it.name); b.addEventListener('click', function () { change(k, +b.getAttribute('data-d'), true); }); });
        listEl.appendChild(li);
      });
      emptyEl.hidden = keys.length > 0;
      totalEl.textContent = fmt(total());
    }
    function paintBar() {
      var n = count();
      d.body.classList.toggle('has-basket', n > 0);
      barCount.textContent = n + (n === 1 ? ' item' : ' items');
      barTotal.textContent = fmt(total());
      openBtns.forEach(function (b) { var c = $('.cnt', b); if (c) c.textContent = n ? ' (' + n + ')' : ''; });
    }
    function change(k, dlt, inPanel) {
      var q = (cart[k] || 0) + dlt;
      if (q <= 0) delete cart[k]; else cart[k] = Math.min(q, 30);
      persist(); paintButtons(); paintBar(); paintList(); build();
      if (inPanel && !count()) { setTimeout(function () { closeDlg(panel); }, 250); }
    }

    function fillTimes() {
      var b = val('branch'), dayOff = val('day') === '1' ? 1 : 0, hint = $('#tk-hint');
      var keep = timeEl.value;
      timeEl.innerHTML = '';
      var o0 = d.createElement('option'); o0.value = ''; o0.textContent = b ? 'Choose a time' : 'Choose a branch first'; timeEl.appendChild(o0);
      if (!b) { hint.textContent = ''; return; }
      var s = slots(b, dayOff);
      var todayInput = $('input[name="day"][value="0"]', panel);
      if (!slots(b, 0).length) { todayInput.disabled = true; if (dayOff === 0) { $('input[name="day"][value="1"]', panel).checked = true; return fillTimes(); } } else { todayInput.disabled = false; }
      s.forEach(function (m) { var o = d.createElement('option'); o.value = clock(m); o.textContent = clock(m); timeEl.appendChild(o); });
      if (keep) timeEl.value = keep;
      var h = BR[b].hrs((cairo().day + dayOff) % 7);
      hint.textContent = BR[b].name + ' is open ' + clock(h[0]) + ' to ' + (h[1] >= 1440 ? '12:00 AM' : clock(h[1])) + (dayOff ? ' tomorrow.' : ' today.');
    }
    function message() {
      var lines = ['Hello Sushimi By K, takeaway order:'];
      Object.keys(cart).forEach(function (k) { lines.push(cart[k] + ' x ' + items[k].name); });
      lines.push('Total: ' + fmt(total()));
      lines.push('Branch: ' + (val('branch') ? BR[val('branch')].name : ''));
      lines.push('Pickup: ' + (val('day') === '1' ? 'Tomorrow' : 'Today') + ', ' + timeEl.value);
      if (nameEl.value.trim()) lines.push('Name: ' + nameEl.value.trim());
      return lines.join('\n');
    }
    function build() { send.setAttribute('href', 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message())); }
    function errs() {
      var e = {};
      if (!count()) e.items = 'Add at least one dish.';
      if (!val('branch')) e.branch = 'Choose a branch.';
      if (!timeEl.value) e.time = 'Choose a pickup time.';
      $('#e-branch').textContent = e.branch || ''; $('#e-time').textContent = e.time || '';
      return e;
    }
    $$('input[name="branch"], input[name="day"]', panel).forEach(function (r) { r.addEventListener('change', function () { fillTimes(); build(); $('#e-branch').textContent = ''; }); });
    timeEl.addEventListener('change', function () { build(); $('#e-time').textContent = ''; });
    nameEl.addEventListener('input', build);
    $('#tk-form').addEventListener('submit', function (e) { e.preventDefault(); });
    send.addEventListener('click', function (e) {
      build();
      var er = errs();
      if (Object.keys(er).length) { e.preventDefault(); send.setAttribute('aria-disabled', 'true'); var f = er.branch ? $('input[name="branch"]', panel) : (er.time ? timeEl : null); if (f) f.focus(); }
      else send.removeAttribute('aria-disabled');
    });
    $$('.add').forEach(function (b) { b.addEventListener('click', function () { change(b.closest('.it').getAttribute('data-id'), 1, false); }); });
    openBtns.forEach(function (b) { b.addEventListener('click', function () { paintList(); fillTimes(); build(); openDlg(panel, b); }); });

    paintButtons(); paintBar(); paintList(); fillTimes(); build();
  }
})();
