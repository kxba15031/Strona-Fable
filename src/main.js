/* Start aplikacji: wstawia szablony zakładek, uruchamia je i odświeża po każdej zmianie danych. */
import { compute } from './core/compute.js';
import { $ } from './core/dom.js';
import { monthLabel, thisMonth } from './core/format.js';
import { loadState, onChange } from './core/store.js';
import { initTabs } from './components/tabs.js';
import { initThemeToggle } from './components/themeToggle.js';
import { initBackup } from './features/backup.js';
import { initKeyboardDismiss } from './features/keyboard.js';
import { initOffline } from './features/offline.js';
import { initSync } from './features/sync/index.js';
import * as budget from './pages/budget/index.js';
import * as spend from './pages/spend/index.js';
import * as goals from './pages/goals/index.js';
import * as shop from './pages/shop/index.js';
import * as recipes from './pages/recipes/index.js';

const pages = { budget, spend, goals, shop, recipes };

function renderAll(info) {
  const data = compute();
  Object.values(pages).forEach((page) => page.render(data, info));
}

initThemeToggle();
loadState();
Object.entries(pages).forEach(([name, page]) => { $(`view-${name}`).innerHTML = page.template; });
$('monthLabel').textContent = monthLabel(thisMonth());
Object.values(pages).forEach((page) => page.init());
initTabs();
initKeyboardDismiss();
initBackup();
onChange(renderAll);
renderAll({ replaced: true });
initSync();
initOffline();
