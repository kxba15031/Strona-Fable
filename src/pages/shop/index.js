/* Zakładka „Zakupy”: lista zakupów z szacowanymi cenami i linki do gazetek sklepów. */
import { STORE_LINKS, STORES } from '../../core/constants.js';
import { shopTotals } from '../../core/compute.js';
import { $, countTo, el, need, onAction, syncList } from '../../core/dom.js';
import { amountText, isoToday, parseAmount, plural, priceText, uid, zl, zlExact } from '../../core/format.js';
import { estimatePrice, HINTS } from '../../core/prices.js';
import { commit, state } from '../../core/store.js';
import { checkButton, chipHtml, deleteButton, selectChip, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { icon } from '../../components/icons.js';
import { card, field, hero, nameField } from '../../components/layout.js';
import { entryRow, inlineInput } from '../../components/row.js';

export const template = `
  ${hero({
    titleId: 'shopHeroTitle', title: 'Szacowany koszt zakupów', amountId: 'shopTotal',
    meterId: 'shopMeter', meterLabel: 'Ile z listy jest już w koszyku', noteId: 'shopNote',
    stats: [['Do kupienia', 'shopToBuy'], ['W koszyku', 'shopDone'], ['Zostanie Ci', 'shopAfter', '–']],
  })}

  ${card({
    icon: 'cart', id: 'shopTitle', title: 'Lista zakupów', sub: 'Cenę podpowiem sam – możesz ją zawsze poprawić',
    body: `
    <form class="fields" id="shopForm" novalidate>
      ${nameField({ id: 'shopName', label: 'Produkt', placeholder: 'np. Mleko', attrs: 'maxlength="40" list="shopHints"' })}
      <datalist id="shopHints">${HINTS.map((hint) => `<option value="${hint}"></option>`).join('')}</datalist>
      ${field({ id: 'shopQty', label: 'Ilość', unit: 'szt.', value: '1' })}
      ${field({ id: 'shopPrice', label: 'Cena za sztukę', unit: 'zł', placeholder: '0' })}
      <p class="hint" id="shopHint" aria-live="polite"></p>
      ${submitButton('Dodaj do listy')}
    </form>
    <ul class="rows" id="shopList"></ul>
    <p class="empty" id="shopEmpty">Lista jest pusta. Dodaj produkty powyżej.</p>
    <div class="list-actions" id="shopActions" hidden>
      <button type="button" class="btn" id="shopToExpenses">${icon('check')}<span></span></button>
      <button type="button" class="link" id="shopClearDone">Usuń kupione bez dopisywania</button>
    </div>`,
  })}

  ${card({
    icon: 'tag', tone: 'yellow', id: 'promoTitle', title: 'Promocje w sklepach', sub: 'Strony sklepów, na których zawsze są bieżące gazetki',
    body: `
    <div class="chips" id="storeChips" role="group" aria-label="Sklep">
      ${['', ...STORES].map((store) => chipHtml({ label: store || 'Wszystkie sklepy', value: store })).join('')}
    </div>
    <div class="store-links" id="storeLinks"></div>
    <p class="disclaimer">Strony sklepów otwierają się w nowej karcie.</p>`,
  })}
`;

// Cena podpowiada się sama, dopóki użytkownik nie wpisze własnej.
let priceIsSuggested = true;

function suggestPrice() {
  const name = $('shopName').value.trim();
  const estimate = estimatePrice(name);
  const hint = $('shopHint');
  if (priceIsSuggested) $('shopPrice').value = estimate ? priceText(estimate) : '';
  hint.classList.toggle('ok', estimate > 0);
  hint.classList.toggle('unknown', Boolean(name) && !estimate);
  if (!name) hint.textContent = 'Wpisz produkt, a podpowiem szacowaną cenę.';
  else if (estimate) hint.textContent = `Szacowana cena: ok. ${priceText(estimate)} zł za sztukę. Możesz ją zmienić.`;
  else hint.textContent = 'Nie znam ceny tego produktu – wpisz ją samodzielnie.';
}

const removeBought = () => { state.shop = state.shop.filter((i) => !i.done); };

export function init() {
  ['input', 'change', 'blur'].forEach((type) => $('shopName').addEventListener(type, suggestPrice));
  $('shopPrice').addEventListener('input', (e) => { priceIsSuggested = e.target.value.trim() === ''; });
  suggestPrice();

  entryForm({
    form: $('shopForm'),
    read() {
      const name = need('shopName');
      if (!name) return null;
      suggestPrice();
      const price = parseAmount($('shopPrice').value);
      return { name, price, qty: parseAmount($('shopQty').value) || 1, est: priceIsSuggested && price > 0, done: false };
    },
    save: (data) => state.shop.unshift({ id: uid(), ...data }),
    clear() {
      $('shopName').value = '';
      $('shopQty').value = '1';
      $('shopPrice').value = '';
      priceIsSuggested = true;
      suggestPrice();
    },
    done: commit,
  });

  const find = (id) => state.shop.find((i) => i.id === id);
  onAction($('shopList'), {
    toggle(id) { find(id).done = !find(id).done; commit(); },
    delete(id) { state.shop = state.shop.filter((i) => i.id !== id); commit(); },
  });
  $('shopList').addEventListener('change', (e) => {
    if (!e.target.matches('.inline-input')) return;
    Object.assign(find(e.target.closest('[data-key]').dataset.key), { price: parseAmount(e.target.value), est: false });
    commit();
  });

  $('shopToExpenses').addEventListener('click', () => {
    const { done, boughtCount } = shopTotals();
    if (done > 0) {
      const name = `Zakupy (${boughtCount} ${plural(boughtCount, 'produkt', 'produkty', 'produktów')})`;
      state.expenses.unshift({ id: uid(), goalId: '', name, amount: Math.round(done * 100) / 100, cat: 'food', date: isoToday() });
    }
    removeBought();
    commit();
  });
  $('shopClearDone').addEventListener('click', () => { removeBought(); commit(); });

  onAction($('storeChips'), {
    pick(_, button) { state.store = button.dataset.value; commit(); },
  });
}

function renderSummary(d, totals) {
  const after = d.left - totals.total;
  countTo($('shopTotal'), totals.total, zlExact);
  countTo($('shopToBuy'), totals.toBuy, zl);
  countTo($('shopDone'), totals.done, zl);
  $('shopAfter').textContent = d.income > 0 ? zl(after) : '–';
  $('shopMeter').style.width = `${totals.total > 0 ? (totals.done / totals.total) * 100 : 0}%`;
  $('shopTotal').closest('.hero').classList.toggle('negative', d.income > 0 && after < 0 && totals.total > 0);

  const count = state.shop.length;
  let note = 'Dodaj pierwszy produkt do listy';
  if (count && d.income > 0 && d.left > 0) note = `Zakupy to ${Math.round((totals.total / d.left) * 100)}% kwoty, która zostaje Ci w tym miesiącu`;
  else if (count) note = `${count} ${plural(count, 'pozycja', 'pozycje', 'pozycji')} na liście`;
  if (totals.noPrice) note += ` · ${totals.noPrice} bez ceny`;
  $('shopNote').textContent = note;
}

function renderList(totals) {
  const rows = [...state.shop]
    .sort((a, b) => Number(a.done) - Number(b.done))
    .map((i) => ({ key: i.id, name: i.name, qty: i.qty, price: i.price, est: i.est, done: i.done }));
  syncList($('shopList'), rows, (row) => {
    const price = inlineInput({ id: `price-${row.key}`, value: row.price ? priceText(row.price) : '', placeholder: '0', label: `Cena za sztukę: ${row.name}` });
    const meta = [`${amountText(row.qty)} × `, price, ' zł'];
    if (!row.price) meta.push(el('span', 'tag', 'bez ceny'));
    else if (row.est) meta.push(el('span', 'tag', 'szac.'));
    return entryRow({
      lead: checkButton(`Kupione: ${row.name}`, row.done),
      title: row.name, meta, amount: zlExact(row.qty * row.price),
      actions: [deleteButton(`Usuń z listy: ${row.name}`)],
      className: row.done ? 'done' : '',
    });
  });
  $('shopEmpty').hidden = rows.length > 0;
  $('shopActions').hidden = !totals.boughtCount;
  $('shopToExpenses').querySelector('span').textContent = `Dopisz kupione do wydatków (${zl(totals.done)})`;
}

function renderStores() {
  selectChip($('storeChips'), state.store);
  const stores = (state.store ? [state.store] : STORES).map((store) => ({ key: store, single: Boolean(state.store) }));
  syncList($('storeLinks'), stores, (store) => {
    const link = el('a', `store-link${store.single ? ' main' : ''}`);
    Object.assign(link, { href: STORE_LINKS[store.key], target: '_blank', rel: 'noopener noreferrer' });
    link.append(el('span', '', `Gazetki ${store.key}`), el('small', '', 'otwórz ↗'));
    return link;
  });
}

export function render(d) {
  const totals = shopTotals();
  renderSummary(d, totals);
  renderList(totals);
  renderStores();
}
