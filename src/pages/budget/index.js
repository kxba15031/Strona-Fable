/* Zakładka „Budżet”: podsumowanie, agent, terminy płatności, wypłata, stałe koszty, historia. */
import { CATEGORIES, catById } from '../../core/constants.js';
import { compute, dueList, forecastText } from '../../core/compute.js';
import { $, countTo, el, fillSelect, keyOf, need, onAction, syncList } from '../../core/dom.js';
import { amountText, clampDay, daysText, inMonth, isoToday, monthLabel, parseAmount, plural, shortDate, thisMonth, uid, zl, zlExact } from '../../core/format.js';
import { commit, state } from '../../core/store.js';
import { cancelEditButton, checkButton, chipHtml, deleteButton, editButton, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { card, field, hero, nameField, selectField } from '../../components/layout.js';
import { bar, barHeading, entryRow, inlineInput } from '../../components/row.js';
import { answers, report } from './agent.js';
import { initAsk, resetConversation } from './ai.js';
import { ask, reply, scheduleReport } from './chat.js';
import { renderDonut } from './donut.js';
import { renderSubscriptions, subscriptionsCard } from './subscriptions.js';

const QUESTIONS = [['left', 'Ile mi zostało?'], ['plan', 'Na co przeznaczyć?'], ['invest', 'W co zainwestować?'], ['cut', 'Jak ograniczyć koszty?']];

export const template = `
  ${hero({
    titleId: 'heroTitle', title: 'Zostaje Ci w tym miesiącu', amountId: 'leftAmount',
    meterId: 'meterFill', meterLabel: 'Udział kosztów i wydatków w dochodzie', noteId: 'meterNote',
    extra: '<p class="forecast" id="forecast" hidden></p>',
    stats: [['Dochód', 'statIncome'], ['Stałe koszty', 'statCosts'], ['Wydatki', 'statSpent'], ['Do wypłaty', 'statDays', '–']],
  })}

  <section class="card agent reveal" aria-labelledby="agentTitle">
    <div class="card-head">
      <div class="agent-avatar" aria-hidden="true"><span class="eye"></span><span class="eye"></span></div>
      <div>
        <h2 id="agentTitle">Agent Grosik</h2>
        <p class="sub"><span class="dot"></span> analizuje Twój budżet na bieżąco</p>
      </div>
    </div>
    <div class="chat" id="chat" aria-live="polite"></div>
    <div class="chips" id="questions">
      ${QUESTIONS.map(([value, label]) => chipHtml({ label, value, action: 'ask' })).join('')}
    </div>
    <form class="ask" id="askForm" novalidate hidden>
      <div class="input-wrap">
        <input id="askInput" type="text" placeholder="Zapytaj własnymi słowami…" maxlength="300" autocomplete="off" aria-label="Pytanie do agenta AI">
      </div>
      ${submitButton('Zapytaj', { small: true })}
    </form>
    <p class="disclaimer">Podpowiedzi mają charakter edukacyjny i nie są rekomendacją inwestycyjną.</p>
  </section>

  ${card({
    icon: 'calendar', id: 'dueTitle', title: 'Do zapłaty w tym tygodniu', sub: 'Zaległe i najbliższe płatności stałych kosztów',
    body: '<ul class="rows flush" id="dueList"></ul><p class="note" id="dueNote"></p>',
  })}

  ${card({
    icon: 'wallet', tone: 'yellow', id: 'incomeTitle', title: 'Twoja wypłata', sub: 'Kwota „na rękę”, którą dostajesz co miesiąc',
    body: `
    <div class="fields">
      ${field({ id: 'income', label: 'Wypłata netto', unit: 'zł', placeholder: 'np. 6500', wide: true })}
      ${field({ id: 'payday', label: 'Dzień wypłaty', mode: 'numeric', placeholder: '10' })}
      ${field({ id: 'savings', label: 'Twoje oszczędności', unit: 'zł', placeholder: 'np. 5000' })}
    </div>
    <h3 class="mini">Dodatkowe dochody w tym miesiącu</h3>
    <form class="fields" id="extraForm" novalidate>
      ${nameField({ id: 'extraName', label: 'Źródło', placeholder: 'np. Premia', wide: false })}
      ${field({ id: 'extraAmount', label: 'Kwota', unit: 'zł', placeholder: '0' })}
      ${submitButton('Dodaj dochód')}
    </form>
    <ul class="rows" id="extraList"></ul>
    <p class="note" id="extraNote"></p>`,
  })}

  ${card({
    icon: 'receipt', id: 'costsTitle', title: 'Stałe koszty', sub: 'Czynsz, rachunki, raty, subskrypcje…',
    body: `
    <form class="fields" id="costForm" novalidate>
      ${nameField({ id: 'costName', label: 'Nazwa', placeholder: 'np. Czynsz' })}
      ${field({ id: 'costAmount', label: 'Kwota', unit: 'zł', placeholder: '0' })}
      ${selectField({ id: 'costCategory', label: 'Kategoria' })}
      ${field({ id: 'costDay', label: 'Dzień płatności w miesiącu (opcjonalnie)', mode: 'numeric', placeholder: 'np. 10', wide: true })}
      ${submitButton('Dodaj koszt')}
      ${cancelEditButton()}
    </form>
    <ul class="rows" id="costList"></ul>
    <p class="empty" id="costEmpty">Nie masz jeszcze żadnych kosztów. Dodaj pierwszy powyżej.</p>`,
  })}

  ${subscriptionsCard}

  ${card({
    icon: 'pie', tone: 'yellow', id: 'chartTitle', title: 'Na co idą pieniądze', sub: 'Podział stałych kosztów według kategorii',
    body: `
    <div class="donut-chart">
      <div class="donut-wrap">
        <svg class="donut" id="donut" viewBox="0 0 120 120" role="img" aria-label="Wykres kosztów według kategorii"></svg>
        <div class="donut-center"><span>Razem</span><strong id="donutTotal">0 zł</strong></div>
      </div>
      <div>
        <ul class="legend" id="legend"></ul>
        <p class="note" id="legendEmpty">Dodaj koszty, aby zobaczyć podział.</p>
      </div>
    </div>`,
  })}

  ${card({
    icon: 'bars', id: 'historyTitle', title: 'Historia miesięcy', sub: 'Jak dzieliły się Twoje pieniądze w kolejnych miesiącach',
    body: `
    <ul class="stack" id="historyList"></ul>
    <p class="note" id="historyNote"></p>
    <p class="key"><span><i style="background:#15803d"></i>stałe koszty</span><span><i style="background:#facc15"></i>wydatki</span><span><i style="background:#bbf7d0"></i>zostało</span></p>`,
  })}
`;

let costForm;

export function init() {
  fillSelect($('costCategory'), CATEGORIES);

  $('income').addEventListener('input', (e) => { state.income = parseAmount(e.target.value); commit(); });
  $('savings').addEventListener('input', (e) => { state.savings = parseAmount(e.target.value); commit(); });
  $('payday').addEventListener('input', (e) => {
    const day = clampDay(e.target.value);
    if (day) { state.payday = day; commit(); }
  });

  entryForm({
    form: $('extraForm'),
    read() {
      const name = need('extraName');
      const amount = name && need('extraAmount', parseAmount);
      return amount ? { name, amount } : null;
    },
    save: (data) => state.extras.unshift({ id: uid(), date: isoToday(), ...data }),
    clear() { $('extraName').value = ''; $('extraAmount').value = ''; },
    done: commit,
  });
  onAction($('extraList'), {
    delete(id) { state.extras = state.extras.filter((x) => x.id !== id); commit(); },
  });

  onAction($('dueList'), {
    toggle(id) {
      state.paid = state.paid.includes(id) ? state.paid.filter((paid) => paid !== id) : [...state.paid, id];
      commit();
    },
  });

  costForm = entryForm({
    form: $('costForm'),
    read() {
      const name = need('costName');
      const amount = name && need('costAmount', parseAmount);
      return amount ? { name, amount, category: $('costCategory').value, day: clampDay($('costDay').value) } : null;
    },
    save(data, id) {
      const existing = state.costs.find((c) => c.id === id);
      if (existing) Object.assign(existing, data);
      else state.costs.unshift({ id: uid(), ...data });
    },
    fill(cost) {
      $('costName').value = cost.name;
      $('costAmount').value = amountText(cost.amount);
      $('costCategory').value = cost.category;
      $('costDay').value = cost.day || '';
    },
    clear() { ['costName', 'costAmount', 'costDay'].forEach((id) => { $(id).value = ''; }); },
    done: commit,
  });
  onAction($('costList'), {
    edit(id) { costForm.edit(id, state.costs.find((c) => c.id === id)); },
    delete(id) {
      state.costs = state.costs.filter((c) => c.id !== id);
      state.paid = state.paid.filter((paid) => paid !== id);
      costForm.forget(id);
      commit();
    },
  });
  $('costList').addEventListener('change', (e) => {
    if (!e.target.matches('.day-edit')) return;
    const cost = state.costs.find((c) => c.id === keyOf(e.target));
    if (!cost) return;
    cost.day = clampDay(e.target.value);
    commit();
  });

  onAction($('questions'), {
    ask(_, button) { reply(ask(button.textContent), answers[button.dataset.value](compute())); },
  });
  onAction($('chat'), {
    dismiss() { state.summaryFor = ''; commit(); },
  });
  initAsk();
}

function renderSummary(d) {
  countTo($('leftAmount'), d.left, zlExact);
  countTo($('statIncome'), d.income, zl);
  countTo($('statCosts'), d.costs, zl);
  countTo($('statSpent'), d.spent, zl);
  $('statDays').textContent = d.days === 0 ? 'dziś!' : daysText(d.days);
  $('leftAmount').closest('.hero').classList.toggle('negative', d.left < 0);
  $('meterFill').style.width = `${Math.min(100, d.used * 100)}%`;
  if (d.income <= 0) $('meterNote').textContent = 'Dodaj wypłatę, aby zacząć';
  else if (d.spent > 0) $('meterNote').textContent = `Stałe koszty i wydatki to ${Math.round(d.used * 100)}% Twojego dochodu`;
  else $('meterNote').textContent = `Stałe koszty to ${Math.round(d.share * 100)}% Twojego dochodu`;
  $('forecast').hidden = !d.forecast;
  if (d.forecast) {
    $('forecast').classList.toggle('bad', d.forecast.left < 0);
    $('forecast').textContent = forecastText(d);
  }
}

function renderDue() {
  const all = dueList();
  const shown = all.filter((x) => x.status !== 'later');
  const later = all.length - shown.length;
  const month = thisMonth().slice(5);
  const when = (x) => {
    if (x.status === 'paid') return 'zapłacone';
    if (x.status === 'overdue') return `po terminie o ${daysText(-x.diff)}`;
    return x.diff === 0 ? 'termin dziś' : `za ${daysText(x.diff)}`;
  };
  const rows = shown.map((x) => ({ key: x.cost.id, name: x.cost.name, amount: x.cost.amount, status: x.status, meta: `do ${x.day}.${month} · ${when(x)}` }));
  syncList($('dueList'), rows, (row) => entryRow({
    lead: checkButton(`Zapłacone: ${row.name}`, row.status === 'paid'),
    title: row.name, meta: row.meta, amount: zlExact(row.amount),
    className: `due-${row.status}${row.status === 'paid' ? ' done' : ''}`,
  }));

  let note = '';
  if (!all.length) note = 'Ustaw dzień płatności przy stałych kosztach, a przypomnę o terminach.';
  else if (!shown.length) note = 'W najbliższych 7 dniach nie masz żadnych płatności.';
  if (later) note += ` Później w tym miesiącu: ${later} ${plural(later, 'płatność', 'płatności', 'płatności')}.`;
  $('dueNote').textContent = note.trim();
}

function renderIncome(d) {
  const rows = inMonth(state.extras, thisMonth()).map((x) => ({ key: x.id, name: x.name, amount: x.amount, date: x.date }));
  syncList($('extraList'), rows, (row) => entryRow({
    lead: { color: '#facc15' }, title: row.name, meta: `Dodatkowy dochód · ${shortDate(row.date)}`, amount: zlExact(row.amount),
    actions: [deleteButton(`Usuń dochód: ${row.name}`)],
  }));
  $('extraNote').textContent = d.extra > 0 ? `Razem z wypłatą masz w tym miesiącu ${zl(d.income)}.` : '';
}

function renderCosts() {
  const rows = state.costs.map((c) => ({ key: c.id, name: c.name, amount: c.amount, category: c.category, day: c.day, editing: c.id === costForm.editing }));
  syncList($('costList'), rows, (row) => {
    const cat = catById(row.category);
    const day = inlineInput({ id: `day-${row.key}`, value: row.day || '', placeholder: '–', mode: 'numeric', label: `Dzień płatności: ${row.name}`, className: 'day-edit' });
    return entryRow({
      lead: cat, title: row.name, meta: [`${cat.name} · dzień `, day], amount: zlExact(row.amount),
      actions: [editButton(`Edytuj koszt: ${row.name}`), deleteButton(`Usuń koszt: ${row.name}`)],
      className: row.editing ? 'editing' : '',
    });
  });
  $('costEmpty').hidden = rows.length > 0;
}

function renderHistory(d) {
  const months = [...state.history.slice(-5), { month: thisMonth(), income: d.income, fixed: d.costs, spent: d.spent, live: true }]
    .filter((h) => h.income > 0 || h.fixed > 0 || h.spent > 0)
    .map((h) => ({ key: h.month, ...h }));
  syncList($('historyList'), months, (h) => {
    const left = h.income - h.fixed - h.spent;
    const base = Math.max(h.income, h.fixed + h.spent, 1);
    const row = el('li', 'bar-row');
    const name = [monthLabel(h.month), ...(h.live ? [el('span', 'tag', 'trwa')] : [])];
    const result = el('b', left < 0 ? 'neg' : '', `${left < 0 ? 'brakło' : 'zostało'} ${zl(Math.abs(left))}`);
    row.append(
      barHeading(name, result),
      bar([[h.fixed / base, '#15803d'], [h.spent / base, '#facc15'], [Math.max(0, left) / base, '#bbf7d0']], 'stacked'),
      el('p', 'bar-note', `Dochód ${zl(h.income)} · stałe ${zl(h.fixed)} · wydatki ${zl(h.spent)}`),
    );
    return row;
  });
  if (months.length > 1) $('historyNote').textContent = '';
  else $('historyNote').textContent = months.length
    ? 'To Twój pierwszy miesiąc. Kolejne zapiszą się tu same z początkiem następnego.'
    : 'Dodaj wypłatę i koszty, a zacznę zapisywać historię miesięcy.';
}

let reportedFor = '';

export function render(d, info) {
  if (info.replaced) {
    $('income').value = amountText(state.income);
    $('savings').value = amountText(state.savings);
    $('payday').value = state.payday;
    resetConversation();
  }
  renderSummary(d);
  renderDue();
  renderIncome(d);
  renderCosts();
  renderSubscriptions(d);
  renderDonut(d);
  renderHistory(d);

  // Raport agenta odświeża się tylko wtedy, gdy zmieniło się coś, o czym mówi.
  const basis = JSON.stringify([d, state.costs, state.paid, state.limits, state.goals, state.summaryFor]);
  if (basis !== reportedFor) {
    reportedFor = basis;
    scheduleReport(() => report(compute()));
  }
}
