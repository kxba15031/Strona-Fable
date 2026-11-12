/* Zakładka „Przepisy”: propozycje posiłków ze składnikami do dodania na listę zakupów. */
import { $, el, onAction, syncList } from '../../core/dom.js';
import { plain, plural, uid, zl } from '../../core/format.js';
import { estimatePrice } from '../../core/prices.js';
import { commit, state } from '../../core/store.js';
import { chipHtml, selectChip } from '../../components/buttons.js';
import { icon } from '../../components/icons.js';
import { openTab } from '../../components/tabs.js';
import { CUISINES, MEALS, RECIPES } from './data.js';

const PER_PAGE = 3;

const FILTERS = [
  { id: 'all', label: 'Wszystkie', test: () => true },
  { id: 'quick', label: 'Do 15 minut', test: (recipe) => recipe.minutes <= 15 },
  { id: 'light', label: 'Do 400 kcal', test: (recipe) => recipe.kcal <= 400 },
  { id: 'veg', label: 'Wegetariańskie', test: (recipe) => recipe.vegetarian },
  { id: 'world', label: 'Kuchnie świata', test: (recipe) => recipe.cuisine && recipe.cuisine !== 'pl' },
];

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
    <h3 class="mini">Pokaż</h3>
    <div class="chips wrap" id="recipeFilters" role="group" aria-label="Rodzaj przepisów">
      ${FILTERS.map((filter) => chipHtml({ label: filter.label, value: filter.id })).join('')}
    </div>
  </section>

  <section class="card reveal" aria-labelledby="recipeListTitle">
    <div class="recipes-head">
      <div>
        <h2 id="recipeListTitle"></h2>
        <p class="sub" id="recipeCount"></p>
      </div>
      <button type="button" class="link" id="moreRecipes">Pokaż inne</button>
    </div>
    <p class="empty" id="recipeEmpty">Nie mam przepisów dla tego wyboru. Zmień filtr powyżej.</p>
    <ul class="stack" id="recipeList"></ul>
    <p class="disclaimer">Kalorie to przybliżenie dla jednej porcji; ilości składników dotyczą wszystkich porcji. Koszt to szacunek zakupu całych opakowań składników, których nie masz jeszcze na liście.</p>
  </section>
`;

/** Pora dnia podpowiada posiłek, od którego zaczynamy. */
function mealForNow() {
  const hour = new Date().getHours();
  if (hour < 10) return 'b';
  return hour < 16 ? 'd' : 's';
}

let meal = mealForNow();
let filter = 'all';
let page = 0;
let order = []; // wylosowana kolejność przepisów dla bieżącego posiłku i filtra

/** Losuje kolejność, żeby za każdym razem zaczynać od innych propozycji. */
function reshuffle() {
  const test = FILTERS.find((f) => f.id === filter).test;
  order = RECIPES.filter((recipe) => recipe.meal === meal && test(recipe));
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  page = 0;
}
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
    pick(_, button) { meal = button.dataset.value; reshuffle(); render(); },
  });
  onAction($('recipeFilters'), {
    pick(_, button) { filter = button.dataset.value; reshuffle(); render(); },
  });
  reshuffle();
  $('moreRecipes').addEventListener('click', () => { page += 1; render(); });
  onAction($('recipeList'), {
    add(id) { addToShoppingList(RECIPES.find((recipe) => recipe.id === id)); },
    shop() { openTab('shop'); },
  });
}

function recipeCard(view) {
  const recipe = RECIPES.find((r) => r.id === view.key);
  const item = el('li', 'recipe');
  const facts = [`${recipe.minutes} min`, CUISINES[recipe.cuisine], recipe.vegetarian && 'bez mięsa', view.cost && `do kupienia ok. ${zl(view.cost)}`];
  const energy = el('p', 'recipe-kcal');
  energy.append(el('b', '', `ok. ${recipe.kcal} kcal`), ` na porcję · ${recipe.portions} ${plural(recipe.portions, 'porcja', 'porcje', 'porcji')}`);
  item.append(el('h3', 'recipe-name', recipe.name), el('p', 'recipe-meta', facts.filter(Boolean).join(' · ')), energy);

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
  const start = order.length ? (page * PER_PAGE) % order.length : 0;
  const shown = [...order.slice(start), ...order.slice(0, start)].slice(0, PER_PAGE);
  const onList = shoppingNames();

  selectChip($('mealChips'), meal);
  selectChip($('recipeFilters'), filter);
  $('recipeListTitle').textContent = MEALS.find((m) => m.id === meal).title;
  $('recipeCount').textContent = `${order.length} ${plural(order.length, 'przepis', 'przepisy', 'przepisów')}`;
  $('recipeEmpty').hidden = order.length > 0;
  $('moreRecipes').hidden = order.length <= PER_PAGE;
  syncList($('recipeList'), shown.map((recipe) => {
    const have = recipe.items.map(([name]) => onList.has(plain(name)));
    const cost = recipe.items.reduce((total, [name], i) => total + (have[i] ? 0 : estimatePrice(name)), 0);
    return { key: recipe.id, onList: have, cost, note: added.get(recipe.id) || '' };
  }), recipeCard);
}
