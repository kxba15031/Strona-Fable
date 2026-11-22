/* Powtarzalne fragmenty szablonów stron: karta, pole formularza, zielona karta podsumowania. */
import { icon } from './icons.js';

/** Karta z nagłówkiem (ikona, tytuł, podtytuł) i dowolną treścią. */
export const card = ({ icon: iconName, tone = 'green', id, title, sub, body, className = '' }) => `
  <section class="card reveal ${className}" aria-labelledby="${id}">
    <div class="card-head">
      <span class="icon icon-${tone}" aria-hidden="true">${icon(iconName)}</span>
      <div>
        <h2 id="${id}">${title}</h2>
        <p class="sub">${sub}</p>
      </div>
    </div>
    ${body}
  </section>`;

/** Pole tekstowe z etykietą i opcjonalną jednostką (np. „zł”). */
export const field = ({ id, label, unit = '', wide = false, type = 'text', mode = 'decimal', placeholder = '', value = '', attrs = '' }) => `
  <label class="field${wide ? ' field-wide' : ''}">
    <span>${label}</span>
    <div class="input-wrap">
      <input id="${id}" type="${type}"${type === 'text' && mode ? ` inputmode="${mode}"` : ''} placeholder="${placeholder}" value="${value}" autocomplete="off" ${attrs}>
      ${unit ? `<em>${unit}</em>` : ''}
    </div>
  </label>`;

/** Pole z nazwą (zwykła klawiatura, limit długości). */
export const nameField = (options) => field({ mode: '', wide: true, attrs: 'maxlength="40"', ...options });

/** Wielowierszowe pole tekstowe na całą szerokość formularza. */
export const textArea = ({ id, label, placeholder = '', rows = 3 }) => `
  <label class="field field-wide">
    <span>${label}</span>
    <div class="input-wrap"><textarea id="${id}" rows="${rows}" placeholder="${placeholder}"></textarea></div>
  </label>`;

/** Pole wyboru tak/nie. */
export const checkField = ({ id, label }) => `
  <label class="check-field"><input id="${id}" type="checkbox"><span>${label}</span></label>`;

/** Pole wyszukiwania z lupą. */
export const searchField = ({ id, placeholder, label }) => `
  <div class="input-wrap search">
    ${icon('search')}
    <input id="${id}" type="search" placeholder="${placeholder}" aria-label="${label}" autocomplete="off" maxlength="40">
  </div>`;

export const selectField = ({ id, label }) => `
  <label class="field">
    <span>${label}</span>
    <div class="input-wrap"><select id="${id}"></select></div>
  </label>`;

/** Zielona karta podsumowania: duża kwota, pasek postępu i kafelki ze statystykami. */
export const hero = ({ titleId, title, amountId, meterId, meterLabel, noteId, note = '', extra = '', stats }) => `
  <section class="hero reveal" aria-labelledby="${titleId}">
    <div class="hero-shine" aria-hidden="true"></div>
    <p class="hero-label" id="${titleId}">${title}</p>
    <p class="hero-amount" id="${amountId}">0,00 zł</p>
    <div class="meter" role="img" aria-label="${meterLabel}"><div class="meter-fill" id="${meterId}"></div></div>
    <p class="meter-note" id="${noteId}">${note}</p>
    ${extra}
    <div class="hero-stats${stats.length === 4 ? ' four' : ''}">
      ${stats.map(([label, id, initial = '0 zł']) => `
      <div class="stat">
        <span class="stat-label">${label}</span>
        <span class="stat-value" id="${id}">${initial}</span>
      </div>`).join('')}
    </div>
  </section>`;
