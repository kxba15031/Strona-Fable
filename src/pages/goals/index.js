/* Zakładka „Cele”: cele oszczędnościowe z wpłatami oraz kalkulator inwestycji. */
import { goalNeed } from '../../core/compute.js';
import { $, el, flagInvalid, need, onAction, syncList } from '../../core/dom.js';
import { amountText, isIsoMonth, isoToday, monthLabel, parseAmount, plural, thisMonth, uid, zl } from '../../core/format.js';
import { commit, state } from '../../core/store.js';
import { deleteButton, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { card, field, nameField } from '../../components/layout.js';
import { bar } from '../../components/row.js';
import { calculatorCard, initCalculator } from './calculator.js';

export const template = `
  ${card({
    icon: 'target', tone: 'yellow', id: 'goalTitle', title: 'Nowy cel', sub: 'Na co odkładasz i do kiedy chcesz zebrać całą kwotę',
    body: `
    <form class="fields" id="goalForm" novalidate>
      ${nameField({ id: 'goalName', label: 'Nazwa celu', placeholder: 'np. Wakacje' })}
      ${field({ id: 'goalTarget', label: 'Kwota celu', unit: 'zł', placeholder: 'np. 5000' })}
      ${field({ id: 'goalSaved', label: 'Już odłożone', unit: 'zł', placeholder: '0' })}
      ${field({ id: 'goalDeadline', label: 'Termin (opcjonalnie)', type: 'month', wide: true })}
      ${submitButton('Dodaj cel')}
    </form>`,
  })}

  ${card({
    icon: 'flag', id: 'goalsTitle', title: 'Twoje cele', sub: 'Każda wpłata zapisuje się też w wydatkach miesiąca',
    body: '<ul class="stack" id="goalList"></ul><p class="empty" id="goalEmpty">Nie masz jeszcze żadnego celu.</p>',
  })}

  ${calculatorCard}
`;

export function init() {
  entryForm({
    form: $('goalForm'),
    read() {
      const name = need('goalName');
      const target = name && need('goalTarget', parseAmount);
      if (!target) return null;
      const deadline = $('goalDeadline').value;
      return {
        name, target,
        saved: Math.min(target, parseAmount($('goalSaved').value)),
        deadline: isIsoMonth(deadline) && deadline >= thisMonth() ? deadline : '',
      };
    },
    save: (data) => state.goals.push({ id: uid(), ...data }),
    clear() { ['goalName', 'goalTarget', 'goalSaved', 'goalDeadline'].forEach((id) => { $(id).value = ''; }); },
    done: commit,
  });

  onAction($('goalList'), {
    delete(id) { state.goals = state.goals.filter((g) => g.id !== id); commit(); },
  });

  // Wpłata na cel: zwiększa odłożoną kwotę i zapisuje się jako wydatek miesiąca.
  $('goalList').addEventListener('submit', (e) => {
    e.preventDefault();
    const goal = state.goals.find((g) => g.id === e.target.closest('[data-key]').dataset.key);
    const input = e.target.querySelector('input');
    const amount = Math.min(parseAmount(input.value), goal.target - goal.saved);
    if (!amount) { flagInvalid(input); return; }
    goal.saved += amount;
    state.expenses.unshift({ id: uid(), name: `Cel: ${goal.name}`, amount, cat: 'goal', goalId: goal.id, date: isoToday() });
    commit();
  });

  initCalculator();
}

function goalCard(goal) {
  const plan = goalNeed(goal);
  const reached = plan.missing === 0;
  const done = goal.saved / goal.target;
  const item = el('li', `goal${reached ? ' reached' : ''}`);
  const top = el('div', 'goal-top');
  top.append(el('h3', 'goal-name', goal.name), el('span', 'goal-pct', `${Math.round(done * 100)}%`), deleteButton(`Usuń cel: ${goal.name}`));

  let info = `Brakuje ${zl(plan.missing)}. Dodaj termin, a policzę miesięczną kwotę.`;
  if (reached) info = 'Cel osiągnięty. Gratulacje!';
  else if (goal.deadline) info = `Do końca: ${monthLabel(goal.deadline)}. Odkładaj ${zl(plan.perMonth)} miesięcznie (${plan.months} ${plural(plan.months, 'miesiąc', 'miesiące', 'miesięcy')}).`;

  item.append(
    top,
    bar([[done, 'linear-gradient(90deg, #22c55e, #facc15)']], 'tall'),
    el('p', 'goal-nums', `${zl(goal.saved)} z ${zl(goal.target)}`),
    el('p', 'goal-info', info),
  );
  if (!reached) {
    const form = el('form', 'goal-pay');
    form.noValidate = true;
    form.innerHTML = `
      <div class="input-wrap">
        <input type="text" inputmode="decimal" id="pay-${goal.key}" placeholder="${plan.perMonth ? amountText(Math.ceil(plan.perMonth)) : 'kwota'}" autocomplete="off">
        <em>zł</em>
      </div>
      ${submitButton('Wpłać', { small: true })}`;
    form.querySelector('input').setAttribute('aria-label', `Kwota wpłaty na cel: ${goal.name}`);
    item.append(form);
  }
  return item;
}

export function render() {
  // Miesiąc jest częścią danych wiersza, żeby wyliczenia odświeżyły się po zmianie miesiąca.
  const goals = state.goals.map((g) => ({ key: g.id, name: g.name, target: g.target, saved: g.saved, deadline: g.deadline, month: thisMonth() }));
  syncList($('goalList'), goals, goalCard);
  $('goalEmpty').hidden = goals.length > 0;
}
