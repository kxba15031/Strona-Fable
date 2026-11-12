/* Wykresy wydatków: słupki kategorii (jedna barwa, wartości przy słupkach) i kolumny dzień po dniu. */
import { EXP_CATS, GOAL_CAT } from '../../core/constants.js';
import { $, el, syncList } from '../../core/dom.js';
import { daysInMonth, inMonth, plural, thisMonth, zl, zlExact } from '../../core/format.js';
import { state } from '../../core/store.js';
import { bar, barHeading } from '../../components/row.js';

let perDay = [];
let pickedDay = 0;

function describeDay(day) {
  const { total, count } = perDay[day - 1];
  const date = `${day}.${thisMonth().slice(5)}`;
  return count ? `${date}: ${zlExact(total)} (${count} ${plural(count, 'wydatek', 'wydatki', 'wydatków')})` : `${date}: bez wydatków`;
}

function pickDay(day) {
  pickedDay = day;
  $('dayCols').querySelectorAll('.day').forEach((col) => col.classList.toggle('active', Number(col.dataset.key) === day));
  $('dayInfo').textContent = describeDay(day);
}

export function initCharts() {
  const pick = (e) => {
    const col = e.target.closest('.day');
    if (col && !col.disabled) pickDay(Number(col.dataset.key));
  };
  ['pointerover', 'click', 'focusin'].forEach((type) => $('dayCols').addEventListener(type, pick));
}

export function renderCharts(d) {
  const items = inMonth(state.expenses, thisMonth());
  $('spendChartEmpty').hidden = items.length > 0;
  $('spendCharts').hidden = !items.length;
  if (!items.length) return;

  const cats = [...EXP_CATS, GOAL_CAT]
    .map((cat) => ({ key: cat.id, name: cat.name, total: d.spentByCat[cat.id] || 0 }))
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((cat, _, all) => ({ ...cat, width: cat.total / all[0].total, share: Math.round((cat.total / d.spent) * 100) }));
  syncList($('catBars'), cats, (cat) => {
    const value = el('b', '', zl(cat.total));
    value.append(el('small', '', `${cat.share}%`));
    const row = el('li', 'bar-row');
    row.append(barHeading(cat.name, value), bar([[cat.width, 'var(--chart-bar)']], 'square'));
    return row;
  });

  const today = new Date().getDate();
  perDay = Array.from({ length: daysInMonth() }, () => ({ total: 0, count: 0 }));
  items.forEach((x) => {
    const day = perDay[Number(x.date.slice(8)) - 1];
    day.total += x.amount;
    day.count += 1;
  });
  const max = Math.max(...perDay.map((day) => day.total));
  $('dayMax').textContent = `${zl(max)} – najwyższy dzień`;
  const cols = perDay.map((day, i) => ({ key: i + 1, height: day.total / max, future: i + 1 > today }));
  syncList($('dayCols'), cols, (col) => {
    const node = el('button', 'day');
    node.type = 'button';
    node.disabled = col.future;
    node.setAttribute('aria-label', col.future ? `${col.key}.${thisMonth().slice(5)}` : describeDay(col.key));
    const column = el('i');
    column.style.height = col.height > 0 ? `${Math.max(3, col.height * 100)}%` : '0';
    node.appendChild(column);
    return node;
  });
  const ticks = [1, 5, 10, 15, 20, 25, perDay.length];
  $('dayAxis').replaceChildren(...perDay.map((_, i) => el('span', '', ticks.includes(i + 1) ? String(i + 1) : '')));
  pickDay(pickedDay && pickedDay <= today ? pickedDay : today);
}
