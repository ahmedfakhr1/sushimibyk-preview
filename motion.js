(function () {
  if (!('IntersectionObserver' in window) || !Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var vh = innerHeight, vw = innerWidth, SOFT = 'cubic-bezier(.25,.1,.25,1)', tries = 0;
  function big(i) { var r = i.getBoundingClientRect(); return r.width * r.height > 0.12 * vw * vh; }
  function clipped(i) { var p = i.parentElement; for (var k = 0; k < 3 && p; k++, p = p.parentElement) { var o = getComputedStyle(p).overflow; if (o === 'hidden' || o === 'clip') return true; } return false; }
  function free(el) { return getComputedStyle(el).transform === 'none' && !el.closest('div.veil,#veil,div.cover,header,nav,footer,[role=dialog]'); }
  function start() {
    var main = document.querySelector('main') || document.body;
    if (main.getBoundingClientRect().height < innerHeight && tries++ < 40) { setTimeout(start, 150); return; }
    vh = innerHeight; vw = innerWidth;
    document.documentElement.style.overflowX = 'clip'; document.body.style.overflowX = 'clip';
    var all = [].slice.call(main.querySelectorAll('img'));

    // 1. hero: a slow, soft settle inside its own frame, starting as the intro lifts
    var hero = null;
    all.forEach(function (i) { if (!hero && big(i) && free(i) && i.getBoundingClientRect().top < vh * .6) hero = i; });
    if (hero && !clipped(hero)) { var pr = hero.parentElement.getBoundingClientRect(), hr = hero.getBoundingClientRect(); if (Math.abs(pr.width - hr.width) < 3 && Math.abs(pr.height - hr.height) < 3) hero.parentElement.style.overflow = 'clip'; else hero = null; }
    if (hero) {
      var hz = hero.animate([{ transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 3600, easing: 'cubic-bezier(.33,0,.2,1)', fill: 'backwards' });
      hz.pause(); var waited = 0;
      (function go() { var cv = document.querySelector('div.veil,#veil,div.cover'), c = cv && getComputedStyle(cv);
        if (c && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > .97 && cv.getBoundingClientRect().height > 0 && (waited += 50) < 3500) { setTimeout(go, 50); return; }
        hz.play(); })();
    }

    // 2. framed photos drift very slightly with the scroll (no reveal, always visible)
    var drift = all.filter(function (i) { return i !== hero && big(i) && free(i) && clipped(i); });
    drift.forEach(function (i) { i.style.willChange = 'transform'; });
    var on = new Set(), q = false;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? on.add(e.target) : on.delete(e.target); }); tick(); }, { rootMargin: '20% 0px' });
    drift.forEach(function (i) { io.observe(i); });
    function upd() { q = false; vh = innerHeight; on.forEach(function (i) { var r = i.getBoundingClientRect(), p = (r.top + r.height / 2 - vh / 2) / (vh + r.height); p = Math.max(-.5, Math.min(.5, p)); i.style.transform = 'translate3d(0,' + (p * -5).toFixed(2) + '%,0) scale(1.06)'; }); }
    function tick() { if (!q) { q = true; requestAnimationFrame(upd); } }
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); upd();

    // 3. everything else below the first screen: one calm fade-up as it comes in, set up in advance so nothing jumps
    var rise = all.filter(function (i) { return i !== hero && drift.indexOf(i) < 0 && big(i) && free(i); })
      .concat([].slice.call(main.querySelectorAll('section h2')).filter(function (h) { return free(h) && !h.matches('.signed,.script') && !h.querySelector('img,svg'); }))
      .filter(function (el) { return el.getBoundingClientRect().top > vh; });
    rise.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translate3d(0,24px,0)'; });
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; ro.unobserve(e.target); var el = e.target;
      var a = el.animate([{ opacity: 0, transform: 'translate3d(0,24px,0)' }, { opacity: 1, transform: 'translate3d(0,0,0)' }], { duration: 1300, easing: SOFT, fill: 'forwards' });
      a.onfinish = function () { el.style.opacity = ''; el.style.transform = ''; a.cancel(); };
    }); }, { rootMargin: '0px 0px 4% 0px' });
    rise.forEach(function (el) { ro.observe(el); });
    window.__motion = [hero ? 1 : 0, drift.length, rise.length];
  }
  if (document.readyState === 'complete') setTimeout(start, 50); else addEventListener('load', function () { setTimeout(start, 50); });
})();
