/* Perf tweaks: lazy images & videos, but NEVER lazy above-the-fold images or the header logo */
(() => {
  const init = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const inFirstViewport = el => {
      const r = el.getBoundingClientRect();
      const top = r.top + (window.scrollY || window.pageYOffset);
      return top < (window.scrollY + vh * 1.2); // within ~1.2x viewport from top
    };

    // Images
    document.querySelectorAll('img').forEach(img => {
      const isLogo = img.matches('header img.logo, .logo img');
      const optedOut = img.classList.contains('no-lazy');
      if (isLogo || optedOut || inFirstViewport(img)) {
        if (!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
        return; // don't force lazy on above-the-fold/opted-out images
      }
      if (!img.hasAttribute('loading'))  img.setAttribute('loading','lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding','async');
    });

    // Videos: stop eager downloads; hydrate when near viewport
    const videos = Array.from(document.querySelectorAll('video:not(.no-lazy)'));
    videos.forEach(v => {
      v.removeAttribute('autoplay'); // no background autoplay
      v.setAttribute('preload','none');
      v.querySelectorAll('source').forEach(s => {
        if (s.src && !s.dataset.src) { s.dataset.src = s.src; s.removeAttribute('src'); }
      });
      try { v.load(); } catch (_) {}
    });

    if (!('IntersectionObserver' in window)) return;

    const hydrate = (v, play=false) => {
      if (v.dataset.hydrated) return;
      v.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; s.removeAttribute('data-src'); });
      v.load();
      v.dataset.hydrated = '1';
      if (play) v.play().catch(()=>{});
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        hydrate(e.target, false);
        obs.unobserve(e.target);
      });
    }, { rootMargin: '200px' });

    videos.forEach(v => {
      if (inFirstViewport(v)) hydrate(v, false); else io.observe(v);
      v.addEventListener('play', () => hydrate(v, true), { once:true });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
