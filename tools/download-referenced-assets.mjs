import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const root = process.cwd();
const stackPrefix = 'https://stack.flowermarket.com.br/bethyflores/';
const assetRoot = path.join(root, 'assets', 'bethyflores');
const pending = new Set();
const downloaded = new Set();
const failed = [];

const scannedExtensions = new Set(['.asp', '.css', '.htm', '.html', '.js', '.php']);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function sanitizeSegment(segment) {
  return decodeURIComponent(segment)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'asset';
}

function stackUrlForLocalAsset(reference) {
  const normalized = reference.replace(/\\/g, '/').split(/[?#]/, 1)[0];
  const marker = 'assets/bethyflores/';
  const index = normalized.indexOf(marker);
  if (index === -1) return null;

  const assetPath = normalized.slice(index + marker.length);
  if (!assetPath || assetPath.endsWith('/') || assetPath.includes('..')) return null;

  return new URL(assetPath.split('/').map(encodeURIComponent).join('/'), stackPrefix).href;
}

function localPathForStackUrl(urlString) {
  const url = new URL(urlString);
  const prefixPath = '/bethyflores/';
  let assetPath = decodeURIComponent(url.pathname);
  if (assetPath.startsWith(prefixPath)) {
    assetPath = assetPath.slice(prefixPath.length);
  }
  return path.join(assetRoot, ...assetPath.split('/').map(sanitizeSegment));
}

function collectReferences(text, filePath) {
  const directPattern = /(?:\.\.\/|\.\/|\/)?(?:assets\/bethyflores\/)[^"'()<>\s]+/gi;
  for (const match of text.matchAll(directPattern)) {
    const url = stackUrlForLocalAsset(match[0]);
    if (url) pending.add(url);
  }

  const absolutePattern = /https:\/\/stack\.flowermarket\.com\.br\/bethyflores\/[^"'()<>\s]+/gi;
  for (const match of text.matchAll(absolutePattern)) {
    const url = match[0].replace(/[.,;]+$/, '');
    if (!new URL(url).pathname.endsWith('/')) {
      pending.add(url);
    }
  }

  if (path.extname(filePath).toLowerCase() === '.css') {
    const cssUrlPattern = /url\((['"]?)([^'")]+)\1\)/gi;
    const fromDir = path.dirname(filePath);
    for (const match of text.matchAll(cssUrlPattern)) {
      const raw = match[2].trim();
      if (!raw || raw.startsWith('data:') || /^https?:\/\//i.test(raw)) continue;
      const resolved = toPosixPath(path.resolve(fromDir, raw));
      if (resolved.includes('/assets/bethyflores/')) {
        const url = stackUrlForLocalAsset(resolved);
        if (url) pending.add(url);
      }
    }
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (scannedExtensions.has(path.extname(entry.name).toLowerCase())) {
      const text = await fs.readFile(fullPath, 'utf8').catch(async () => {
        const bytes = await fs.readFile(fullPath);
        return bytes.toString('latin1');
      });
      collectReferences(text, fullPath);
    }
  }
}

function fetchBuffer(urlString, redirects = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(urlString, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects < 5) {
          response.resume();
          resolve(fetchBuffer(new URL(response.headers.location, urlString).href, redirects + 1));
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          reject(new Error(`HTTP ${status}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function downloadAsset(urlString) {
  if (downloaded.has(urlString)) return;
  downloaded.add(urlString);

  const target = localPathForStackUrl(urlString);
  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    try {
      await fs.access(target);
      return;
    } catch {
      // Missing locally; download it.
    }

    const buffer = await fetchBuffer(urlString);
    await fs.writeFile(target, buffer);

    if (/\.(css|js)$/i.test(target)) {
      const text = buffer.toString('latin1');
      collectReferences(text, target);
    }
  } catch (error) {
    failed.push(`${urlString} (${error.message})`);
  }
}

await walk(root);

while (pending.size > 0) {
  const [url] = pending;
  pending.delete(url);
  await downloadAsset(url);

  if (downloaded.size % 100 === 0) {
    console.log(`${downloaded.size} assets verificados/baixados`);
  }
}

if (failed.length > 0) {
  await fs.writeFile(path.join(root, 'failed-assets.txt'), failed.join('\n') + '\n', 'utf8');
}

console.log(`${downloaded.size - failed.length} assets verificados/baixados`);
if (failed.length > 0) {
  console.log(`${failed.length} assets falharam; veja failed-assets.txt`);
}
