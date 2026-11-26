(function () {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var vh = innerHeight, vw = innerWidth, E = 'cubic-bezier(.22,.61,.36,1)';
  function big(i) { var r = i.getBoundingClientRect(); return r.width * r.height > 0.12 * vw * vh; }
  function clipped(i) { var p = i.parentElement; for (var k = 0; k < 3 && p; k++, p = p.parentElement) { var o = getComputedStyle(p).overflow; if (o === 'hidden' || o === 'clip') return true; } return false; }
  function free(el) { return getComputedStyle(el).transform === 'none' && !el.closest('.veil,#veil,.cover,header,nav,footer,[role=dialog]'); }
  var tries = 0;
  function start() {
    var main = document.querySelector('main') || document.body;
    var cov = document.querySelector('.veil,#veil,.cover'), cs = cov && getComputedStyle(cov);
    var covered = cs && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .05 && cov.getBoundingClientRect().height > 0;
    if ((covered || main.getBoundingClientRect().height < innerHeight) && tries++ < 40) { setTimeout(start, 150); return; }
    vh = innerHeight; vw = innerWidth;
    document.documentElement.style.overflowX = 'clip'; document.body.style.overflowX = 'clip';
    var imgs = [].slice.call(main.querySelectorAll('img')).filter(function (i) { return big(i) && free(i) && clipped(i); });
    var hero = null;
    [].slice.call(main.querySelectorAll('img')).forEach(function (i) { if (!hero && big(i) && free(i) && i.getBoundingClientRect().top < vh * .6) hero = i; });
    // 1. hero: one slow settle inside its own frame, then rests
    if (hero && !clipped(hero)) { var pr = hero.parentElement.getBoundingClientRect(), hr = hero.getBoundingClientRect(); if (Math.abs(pr.width - hr.width) < 3 && Math.abs(pr.height - hr.height) < 3) hero.parentElement.style.overflow = 'clip'; else hero = null; }
    if (hero) hero.animate([{ transform: 'scale(1.07)' }, { transform: 'scale(1)' }], { duration: 4200, easing: E });
    // 2. photos: gentle drift with the scroll, visible from the start
    var drift = imgs.filter(function (i) { return i !== hero; });
    drift.forEach(function (i) { i.style.willChange = 'transform'; i.style.transform = 'scale(1.08)'; });
    var on = new Set(), q = false;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? on.add(e.target) : on.delete(e.target); }); tick(); }, { rootMargin: '20% 0px' });
    drift.forEach(function (i) { io.observe(i); });
    function upd() { q = false; vh = innerHeight; on.forEach(function (i) { var r = i.getBoundingClientRect(), p = (r.top + r.height / 2 - vh / 2) / (vh + r.height); if (p < -.5) p = -.5; if (p > .5) p = .5; i.style.transform = 'translate3d(0,' + (p * -7).toFixed(2) + '%,0) scale(1.08)'; }); }
    function tick() { if (!q) { q = true; requestAnimationFrame(upd); } }
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); upd();
    // 2b. photos without a frame: open gently into place as they arrive (never hidden)
    var open = [].slice.call(main.querySelectorAll('img')).filter(function (i) { return i !== hero && big(i) && free(i) && !clipped(i) && i.getBoundingClientRect().top > vh * .9; });
    var oo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; oo.unobserve(e.target); var w = e.target.getBoundingClientRect().width > vw * .85; e.target.animate(w ? [{ clipPath: 'inset(5%)' }, { clipPath: 'inset(0%)' }] : [{ clipPath: 'inset(4%)', transform: 'scale(1.06)' }, { clipPath: 'inset(0%)', transform: 'none' }], { duration: 1100, easing: E }); }); }, { rootMargin: '0px 0px -6% 0px' });
    open.forEach(function (i) { oo.observe(i); });
    // 3. headings: one soft rise per section, early, never in the hero
    var heads = [].slice.call(main.querySelectorAll('section h2')).filter(function (h) { return free(h) && h.getBoundingClientRect().top > vh; });
    var ho = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; ho.unobserve(e.target); e.target.animate([{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: E }); }); }, { rootMargin: '0px 0px -8% 0px' });
    heads.forEach(function (h) { ho.observe(h); });
    window.__motion = [hero ? 1 : 0, drift.length, open.length, heads.length];
  }
  if (document.readyState === 'complete') setTimeout(start, 50); else addEventListener('load', function () { setTimeout(start, 50); });
})();
