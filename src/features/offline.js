/* Praca bez internetu i instalacja na ekranie głównym: rejestruje sw.js (tylko na stronie www). */
export function initOffline() {
  if (!('serviceWorker' in navigator) || window.claude || !/^https?:$/.test(window.location.protocol)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* bez trybu offline */ });
  });
}
