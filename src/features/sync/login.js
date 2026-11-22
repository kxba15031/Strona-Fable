/* Ekran logowania: wspólne konto domu (mail i hasło założone w panelu Supabase). */
import { $ } from '../../core/dom.js';
import { field } from '../../components/layout.js';
import { submitButton } from '../../components/buttons.js';

const template = `
  <section class="card login-card" aria-labelledby="loginTitle">
    <div class="login-brand"><span class="brand-mark" aria-hidden="true"><span></span></span><span class="brand-name">Grosik</span></div>
    <h2 id="loginTitle">Zaloguj się</h2>
    <p class="sub">Wasze wspólne dane są w chmurze. Zaloguj się raz – telefon zapamięta konto.</p>
    <form class="fields" id="loginForm" novalidate>
      ${field({ id: 'loginEmail', label: 'Adres e-mail', type: 'email', mode: '', wide: true, placeholder: 'np. dom@poczta.pl', attrs: 'autocapitalize="off" autocomplete="username" maxlength="120"' })}
      ${field({ id: 'loginPassword', label: 'Hasło', type: 'password', mode: '', wide: true, attrs: 'autocomplete="current-password" maxlength="72"' })}
      ${submitButton('Zaloguj', { iconName: 'check' })}
    </form>
    <p class="note" id="loginNote" aria-live="polite"></p>
  </section>`;

const ERRORS = [
  [/invalid login|credentials/i, 'Zły mail albo hasło.'],
  [/rate limit|too many|seconds/i, 'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.'],
  [/fetch|network/i, 'Brak połączenia z internetem.'],
];
const errorText = (error) => (ERRORS.find(([re]) => re.test(error && error.message)) || [0, 'Nie udało się. Spróbuj ponownie.'])[1];

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
  $('loginPassword').value = '';
}

export function initLogin(getClient) {
  $('login').innerHTML = template;
  const note = (text) => { $('loginNote').textContent = text; };

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('loginEmail').value.trim().toLowerCase();
    const password = $('loginPassword').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note('Wpisz poprawny adres e-mail.'); return; }
    if (!password) { note('Wpisz hasło.'); return; }
    note('Loguję…');
    const client = await getClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    note(error ? errorText(error) : '');
  });
}
