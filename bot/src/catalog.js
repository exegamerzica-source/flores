const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const defaultCatalogPath = path.join(repoRoot, "bot", "data", "products.json");

const STOP_WORDS = new Set([
  "a", "as", "ao", "aos", "com", "da", "das", "de", "do", "dos", "e", "em",
  "eu", "me", "meu", "minha", "na", "nas", "no", "nos", "o", "os", "para",
  "pra", "por", "que", "quero", "uma", "um", "voce", "voces"
]);

const INTENT_KEYWORDS = [
  ["amor", ["amor", "apaixonado", "romance", "romantico", "romantica", "romanticas", "namorados", "te amo", "rosa", "colombiana"]],
  ["aniversario", ["aniversario", "parabens", "birthday", "balao", "feliz aniversario", "cesta"]],
  ["desculpas", ["desculpas", "perdao", "sinto muito", "rosa", "delicado"]],
  ["agradecimento", ["agradecimento", "obrigado", "carinho", "voce e especial"]],
  ["amizade", ["amizade", "amiga", "amigo", "colorido", "alegre"]],
  ["condolencias", ["condolencias", "funeral", "velorio", "coroa", "sentimentos", "saudades"]],
  ["melhoras", ["melhoras", "fique bem", "violeta", "margarida"]],
  ["orquidea", ["orquidea", "phalaenopsis", "cachepo", "vaso"]],
  ["cesta", ["cesta", "chocolate", "cafe", "ferrero", "chandon"]],
  ["girassol", ["girassol", "amarelo", "alegre"]],
  ["barato", ["rosa", "unitaria", "mini", "violeta", "ate 99"]]
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function parseBudget(text) {
  const normalized = normalizeText(text);
  if (!/(ate|orcamento|maximo|max|r\$|reais|menos de|baixo custo|barat)/.test(normalized)) return null;

  const matches = [...String(text || "").matchAll(/(?:r\$\s*)?(\d{2,4})(?:[,.](\d{2}))?/gi)];
  if (!matches.length) return null;

  const values = matches
    .map((match) => Number(`${match[1]}.${match[2] || "00"}`))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 10000);

  return values.length ? Math.max(...values) : null;
}

function stripUrls(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

class Catalog {
  constructor(products) {
    this.products = products.map((product) => ({
      ...product,
      normalizedName: normalizeText(product.name),
      normalizedSearch: normalizeText(`${product.name} ${product.slug} ${product.description || ""}`)
    }));
  }

  static load(filePath = defaultCatalogPath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Catalogo nao encontrado: ${filePath}. Rode npm run build:catalog primeiro.`);
    }

    return new Catalog(JSON.parse(fs.readFileSync(filePath, "utf8")));
  }

  getById(id) {
    return this.products.find((product) => product.id === String(id)) || null;
  }

  getByNumberFromSuggestions(text, suggestions = []) {
    const normalized = normalizeText(text);
    const match = normalized.match(/(?:opcao|opcao numero|numero|n|a|o)?\s*([1-3])\b/);
    if (!match) return null;

    const index = Number(match[1]) - 1;
    return suggestions[index] || null;
  }

  findMentionedProduct(text, suggestions = []) {
    const fromNumber = this.getByNumberFromSuggestions(text, suggestions);
    if (fromNumber) return fromNumber;

    const normalized = normalizeText(text);
    if (!normalized) return null;

    for (const product of suggestions) {
      const candidate = this.getById(product.id) || product;
      if (candidate.normalizedName && normalized.includes(candidate.normalizedName)) return candidate;
      const important = tokenize(candidate.name).filter((token) => token.length > 3);
      if (important.length >= 2 && important.every((token) => normalized.includes(token))) return candidate;
    }

    for (const product of this.products) {
      if (normalized.includes(product.normalizedName)) return product;

      const important = tokenize(product.name).filter((token) => token.length > 3);
      if (important.length > 0 && important.length <= 3 && important.every((token) => normalized.includes(token))) {
        return product;
      }
    }

    return null;
  }

  search(text, options = {}) {
    const scored = this.scoreProducts(text, options);
    return scored.slice(0, options.limit || 3).map((item) => item.product);
  }

  scoreProducts(text, options = {}) {
    const limit = options.limit || 3;
    const budget = options.budget || parseBudget(text);
    const tokens = tokenize(text);
    const normalized = normalizeText(text);
    const expandedTokens = new Set(tokens);

    for (const [, words] of INTENT_KEYWORDS) {
      if (words.some((word) => normalized.includes(normalizeText(word)))) {
        words.flatMap(tokenize).forEach((token) => expandedTokens.add(token));
      }
    }

    if (!expandedTokens.size) {
      ["buque", "rosa", "colombiana", "cesta"].forEach((token) => expandedTokens.add(token));
    }

    const excluded = new Set((options.excludeIds || []).map(String));
    const scored = [];

    for (const product of this.products) {
      if (excluded.has(product.id)) continue;
      if (budget && product.price > budget) continue;

      let score = 0;
      for (const token of expandedTokens) {
        if (product.normalizedName.includes(token)) score += 5;
        else if (product.normalizedSearch.includes(token)) score += 2;
      }

      if (budget) {
        const distance = Math.max(0, budget - product.price);
        score += Math.max(0, 4 - distance / 50);
      }

      if (product.homeRank < 999999) score += Math.max(0, 5 - product.homeRank / 30);
      if (score > 0) scored.push({ product, score });
    }

    if (!scored.length) {
      for (const product of this.products) {
        if (excluded.has(product.id)) continue;
        if (budget && product.price > budget) continue;

        const rankBoost = product.homeRank < 999999 ? Math.max(0, 5 - product.homeRank / 30) : 0;
        scored.push({
          product,
          score: rankBoost + Math.max(0, 4 - product.price / 100)
        });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.product.homeRank !== b.product.homeRank) return a.product.homeRank - b.product.homeRank;
      return a.product.price - b.product.price;
    });

    return scored.slice(0, Math.max(limit, 20));
  }
}

function formatSuggestionList(products) {
  return products
    .slice(0, 3)
    .map((product, index) => `${index + 1}. ${product.name.trim()} - ${formatBRL(product.price)}`)
    .join("\n");
}

module.exports = {
  Catalog,
  formatBRL,
  formatSuggestionList,
  normalizeText,
  parseBudget,
  stripUrls,
  tokenize
};
