/*
 * Chowa klawiaturę po dotknięciu poza polem. Na telefonach (zwłaszcza gdy strona
 * jest osadzona w ramce) samo dotknięcie tła nie zabiera fokusu z pola.
 */
const isField = (node) => node && node.matches && node.matches('input, select, textarea');
const keepsFocus = (node) => node.closest && node.closest('input, select, textarea, label, button, a');
const blurActive = () => { if (isField(document.activeElement)) document.activeElement.blur(); };

export function initKeyboardDismiss() {
  let startX = 0;
  let startY = 0;
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    // Przewijanie palcem nie chowa klawiatury, zwykłe dotknięcie tła tak.
    if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) return;
    if (!keepsFocus(e.target)) blurActive();
  }, { passive: true });
  document.addEventListener('mousedown', (e) => { if (!keepsFocus(e.target)) blurActive(); });
  // Enter w polu bez formularza (np. wypłata) też zamyka klawiaturę.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.target.form) e.target.blur();
  });
}
