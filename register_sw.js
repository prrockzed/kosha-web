// Installs Kosha Web's service worker (kosha_sw.js), which keeps the
// page on this computer so it opens offline. A file of its own because
// the page's Content-Security-Policy allows no inline script.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('kosha_sw.js').catch(() => {
      // Without it the page still works; it just needs the internet to
      // open next time.
    });
  });
}
