/*
 * Pakuje bibliotekę Supabase do jednego pliku src/vendor/supabase.js.
 * Dzięki temu strona działa bez kroku budowania (np. na GitHub Pages).
 * Uruchom po aktualizacji @supabase/supabase-js: npm run vendor
 */
import { build } from 'esbuild';

await build({
  stdin: { contents: "export { createClient } from '@supabase/supabase-js';", resolveDir: process.cwd() },
  bundle: true,
  format: 'esm',
  target: 'es2020',
  minify: true,
  legalComments: 'eof',
  outfile: 'src/vendor/supabase.js',
});
console.log('src/vendor/supabase.js gotowy');
