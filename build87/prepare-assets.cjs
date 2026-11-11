const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const source = root;
const target = path.join(__dirname, 'native', 'app', 'src', 'main', 'assets', 'public');
const files = [
  'index.html',
  'sw.js',
  'version.json',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'core/store/core-store.js',
  'core/store/readonly-store.js'
];

for (const relative of files) {
  const from = path.join(source, relative);
  const to = path.join(target, relative);
  if (!fs.existsSync(from)) throw new Error(`source asset missing: ${relative}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

const hash = value => crypto.createHash('sha256').update(value).digest('hex').toUpperCase();
const sourceHtml = fs.readFileSync(path.join(source, 'index.html'));
const targetHtml = fs.readFileSync(path.join(target, 'index.html'));
if (hash(sourceHtml) !== hash(targetHtml)) throw new Error('APK index.html differs from source');

console.log(JSON.stringify({
  ok: true,
  files: files.length,
  indexBytes: targetHtml.length,
  indexSha256: hash(targetHtml),
  storeFiles: files.filter(file => file.startsWith('core/store/'))
}, null, 2));
