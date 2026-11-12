/* Zakładki w nagłówku: przełączanie widoków i zapamiętanie ostatniego. */
import { STORAGE_KEY, VIEWS } from '../core/constants.js';
import { $, storage } from '../core/dom.js';

const KEY = `${STORAGE_KEY}-tab`;

function show(view) {
  VIEWS.forEach((name) => {
    const active = name === view;
    $(`view-${name}`).hidden = !active;
    $(`tab-${name}`).classList.toggle('active', active);
    $(`tab-${name}`).setAttribute('aria-selected', String(active));
  });
}

export function initTabs() {
  const saved = storage.get(KEY);
  show(VIEWS.includes(saved) ? saved : VIEWS[0]);
  document.querySelector('.tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab || tab.classList.contains('active')) return;
    show(tab.dataset.view);
    storage.set(KEY, tab.dataset.view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
}
