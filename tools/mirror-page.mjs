import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';

const root = process.cwd();
const siteOrigin = 'https://www.bethyflores.com.br';
const startUrl = `${siteOrigin}/`;
const stackPrefix = 'https://stack.flowermarket.com.br/bethyflores/';
const assetRoot = path.join(root, 'assets', 'bethyflores');
const stackRoot = new URL(stackPrefix);
const maxPages = Number.parseInt(process.env.MAX_PAGES ?? '1500', 10);

const queue = [startUrl];
const seenPages = new Set();
const writtenPages = new Map();
const downloadedAssets = new Set();
const pendingAssets = new Set();
const failedPages = [];
const failedAssets = [];
const cookies = new Map();

const pageExtensions = new Set(['.asp', '.aspx', '.html', '.htm', '.php']);
const assetExtensions = new Set([
  '.avif',
  '.bmp',
  '.css',
  '.eot',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.js',
  '.json',
  '.map',
  '.pdf',
  '.png',
  '.svg',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
]);

const blockedPathPrefixes = [
  '/api',
  '/busca',
  '/carrinho',
  '/cdn-cgi',
  '/checkout',
  '/favoritos',
  '/login',
  '/logout',
  '/minha_cesta',
  '/minha_conta',
  '/pagamento',
  '/pedido',
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function sanitizeSegment(segment) {
  const decoded = decodeURIComponent(segment);
  return decoded
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'pagina';
}

function normalizePageUrl(urlString, baseUrl = startUrl) {
  let url;
  try {
    url = new URL(urlString, baseUrl);
  } catch {
    return null;
  }

  if (url.origin !== siteOrigin) return null;

  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|srsltid$|fbclid$|gclid$|msclkid$)/i.test(key)) {
      url.searchParams.delete(key);
    }
  }

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  return url.href;
}

function isBlockedPageUrl(urlString) {
  const url = new URL(urlString);
  const pathname = url.pathname.toLowerCase();
  const ext = path.posix.extname(pathname);

  if (assetExtensions.has(ext) && !pageExtensions.has(ext)) return true;
  return blockedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function pageFileFor(urlString) {
  const url = new URL(urlString);
  const cleanPath = url.pathname === '/' ? '' : url.pathname.replace(/^\/+/, '');
  const parts = cleanPath.split('/').filter(Boolean).map(sanitizeSegment);
  const ext = path.posix.extname(url.pathname).toLowerCase();

  if (url.pathname === '/') {
    return path.join(root, 'index.html');
  }

  if (pageExtensions.has(ext)) {
    const querySuffix = url.search ? `-${sanitizeSegment(url.search.slice(1))}` : '';
    const fileName = parts.pop() || 'pagina.asp';
    const parsed = path.parse(fileName);
    return path.join(root, ...parts, `${parsed.name}${querySuffix}${parsed.ext}`);
  }

  const querySuffix = url.search ? sanitizeSegment(url.search.slice(1)) : '';
  const routeParts = querySuffix ? [...parts.slice(0, -1), `${parts.at(-1) ?? 'pagina'}-${querySuffix}`] : parts;
  return path.join(root, ...routeParts, 'index.html');
}

function assetFileFor(urlString) {
  const url = new URL(urlString);
  const rootPath = stackRoot.pathname.replace(/\/$/, '');
  let assetPath = decodeURIComponent(url.pathname);

  if (assetPath.startsWith(rootPath)) {
    assetPath = assetPath.slice(rootPath.length);
  }

  assetPath = assetPath.replace(/^\/+/, '');
  return path.join(assetRoot, ...assetPath.split('/').map(sanitizeSegment));
}

function relativeAssetPrefix(fromFile) {
  const fromDir = path.dirname(fromFile);
  const relative = path.relative(fromDir, assetRoot);
  return `${toPosixPath(relative || '.')}/`;
}

function relativeAssetHref(urlString, fromFile) {
  const fromDir = path.dirname(fromFile);
  return toPosixPath(path.relative(fromDir, assetFileFor(urlString)));
}

function updateCookies(setCookieHeaders = []) {
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of headers) {
    if (!header) continue;
    const [pair] = header.split(';');
    const equals = pair.indexOf('=');
    if (equals === -1) continue;
    cookies.set(pair.slice(0, equals).trim(), pair.slice(equals + 1).trim());
  }
}

function cookieHeader() {
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

function fetchBuffer(urlString, redirects = 0) {
  return new Promise((resolve, reject) => {
    const headers = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'User-Agent': 'Mozilla/5.0',
    };

    const cookie = cookieHeader();
    if (cookie) headers.Cookie = cookie;

    https
      .get(urlString, { headers }, (response) => {
        updateCookies(response.headers['set-cookie']);

        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status) && response.headers.location && redirects < 5) {
          response.resume();
          resolve(fetchBuffer(new URL(response.headers.location, urlString).href, redirects + 1));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: response.headers['content-type'] ?? '',
            status,
            url: urlString,
          });
        });
      })
      .on('error', reject);
  });
}

function decodeCloudflareEmail(hex) {
  const key = Number.parseInt(hex.slice(0, 2), 16);
  let email = '';
  for (let index = 2; index < hex.length; index += 2) {
    email += String.fromCharCode(Number.parseInt(hex.slice(index, index + 2), 16) ^ key);
  }
  return email;
}

function stripCloudflareRuntime(html) {
  return html
    .replace(/type=(["'])[a-f0-9]+-text\/([^"']+)\1/gi, 'type=$1text/$2$1')
    .replace(/\sdata-cf-modified-[^=\s]+=(["'])\1/gi, '')
    .replace(/if \(!window\.__cfRLUnblockHandlers\) return false;\s*/g, '')
    .replace(/<script\s+data-cfasync=["']false["']\s+src=["']\/cdn-cgi\/scripts\/5c5dd728\/cloudflare-static\/email-decode\.min\.js["']><\/script>/gi, '')
    .replace(/<script\s+src=["']\/cdn-cgi\/scripts\/7d0fa10a\/cloudflare-static\/rocket-loader\.min\.js["'][^>]*><\/script>/gi, '');
}

function normalizeHtml(html, outputFile) {
  let normalized = html;

  if (!/<meta\s+charset=/i.test(normalized)) {
    normalized = normalized.replace(/<head>/i, '<head>\n<meta charset="utf-8">');
  }

  normalized = stripCloudflareRuntime(normalized)
    .replace(/5511983702213/g, '551635130795')
    .replace(/\(11\)\s*98370-2213/g, '(16) 3513 - 0795');

  normalized = normalized.replace(
    /<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([^"]+)">\[email&#160;protected\]<\/a>/g,
    (_, hex) => {
      const email = decodeCloudflareEmail(hex);
      return `<a href="mailto:${email}">${email}</a>`;
    },
  );

  return normalized.split(stackPrefix).join(relativeAssetPrefix(outputFile));
}

function collectStackUrls(text, baseUrl = stackPrefix) {
  const urls = new Set();
  const absolutePattern = /https:\/\/stack\.flowermarket\.com\.br\/bethyflores\/[^"'()<>\s]+/gi;
  for (const match of text.matchAll(absolutePattern)) {
    const url = match[0].replace(/[.,;]+$/, '');
    const ext = path.posix.extname(new URL(url).pathname).toLowerCase();
    if (ext) urls.add(url);
  }

  const cssUrlPattern = /url\((['"]?)([^'")]+)\1\)/gi;
  for (const match of text.matchAll(cssUrlPattern)) {
    const raw = match[2].trim();
    if (!raw || raw.startsWith('data:')) continue;
    try {
      const resolved = new URL(raw, baseUrl).href;
      if (resolved.startsWith(stackPrefix)) {
        urls.add(resolved);
      }
    } catch {
      // Ignore malformed source URLs.
    }
  }

  return urls;
}

function collectPageLinks(html, currentUrl) {
  const links = new Set();
  const patterns = [
    /\b(?:href|action)\s*=\s*(["'])(.*?)\1/gi,
    /\b(?:window\.)?location(?:\.href)?\s*=\s*(["'])(.*?)\1/gi,
    /\bwindow\.open\(\s*(["'])(.*?)\1/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[2].trim();
      if (
        raw === ''
        || raw.startsWith('#')
        || /^(javascript:|mailto:|tel:|whatsapp:|sms:)/i.test(raw)
      ) {
        continue;
      }

      const normalized = normalizePageUrl(raw, currentUrl);
      if (!normalized || isBlockedPageUrl(normalized)) continue;
      links.add(normalized);
    }
  }

  return links;
}

async function downloadAsset(urlString) {
  if (downloadedAssets.has(urlString)) return;
  downloadedAssets.add(urlString);

  try {
    const { buffer, status } = await fetchBuffer(urlString);
    if (status < 200 || status >= 300) {
      throw new Error(`HTTP ${status}`);
    }

    const target = assetFileFor(urlString);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);

    if (/\.(css|js)$/i.test(target)) {
      const text = buffer.toString('latin1');
      for (const nestedUrl of collectStackUrls(text, urlString)) {
        pendingAssets.add(nestedUrl);
      }

      if (/\.css$/i.test(target)) {
        let css = text;
        for (const nestedUrl of collectStackUrls(text, urlString)) {
          css = css.split(nestedUrl).join(relativeAssetHref(nestedUrl, target));
        }
        await fs.writeFile(target, css, 'utf8');
      }
    }
  } catch (error) {
    failedAssets.push(`${urlString} (${error.message})`);
  }
}

async function processPage(urlString) {
  const normalizedUrl = normalizePageUrl(urlString);
  if (!normalizedUrl || seenPages.has(normalizedUrl) || seenPages.size >= maxPages) return;
  seenPages.add(normalizedUrl);

  let response;
  try {
    response = await fetchBuffer(normalizedUrl);
  } catch (error) {
    failedPages.push(`${normalizedUrl} (${error.message})`);
    return;
  }

  if (response.status < 200 || response.status >= 300) {
    failedPages.push(`${normalizedUrl} (HTTP ${response.status})`);
    return;
  }

  if (!/text\/html|charset=/i.test(String(response.contentType))) {
    return;
  }

  const outputFile = pageFileFor(normalizedUrl);
  const originalHtml = response.buffer.toString('latin1');
  const normalizedHtml = normalizeHtml(originalHtml, outputFile);
  const destinationKey = toPosixPath(path.relative(root, outputFile));

  if (writtenPages.has(destinationKey) && writtenPages.get(destinationKey) !== normalizedUrl) {
    const parsed = path.parse(outputFile);
    const uniqueFile = path.join(parsed.dir, `${parsed.name}-${seenPages.size}${parsed.ext}`);
    await fs.mkdir(path.dirname(uniqueFile), { recursive: true });
    await fs.writeFile(uniqueFile, normalizedHtml, 'utf8');
  } else {
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, normalizedHtml, 'utf8');
    writtenPages.set(destinationKey, normalizedUrl);
  }

  for (const assetUrl of collectStackUrls(originalHtml, normalizedUrl)) {
    pendingAssets.add(assetUrl);
  }

  for (const link of collectPageLinks(normalizedHtml, normalizedUrl)) {
    if (!seenPages.has(link) && !queue.includes(link) && queue.length + seenPages.size < maxPages) {
      queue.push(link);
    }
  }

  if (seenPages.size % 25 === 0) {
    console.log(`${seenPages.size} paginas processadas, ${queue.length} na fila`);
  }
}

while (queue.length > 0 && seenPages.size < maxPages) {
  const next = queue.shift();
  await processPage(next);
}

while (pendingAssets.size > 0) {
  const [assetUrl] = pendingAssets;
  pendingAssets.delete(assetUrl);
  await downloadAsset(assetUrl);
}

console.log(`${seenPages.size} paginas capturadas`);
console.log(`${downloadedAssets.size - failedAssets.length} assets espelhados em ${assetRoot}`);

if (failedPages.length > 0) {
  await fs.writeFile(path.join(root, 'failed-pages.txt'), failedPages.join('\n') + '\n', 'utf8');
  console.log(`${failedPages.length} paginas falharam; veja failed-pages.txt`);
}

if (failedAssets.length > 0) {
  await fs.writeFile(path.join(root, 'failed-assets.txt'), failedAssets.join('\n') + '\n', 'utf8');
  console.log(`${failedAssets.length} assets falharam; veja failed-assets.txt`);
}
