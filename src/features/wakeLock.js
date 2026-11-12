/* Blokada wygaszania ekranu (tam, gdzie przeglądarka na to pozwala). */
let wanted = false;
let lock = null;

async function acquire() {
  if (!wanted || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return false;
  try {
    lock = await navigator.wakeLock.request('screen');
    return true;
  } catch (_) {
    return false; // odmowa systemu, np. tryb oszczędzania baterii
  }
}

// Przeglądarka zwalnia blokadę po schowaniu strony – po powrocie prosimy o nią ponownie.
document.addEventListener('visibilitychange', acquire);

/** Włącza lub wyłącza blokadę. Zwraca, czy ekran faktycznie nie zgaśnie. */
export async function keepAwake(on) {
  wanted = on;
  if (on) return acquire();
  if (lock) await lock.release().catch(() => {});
  lock = null;
  return false;
}
