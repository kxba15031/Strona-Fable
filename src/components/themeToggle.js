/* Przełącznik trybu ciemnego. Domyślnie strona jest jasna; wybór jest zapamiętywany. */
import { STORAGE_KEY } from '../core/constants.js';
import { $, storage } from '../core/dom.js';

const KEY = `${STORAGE_KEY}-theme`;

function apply(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('themeToggle').setAttribute('aria-pressed', String(dark));
}

export function initThemeToggle() {
  apply(storage.get(KEY) === 'dark');
  $('themeToggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    apply(dark);
    storage.set(KEY, dark ? 'dark' : 'light');
  });
}
