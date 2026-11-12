/* Zakładka „Zakupy”: lista zakupów z szacowanymi cenami i linki do gazetek sklepów. */
import { STORE_LINKS, STORES } from '../../core/constants.js';
import { shopTotals } from '../../core/compute.js';
import { departmentOf, departmentOrder } from '../../core/departments.js';
import { $, countTo, el, keyOf, need, onAction, syncList } from '../../core/dom.js';
import { amountText, isoToday, parseAmount, plural, priceText, productsText, uid, zl, zlExact } from '../../core/format.js';
import { estimatePrice, HINTS } from '../../core/prices.js';
import { commit, state } from '../../core/store.js';
import { checkButton, chipHtml, deleteButton, selectChip, submitButton } from '../../components/buttons.js';
import { entryForm } from '../../components/entryForm.js';
import { icon } from '../../components/icons.js';
import { card, field, hero, nameField } from '../../components/layout.js';
import { entryRow, inlineInput } from '../../components/row.js';
import { keepAwake } from '../../features/wakeLock.js';

export const template = `
  ${hero({
    titleId: 'shopHeroTitle', title: 'Szacowany koszt zakupów', amountId: 'shopTotal',
    meterId: 'shopMeter', meterLabel: 'Ile z listy jest już w koszyku', noteId: 'shopNote',
    stats: [['Do kupienia', 'shopToBuy'], ['W koszyku', 'shopDone'], ['Zostanie Ci', 'shopAfter', '–']],
  })}

  ${card({
    icon: 'cart', id: 'shopTitle', title: 'Lista zakupów', sub: 'Cenę podpowiem sam – możesz ją zawsze poprawić',
    body: `
    <div class="store-mode-bar">
      <button type="button" class="chip" id="storeModeToggle" aria-pressed="false"></button>
      <p class="note" id="storeModeNote"></p>
    </div>
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
    className: 'store-hide',
    body: `
    <div class="chips" id="storeChips" role="group" aria-label="Sklep">
      ${['', ...STORES].map((store) => chipHtml({ label: store || 'Wszystkie sklepy', value: store })).join('')}
    </div>
    <div class="store-links" id="storeLinks"></div>
    <p class="disclaimer">Strony sklepów otwierają się w nowej karcie.</p>`,
  })}
`;

// Tryb „w sklepie”: sama lista z dużymi polami do odhaczania i ekranem, który nie gaśnie.
let inStore = false;
let screenStaysOn = false;

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
      return { name, price, qty: parseAmount($('shopQty').value) || 1, est: priceIsSuggested && price > 0, done: false, note: '' };
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

  $('storeModeToggle').addEventListener('click', async () => {
    inStore = !inStore;
    screenStaysOn = await keepAwake(inStore);
    commit();
  });

  const find = (id) => state.shop.find((i) => i.id === id);
  const toggle = (id) => { find(id).done = !find(id).done; commit(); };
  // W trybie „w sklepie” produkt odhacza dotknięcie dowolnego miejsca wiersza.
  $('shopList').addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (inStore && row && !e.target.closest('button')) toggle(row.dataset.key);
  });
  onAction($('shopList'), {
    toggle,
    delete(id) { state.shop = state.shop.filter((i) => i.id !== id); commit(); },
  });
  $('shopList').addEventListener('change', (e) => {
    if (!e.target.matches('.inline-input')) return;
    Object.assign(find(keyOf(e.target)), { price: parseAmount(e.target.value), est: false });
    commit();
  });

  $('shopToExpenses').addEventListener('click', () => {
    const { done, boughtCount } = shopTotals();
    if (done > 0) {
      const name = `Zakupy (${productsText(boughtCount)})`;
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

function productRow(row) {
  const lead = checkButton(`Kupione: ${row.name}`, row.done);
  if (row.store) {
    const meta = [`${amountText(row.qty)} szt.`, ...(row.note ? [` · potrzeba: ${row.note}`] : [])];
    return entryRow({ lead, title: row.name, meta, amount: zlExact(row.qty * row.price), className: `big${row.done ? ' done' : ''}` });
  }
  const price = inlineInput({ id: `price-${row.key}`, value: row.price ? priceText(row.price) : '', placeholder: '0', label: `Cena za sztukę: ${row.name}` });
  const meta = [`${amountText(row.qty)} × `, price, ' zł'];
  if (!row.price) meta.push(el('span', 'tag', 'bez ceny'));
  else if (row.est) meta.push(el('span', 'tag', 'szac.'));
  if (row.note) meta.push(el('span', 'row-note', `potrzeba: ${row.note}`));
  return entryRow({
    lead, title: row.name, meta, amount: zlExact(row.qty * row.price),
    actions: [deleteButton(`Usuń z listy: ${row.name}`)],
    className: row.done ? 'done' : '',
  });
}

/**
 * Lista pogrupowana według działów sklepu, w kolejności przejścia przez sklep.
 * W każdym dziale kupione produkty schodzą na dół.
 */
function renderList(totals) {
  const groups = new Map();
  state.shop.forEach((item) => {
    const department = departmentOf(item.name);
    if (!groups.has(department)) groups.set(department, []);
    groups.get(department).push(item);
  });
  const rows = [...groups.keys()].sort((a, b) => departmentOrder(a) - departmentOrder(b)).flatMap((department) => {
    const items = groups.get(department).sort((a, b) => Number(a.done) - Number(b.done));
    const left = items.filter((i) => !i.done).length;
    return [
      { key: `group-${department.id}`, group: department.name, left, count: items.length },
      ...items.map((i) => ({ key: i.id, name: i.name, qty: i.qty, price: i.price, est: i.est, done: i.done, note: i.note || '', store: inStore })),
    ];
  });
  syncList($('shopList'), rows, (row) => {
    if (!row.group) return productRow(row);
    const header = el('li', `row-group${row.left ? '' : ' done'}`);
    header.append(el('span', '', row.group), el('small', '', row.left ? `${row.left} z ${row.count}` : 'kupione'));
    return header;
  });
  $('view-shop').classList.toggle('store-mode', inStore);
  $('storeModeToggle').textContent = inStore ? 'Zakończ zakupy' : 'Tryb w sklepie';
  $('storeModeToggle').setAttribute('aria-pressed', String(inStore));
  $('storeModeToggle').hidden = !state.shop.length && !inStore;
  $('storeModeNote').textContent = inStore
    ? `Kupione ${totals.boughtCount} z ${state.shop.length}. ${screenStaysOn ? 'Ekran nie zgaśnie, dopóki lista jest otwarta.' : 'Ten telefon nie pozwala stronie zablokować wygaszania ekranu.'}`
    : '';
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
