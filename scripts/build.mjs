/*
 * Buduje wersję jednoplikową: dist/grosik.html ze stylami i skryptem w środku.
 * Taki plik można otworzyć bezpośrednio z dysku albo wgrać w jedno miejsce.
 */
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const bundle = await build({
  entryPoints: [new URL('src/main.js', root).pathname],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  write: false,
});
const script = bundle.outputFiles[0].text.replace(/<\/script/g, '<\\/script');

let html = await read('index.html');
const sheets = [...html.matchAll(/^\s*<link rel="stylesheet" href="([^"]+)">\n/gm)];
const styles = (await Promise.all(sheets.map((match) => read(match[1])))).join('\n');
sheets.forEach((match, i) => { html = html.replace(match[0], i === 0 ? '  <style>\n%STYLES%  </style>\n' : ''); });
html = html
  .replace('%STYLES%', () => styles)
  .replace('<script type="module" src="src/main.js"></script>', () => `<script>\n${script}</script>`);

await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/grosik.html', root), html);
console.log(`dist/grosik.html – ${(html.length / 1024).toFixed(0)} kB`);
