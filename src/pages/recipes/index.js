/* Zakładka „Przepisy”: propozycje posiłków ze składnikami do dodania na listę zakupów. */
import { $, onAction, syncList } from '../../core/dom.js';
import { plural, uid } from '../../core/format.js';
import { estimatePrice } from '../../core/prices.js';
import { commit, state } from '../../core/store.js';
import { chipHtml, selectChip } from '../../components/buttons.js';
import { openTab } from '../../components/tabs.js';
import { recipeCard } from './card.js';
import { MEALS } from './data.js';
import { FILTERS, findRecipe, itemStatuses, missingCost, selectRecipes } from './library.js';

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
  order = selectRecipes({ meal, filter });
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  page = 0;
}

const added = new Map(); // id przepisu → komunikat po dodaniu składników

function addToShoppingList(recipe) {
  const statuses = itemStatuses(recipe);
  const missing = recipe.items.filter((_, i) => !statuses[i]);
  missing.forEach(([name]) => {
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
    add(id) { addToShoppingList(findRecipe(id)); },
    shop() { openTab('shop'); },
  });
}

export function render() {
  const start = order.length ? (page * PER_PAGE) % order.length : 0;
  const shown = [...order.slice(start), ...order.slice(0, start)].slice(0, PER_PAGE);

  selectChip($('mealChips'), meal);
  selectChip($('recipeFilters'), filter);
  $('recipeListTitle').textContent = MEALS.find((m) => m.id === meal).title;
  $('recipeCount').textContent = `${order.length} ${plural(order.length, 'przepis', 'przepisy', 'przepisów')}`;
  $('recipeEmpty').hidden = order.length > 0;
  $('moreRecipes').hidden = order.length <= PER_PAGE;
  syncList($('recipeList'), shown.map((recipe) => {
    const statuses = itemStatuses(recipe);
    return { key: recipe.id, statuses, cost: missingCost(recipe, statuses), note: added.get(recipe.id) || '' };
  }), recipeCard);
}
