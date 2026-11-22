/*
 * Wspólne dane w chmurze: jeden wiersz `shared_state` w Supabase dla całego domu.
 * Pamięć przeglądarki zostaje kopią roboczą – aplikacja działa też bez internetu,
 * a niewysłane zmiany wysyła po odzyskaniu połączenia. Przy jednoczesnej edycji
 * wygrywa zapis wysłany później.
 */
import { STORAGE_KEY } from '../../core/constants.js';
import { $, storage } from '../../core/dom.js';
import { commit, onChange, replaceState, state } from '../../core/store.js';
import { getClient, hasSavedSession, syncAvailable } from './client.js';
import { hideLogin, initLogin, showLogin } from './login.js';

const TABLE = 'shared_state';
const ROW = 'home';
const DIRTY_KEY = `${STORAGE_KEY}-dirty`;
const PUSH_DELAY = 800;
const RETRY_DELAY = 10000;

let client = null;
let channel = null;
let pushTimer = 0;
let pushing = false;
let signedIn = false;

const isDirty = () => storage.get(DIRTY_KEY, '') === '1';
const setDirty = (on) => storage.set(DIRTY_KEY, on ? '1' : '');
const time = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

const status = (text) => { $('syncNote').textContent = text; };

/** Błąd uprawnień bazy = ten mail nie jest na liście domowników (tabela `members`). */
const isDenied = (error) => error && (error.code === '42501' || /row-level security|permission denied/i.test(error.message));

async function lockOut(message) {
  stopRealtime();
  await client.auth.signOut().catch(() => {});
  showLogin(message);
}

/** Podmienia lokalny stan na dane z chmury (bez odsyłania ich z powrotem). */
function applyRemote(data) {
  if (!data || typeof data !== 'object' || JSON.stringify(data) === JSON.stringify(state)) return;
  replaceState(data);
  commit({ replaced: true, remote: true });
}

async function pull() {
  const { data, error } = await client.from(TABLE).select('data').eq('id', ROW).maybeSingle();
  if (error) throw error;
  return data;
}

async function push() {
  if (pushing || !isDirty()) return;
  pushing = true;
  const sent = JSON.stringify(state);
  try {
    const { error } = await client.from(TABLE).upsert({ id: ROW, data: state, updated_at: new Date().toISOString() });
    if (error) throw error;
    if (JSON.stringify(state) === sent) setDirty(false);
    status(`Zsynchronizowano o ${time()}.`);
  } finally {
    pushing = false;
  }
  if (isDirty()) schedulePush(0);
}

function schedulePush(delay = PUSH_DELAY) {
  clearTimeout(pushTimer);
  if (!navigator.onLine) { status('Brak internetu – zmiany wyślę po połączeniu.'); return; }
  status('Zapisuję…');
  pushTimer = setTimeout(() => {
    push().catch((error) => {
      if (isDenied(error)) { lockOut('Ten adres nie ma dostępu do wspólnych danych.'); return; }
      status('Nie udało się zapisać – ponawiam za chwilę.');
      schedulePush(RETRY_DELAY);
    });
  }, delay);
}

/** Uzgadnia dane po zalogowaniu i po powrocie do aplikacji: niewysłane zmiany wygrywają. */
async function reconcile() {
  if (!signedIn) return;
  if (!navigator.onLine) { if (isDirty()) schedulePush(); return; }
  try {
    const remote = await pull();
    if (!remote || isDirty()) { setDirty(true); schedulePush(0); return; }
    applyRemote(remote.data);
    status(`Zsynchronizowano o ${time()}.`);
  } catch (error) {
    if (isDenied(error)) { lockOut('Ten adres nie ma dostępu do wspólnych danych.'); return; }
    status('Brak połączenia z chmurą – pracujesz na kopii z telefonu.');
  }
}

function startRealtime() {
  stopRealtime();
  channel = client.channel('grosik-home')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${ROW}` }, (payload) => {
      if (payload.new && !isDirty()) {
        applyRemote(payload.new.data);
        status(`Zsynchronizowano o ${time()}.`);
      }
    })
    .subscribe();
}

function stopRealtime() {
  if (channel && client) client.removeChannel(channel);
  channel = null;
}

function showAccount(session) {
  $('accountEmail').textContent = session.user.email;
  $('accountBox').hidden = false;
}

async function signOut() {
  if (isDirty()) { status('Masz niewysłane zmiany – połącz się z internetem przed wylogowaniem.'); return; }
  stopRealtime();
  await client.auth.signOut().catch(() => {});
  storage.set(DIRTY_KEY, '');
  replaceState(null);
  commit({ replaced: true, remote: true });
  $('accountBox').hidden = true;
  status('');
  showLogin('Wylogowano.');
}

function onSession(session) {
  if (!session) {
    signedIn = false;
    stopRealtime();
    showLogin();
    return;
  }
  hideLogin();
  showAccount(session);
  if (signedIn) return;
  signedIn = true;
  if (window.location.hash.includes('access_token')) {
    window.history.replaceState(null, '', window.location.href.split('#')[0]);
  }
  reconcile().then(startRealtime);
}

export async function initSync() {
  if (!syncAvailable()) return;
  $('syncBox').hidden = false;
  $('footerNote').textContent = 'Dane są wspólne dla domowników i zapisują się w chmurze. Na telefonie zostaje kopia do pracy bez internetu.';
  initLogin(getClient);
  if (!hasSavedSession()) showLogin();

  onChange((info) => {
    if (info.remote) return;
    setDirty(true);
    if (signedIn) schedulePush();
  });
  $('signOutBtn').addEventListener('click', signOut);
  window.addEventListener('online', reconcile);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reconcile(); });

  try {
    client = await getClient();
  } catch (_) {
    status('Nie udało się połączyć z chmurą. Odśwież stronę.');
    return;
  }
  client.auth.onAuthStateChange((_event, session) => setTimeout(() => onSession(session), 0));
}
