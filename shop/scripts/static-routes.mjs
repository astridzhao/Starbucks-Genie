import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleMenu } from '../src/data/menu.js';

// Static hosting resolves /customize from customize.html. These entry files
// make direct links work before any service worker has been installed.
const output = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(join(output, 'index.html'));
const paths = new Set(['customize', 'trending', 'menu']);
for (const drink of sampleMenu) {
  paths.add(`menu/${drink.category}`);
  paths.add(`menu/${drink.category}/${drink.itemid}`);
}
for (const path of paths) {
  const target = join(output, `${path}.html`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
}
console.log(`Generated ${paths.size} static route entries.`);
