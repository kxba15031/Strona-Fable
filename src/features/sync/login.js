/*
 * Ekran logowania: mail, potem kliknięcie linku z wiadomości. W aplikacji z ekranu głównego
 * (iPhone otwiera link w Safari) można wkleić skopiowany link albo wpisać kod z maila.
 */
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
      ${field({ id: 'loginCode', label: 'Skopiowany link albo kod z maila', mode: '', wide: true, placeholder: 'https://… albo 123456', attrs: 'autocapitalize="off" autocomplete="one-time-code"' })}
      ${submitButton('Zaloguj', { iconName: 'check' })}
      <button type="button" class="link" id="loginBack">Zmień adres e-mail</button>
    </form>
    <p class="note" id="loginNote" aria-live="polite"></p>
  </section>`;

const ERRORS = [
  [/rate limit|too many|seconds/i, 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'],
  [/expired|invalid/i, 'Link albo kod jest nieprawidłowy lub wygasł. Wyślij nowy link.'],
  [/fetch|network/i, 'Brak połączenia z internetem.'],
];
const errorText = (error) => (ERRORS.find(([re]) => re.test(error && error.message)) || [0, 'Nie udało się. Spróbuj ponownie.'])[1];

/** Link z maila ma prowadzić z powrotem na tę samą stronę (bez #tokenów). */
const redirectUrl = () => window.location.href.split('#')[0];

/** Dane do weryfikacji z wklejonego linku (parametr `token`) albo z samego kodu cyfrowego. */
function otpParams(input) {
  const value = input.trim();
  const match = value.match(/[?&]token=([^&#\s]+)/);
  if (match) {
    const type = (value.match(/[?&]type=([a-z_]+)/) || [])[1] || 'email';
    return { token_hash: decodeURIComponent(match[1]), type };
  }
  const token = value.replace(/\D/g, '');
  return token.length >= 6 ? { email, token, type: 'email' } : null;
}

let email = '';

function step(codeStep) {
  $('loginEmailForm').hidden = codeStep;
  $('loginCodeForm').hidden = !codeStep;
  $('loginSub').textContent = codeStep
    ? `Wysłaliśmy wiadomość na ${email}. Kliknij link w mailu. Jeśli używasz aplikacji z ekranu głównego, przytrzymaj link w mailu, skopiuj go i wklej tutaj.`
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
    const params = otpParams($('loginCode').value);
    if (!params) { note('Wklej cały link z maila (zaczyna się od https://).'); return; }
    note('Sprawdzam…');
    const client = await getClient();
    const { error } = await client.auth.verifyOtp(params);
    note(error ? errorText(error) : '');
  });

  $('loginBack').addEventListener('click', () => { note(''); step(false); });
}
