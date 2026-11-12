/* Wiersz listy (koszt, wydatek, produkt, płatność) i paski postępu. */
import { el } from '../core/dom.js';

/**
 * @param lead     kropka w kolorze kategorii (`{ color }`) albo gotowy przycisk wyboru
 * @param meta     tekst lub lista tekstów/elementów pod tytułem
 * @param actions  przyciski po prawej; przy dwóch i więcej kwota schodzi pod tytuł
 */
export function entryRow({ lead, title, meta, amount, actions = [], className = '' }) {
  const row = el('li', `row ${className}${actions.length > 1 ? ' stacked' : ''}`);
  if (lead instanceof Node) row.append(lead);
  else {
    const dot = el('span', 'row-dot');
    dot.style.background = lead.color;
    row.append(dot);
  }
  const info = el('div', 'row-info');
  const metaLine = el('div', 'row-meta');
  metaLine.append(...[].concat(meta));
  info.append(el('div', 'row-title', title), metaLine);
  row.append(info, el('span', 'row-amount', amount), ...actions);
  return row;
}

/** Małe pole wpisywane bezpośrednio w wierszu (cena, dzień, limit). */
export function inlineInput({ id, value, placeholder, label, mode = 'decimal', className = '' }) {
  const input = el('input', `inline-input ${className}`);
  Object.assign(input, { type: 'text', inputMode: mode, id, value, placeholder });
  input.setAttribute('aria-label', label);
  return input;
}

/** Pasek z jednym lub kilkoma segmentami; `parts` to pary [udział 0–1, kolor]. */
export function bar(parts, className = '') {
  const track = el('div', `bar ${className}`);
  parts.forEach(([share, color]) => {
    const fill = el('i');
    fill.style.background = color;
    fill.style.width = `${Math.max(0, Math.min(1, share)) * 100}%`;
    track.appendChild(fill);
  });
  return track;
}

/** Linia „nazwa … wartość” nad paskiem. */
export function barHeading(name, value) {
  const top = el('div', 'bar-top');
  const label = el('span', 'bar-name');
  label.append(...[].concat(name));
  top.append(label, value);
  return top;
}
