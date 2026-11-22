/* Połączenie z bazą Supabase: ładowane dopiero, gdy jest potrzebne. */
import { STORAGE_KEY, SUPABASE_KEY, SUPABASE_URL } from '../../core/constants.js';
import { storage } from '../../core/dom.js';

export const AUTH_KEY = `${STORAGE_KEY}-auth`;

/** Synchronizacja działa na zwykłej stronie www; w podglądzie Claude i z pliku na dysku – nie. */
export const syncAvailable = () => Boolean(SUPABASE_URL) && !window.claude && /^https?:$/.test(window.location.protocol);

/** Czy w przeglądarce jest zapisana sesja (sprawdzane bez ładowania biblioteki). */
export const hasSavedSession = () => storage.get(AUTH_KEY, '') !== '' || /access_token=/.test(window.location.hash);

let clientPromise = null;
export function getClient() {
  clientPromise = clientPromise || import('../../vendor/supabase.js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }));
  return clientPromise;
}
