/* Zakładka „Wydatki”: codzienne wydatki, szybkie dodawanie, wykresy i limity kategorii. */
import { EXP_CATS, expCat } from '../../core/constants.js';
import { knownMonths, monthSpending, quickItems } from '../../core/compute.js';
import { $, countTo, el, fillSelect, need, onAction, syncList } from '../../core/dom.js';
import { amountText, daysInMonth, isIsoDate, isoToday, monthLabel, monthStart, parseAmount, shortDate, thisMonth, uid, zl, zlExact } from '../../core/format.js';
import { commit, state } from '../../core/store.js';
import { cancelEditButton, chip, deleteButton, editButton, linkButton, stepper, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { card, field, hero, nameField, selectField } from '../../components/layout.js';
import { bar, barHeading, entryRow, inlineInput } from '../../components/row.js';
import { initCharts, renderCharts } from './charts.js';

export const template = `
  <div class="month-nav" id="monthNav"></div>

  ${hero({
    titleId: 'expHeroTitle', title: 'Wydane w tym miesiącu', amountId: 'expSpent',
    meterId: 'expMeter', meterLabel: 'Ile z miesięcznej kwoty jest już wydane', noteId: 'expNote',
    stats: [['Po stałych kosztach', 'expBudget'], ['Zostaje', 'expLeft'], ['Średnio dziennie', 'expDaily', '–']],
  })}

  ${card({
    icon: 'purse', tone: 'yellow', id: 'expTitle', title: 'Codzienne wydatki', sub: 'Jedzenie, paliwo, rozrywka – wszystko poza stałymi kosztami',
    body: `
    <p class="note first" id="pastNote" hidden>Przeglądasz miniony miesiąc. Wpisy można tu usuwać, ale nie dodawać ani edytować.</p>
    <div class="quick" id="quickWrap" hidden>
      <h3 class="mini first">Szybkie dodawanie</h3>
      <div class="chips" id="quickList"></div>
    </div>
    <form class="fields" id="expForm" novalidate>
      ${nameField({ id: 'expName', label: 'Na co', placeholder: 'np. Obiad na mieście' })}
      ${field({ id: 'expAmount', label: 'Kwota', unit: 'zł', placeholder: '0' })}
      ${selectField({ id: 'expCategory', label: 'Kategoria' })}
      ${field({ id: 'expDate', label: 'Data', type: 'date', wide: true })}
      ${submitButton('Dodaj wydatek')}
      ${cancelEditButton()}
    </form>
    <ul class="rows" id="expList"></ul>
    <p class="empty" id="expEmpty">Nie ma wydatków w tym miesiącu.</p>`,
  })}

  ${card({
    icon: 'bars', tone: 'yellow', id: 'spendChartTitle', title: 'Na co wydajesz', sub: 'Wydatki tego miesiąca według kategorii i dni',
    body: `
    <p class="empty" id="spendChartEmpty">Dodaj wydatki, a pokażę, na co i kiedy idą pieniądze.</p>
    <div id="spendCharts" hidden>
      <h3 class="mini first">Według kategorii</h3>
      <ul class="stack" id="catBars"></ul>
      <h3 class="mini">Dzień po dniu</h3>
      <div class="days" role="group" aria-label="Wydatki w kolejnych dniach miesiąca">
        <span class="days-max" id="dayMax"></span>
        <div class="days-cols" id="dayCols"></div>
        <div class="days-axis" id="dayAxis" aria-hidden="true"></div>
      </div>
      <p class="days-info" id="dayInfo" aria-live="polite"></p>
    </div>`,
  })}

  ${card({
    icon: 'shield', id: 'limitTitle', title: 'Limity na kategorie', sub: 'Wpisz miesięczny limit, a ostrzegę po jego przekroczeniu',
    body: '<ul class="stack" id="limitList"></ul>',
  })}
`;

let expForm;
let viewMonth = thisMonth(); // miesiąc oglądany w tej zakładce
const viewingPast = () => viewMonth !== thisMonth();

/** Data wydatku: dowolny dzień bieżącego miesiąca, najpóźniej dziś. */
function resetDate() {
  const today = isoToday();
  Object.assign($('expDate'), { min: `${today.slice(0, 7)}-01`, max: today, value: today });
}

export function init() {
  fillSelect($('expCategory'), EXP_CATS);
  resetDate();

  expForm = entryForm({
    form: $('expForm'),
    read() {
      const name = need('expName');
      const amount = name && need('expAmount', parseAmount);
      if (!amount) return null;
      const today = isoToday();
      const picked = $('expDate').value;
      const valid = isIsoDate(picked) && picked.slice(0, 7) === today.slice(0, 7) && picked <= today;
      return { name, amount, cat: $('expCategory').value, date: valid ? picked : today };
    },
    save(data, id) {
      const existing = state.expenses.find((x) => x.id === id);
      if (existing) Object.assign(existing, data);
      else state.expenses.unshift({ id: uid(), goalId: '', ...data });
    },
    fill(expense) {
      $('expName').value = expense.name;
      $('expAmount').value = amountText(expense.amount);
      $('expCategory').value = expense.cat;
      $('expDate').value = expense.date;
    },
    clear() {
      $('expName').value = '';
      $('expAmount').value = '';
      resetDate();
    },
    done: commit,
  });

  onAction($('expList'), {
    edit(id) { expForm.edit(id, state.expenses.find((x) => x.id === id)); },
    delete(id) {
      const expense = state.expenses.find((x) => x.id === id);
      // Usunięcie wpłaty na cel cofa ją także w samym celu.
      const goal = expense.goalId && state.goals.find((g) => g.id === expense.goalId);
      if (goal) goal.saved = Math.max(0, goal.saved - expense.amount);
      state.expenses = state.expenses.filter((x) => x.id !== id);
      expForm.forget(id);
      commit();
    },
  });

  onAction($('quickList'), {
    add(_, button) {
      const item = quickItems()[Number(button.dataset.value)];
      if (!item) return;
      state.expenses.unshift({ id: uid(), goalId: '', name: item.name, amount: item.amount, cat: item.cat, date: isoToday() });
      commit();
    },
  });

  $('limitList').addEventListener('change', (e) => {
    const cat = e.target.closest('[data-key]').dataset.key;
    const limit = parseAmount(e.target.value);
    if (limit) state.limits[cat] = limit;
    else delete state.limits[cat];
    commit();
  });

  // Przełącznik miesiąca: tylko miesiące, w których są jakieś dane.
  const step = (delta) => {
    const months = knownMonths();
    viewMonth = months[months.indexOf(viewMonth) + delta] || viewMonth;
    expForm.forget(expForm.editing);
    commit();
  };
  onAction($('monthNav'), {
    less() { step(-1); },
    more() { step(1); },
    today() { viewMonth = thisMonth(); commit(); },
  });

  initCharts();
}

function renderMonthNav() {
  const months = knownMonths();
  if (!months.includes(viewMonth)) viewMonth = thisMonth();
  const index = months.indexOf(viewMonth);
  syncList($('monthNav'), [{ key: viewMonth, first: index === 0, last: index === months.length - 1, only: months.length === 1 }], (nav) => {
    const wrap = el('div', 'month-nav-row');
    wrap.hidden = nav.only;
    wrap.append(stepper({ text: monthLabel(nav.key), label: 'Oglądany miesiąc', canLess: !nav.first, canMore: !nav.last, symbols: ['‹', '›'] }));
    if (!nav.last) wrap.append(linkButton({ label: 'Wróć do bieżącego', action: 'today' }));
    return wrap;
  });
}

/**
 * Podsumowanie oglądanego miesiąca. Dla bieżącego liczby pochodzą z `compute()`,
 * dla minionego z zapisanej historii (jeśli miesiąc był wtedy zapisany).
 */
function renderSummary(d, spending) {
  const past = viewingPast();
  const saved = state.history.find((h) => h.month === viewMonth);
  const known = !past || Boolean(saved);
  const income = past ? (saved ? saved.income : 0) : d.income;
  const budget = past ? (saved ? saved.income - saved.fixed : 0) : d.budget;
  const left = budget - spending.spent;
  const days = past ? daysInMonth(monthStart(viewMonth)) : new Date().getDate();

  $('expHeroTitle').textContent = past ? `Wydane: ${monthLabel(viewMonth)}` : 'Wydane w tym miesiącu';
  countTo($('expSpent'), spending.spent, zlExact);
  if (known) {
    countTo($('expBudget'), budget, zl);
    countTo($('expLeft'), left, zl);
  } else {
    $('expBudget').textContent = '–';
    $('expLeft').textContent = '–';
  }
  $('expDaily').textContent = spending.spent > 0 ? zl(spending.spent / days) : '–';
  $('expMeter').style.width = `${budget > 0 ? Math.min(100, (spending.spent / budget) * 100) : 0}%`;
  $('expSpent').closest('.hero').classList.toggle('negative', income > 0 && left < 0);
  if (!known) $('expNote').textContent = 'Dla tego miesiąca nie mam zapisanego dochodu';
  else if (income <= 0) $('expNote').textContent = 'Dodaj wypłatę w zakładce Budżet, a pokażę, ile możesz wydać';
  else if (budget <= 0) $('expNote').textContent = 'Stałe koszty zajmują cały dochód';
  else $('expNote').textContent = `Wydane ${Math.round((spending.spent / budget) * 100)}% kwoty, która zostaje po stałych kosztach`;
}

function renderExpenses(spending) {
  const past = viewingPast();
  const rows = [...spending.items]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((x) => ({ key: x.id, name: x.name, amount: x.amount, cat: x.cat, date: x.date, editing: x.id === expForm.editing, past }));
  syncList($('expList'), rows, (row) => {
    const cat = expCat(row.cat);
    // Wpłaty na cele edytuje się w zakładce Cele, a wpisy z minionych miesięcy można tylko usuwać.
    const actions = row.cat === 'goal' || row.past ? [] : [editButton(`Edytuj wydatek: ${row.name}`)];
    return entryRow({
      lead: cat, title: row.name, meta: `${cat.name} · ${shortDate(row.date)}`, amount: zlExact(row.amount),
      actions: [...actions, deleteButton(`Usuń wydatek: ${row.name}`)],
      className: row.editing ? 'editing' : '',
    });
  });
  $('expEmpty').hidden = rows.length > 0;
  $('expForm').hidden = past;
  $('pastNote').hidden = !past;
}

function renderQuick() {
  const items = quickItems().map((q, i) => ({ key: i, name: q.name, amount: q.amount }));
  $('quickWrap').hidden = !items.length || viewingPast();
  syncList($('quickList'), items, (q) => chip({
    label: `${q.name} · ${Number.isInteger(q.amount) ? zl(q.amount) : zlExact(q.amount)}`,
    value: q.key, action: 'add', title: `Dodaj wydatek: ${q.name}, ${zlExact(q.amount)}`,
  }));
}

function renderLimits(d) {
  const rows = EXP_CATS.map((cat) => ({ key: cat.id, name: cat.name, color: cat.color, spent: d.spentByCat[cat.id] || 0, limit: state.limits[cat.id] || 0 }));
  syncList($('limitList'), rows, (row) => {
    const over = row.limit > 0 && row.spent > row.limit;
    const value = el('label', 'bar-value');
    value.append(`${zl(row.spent)} z `, inlineInput({ id: `limit-${row.key}`, value: amountText(row.limit), placeholder: 'limit', label: `Limit miesięczny: ${row.name}` }), ' zł');
    const item = el('li', 'bar-row');
    item.append(barHeading(row.name, value), bar([[row.limit > 0 ? row.spent / row.limit : 0, over ? 'var(--danger)' : row.color]]));
    if (over) item.append(el('p', 'bar-note warn', `Limit przekroczony o ${zl(row.spent - row.limit)}`));
    else if (row.limit > 0) item.append(el('p', 'bar-note', `Zostało ${zl(row.limit - row.spent)}`));
    return item;
  });
}

export function render(d) {
  renderMonthNav();
  const spending = monthSpending(viewMonth);
  renderSummary(d, spending);
  renderQuick();
  renderExpenses(spending);
  renderCharts(spending);
  renderLimits(d);
  // Limity dotyczą bieżącego miesiąca, więc przy przeglądaniu minionych są schowane.
  $('limitTitle').closest('.card').hidden = viewingPast();
}
