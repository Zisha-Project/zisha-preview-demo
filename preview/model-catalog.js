export function createModelCatalog(filenames, modelsDirectory) {
  return [...new Set(filenames)]
    .filter((filename) => typeof filename === 'string'
      && !/[\/\\]/.test(filename) && /\.glb$/i.test(filename))
    .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
    .map((filename) => ({
      name: filename.replace(/\.glb$/i, ''),
      url: new URL(encodeURIComponent(filename), modelsDirectory).href
    }));
}

export async function discoverModels(modelsDirectory) {
  // Directory listings reflect local changes immediately; static hosts use a generated manifest.
  try {
    const response = await fetch(modelsDirectory, { cache: 'no-store' });
    if (response.ok) {
      const document = new DOMParser().parseFromString(await response.text(), 'text/html');
      const links = [...document.querySelectorAll('a[href]')];
      const isDirectoryListing = document.querySelector('h1')?.textContent
        .match(/directory listing|index of/i);
      const filenames = links.flatMap((link) => {
        const url = new URL(link.getAttribute('href'), modelsDirectory);
        if (url.origin !== modelsDirectory.origin
          || !url.pathname.startsWith(modelsDirectory.pathname)) return [];
        try {
          return [decodeURIComponent(url.pathname.slice(modelsDirectory.pathname.length))];
        } catch {
          return [];
        }
      });
      const models = createModelCatalog(filenames, modelsDirectory);
      if (models.length || isDirectoryListing) return models;
    }
  } catch (error) {
    console.debug('目录索引不可用，尝试模型清单', error);
  }

  const response = await fetch(new URL('manifest.json', modelsDirectory), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Model manifest HTTP ${response.status}`);
  const filenames = await response.json();
  if (!Array.isArray(filenames)) throw new Error('Invalid model manifest');
  return createModelCatalog(filenames, modelsDirectory);
}
