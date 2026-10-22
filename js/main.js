// Boot.
(function () {
  function boot() {
    try {
      G.boot();
      UI.init();
      UI.title();
    } catch (e) {
      console.error(e);
      document.getElementById('bootText').textContent = 'WebGL2 is needed to run No Vacancy. Try Chrome, Safari 15+ or Firefox.';
      return;
    }
    setTimeout(() => { document.getElementById('boot').classList.add('gone'); if (window.__TEST) window.__READY = true; }, 300);
    try { if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
