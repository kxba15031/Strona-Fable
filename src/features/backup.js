/* Stopka: kopia zapasowa danych (pobranie i wczytanie pliku) oraz wyczyszczenie danych. */
import { $ } from '../core/dom.js';
import { isoToday } from '../core/format.js';
import { commit, replaceState, state } from '../core/store.js';

const note = (message) => { $('backupNote').textContent = message; };

/** Pobranie pliku: przez uprawnienie strony w Claude, a poza Claude zwykłym linkiem. */
async function saveFile(filename, data) {
  const inClaude = window.claude && typeof window.claude.use === 'function';
  const downloads = inClaude ? await window.claude.use('downloads').catch(() => null) : null;
  if (downloads) {
    try {
      await downloads.save({ filename, data });
      return 'Kopia zapisana.';
    } catch (error) {
      return error && error.code === 'declined' ? 'Zapis anulowany.' : 'Nie udało się zapisać kopii w tym widoku.';
    }
  }
  if (inClaude) return 'Pobieranie plików nie jest dostępne w tym widoku.';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  return 'Kopia pobrana.';
}

async function importFile(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const data = parsed && typeof parsed.state === 'object' ? parsed.state : parsed;
    if (!data || typeof data !== 'object' || !('income' in data || 'costs' in data)) throw new Error('format');
    replaceState(data);
    commit({ replaced: true });
    note('Dane wczytane z kopii.');
  } catch (_) {
    note('To nie wygląda na kopię danych z Grosika. Wybierz plik .json pobrany z tej strony.');
  }
}

export function initBackup() {
  $('exportBtn').addEventListener('click', async () => {
    const data = JSON.stringify({ app: 'grosik', version: 1, exported: isoToday(), state }, null, 2);
    note(await saveFile(`grosik-kopia-${isoToday()}.json`, data));
  });

  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (file) importFile(file);
  });

  // Potwierdzenie w dwóch kliknięciach (okno confirm bywa blokowane w ramkach).
  const reset = $('resetBtn');
  const idleLabel = reset.textContent;
  let armed = 0;
  reset.addEventListener('click', () => {
    clearTimeout(armed);
    if (!armed) {
      reset.textContent = 'Kliknij ponownie, aby potwierdzić';
      armed = setTimeout(() => { armed = 0; reset.textContent = idleLabel; }, 4000);
      return;
    }
    armed = 0;
    reset.textContent = idleLabel;
    replaceState(null);
    commit({ replaced: true });
    note('Dane wyczyszczone.');
  });
}
