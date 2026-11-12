/* Kalkulator inwestycji: ile urośnie kwota odkładana co miesiąc przy stałej stopie zwrotu. */
import { $, countTo, onAction } from '../../core/dom.js';
import { parseAmount, plural, zl } from '../../core/format.js';
import { chipHtml, selectChip } from '../../components/buttons.js';
import { card, field } from '../../components/layout.js';

const RATES = [[3, 'ostrożnie'], [5, 'umiarkowanie'], [7, 'odważnie']];
let rate = 5;

export const calculatorCard = card({
  icon: 'trend', tone: 'yellow', id: 'calcTitle', title: 'Kalkulator inwestycji', sub: 'Ile urośnie kwota odkładana co miesiąc',
  body: `
  <div class="fields">
    ${field({ id: 'calcMonthly', label: 'Co miesiąc', unit: 'zł', value: '300' })}
    ${field({ id: 'calcYears', label: 'Przez', unit: 'lat', mode: 'numeric', value: '10' })}
    <div class="field field-wide">
      <span>Średni roczny zysk</span>
      <div class="chips wrap" id="calcRates" role="group" aria-label="Średni roczny zysk">
        ${RATES.map(([value, name]) => chipHtml({ label: `${value}% ${name}`, value, active: value === rate })).join('')}
      </div>
    </div>
  </div>
  <div class="calc-result" aria-live="polite">
    <span class="calc-label" id="calcLabel"></span>
    <span class="calc-total" id="calcTotal">0 zł</span>
    <div class="bar stacked"><i id="calcBarPaid" style="background:#15803d"></i><i id="calcBarGain" style="background:#facc15"></i></div>
    <p class="key"><span><i style="background:#15803d"></i>wpłacisz <b id="calcPaid"></b></span><span><i style="background:#facc15"></i>zysk <b id="calcGain"></b></span></p>
  </div>
  <p class="disclaimer">To uproszczona symulacja ze stałą stopą zwrotu, bez podatku i inflacji. Rzeczywiste wyniki inwestycji są zmienne i mogą być ujemne.</p>`,
});

function update() {
  const monthly = parseAmount($('calcMonthly').value);
  const years = Math.min(60, Math.round(parseAmount($('calcYears').value)));
  const months = years * 12;
  const monthlyRate = rate / 100 / 12;
  const paid = monthly * months;
  const total = monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  $('calcLabel').textContent = `Po ${years} ${plural(years, 'roku', 'latach', 'latach')} możesz mieć około`;
  countTo($('calcTotal'), total, zl);
  $('calcPaid').textContent = zl(paid);
  $('calcGain').textContent = zl(total - paid);
  $('calcBarPaid').style.width = `${total > 0 ? (paid / total) * 100 : 0}%`;
  $('calcBarGain').style.width = `${total > 0 ? ((total - paid) / total) * 100 : 0}%`;
}

export function initCalculator() {
  $('calcMonthly').addEventListener('input', update);
  $('calcYears').addEventListener('input', update);
  onAction($('calcRates'), {
    pick(_, button) {
      rate = Number(button.dataset.value);
      selectChip($('calcRates'), rate);
      update();
    },
  });
  update();
}
