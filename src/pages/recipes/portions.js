/* Przeliczanie ilości składników na inną liczbę porcji. */
import { plural } from '../../core/format.js';

// Odmiana jednostek: [1, 2–4, 5+, ułamek], np. 1 łyżka, 2 łyżki, 5 łyżek, 1,5 łyżki.
const UNITS = [
  ['łyżka', 'łyżki', 'łyżek', 'łyżki'],
  ['łyżeczka', 'łyżeczki', 'łyżeczek', 'łyżeczki'],
  ['szklanka', 'szklanki', 'szklanek', 'szklanki'],
  ['kromka', 'kromki', 'kromek', 'kromki'],
  ['puszka', 'puszki', 'puszek', 'puszki'],
  ['kulka', 'kulki', 'kulek', 'kulki'],
  ['plaster', 'plastry', 'plastrów', 'plastra'],
  ['ząbek', 'ząbki', 'ząbków', 'ząbka'],
  ['filet', 'filety', 'filetów', 'fileta'],
  ['płat', 'płaty', 'płatów', 'płata'],
  ['opakowanie', 'opakowania', 'opakowań', 'opakowania'],
];

const number = (n) => String(n).replace('.', ',');

/** Zaokrągla do kroku właściwego dla jednostki: gramy co 5, kilogramy co ćwierć, reszta co pół. */
function roundFor(unit, value) {
  let step = 0.5;
  if (unit === 'g' || unit === 'ml') step = value < 10 ? 1 : 5;
  else if (unit === 'kg' || unit === 'l') step = 0.25;
  return Math.max(step, Math.round(value / step) * step);
}

function inflect(unit, value) {
  const forms = UNITS.find((unitForms) => unitForms.includes(unit));
  if (!forms) return unit;
  return Number.isInteger(value) ? plural(value, forms[0], forms[1], forms[2]) : forms[3];
}

/**
 * Skaluje opis ilości, np. „2 łyżki” × 2,5 → „5 łyżek”.
 * Ilości bez liczby („garść”, „pół sztuki”) dostają dopisek „×2”,
 * a określenia typu „do posypania” zostają bez zmian.
 */
export function scaleAmount(amount, factor) {
  if (factor === 1 || amount.startsWith('do ')) return amount;
  const match = amount.match(/^(\d+(?:,\d+)?)\s*(\S*)(.*)$/);
  if (!match) return `${amount} ×${number(Math.round(factor * 100) / 100)}`;
  const [, digits, unit, rest] = match;
  const value = roundFor(unit, parseFloat(digits.replace(',', '.')) * factor);
  return `${number(value)} ${inflect(unit, value)}${rest}`.trim();
}
