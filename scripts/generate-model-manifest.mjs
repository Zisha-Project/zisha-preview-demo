import { readdir, writeFile } from 'node:fs/promises';

const modelsDirectory = new URL('../preview/models/', import.meta.url);
const files = (await readdir(modelsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.glb$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

await writeFile(new URL('manifest.json', modelsDirectory), `${JSON.stringify(files, null, 2)}\n`);
console.log(`Generated model manifest: ${files.length} models`);
