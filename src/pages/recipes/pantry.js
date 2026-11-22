/* „Co mam w domu”: lista posiadanych składników, pomijanych przy zakupach. */
import { $, need, onAction, syncList } from '../../core/dom.js';
import { plain } from '../../core/format.js';
import { commit, state } from '../../core/store.js';
import { chip, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { card } from '../../components/layout.js';
import { ingredientNames } from './library.js';

const SUGGESTIONS = 10;

export const pantryCard = card({
  icon: 'home', id: 'pantryTitle', title: 'Co mam w domu', sub: 'Te składniki pominę przy zakupach i podpowiem, co da się z nich ugotować',
  body: `
  <form class="pantry-form" id="pantryForm" novalidate>
    <div class="input-wrap">
      <input id="pantryName" type="text" list="pantryHints" placeholder="np. Jajka" maxlength="40" autocomplete="off" aria-label="Składnik, który masz w domu">
      <datalist id="pantryHints"></datalist>
    </div>
    ${submitButton('Dodaj', { small: true })}
  </form>
  <div class="chips wrap" id="pantryList" role="group" aria-label="Składniki, które masz"></div>
  <p class="note" id="pantryNote"></p>
  <h3 class="mini">Często używane</h3>
  <div class="chips wrap" id="pantrySuggestions" role="group" aria-label="Dodaj często używany składnik"></div>
  <button type="button" class="link pantry-show" id="pantryShow" hidden>Pokaż przepisy z tych składników</button>`,
});

const has = (name) => state.recipes.pantry.some((owned) => plain(owned) === plain(name));
const add = (name) => { if (!has(name)) state.recipes.pantry.push(name); };

/** @param onShowRecipes  wywoływane po kliknięciu „Pokaż przepisy z tych składników” */
export function initPantry({ onShowRecipes }) {
  entryForm({
    form: $('pantryForm'),
    read() {
      const name = need('pantryName');
      return name ? { name } : null;
    },
    save: ({ name }) => add(name),
    clear() { $('pantryName').value = ''; },
    done: commit,
  });
  onAction($('pantryList'), {
    remove(_, button) {
      state.recipes.pantry = state.recipes.pantry.filter((name) => name !== button.dataset.value);
      commit();
    },
  });
  onAction($('pantrySuggestions'), {
    add(_, button) { add(button.dataset.value); commit(); },
  });
  $('pantryShow').addEventListener('click', onShowRecipes);
}

export function renderPantry() {
  const { pantry } = state.recipes;
  const free = ingredientNames().filter((name) => !has(name));
  $('pantryHints').replaceChildren(...free.map((name) => Object.assign(document.createElement('option'), { value: name })));
  syncList($('pantryList'), pantry.map((name) => ({ key: name })), ({ key }) =>
    chip({ label: `${key} ×`, value: key, action: 'remove', title: `Usuń z posiadanych: ${key}` }));
  syncList($('pantrySuggestions'), free.slice(0, SUGGESTIONS).map((name) => ({ key: name })), ({ key }) =>
    chip({ label: `+ ${key}`, value: key, action: 'add', title: `Mam w domu: ${key}` }));
  $('pantryNote').textContent = pantry.length ? '' : 'Nic jeszcze nie zaznaczono. Dodaj składniki, które masz w kuchni.';
  $('pantryShow').hidden = !pantry.length;
}
