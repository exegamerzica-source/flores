import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicExtensions = new Set(['.asp', '.htm', '.html', '.php']);
const ignoredDirs = new Set(['.git', 'api', 'assets', 'tools']);
const scriptPath = path.join(root, 'assets', 'bethyflores', 'js', 'whatsapp-sales.js');
const marker = 'whatsapp-sales.js';
let updated = 0;

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        await walk(path.join(directory, entry.name));
      }
      continue;
    }

    if (!publicExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    const file = path.join(directory, entry.name);
    let html = await fs.readFile(file, 'utf8');
    if (html.length === 0 || html.includes(marker)) {
      continue;
    }

    const relativeScript = toPosixPath(path.relative(path.dirname(file), scriptPath));
    const tag = `<script src="${relativeScript}"></script>`;

    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${tag}\n</body>`);
    } else {
      html += `\n${tag}\n`;
    }

    await fs.writeFile(file, html, 'utf8');
    updated += 1;
  }
}

await walk(root);
console.log(`${updated} paginas atualizadas com whatsapp-sales.js`);
