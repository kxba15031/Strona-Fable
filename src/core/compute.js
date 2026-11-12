/* Wszystkie obliczenia na stanie – widoki tylko je wyświetlają. */
import { CATEGORIES } from './constants.js';
import { daysInMonth, daysText, inMonth, plain, sum, thisMonth, zl } from './format.js';
import { state } from './store.js';

function daysToPayday() {
  const now = new Date();
  const today = now.getDate();
  const payday = Math.min(state.payday, daysInMonth(now));
  if (payday >= today) return payday - today;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return daysInMonth(now) - today + Math.min(state.payday, daysInMonth(next));
}

/** Wydatki wybranego miesiąca: wpisy, suma i sumy według kategorii. */
export function monthSpending(month) {
  const items = inMonth(state.expenses, month);
  const spentByCat = {};
  items.forEach((x) => { spentByCat[x.cat] = (spentByCat[x.cat] || 0) + x.amount; });
  return { month, items, spent: sum(items), spentByCat };
}

/** Miesiące, dla których są jakieś dane, od najstarszego; bieżący jest zawsze ostatni. */
export function knownMonths() {
  const months = new Set([...state.expenses.map((x) => x.date.slice(0, 7)), ...state.history.map((h) => h.month), thisMonth()]);
  return [...months].filter((month) => month <= thisMonth()).sort();
}

/** Liczby bieżącego miesiąca, z których korzystają wszystkie zakładki. */
export function compute() {
  const month = thisMonth();
  const { spent, spentByCat } = monthSpending(month);

  const costs = sum(state.costs);
  const extra = sum(inMonth(state.extras, month));
  const income = state.income + extra;
  const budget = income - costs;
  const left = budget - spent;
  const days = daysToPayday();

  const byCat = CATEGORIES
    .map((cat) => ({ ...cat, total: sum(state.costs.filter((c) => c.category === cat.id)) }))
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  // Prognoza: dotychczasowe dzienne tempo wydatków (bez wpłat na cele) przeniesione na dni do wypłaty.
  const everyday = spent - (spentByCat.goal || 0);
  const pace = everyday > 0 ? everyday / new Date().getDate() : 0;
  const forecast = pace > 0 && days > 0 && income > 0 && left > 0
    ? { pace, left: left - pace * days, lasts: Math.floor(left / pace) }
    : null;

  return {
    income, extra, costs, spent, spentByCat, budget, left, byCat, days, forecast,
    savings: state.savings,
    share: income > 0 ? costs / income : 0,
    used: income > 0 ? (costs + spent) / income : 0,
    cushionMonths: costs > 0 ? state.savings / costs : (state.savings > 0 ? Infinity : 0),
  };
}

export function forecastText(d) {
  const f = d.forecast;
  const pace = `przy obecnym tempie wydatków (${zl(f.pace)} dziennie)`;
  if (f.left >= 0) return `Prognoza: ${pace} do wypłaty zostanie Ci ok. ${zl(f.left)}.`;
  return `Prognoza: ${pace} pieniądze skończą się za ${daysText(f.lasts)}, czyli ${daysText(d.days - f.lasts)} przed wypłatą.`;
}

/** Proponowany podział kwoty, która zostaje, zależnie od wielkości poduszki bezpieczeństwa. */
export function buildPlan(d) {
  const daily = d.byCat.some((c) => c.id === 'food') ? 'Codzienne wydatki' : 'Jedzenie i codzienne wydatki';
  const stages = [
    { stage: 'cushion', below: 3, rows: [[daily, 0.5, '#22c55e'], ['Poduszka bezpieczeństwa', 0.3, '#15803d'], ['Przyjemności', 0.15, '#facc15'], ['Pierwsze inwestycje', 0.05, '#eab308']] },
    { stage: 'growing', below: 6, rows: [[daily, 0.5, '#22c55e'], ['Inwestycje', 0.2, '#eab308'], ['Poduszka bezpieczeństwa', 0.15, '#15803d'], ['Przyjemności', 0.15, '#facc15']] },
    { stage: 'invest', below: Infinity, rows: [[daily, 0.45, '#22c55e'], ['Inwestycje', 0.3, '#eab308'], ['Przyjemności i cele', 0.2, '#facc15'], ['Dopłata do oszczędności', 0.05, '#15803d']] },
  ];
  const { stage, rows } = stages.find((s) => d.cushionMonths < s.below) || stages[2];
  return { stage, rows: rows.map(([label, part, color]) => ({ label, part, color, amount: d.left * part })) };
}

/** Terminy płatności stałych kosztów w bieżącym miesiącu, od najwcześniejszego. */
export function dueList() {
  const now = new Date();
  const today = now.getDate();
  const last = daysInMonth(now);
  return state.costs.filter((c) => c.day).map((cost) => {
    const day = Math.min(cost.day, last);
    const diff = day - today;
    let status = 'later';
    if (state.paid.includes(cost.id)) status = 'paid';
    else if (diff < 0) status = 'overdue';
    else if (diff <= 7) status = 'soon';
    return { cost, day, diff, status };
  }).sort((a, b) => a.day - b.day);
}

/** Ile brakuje do celu i ile odkładać miesięcznie, żeby zdążyć przed terminem. */
export function goalNeed(goal) {
  const missing = Math.max(0, goal.target - goal.saved);
  if (!missing || !goal.deadline) return { missing, months: 0, perMonth: 0 };
  const [year, month] = thisMonth().split('-').map(Number);
  const [endYear, endMonth] = goal.deadline.split('-').map(Number);
  const months = Math.max(1, (endYear - year) * 12 + endMonth - month + 1);
  return { missing, months, perMonth: missing / months };
}

export function shopTotals() {
  const value = (items) => items.reduce((total, i) => total + i.qty * i.price, 0);
  const bought = state.shop.filter((i) => i.done);
  const done = value(bought);
  const toBuy = value(state.shop) - done;
  return { toBuy, done, total: toBuy + done, boughtCount: bought.length, noPrice: state.shop.filter((i) => !i.price).length };
}

/** Najczęściej powtarzane wydatki – do dodawania jednym dotknięciem. */
export function quickItems() {
  const groups = new Map();
  state.expenses.filter((x) => x.cat !== 'goal').forEach((x) => {
    const key = `${plain(x.name).trim()}|${x.cat}`;
    const group = groups.get(key);
    if (!group) groups.set(key, { name: x.name, cat: x.cat, amount: x.amount, count: 1, last: x.date });
    else {
      group.count += 1;
      if (x.date > group.last) Object.assign(group, { last: x.date, amount: x.amount, name: x.name });
    }
  });
  return [...groups.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, 5);
}
