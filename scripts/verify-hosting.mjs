import { writeFile } from 'node:fs/promises';
const base = process.argv[2];
if (!base?.startsWith('https://')) throw Error('HTTPS URL required');
const response = await fetch(base);
const html = await response.text();
if (!response.ok) throw Error('Page failed');
const paths = [
  ...html.matchAll(/(?:src|href)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g),
].map((m) => m[1]);
if (
  !paths.some((p) => p.includes('.css')) ||
  !paths.some((p) => p.includes('.js'))
)
  throw Error('Missing CSS or JS references');
const assets = [];
for (const path of [...new Set(paths)]) {
  const url = new URL(path, base);
  if (url.origin !== new URL(base).origin) continue;
  const r = await fetch(url);
  const type = r.headers.get('content-type') || '';
  if (
    !r.ok ||
    !(path.includes('.css')
      ? type.includes('text/css')
      : type.includes('javascript'))
  )
    throw Error('Broken asset ' + url + ' ' + r.status + ' ' + type);
  assets.push({ path, status: r.status, type });
}
await writeFile(
  new URL('../artifacts/hosting-verification.json', import.meta.url),
  JSON.stringify(
    {
      url: base,
      status: response.status,
      assets,
      checked_at: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log('HTML and ' + assets.length + ' CSS/JS assets verified');
