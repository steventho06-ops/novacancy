// Boot.
(function () {
  function boot() {
    try {
      G.boot();
      UI.init();
    } catch (e) {
      console.error(e);
      document.getElementById('bootText').textContent = 'WebGL2 is needed to run No Vacancy. Try Chrome, Safari 15+ or Firefox.';
      return;
    }
    // accounts: check for the server and pull this account's save before the title shows
    document.getElementById('bootText').textContent = 'checking in...';
    (window.CLOUD ? CLOUD.start() : Promise.resolve()).catch(() => { }).then(() => {
      UI.title();
      setTimeout(() => { document.getElementById('boot').classList.add('gone'); if (window.__TEST) window.__READY = true; }, 300);
      if (window.CLOUD) CLOUD.gate();
    });
    try { if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
