const fs = require("fs");
const path = require("path");
const { normalizeText, stripUrls, tokenize } = require("./catalog");

const DEFAULT_DATA = {
  customInstructions: "Atendimento curto, consultivo e vendedor. Priorize produtos do catalogo e nunca envie links fora da saudacao.",
  entries: [
    {
      id: "entrega",
      title: "Entrega e frete",
      triggers: "entrega, frete, prazo, demora, chega, cep",
      answer: "Entregamos em todo o Brasil com frete grátis. Após o pagamento, chega em 30 a 60 min conforme disponibilidade 🌷",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "pagamento",
      title: "Forma de pagamento",
      triggers: "pagamento, pix, cartao, boleto, dinheiro, chave pix",
      answer: "Aceitamos apenas Pix. O pedido é liberado depois do comprovante anexado no sistema.",
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

class KnowledgeStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.data = structuredClone(DEFAULT_DATA);
    this.load();
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      this.save();
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      this.data = {
        customInstructions: data.customInstructions || DEFAULT_DATA.customInstructions,
        entries: Array.isArray(data.entries) ? data.entries : []
      };
    } catch {
      this.data = structuredClone(DEFAULT_DATA);
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.data, null, 2)}\n`, "utf8");
  }

  all() {
    return this.data;
  }

  updateSettings(patch) {
    this.data.customInstructions = String(patch.customInstructions || "").trim();
    this.save();
    return this.data;
  }

  upsert(entry) {
    const now = new Date().toISOString();
    const id = entry.id || `kb-${Date.now()}`;
    const clean = {
      id,
      title: String(entry.title || "Sem titulo").trim(),
      triggers: String(entry.triggers || "").trim(),
      answer: stripUrls(entry.answer || ""),
      enabled: entry.enabled !== false,
      createdAt: entry.createdAt || now,
      updatedAt: now
    };

    const index = this.data.entries.findIndex((item) => item.id === id);
    if (index >= 0) this.data.entries[index] = clean;
    else this.data.entries.unshift(clean);

    this.save();
    return clean;
  }

  remove(id) {
    const before = this.data.entries.length;
    this.data.entries = this.data.entries.filter((entry) => entry.id !== id);
    this.save();
    return before !== this.data.entries.length;
  }

  search(text) {
    const normalized = normalizeText(text);
    if (!normalized) return null;

    const queryTokens = new Set(tokenize(normalized));
    let best = null;

    for (const entry of this.data.entries) {
      if (!entry.enabled) continue;

      const triggerText = normalizeText(`${entry.title} ${entry.triggers}`);
      const triggers = String(entry.triggers || "")
        .split(",")
        .map((trigger) => normalizeText(trigger))
        .filter(Boolean);

      let score = 0;
      if (triggers.some((trigger) => trigger && normalized.includes(trigger))) score += 10;

      for (const token of queryTokens) {
        if (triggerText.includes(token)) score += 2;
      }

      if (!best || score > best.score) best = { entry, score };
    }

    return best && best.score >= 4 ? best.entry : null;
  }
}

module.exports = { KnowledgeStore };
