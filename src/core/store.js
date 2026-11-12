/* Stan aplikacji: odczyt, zapis w przeglądarce i powiadamianie widoków o zmianach. */
import { STORAGE_KEY, EXP_CATS, STORES, catById, expCat } from './constants.js';
import { storage } from './dom.js';
import { clampDay, inMonth, isIsoDate, isIsoMonth, sum, thisMonth, uid } from './format.js';

const emptyState = () => ({
  income: 0, payday: 10, savings: 0, month: '',
  costs: [], paid: [], extras: [], expenses: [], limits: {}, goals: [], history: [],
  shop: [], store: '',
});

export const state = emptyState();

const list = (value) => (Array.isArray(value) ? value : []);
const amount = (value) => Math.max(0, Number(value) || 0);
const id = (value) => String(value || uid());
const dated = (x) => x && x.name && Number(x.amount) > 0 && isIsoDate(x.date);

/** Zamienia dowolne dane (z pamięci przeglądarki lub z pliku kopii) na poprawny stan. */
function sanitize(saved) {
  const s = emptyState();
  if (!saved || typeof saved !== 'object') return s;
  s.income = amount(saved.income);
  s.savings = amount(saved.savings);
  s.payday = clampDay(saved.payday) || 10;
  s.month = isIsoMonth(saved.month) ? saved.month : '';
  s.costs = list(saved.costs).filter((c) => c && Number(c.amount) > 0).map((c) => ({
    id: id(c.id), name: String(c.name || 'Koszt').slice(0, 40), amount: Number(c.amount),
    category: catById(c.category).id, day: clampDay(c.day),
  }));
  s.paid = list(saved.paid).map(String);
  s.extras = list(saved.extras).filter(dated).map((x) => ({
    id: id(x.id), name: String(x.name).slice(0, 40), amount: Number(x.amount), date: x.date,
  }));
  s.expenses = list(saved.expenses).filter(dated).map((x) => ({
    id: id(x.id), name: String(x.name).slice(0, 60), amount: Number(x.amount), date: x.date,
    cat: expCat(x.cat).id, goalId: x.goalId ? String(x.goalId) : '',
  }));
  EXP_CATS.forEach((cat) => {
    const limit = saved.limits && Number(saved.limits[cat.id]);
    if (limit > 0) s.limits[cat.id] = limit;
  });
  s.goals = list(saved.goals).filter((g) => g && g.name && Number(g.target) > 0).map((g) => ({
    id: id(g.id), name: String(g.name).slice(0, 40), target: Number(g.target),
    saved: amount(g.saved), deadline: isIsoMonth(g.deadline) ? g.deadline : '',
  }));
  s.history = list(saved.history).filter((h) => h && isIsoMonth(h.month)).map((h) => ({
    month: h.month, income: amount(h.income), fixed: amount(h.fixed), spent: amount(h.spent),
  }));
  s.shop = list(saved.shop).filter((i) => i && i.name).map((i) => ({
    id: id(i.id), name: String(i.name).slice(0, 40), qty: Math.max(0.01, Number(i.qty) || 1),
    price: amount(i.price), est: Boolean(i.est), done: Boolean(i.done),
  }));
  s.store = STORES.includes(saved.store) ? saved.store : '';
  return s;
}

/** Po zmianie miesiąca zapisuje poprzedni do historii i zeruje oznaczenia „zapłacone”. */
function rollMonth() {
  const current = thisMonth();
  const prev = state.month;
  if (prev && prev !== current) {
    const entry = {
      month: prev,
      income: state.income + sum(inMonth(state.extras, prev)),
      fixed: sum(state.costs),
      spent: sum(inMonth(state.expenses, prev)),
    };
    if (entry.income > 0 || entry.fixed > 0 || entry.spent > 0) {
      state.history = [...state.history.filter((h) => h.month !== prev), entry]
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12);
    }
    state.paid = [];
  }
  state.month = current;
}

/** Podmienia cały stan (wczytanie kopii, wyczyszczenie danych). */
export function replaceState(data) {
  Object.assign(state, sanitize(data));
  rollMonth();
}

export function loadState() {
  let saved = null;
  try { saved = JSON.parse(storage.get(STORAGE_KEY, 'null')); } catch (_) { /* uszkodzone dane – start od zera */ }
  replaceState(saved);
}

const listeners = [];
export const onChange = (listener) => listeners.push(listener);

/** Zapisuje stan i odświeża widoki. `info.replaced` oznacza podmianę całego stanu. */
export function commit(info = {}) {
  storage.set(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((listener) => listener(info));
}
