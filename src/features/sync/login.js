/* Ekran logowania: mail, potem link z wiadomości albo 6-cyfrowy kod (wygodny w aplikacji z ekranu głównego). */
import { $ } from '../../core/dom.js';
import { field } from '../../components/layout.js';
import { submitButton } from '../../components/buttons.js';

const template = `
  <section class="card login-card" aria-labelledby="loginTitle">
    <div class="login-brand"><span class="brand-mark" aria-hidden="true"><span></span></span><span class="brand-name">Grosik</span></div>
    <h2 id="loginTitle">Zaloguj się</h2>
    <p class="sub" id="loginSub">Wasze wspólne dane są w chmurze. Podaj mail, a wyślemy Ci link do logowania.</p>
    <form class="fields" id="loginEmailForm" novalidate>
      ${field({ id: 'loginEmail', label: 'Adres e-mail', type: 'email', mode: '', wide: true, placeholder: 'np. ania@poczta.pl', attrs: 'autocapitalize="off" maxlength="120"' })}
      ${submitButton('Wyślij link', { iconName: 'check' })}
    </form>
    <form class="fields" id="loginCodeForm" novalidate hidden>
      ${field({ id: 'loginCode', label: 'Kod z maila', mode: 'numeric', wide: true, placeholder: '123456', attrs: 'maxlength="10" autocomplete="one-time-code"' })}
      ${submitButton('Zaloguj', { iconName: 'check' })}
      <button type="button" class="link" id="loginBack">Zmień adres e-mail</button>
    </form>
    <p class="note" id="loginNote" aria-live="polite"></p>
  </section>`;

const ERRORS = [
  [/rate limit|too many|seconds/i, 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'],
  [/expired|invalid/i, 'Kod jest nieprawidłowy albo wygasł. Wyślij nowy link.'],
  [/fetch|network/i, 'Brak połączenia z internetem.'],
];
const errorText = (error) => (ERRORS.find(([re]) => re.test(error && error.message)) || [0, 'Nie udało się. Spróbuj ponownie.'])[1];

/** Link z maila ma prowadzić z powrotem na tę samą stronę (bez #tokenów). */
const redirectUrl = () => window.location.href.split('#')[0];

let email = '';

function step(codeStep) {
  $('loginEmailForm').hidden = codeStep;
  $('loginCodeForm').hidden = !codeStep;
  $('loginSub').textContent = codeStep
    ? `Wysłaliśmy wiadomość na ${email}. Kliknij link w mailu albo wpisz kod tutaj.`
    : 'Wasze wspólne dane są w chmurze. Podaj mail, a wyślemy Ci link do logowania.';
}

/** Pokazuje ekran logowania i ukrywa aplikację; `message` wyjaśnia powód (np. brak dostępu). */
export function showLogin(message) {
  document.body.classList.add('locked');
  $('login').hidden = false;
  if (message) $('loginNote').textContent = message;
}

export function hideLogin() {
  document.body.classList.remove('locked');
  $('login').hidden = true;
  $('loginNote').textContent = '';
  step(false);
}

export function initLogin(getClient) {
  $('login').innerHTML = template;
  const note = (text) => { $('loginNote').textContent = text; };

  $('loginEmailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    email = $('loginEmail').value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note('Wpisz poprawny adres e-mail.'); return; }
    note('Wysyłam…');
    const client = await getClient();
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl() } });
    if (error) { note(errorText(error)); return; }
    note('');
    step(true);
    $('loginCode').focus();
  });

  $('loginCodeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = $('loginCode').value.replace(/\D/g, '');
    if (token.length < 6) { note('Kod ma co najmniej 6 cyfr.'); return; }
    note('Sprawdzam kod…');
    const client = await getClient();
    const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
    note(error ? errorText(error) : '');
  });

  $('loginBack').addEventListener('click', () => { note(''); step(false); });
}
