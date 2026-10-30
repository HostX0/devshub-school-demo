import { cp, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const publicFiles = ['index.html', 'app.js', 'styles.css'];
const assetExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf']);

async function copyAssets(relative) {
  for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) {
      throw new Error(`Unsupported public asset: ${relative}/${entry.name}`);
    }
    const next = join(relative, entry.name);
    if (entry.isDirectory()) {
      await mkdir(join(output, next), { recursive: true });
      await copyAssets(next);
    } else if (entry.isFile() && (assetExtensions.has(extname(entry.name).toLowerCase()) || /^(?:OFL|LICENSE)(?:\.txt)?$/i.test(entry.name))) {
      await cp(join(root, next), join(output, next));
    } else {
      throw new Error(`Unsupported public asset: ${next}`);
    }
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of publicFiles) {
  if (!(await lstat(join(root, name))).isFile()) throw new Error(`Missing public file: ${name}`);
  await cp(join(root, name), join(output, name));
}
await mkdir(join(output, 'assets'), { recursive: true });
await copyAssets('assets');
console.log('Static preview prepared. Only approved interface files and licensed assets are public.');
