/* Génère js/manifest.js : liste des images locales réellement présentes (clé → extension). */
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'assets/img'), out = {};
for (const d of fs.readdirSync(base, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(base, d.name))) {
    const m = f.match(/^(.*)\.(jpg|png|webp)$/); if (m) out[d.name + '/' + m[1]] = m[2];
  }
}
fs.writeFileSync(path.join(root, 'js/manifest.js'), '/* généré par scripts/build-manifest.mjs */\nwindow.PITWALL.images = ' + JSON.stringify(out) + ';\n');
console.log(Object.keys(out).length, 'images');
fs.appendFileSync(path.join(root, 'js/manifest.js'), 'window.PITWALL.hasModel = ' + fs.existsSync(path.join(root, 'assets/models/f1car.glb')) + ';\n');
