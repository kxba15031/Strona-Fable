/* Zakładka „Przepisy”: propozycje posiłków ze składnikami do dodania na listę zakupów. */
import { $, el, onAction, syncList } from '../../core/dom.js';
import { plain, plural, uid, zl } from '../../core/format.js';
import { estimatePrice } from '../../core/prices.js';
import { commit, state } from '../../core/store.js';
import { chipHtml, selectChip } from '../../components/buttons.js';
import { icon } from '../../components/icons.js';
import { openTab } from '../../components/tabs.js';
import { MEALS, RECIPES } from './data.js';

const PER_PAGE = 3;

export const template = `
  <section class="card agent reveal" aria-labelledby="recipesTitle">
    <div class="card-head">
      <div class="agent-avatar" aria-hidden="true"><span class="eye"></span><span class="eye"></span></div>
      <div>
        <h2 id="recipesTitle">Co dziś zjeść?</h2>
        <p class="sub">Wybierz posiłek, a podpowiem przepisy i listę zakupów</p>
      </div>
    </div>
    <div class="chips wrap" id="mealChips" role="group" aria-label="Posiłek">
      ${MEALS.map((meal) => chipHtml({ label: meal.question, value: meal.id })).join('')}
    </div>
  </section>

  <section class="card reveal" aria-labelledby="recipeListTitle">
    <div class="recipes-head">
      <h2 id="recipeListTitle"></h2>
      <button type="button" class="link" id="moreRecipes">Pokaż inne</button>
    </div>
    <ul class="stack" id="recipeList"></ul>
    <p class="disclaimer">Koszt to szacunek zakupu całych opakowań składników, których nie masz jeszcze na liście.</p>
  </section>
`;

/** Pora dnia podpowiada posiłek, od którego zaczynamy. */
function mealForNow() {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  return hour < 16 ? 'dinner' : 'supper';
}

let meal = mealForNow();
let page = 0;
const added = new Map(); // id przepisu → komunikat po dodaniu składników

const shoppingNames = () => new Set(state.shop.filter((i) => !i.done).map((i) => plain(i.name)));

function addToShoppingList(recipe) {
  const onList = shoppingNames();
  const missing = recipe.items.map(([name]) => name).filter((name) => !onList.has(plain(name)));
  missing.forEach((name) => {
    const price = estimatePrice(name);
    state.shop.unshift({ id: uid(), name, qty: 1, price, est: price > 0, done: false });
  });
  added.set(recipe.id, `Dodano ${missing.length} ${plural(missing.length, 'produkt', 'produkty', 'produktów')} do listy zakupów.`);
  commit();
}

export function init() {
  onAction($('mealChips'), {
    pick(_, button) {
      meal = button.dataset.value;
      page = 0;
      render();
    },
  });
  $('moreRecipes').addEventListener('click', () => { page += 1; render(); });
  onAction($('recipeList'), {
    add(id) { addToShoppingList(RECIPES.find((recipe) => recipe.id === id)); },
    shop() { openTab('shop'); },
  });
}

function recipeCard(view) {
  const recipe = RECIPES.find((r) => r.id === view.key);
  const item = el('li', 'recipe');
  const meta = `${recipe.minutes} min · ${recipe.items.length} ${plural(recipe.items.length, 'składnik', 'składniki', 'składników')}`;
  item.append(el('h3', 'recipe-name', recipe.name), el('p', 'recipe-meta', view.cost ? `${meta} · do kupienia ok. ${zl(view.cost)}` : meta));

  const list = el('ul', 'recipe-items');
  recipe.items.forEach(([name, amount], i) => {
    const line = el('li', view.onList[i] ? 'have' : '');
    line.append(el('span', '', name), el('small', '', view.onList[i] ? 'na liście' : amount));
    list.appendChild(line);
  });
  item.append(list, el('p', 'recipe-steps', recipe.steps));

  const missing = view.onList.filter((have) => !have).length;
  const button = el('button', 'btn');
  button.type = 'button';
  button.dataset.action = 'add';
  button.disabled = missing === 0;
  button.innerHTML = `${icon(missing ? 'plus' : 'check')}<span></span>`;
  button.lastChild.textContent = missing ? `Dodaj ${missing} ${plural(missing, 'produkt', 'produkty', 'produktów')} do listy zakupów` : 'Wszystko jest już na liście';
  item.append(button);

  if (view.note) {
    const note = el('p', 'recipe-note', `${view.note} `);
    const link = el('button', 'link', 'Przejdź do zakupów');
    link.type = 'button';
    link.dataset.action = 'shop';
    note.append(link);
    item.append(note);
  }
  return item;
}

export function render() {
  const current = MEALS.find((m) => m.id === meal);
  const pool = RECIPES.filter((recipe) => recipe.meal === meal);
  const start = (page * PER_PAGE) % pool.length;
  const shown = [...pool.slice(start), ...pool.slice(0, start)].slice(0, PER_PAGE);
  const onList = shoppingNames();

  selectChip($('mealChips'), meal);
  $('recipeListTitle').textContent = current.title;
  $('moreRecipes').hidden = pool.length <= PER_PAGE;
  syncList($('recipeList'), shown.map((recipe) => {
    const have = recipe.items.map(([name]) => onList.has(plain(name)));
    const cost = recipe.items.reduce((total, [name], i) => total + (have[i] ? 0 : estimatePrice(name)), 0);
    return { key: recipe.id, onList: have, cost, note: added.get(recipe.id) || '' };
  }), recipeCard);
}
