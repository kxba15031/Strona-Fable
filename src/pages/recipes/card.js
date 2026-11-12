/* Karta jednego przepisu na liście propozycji. */
import { el } from '../../core/dom.js';
import { plural, shortDate, zl } from '../../core/format.js';
import { starButton, stepper } from '../../components/buttons.js';
import { icon } from '../../components/icons.js';
import { CUISINES } from './data.js';
import { findRecipe } from './library.js';
import { scaleAmount } from './portions.js';

const STATUS_LABEL = { home: 'mam', list: 'na liście' };
const products = (n) => `${n} ${plural(n, 'produkt', 'produkty', 'produktów')}`;

/** `view` to dane wiersza z index.js: klucz przepisu, statusy składników, koszt, ulubiony, porcje, data zjedzenia, komunikat. */
export function recipeCard(view) {
  const recipe = findRecipe(view.key);
  const card = el('li', 'recipe');

  const owned = view.statuses.filter((status) => status === 'home').length;
  const facts = [
    `${recipe.minutes} min`, CUISINES[recipe.cuisine], recipe.vegetarian && 'bez mięsa',
    owned && `masz ${owned} z ${recipe.items.length} składników`,
    view.cost && `do kupienia ok. ${zl(view.cost)}`,
  ];
  const head = el('div', 'recipe-head');
  head.append(el('h3', 'recipe-name', recipe.name), starButton(`Ulubiony: ${recipe.name}`, view.favorite));
  card.append(head, el('p', 'recipe-meta', facts.filter(Boolean).join(' · ')));

  const serving = el('div', 'recipe-serving');
  if (recipe.kcal) {
    const energy = el('p', 'recipe-kcal');
    energy.append(el('b', '', `ok. ${recipe.kcal} kcal`), ' na porcję');
    serving.append(energy);
  }
  serving.append(stepper({
    value: view.portions, label: `Liczba porcji: ${recipe.name}`,
    text: `${view.portions} ${plural(view.portions, 'porcja', 'porcje', 'porcji')}`,
  }));
  card.append(serving);

  const list = el('ul', 'recipe-items');
  const factor = view.portions / recipe.portions;
  recipe.items.forEach(([name, amount], i) => {
    const status = view.statuses[i];
    const line = el('li', status ? 'have' : '');
    line.append(el('span', '', name), el('small', '', STATUS_LABEL[status] || scaleAmount(amount, factor)));
    list.appendChild(line);
  });
  card.append(list, el('p', 'recipe-steps', recipe.steps));

  const missing = view.statuses.filter((status) => !status).length;
  const add = el('button', 'btn');
  add.type = 'button';
  add.dataset.action = 'add';
  add.disabled = missing === 0;
  add.innerHTML = `${icon(missing ? 'plus' : 'check')}<span></span>`;
  add.lastChild.textContent = missing ? `Dodaj ${products(missing)} do listy zakupów` : 'Niczego nie trzeba dokupować';
  card.append(add);

  const eaten = el('button', 'link recipe-eaten', view.eaten ? `Zjedzone ${shortDate(view.eaten)} · cofnij` : 'Oznacz jako zjedzone dziś');
  eaten.type = 'button';
  eaten.dataset.action = 'eaten';
  eaten.setAttribute('aria-pressed', String(Boolean(view.eaten)));
  card.append(eaten);

  if (view.note) {
    const note = el('p', 'recipe-note', `${view.note} `);
    const link = el('button', 'link', 'Przejdź do zakupów');
    link.type = 'button';
    link.dataset.action = 'shop';
    note.append(link);
    card.append(note);
  }
  return card;
}
