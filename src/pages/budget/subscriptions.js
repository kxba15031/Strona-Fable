/* Karta „Subskrypcje”: stałe koszty z kategorii Subskrypcje, ich roczny koszt i najbliższe odnowienia. */
import { catById } from '../../core/constants.js';
import { nextPayment } from '../../core/compute.js';
import { $, syncList } from '../../core/dom.js';
import { daysText, sum, zl } from '../../core/format.js';
import { state } from '../../core/store.js';
import { card } from '../../components/layout.js';
import { entryRow } from '../../components/row.js';

const CATEGORY = catById('subs');

export const subscriptionsCard = card({
  icon: 'repeat', tone: 'yellow', id: 'subsTitle', title: 'Subskrypcje', sub: 'Ile kosztują rocznie i kiedy się odnawiają',
  body: `
  <p class="subs-total" id="subsTotal" hidden><b id="subsYear"></b> rocznie <span id="subsMonth"></span></p>
  <ul class="rows flush" id="subsList"></ul>
  <p class="note" id="subsNote"></p>`,
});

function renewalText(payment) {
  if (!payment) return 'ustaw dzień płatności, żeby zobaczyć datę odnowienia';
  const date = `${payment.date.getDate()}.${String(payment.date.getMonth() + 1).padStart(2, '0')}`;
  return `odnowienie ${date} · ${payment.inDays === 0 ? 'dziś' : `za ${daysText(payment.inDays)}`}`;
}

export function renderSubscriptions(d) {
  const subs = state.costs.filter((cost) => cost.category === CATEGORY.id);
  const monthly = sum(subs);
  // Najbliższe odnowienia na górze; pozycje bez dnia płatności na końcu.
  const rows = subs
    .map((cost) => ({ key: cost.id, name: cost.name, amount: cost.amount, payment: nextPayment(cost) }))
    .sort((a, b) => (a.payment ? a.payment.inDays : Infinity) - (b.payment ? b.payment.inDays : Infinity))
    .map(({ payment, ...row }) => ({ ...row, renewal: renewalText(payment) }));
  syncList($('subsList'), rows, (row) => entryRow({
    lead: CATEGORY, title: row.name, meta: `${zl(row.amount)} miesięcznie · ${row.renewal}`, amount: `${zl(row.amount * 12)} / rok`,
  }));

  $('subsTotal').hidden = !subs.length;
  $('subsYear').textContent = zl(monthly * 12);
  $('subsMonth').textContent = `· ${zl(monthly)} miesięcznie`;
  if (!subs.length) $('subsNote').textContent = 'Dodaj stały koszt w kategorii „Subskrypcje”, a pokażę tu jego roczny koszt i datę odnowienia.';
  else $('subsNote').textContent = d.income > 0 ? `To ${(monthly / d.income * 100).toFixed(1).replace('.', ',')}% Twojego miesięcznego dochodu. Zmiany wprowadzisz w „Stałych kosztach”.` : 'Zmiany wprowadzisz w „Stałych kosztach”.';
}
