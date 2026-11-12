/* Zbiór przepisów (wbudowane i własne) oraz pytania do niego: filtry, braki, koszt. */
import { plain } from '../../core/format.js';
import { estimatePrice } from '../../core/prices.js';
import { state } from '../../core/store.js';
import { RECIPES } from './data.js';

export const allRecipes = () => [...state.recipes.custom, ...RECIPES];
export const findRecipe = (id) => allRecipes().find((recipe) => recipe.id === id);

export const FILTERS = [
  { id: 'all', label: 'Wszystkie', test: () => true },
  { id: 'quick', label: 'Do 15 minut', test: (recipe) => recipe.minutes <= 15 },
  { id: 'light', label: 'Do 400 kcal', test: (recipe) => recipe.kcal > 0 && recipe.kcal <= 400 },
  { id: 'veg', label: 'Wegetariańskie', test: (recipe) => recipe.vegetarian },
  { id: 'world', label: 'Kuchnie świata', test: (recipe) => recipe.cuisine && recipe.cuisine !== 'pl' },
];

/** Przepisy pasujące do wybranego posiłku i filtra. */
export function selectRecipes({ meal, filter }) {
  const { test } = FILTERS.find((f) => f.id === filter);
  return allRecipes().filter((recipe) => recipe.meal === meal && test(recipe));
}

/**
 * Co dzieje się z każdym składnikiem przepisu:
 * 'list' – jest już na liście zakupów, '' – trzeba go kupić.
 */
export function itemStatuses(recipe) {
  const onList = new Set(state.shop.filter((i) => !i.done).map((i) => plain(i.name)));
  return recipe.items.map(([name]) => (onList.has(plain(name)) ? 'list' : ''));
}

/** Szacunkowy koszt zakupu składników, których jeszcze brakuje. */
export const missingCost = (recipe, statuses) =>
  recipe.items.reduce((total, [name], i) => total + (statuses[i] ? 0 : estimatePrice(name)), 0);
