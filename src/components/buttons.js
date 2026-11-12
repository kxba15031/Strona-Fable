/*
 * Przyciski używane na wszystkich stronach.
 * Przyciski w wierszach list mają atrybut `data-action` – obsługuje je `onAction` z core/dom.js.
 */
import { el } from '../core/dom.js';
import { icon } from './icons.js';

function actionButton(action, className, label, content) {
  const button = el('button', className);
  button.type = 'button';
  button.dataset.action = action;
  button.setAttribute('aria-label', label);
  button.innerHTML = content;
  return button;
}

export const deleteButton = (label) => actionButton('delete', 'del', label, '×');
export const editButton = (label) => actionButton('edit', 'edit', label, icon('edit'));

/** Przycisk z dwoma stanami; stan niesie atrybut `aria-pressed`. */
function toggleButton(action, className, iconName, label, pressed) {
  const button = actionButton(action, className, label, icon(iconName));
  button.setAttribute('aria-pressed', String(pressed));
  return button;
}

/** Pole wyboru w formie przycisku (kupione, zapłacone). */
export const checkButton = (label, pressed) => toggleButton('toggle', 'check', 'check', label, pressed);
/** Gwiazdka „ulubione”. */
export const starButton = (label, pressed) => toggleButton('favorite', 'star', 'star', label, pressed);

/** Licznik z przyciskami − i + (akcje „less” i „more”). */
export function stepper({ value, text, label, min = 1, max = 12 }) {
  const wrap = el('div', 'stepper');
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', label);
  const less = actionButton('less', 'step', 'Mniej', '−');
  const more = actionButton('more', 'step', 'Więcej', '+');
  less.disabled = value <= min;
  more.disabled = value >= max;
  wrap.append(less, el('span', 'stepper-value', text), more);
  return wrap;
}

/** Przycisk-pastylka budowany dla danych, np. szybkie wydatki. */
export function chip({ label, value = '', action = 'pick', title = '' }) {
  const button = el('button', 'chip', label);
  button.type = 'button';
  button.dataset.action = action;
  button.dataset.value = value;
  if (title) button.setAttribute('aria-label', title);
  return button;
}

/* ----- Wersje do szablonów stron (zwracają HTML) ----- */

export const submitButton = (label, { iconName = 'plus', id = '', small = false } = {}) =>
  `<button class="btn${small ? ' btn-small' : ''}" type="submit"${id ? ` id="${id}"` : ''}>${small ? '' : icon(iconName)}<span>${label}</span></button>`;

export const cancelEditButton = () =>
  '<button type="button" class="link cancel-edit" data-cancel hidden>Anuluj edycję</button>';

export const chipHtml = ({ label, value, action = 'pick', active = false }) =>
  `<button type="button" class="chip${active ? ' active' : ''}" data-action="${action}" data-value="${value}" aria-pressed="${active}">${label}</button>`;

/** Zaznacza jedną pastylkę w grupie o podanej wartości. */
export function selectChip(group, value) {
  group.querySelectorAll('.chip').forEach((button) => {
    const active = button.dataset.value === String(value);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
