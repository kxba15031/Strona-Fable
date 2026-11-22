/* Formatowanie kwot i dat oraz drobne pomocnicze funkcje na danych. */

const PLN = { style: 'currency', currency: 'PLN' };
const exact = new Intl.NumberFormat('pl-PL', PLN);
const rounded = new Intl.NumberFormat('pl-PL', { ...PLN, maximumFractionDigits: 0 });

/** Kwota z groszami, np. „12,50 zł”. */
export const zlExact = (n) => exact.format(n);
/** Kwota zaokrąglona do złotych, np. „13 zł”. */
export const zl = (n) => rounded.format(Math.round(n));
/** Liczba do pola formularza: „12,5”, a dla zera pusty tekst. */
export const amountText = (n) => (n ? String(Math.round(n * 100) / 100).replace('.', ',') : '');
/** Cena z dwoma miejscami po przecinku: „4,20”. */
export const priceText = (n) => n.toFixed(2).replace('.', ',');

export function parseAmount(text) {
  const n = parseFloat(String(text).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** Dzień miesiąca 1–31 albo 0, gdy wartość jest spoza zakresu. */
export function clampDay(value) {
  const n = Math.round(Number(value));
  return n >= 1 && n <= 31 ? n : 0;
}

export function plural(n, one, few, many) {
  if (n === 1) return one;
  const d = n % 10;
  const h = n % 100;
  return d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
}
export const daysText = (n) => `${n} ${plural(n, 'dzień', 'dni', 'dni')}`;
export const productsText = (n) => `${n} ${plural(n, 'produkt', 'produkty', 'produktów')}`;

/** Data w zapisie RRRR-MM-DD (czas lokalny). */
export const toIso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const isoToday = () => toIso(new Date());
export const thisMonth = () => isoToday().slice(0, 7);
export const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isIsoMonth = (v) => typeof v === 'string' && /^\d{4}-\d{2}$/.test(v);
export const shortDate = (iso) => `${Number(iso.slice(8, 10))}.${iso.slice(5, 7)}`;
/** Pierwszy dzień miesiąca zapisanego jako RRRR-MM. */
export const monthStart = (ym) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1);
export const monthLabel = (ym) => monthStart(ym).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
export const daysInMonth = (date = new Date()) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

export const inMonth = (list, ym) => list.filter((x) => x.date.slice(0, 7) === ym);
export const sum = (list) => list.reduce((total, x) => total + x.amount, 0);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Tekst bez wielkich liter i polskich znaków – do porównywania nazw. */
export const plain = (text) => String(text).toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
