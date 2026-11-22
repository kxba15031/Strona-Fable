/* Własne przepisy: formularz dodawania i edycji. */
import { $, fillSelect, flagInvalid, need } from '../../core/dom.js';
import { parseAmount, uid } from '../../core/format.js';
import { commit, state } from '../../core/store.js';
import { cancelEditButton, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { card, checkField, field, nameField, selectField, textArea } from '../../components/layout.js';
import { MEALS } from './data.js';

export const recipeFormCard = card({
  icon: 'edit', tone: 'yellow', id: 'ownRecipeTitle', title: 'Własny przepis', sub: 'Dodaj swoje danie – pojawi się wśród propozycji',
  body: `
  <form class="fields" id="recipeForm" novalidate>
    ${nameField({ id: 'ownName', label: 'Nazwa dania', placeholder: 'np. Zapiekanka babci', attrs: 'maxlength="60"' })}
    ${selectField({ id: 'ownMeal', label: 'Posiłek' })}
    ${field({ id: 'ownMinutes', label: 'Czas', unit: 'min', mode: 'numeric', placeholder: '30' })}
    ${field({ id: 'ownPortions', label: 'Porcje', mode: 'numeric', placeholder: '2' })}
    ${field({ id: 'ownKcal', label: 'Kalorie na porcję', unit: 'kcal', mode: 'numeric', placeholder: 'opcjonalnie' })}
    ${textArea({ id: 'ownItems', label: 'Składniki – każdy w osobnej linii, ilość po dwukropku', placeholder: 'Makaron: 250 g\nPomidory: 3 szt.\nBazylia', rows: 5 })}
    ${textArea({ id: 'ownSteps', label: 'Wykonanie', placeholder: 'Krótko opisz, jak to przygotować', rows: 3 })}
    ${checkField({ id: 'ownVeg', label: 'Danie bez mięsa i ryb' })}
    ${submitButton('Dodaj przepis')}
    ${cancelEditButton()}
  </form>`,
});

/** Zamienia tekst z pola na listę składników: „Nazwa: ilość” w każdej linii. */
function parseItems(text) {
  return text.split('\n').map((line) => {
    const [name, ...rest] = line.split(':');
    return [name.trim().slice(0, 40), rest.join(':').trim().slice(0, 30) || 'wg uznania'];
  }).filter(([name]) => name);
}

const FIELDS = ['ownName', 'ownMinutes', 'ownPortions', 'ownKcal', 'ownItems', 'ownSteps'];

/**
 * @param onSaved  wywoływane z zapisanym przepisem, żeby lista mogła go pokazać
 * @returns formularz z metodami `edit(id, przepis)` i `forget(id)`
 */
export function initRecipeForm({ onSaved }) {
  fillSelect($('ownMeal'), MEALS.map((meal) => ({ id: meal.id, name: meal.title })));
  $('ownMeal').value = 'd';
  let saved = null;

  return entryForm({
    form: $('recipeForm'),
    read() {
      const name = need('ownName');
      if (!name) return null;
      const items = parseItems($('ownItems').value);
      if (!items.length) { flagInvalid($('ownItems')); return null; }
      return {
        name, items,
        meal: $('ownMeal').value,
        minutes: Math.round(parseAmount($('ownMinutes').value)),
        portions: Math.min(12, Math.max(1, Math.round(parseAmount($('ownPortions').value)) || 1)),
        kcal: Math.round(parseAmount($('ownKcal').value)),
        steps: $('ownSteps').value.trim().slice(0, 600),
        vegetarian: $('ownVeg').checked,
      };
    },
    save(data, id) {
      const existing = state.recipes.custom.find((recipe) => recipe.id === id);
      if (existing) {
        Object.assign(existing, data);
        delete state.recipes.portions[id]; // domyślna liczba porcji mogła się zmienić
        saved = existing;
      } else {
        saved = { id: `own-${uid()}`, custom: true, cuisine: '', ...data };
        state.recipes.custom.unshift(saved);
      }
    },
    fill(recipe) {
      $('ownName').value = recipe.name;
      $('ownMeal').value = recipe.meal;
      $('ownMinutes').value = recipe.minutes || '';
      $('ownPortions').value = recipe.portions;
      $('ownKcal').value = recipe.kcal || '';
      $('ownItems').value = recipe.items.map(([name, amount]) => `${name}: ${amount}`).join('\n');
      $('ownSteps').value = recipe.steps;
      $('ownVeg').checked = recipe.vegetarian;
    },
    clear() {
      FIELDS.forEach((id) => { $(id).value = ''; });
      $('ownVeg').checked = false;
    },
    done() {
      commit();
      if (saved) onSaved(saved);
      saved = null;
    },
  });
}
