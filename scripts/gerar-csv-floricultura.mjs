import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "bot", "data", "products.json");
const outputDir = path.join(root, "outputs", "floricultura");
const outputPath = path.join(outputDir, "catalogo_floricultura_nuvemshop.csv");

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const floralTerms = /\b(buque|buques|bouquet|bouquets|rosa|rosas|flor|flores|floral|florais|colombiana|colombianas|colombiano|colombianos|orquidea|orquideas|phalaenopsis|astromelia|astromelias|margarida|margaridas|girassol|girassois|lirio|lirios|violeta|violetas|kalanchoe|begonia|begonias|suculenta|suculentas|bonsai|arranjo|arranjos|jardim|coroa|coroas|funeral|funebre|cravo|cravos|tulipa|tulipas|plantado|condolencia|condolencias)\b/;
const strongFloralTerms = /\b(buque|buques|bouquet|bouquets|flores|floral|florais|colombiana|colombianas|colombiano|colombianos|orquidea|orquideas|phalaenopsis|astromelia|astromelias|margarida|margaridas|girassol|girassois|lirio|lirios|violeta|violetas|kalanchoe|begonia|begonias|suculenta|suculentas|arranjo|arranjos|coroa|coroas|funeral|funebre|condolencia|condolencias)\b/;
const nonFloralPrefixes = /^(caneca|garrafa|copo|almofada|pelucia|urso|ursinho|ursa|cachorro|gato|sapo|porquinha|bicho|coelho|panda|girafa|elefante|raposa|tatu|boneco|chaveiro|bowl|squeeze|taca|placa|plaquinha|cartao|porta[ -]|imagem|sagrada familia|presepio|vela|perfume|vinho|salton|pergola|chandon|bombom|snickers|kit kat|kinder|alpino|barra de chocolate|caixa de chocolate|caixa musical|mini balao|balao)\b/;

function isFloricultureProduct(product) {
  const name = normalize(product.name);
  if (!floralTerms.test(name)) return false;
  if (/rosa encantada|bonsai artificial/.test(name)) return false;
  if (nonFloralPrefixes.test(name) && !strongFloralTerms.test(name)) return false;
  return true;
}

function categoryFor(product) {
  const name = normalize(product.name);
  if (/\b(coroa|funeral|funebre|condolencia|condolencias)\b/.test(name)) return "Coroas e Condolencias";
  if (/\b(orquidea|orquideas|phalaenopsis)\b/.test(name)) return "Orquideas";
  if (/\b(buque|buques|bouquet|bouquets)\b/.test(name)) return "Buques";
  if (/^cesta\b/.test(name)) return "Cestas com Flores";
  if (/\b(kalanchoe|begonia|begonias|violeta|violetas|margarida|margaridas|suculenta|suculentas|plantado|jardim)\b/.test(name)) return "Plantas e Vasos";
  if (/\b(rosa|rosas|colombiana|colombianas|colombiano|colombianos)\b/.test(name)) return "Rosas e Arranjos";
  return "Arranjos Florais";
}

function csvCell(value) {
  const text = String(value ?? "")
    .replace(/[\u0091\u0092]/g, "'")
    .replace(/[\u0093\u0094]/g, '"')
    .replace(/[\u0096\u0097]/g, "-")
    .replace(/[\u0080-\u009f]/g, " ")
    .replace(/\r?\n/g, " ")
    .replace(/"/g, '""');
  return `"${text}"`;
}

function priceForCsv(value) {
  const number = Number(value || 0);
  return number.toFixed(2);
}

const products = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const selected = products
  .filter(isFloricultureProduct)
  .sort((a, b) => categoryFor(a).localeCompare(categoryFor(b), "pt-BR") || a.name.localeCompare(b.name, "pt-BR"));

const headers = [
  "Identificador URL",
  "Nome",
  "Categorias",
  "Nome da variação 1",
  "Valor da variação 1",
  "Nome da variação 2",
  "Valor da variação 2",
  "Nome da variação 3",
  "Valor da variação 3",
  "Preço",
  "Preço promocional",
  "Peso (kg)",
  "Altura (cm)",
  "Largura (cm)",
  "Comprimento (cm)",
  "Estoque",
  "SKU",
  "Código de barras",
  "Exibir na loja",
  "Frete gratis",
  "Descrição",
  "Tags",
  "Título para SEO",
  "Descrição para SEO",
  "Marca",
  "Produto Físico",
  "MPN (Cód. Exclusivo Modelo Fabricante)",
  "Sexo",
  "Faixa etária",
  "Custo",
];

function seoDescription(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

const rows = selected.map((product) => {
  const category = categoryFor(product);
  return [
    product.slug,
    product.name,
    category,
    "",
    "",
    "",
    "",
    "",
    "",
    priceForCsv(product.price),
    "",
    "",
    "",
    "",
    "",
    "",
    product.id,
    "",
    "SIM",
    "NÃO",
    product.description,
    `floricultura, ${category.toLowerCase()}`,
    product.name,
    seoDescription(product.description),
    "Praça Das Flores",
    "SIM",
    "",
    "",
    "",
    "",
  ];
});

const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `\uFEFF${csv}`, "utf8");

const categoryCounts = {};
for (const product of selected) {
  const category = categoryFor(product);
  categoryCounts[category] = (categoryCounts[category] || 0) + 1;
}

const missingPages = selected.filter((product) => !fs.existsSync(path.join(root, product.slug, "index.html")));
const missingImages = selected.filter((product) => product.imagePath && !fs.existsSync(path.join(root, product.imagePath)));

console.log(JSON.stringify({
  totalCatalog: products.length,
  selected: selected.length,
  excluded: products.length - selected.length,
  categoryCounts,
  missingPages: missingPages.map((product) => product.slug),
  missingImages: missingImages.map((product) => product.imagePath),
  outputPath,
}, null, 2));
