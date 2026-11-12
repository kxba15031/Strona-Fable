/* Zakładka „Przepisy”: propozycje posiłków ze składnikami do dodania na listę zakupów. */
import { $, onAction, scrollToNode, syncList } from '../../core/dom.js';
import { isoToday, plural, uid } from '../../core/format.js';
import { estimatePrice } from '../../core/prices.js';
import { commit, state } from '../../core/store.js';
import { chipHtml, selectChip } from '../../components/buttons.js';
import { searchField } from '../../components/layout.js';
import { openTab } from '../../components/tabs.js';
import { recipeCard } from './card.js';
import { MEALS } from './data.js';
import { FILTERS, findRecipe, itemStatuses, missingCost, ownedCount, portionsOf, selectRecipes } from './library.js';
import { initRecipeForm, recipeFormCard } from './form.js';
import { initPantry, pantryCard, renderPantry } from './pantry.js';
import { scaleAmount } from './portions.js';

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
    <h3 class="mini">Albo znajdź konkretne danie</h3>
    ${searchField({ id: 'recipeSearch', placeholder: 'np. kurczak, makaron, jajka', label: 'Szukaj przepisu po nazwie lub składniku' })}
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
    <p class="empty" id="recipeEmpty">Nie mam przepisów dla tego wyboru. Zmień posiłek lub filtr powyżej.</p>
    <ul class="stack" id="recipeList"></ul>
    <p class="disclaimer">Kalorie to przybliżenie dla jednej porcji; ilości składników dotyczą wybranej liczby porcji. Koszt to szacunek zakupu całych opakowań składników, których nie masz jeszcze na liście.</p>
  </section>

  ${pantryCard}

  ${recipeFormCard}
`;

/** Pora dnia podpowiada posiłek, od którego zaczynamy. */
function mealForNow() {
  const hour = new Date().getHours();
  if (hour < 10) return 'b';
  return hour < 16 ? 'd' : 's';
}

let meal = mealForNow();
let filter = 'all';
let query = '';
let page = 0;
let order = []; // przepisy pasujące do wyboru, w kolejności pokazywania

const searching = () => query.trim().length >= 2;

/**
 * Układa propozycje od nowa. Propozycje dla posiłku są losowane, żeby za każdym
 * razem zaczynać od innych; wyniki wyszukiwania zachowują kolejność trafności.
 */
function reshuffle() {
  order = selectRecipes({ meal, filter, query: searching() ? query : '' });
  if (!searching()) {
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    // Dania jedzone niedawno schodzą na koniec kolejki (sortowanie zachowuje wylosowaną kolejność reszty).
    const { eaten } = state.recipes;
    order.sort((a, b) => (eaten[a.id] || '').localeCompare(eaten[b.id] || ''));
    // „Z tego, co mam”: najpierw dania, do których brakuje najmniej składników.
    if (filter === 'home') order.sort((a, b) => (a.items.length - ownedCount(a)) - (b.items.length - ownedCount(b)));
  }
  page = 0;
}

const added = new Map(); // id przepisu → komunikat po dodaniu składników

function addToShoppingList(recipe) {
  const statuses = itemStatuses(recipe);
  const factor = portionsOf(recipe) / recipe.portions;
  const missing = recipe.items.filter((_, i) => !statuses[i]);
  missing.forEach(([name, amount]) => {
    const price = estimatePrice(name);
    state.shop.unshift({ id: uid(), name, qty: 1, price, est: price > 0, done: false, note: scaleAmount(amount, factor) });
  });
  added.set(recipe.id, `Dodano ${missing.length} ${plural(missing.length, 'produkt', 'produkty', 'produktów')} do listy zakupów.`);
  commit();
}

let ownForm;

/** Usuwa własny przepis razem z tym, co o nim zapamiętano. */
function removeOwnRecipe(id) {
  const { recipes } = state;
  recipes.custom = recipes.custom.filter((recipe) => recipe.id !== id);
  recipes.favorites = recipes.favorites.filter((fav) => fav !== id);
  delete recipes.eaten[id];
  delete recipes.portions[id];
  ownForm.forget(id);
  reshuffle();
  commit();
}

/** Pokazuje wskazany wybór od początku i przewija do listy. */
function show(choice) {
  ({ meal = meal, filter = filter } = choice);
  query = '';
  $('recipeSearch').value = '';
  reshuffle();
  render();
  scrollToNode($('recipeListTitle'), 'start');
}

function changePortions(id, delta) {
  const recipe = findRecipe(id);
  const portions = Math.min(12, Math.max(1, portionsOf(recipe) + delta));
  if (portions === recipe.portions) delete state.recipes.portions[id];
  else state.recipes.portions[id] = portions;
  commit();
}

export function init() {
  onAction($('mealChips'), {
    pick(_, button) {
      meal = button.dataset.value;
      query = '';
      $('recipeSearch').value = '';
      reshuffle();
      render();
    },
  });
  $('recipeSearch').addEventListener('input', (e) => { query = e.target.value; reshuffle(); render(); });
  onAction($('recipeFilters'), {
    pick(_, button) { filter = button.dataset.value; reshuffle(); render(); },
  });
  initPantry({ onShowRecipes: () => show({ filter: 'home' }) });
  ownForm = initRecipeForm({ onSaved: (recipe) => show({ meal: recipe.meal, filter: 'own' }) });
  reshuffle();
  $('moreRecipes').addEventListener('click', () => { page += 1; render(); });
  onAction($('recipeList'), {
    add(id) { addToShoppingList(findRecipe(id)); },
    edit(id) { ownForm.edit(id, findRecipe(id)); },
    delete(id) { removeOwnRecipe(id); },
    eaten(id) {
      if (state.recipes.eaten[id]) delete state.recipes.eaten[id];
      else state.recipes.eaten[id] = isoToday();
      commit();
    },
    less(id) { changePortions(id, -1); },
    more(id) { changePortions(id, 1); },
    favorite(id) {
      const { favorites } = state.recipes;
      state.recipes.favorites = favorites.includes(id) ? favorites.filter((fav) => fav !== id) : [...favorites, id];
      commit();
    },
    shop() { openTab('shop'); },
  });
}

export function render() {
  const start = order.length ? (page * PER_PAGE) % order.length : 0;
  const shown = [...order.slice(start), ...order.slice(0, start)].slice(0, PER_PAGE);

  selectChip($('mealChips'), searching() ? '' : meal);
  selectChip($('recipeFilters'), filter);
  renderPantry();
  $('recipeListTitle').textContent = searching() ? `Wyniki dla „${query.trim()}”` : MEALS.find((m) => m.id === meal).title;
  $('recipeCount').textContent = `${order.length} ${plural(order.length, 'przepis', 'przepisy', 'przepisów')}`;
  $('recipeEmpty').hidden = order.length > 0;
  $('moreRecipes').hidden = order.length <= PER_PAGE;
  syncList($('recipeList'), shown.map((recipe) => {
    const statuses = itemStatuses(recipe);
    return {
      key: recipe.id, statuses, cost: missingCost(recipe, statuses), note: added.get(recipe.id) || '',
      favorite: state.recipes.favorites.includes(recipe.id),
      portions: portionsOf(recipe),
      eaten: state.recipes.eaten[recipe.id] || '',
      // Treść własnego przepisu może się zmienić, więc jest częścią danych karty.
      content: recipe.custom ? JSON.stringify(recipe) : '',
    };
  }), recipeCard);
}
