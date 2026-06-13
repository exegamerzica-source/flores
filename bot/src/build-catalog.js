const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const outputPath = path.join(repoRoot, "bot", "data", "products.json");

const SKIP_DIRS = new Set([".git", "bot", "node_modules"]);

function walkIndexFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkIndexFiles(path.join(dir, entry.name), files);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase() === "index.html") {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function decodeEntities(text) {
  if (!text) return "";

  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
  };

  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name.toLowerCase()] || `&${name};`);
}

function stripTags(html) {
  return decodeEntities(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unescapeJsString(value) {
  return decodeEntities(value || "")
    .replace(/\\"/g, "\"")
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function readHomeRanks() {
  const home = path.join(repoRoot, "index.html");
  if (!fs.existsSync(home)) return new Map();

  const html = fs.readFileSync(home, "utf8");
  const ids = [...html.matchAll(/show_fav\((\d+),1\)/g)].map((match) => match[1]);
  const ranks = new Map();
  ids.forEach((id, index) => {
    if (!ranks.has(id)) ranks.set(id, index + 1);
  });
  return ranks;
}

function findImagePath(id) {
  const sizes = ["600", "300", "230", "160"];
  for (const size of sizes) {
    const rel = path.join("assets", "bethyflores", "images", "produto", `${size}_${id}.jpg`);
    if (fs.existsSync(path.join(repoRoot, rel))) return rel.replace(/\\/g, "/");
  }

  const fallback = path.join("assets", "bethyflores", "images", "produto", `${id}_1.jpg`);
  if (fs.existsSync(path.join(repoRoot, fallback))) return fallback.replace(/\\/g, "/");

  return "";
}

function parseProduct(filePath, homeRanks) {
  const html = fs.readFileSync(filePath, "utf8");
  if (!html.includes("view_item") && !html.includes("item_name")) return null;

  const id = firstMatch(html, [
    /item_id\s*:\s*"([^"]+)"/,
    /C[oó]digo:\s*<\/?[^>]*>\s*(\d+)/i,
    /C(?:Ã³|ó)digo:\s*(\d+)/i
  ]);

  const rawName = firstMatch(html, [
    /item_name\s*:\s*"((?:\\"|[^"])*)"/,
    /<div id="info_produto">\s*<span[^>]*>([\s\S]*?)<\/span>/i
  ]);

  const rawPrice = firstMatch(html, [
    /price\s*:\s*([0-9]+(?:\.[0-9]+)?)/,
    /por\s*R\$\s*([0-9.]+,[0-9]{2})/i
  ]);

  if (!id || !rawName || !rawPrice) return null;

  const name = unescapeJsString(stripTags(rawName));
  const priceText = String(rawPrice).trim();
  const price = priceText.includes(",")
    ? Number(priceText.replace(/\./g, "").replace(",", "."))
    : Number(priceText);
  if (!name || !Number.isFinite(price) || price <= 0) return null;

  const detailHtml = firstMatch(html, [
    /<div id=mais_detalhes_texto>([\s\S]*?)<\/div>/i
  ]);

  const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const slug = path.basename(path.dirname(filePath));

  return {
    id,
    name,
    price,
    priceLabel: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price),
    slug,
    sourcePath: relativePath,
    imagePath: findImagePath(id),
    description: stripTags(detailHtml).replace(/https?:\/\/\S+|www\.\S+/gi, "").trim(),
    homeRank: homeRanks.get(id) || 999999
  };
}

function buildCatalog() {
  const homeRanks = readHomeRanks();
  const productsById = new Map();

  for (const file of walkIndexFiles(repoRoot)) {
    const product = parseProduct(file, homeRanks);
    if (!product) continue;

    const current = productsById.get(product.id);
    if (!current || product.homeRank < current.homeRank || product.sourcePath.length < current.sourcePath.length) {
      productsById.set(product.id, product);
    }
  }

  const products = [...productsById.values()].sort((a, b) => {
    if (a.homeRank !== b.homeRank) return a.homeRank - b.homeRank;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");
  console.log(`Catalogo gerado com ${products.length} produtos em ${path.relative(repoRoot, outputPath)}`);
}

if (require.main === module) {
  buildCatalog();
}

module.exports = { buildCatalog, parseProduct };
