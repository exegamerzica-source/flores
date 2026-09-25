const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const { buildCatalog } = require("./build-catalog");
const { Catalog, formatBRL, formatSuggestionList } = require("./catalog");
const { createEvelyn, DELIVERY_FIELDS } = require("./evelyn");
const { KnowledgeStore } = require("./knowledge-store");
const { analyzeWithOpenAI, isConfidentPaymentProof, saveMediaFile } = require("./media-analyzer");
const { SessionStore } = require("./session-store");
const { downloadWhatsAppMedia, parseIncomingMessages, sendWhatsAppText, verifyWebhook } = require("./whatsapp");

const repoRoot = path.resolve(__dirname, "..", "..");
const adminRoot = path.join(repoRoot, "bot", "admin");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(repoRoot, ".env"));
loadEnvFile(path.join(repoRoot, "bot", ".env"));

let catalog = Catalog.load();
const store = new SessionStore(path.resolve(repoRoot, process.env.BOT_SESSIONS_FILE || "bot/data/sessions.json"));
const knowledge = new KnowledgeStore(path.resolve(repoRoot, process.env.BOT_KNOWLEDGE_FILE || "bot/data/knowledge.json"));
let evelyn = createEvelyn({ catalog, store, knowledge });

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks);
      if (!raw.length) return resolve({ raw, json: {} });
      try {
        resolve({ raw, json: JSON.parse(raw.toString("utf8")) });
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(text);
}

function responseDelayMs() {
  const seconds = Number(process.env.BOT_RESPONSE_DELAY_SECONDS || 7);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.min(seconds, 45) * 1000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function verifySignature(req, rawBody) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;

  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !signature.startsWith("sha256=")) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function requireAdmin(req, res, url) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true;

  const provided = req.headers["x-admin-token"] || url.searchParams.get("token");
  if (provided === token) return true;

  sendJson(res, 401, { ok: false, error: "admin_token_required" });
  return false;
}

function safePath(root, requested) {
  const target = path.resolve(root, requested);
  return target.startsWith(path.resolve(root)) ? target : null;
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  }[ext] || "application/octet-stream";
}

function serveFile(res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return sendText(res, 404, "Not found");
  }

  res.writeHead(200, {
    "Content-Type": mimeType(filePath),
    "Cache-Control": filePath.endsWith(".html") ? "no-store" : "public, max-age=60"
  });
  fs.createReadStream(filePath).pipe(res);
}

function publicProduct(product) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    priceLabel: product.priceLabel || formatBRL(product.price),
    slug: product.slug,
    imagePath: product.imagePath,
    imageUrl: product.imagePath ? `/catalog-assets/${product.imagePath}` : "",
    description: product.description || "",
    homeRank: product.homeRank
  };
}

function enrichConversation(conversation) {
  return {
    ...conversation,
    selectedProduct: publicProduct(catalog.getById(conversation.selectedProductId))
  };
}

async function sendAndLog(to, text, role = "bot", meta = {}) {
  let status = "sent";
  let result = null;

  try {
    result = await sendWhatsAppText({
      to,
      text,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      graphVersion: process.env.WHATSAPP_GRAPH_VERSION || "v25.0"
    });
    if (result && result.skipped) status = "skipped";
  } catch (error) {
    status = "error";
    meta.error = error.payload || error.message;
    console.error(error);
  }

  store.addMessage(to, {
    role,
    type: "text",
    text,
    status,
    meta: { ...meta, whatsapp: result }
  });

  return { status, result };
}

async function enrichIncomingMedia(message) {
  if (!message.media || !message.media.id) return message;

  try {
    const downloaded = await downloadWhatsAppMedia({
      mediaId: message.media.id,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      graphVersion: process.env.WHATSAPP_GRAPH_VERSION || "v25.0"
    });
    if (!downloaded) return message;

    const saved = saveMediaFile({
      root: repoRoot,
      messageId: message.id || message.media.id,
      buffer: downloaded.buffer,
      mimeType: downloaded.mimeType
    });

    message.media = {
      ...message.media,
      ...downloaded,
      buffer: undefined,
      localPath: saved && saved.path,
      publicUrl: saved && saved.publicUrl,
      mimeType: downloaded.mimeType
    };
    message._mediaBuffer = downloaded.buffer;
  } catch (error) {
    message.media = {
      ...message.media,
      error: error.payload || error.message
    };
    console.error(error);
  }

  return message;
}

async function classifyPaymentProof(message) {
  if (typeof message.paymentProofDetected === "boolean") return message;

  const session = store.get(message.from, message.profileName || "");
  if (!session.paymentRequested || !["image", "document"].includes(message.type)) {
    return message;
  }

  const selected = catalog.getById(session.selectedProductId);
  const analysis = await analyzeWithOpenAI({
    buffer: message._mediaBuffer,
    mimeType: message.media && message.media.mimeType,
    expectedAmount: selected && selected.price
  });

  message.paymentProofAnalysis = analysis;
  message.paymentProofDetected = isConfidentPaymentProof(analysis);
  return message;
}

function recordIncoming(message) {
  const session = store.get(message.from, message.profileName || "");
  const alreadyLogged = message.id && (session.messages || []).some((item) => item.meta && item.meta.whatsappId === message.id);
  if (alreadyLogged) return false;

  store.addMessage(message.from, {
    role: "customer",
    type: message.type,
      text: message.text || `[${message.type}]`,
      profileName: message.profileName,
      meta: {
        whatsappId: message.id,
        timestamp: message.timestamp,
        media: message.media ? {
          id: message.media.id,
          mimeType: message.media.mimeType,
          filename: message.media.filename,
          publicUrl: message.media.publicUrl,
          error: message.media.error
        } : null,
        paymentProofAnalysis: message.paymentProofAnalysis || null
      }
    });
  return true;
}

async function runAutomation(message, sendRemote = true) {
  const session = store.get(message.from, message.profileName || "");
  if (session.automationPaused) {
    store.update(message.from, { status: "manual" });
    return [];
  }

  const replies = evelyn(message);
  const delay = sendRemote ? responseDelayMs() : 0;

  for (const reply of replies) {
    if (delay > 0) {
      store.addMessage(message.from, {
        role: "system",
        type: "text",
        text: `Evelyn respondera em ${Math.round(delay / 1000)}s`,
        status: "scheduled",
        meta: { responseDelayMs: delay }
      });
      await sleep(delay);
    }

    if (sendRemote) {
      await sendAndLog(message.from, reply, "bot", { responseDelayMs: delay });
    } else {
      store.addMessage(message.from, {
        role: "bot",
        type: "text",
        text: reply,
        status: "test"
      });
    }
  }

  return replies;
}

function queueAutomation(message) {
  runAutomation(message, true).catch((error) => {
    console.error("Falha ao executar automacao:", error);
  });
}

async function handleWebhookPost(req, res) {
  const { raw, json } = await readJsonBody(req);
  if (!verifySignature(req, raw)) {
    return sendJson(res, 403, { ok: false, error: "invalid_signature" });
  }

  const incoming = parseIncomingMessages(json);
  for (const rawMessage of incoming) {
    const messageWithMedia = await enrichIncomingMedia(rawMessage);
    const message = await classifyPaymentProof(messageWithMedia);
    const isNew = recordIncoming(message);
    if (isNew) queueAutomation(message);
  }

  sendJson(res, 200, { ok: true, messages: incoming.length });
}

async function handleTestPost(req, res) {
  const { json } = await readJsonBody(req);
  const message = {
    from: json.from || "local-test",
    text: json.text || "",
    type: json.type || "text",
    profileName: json.profileName || "Cliente Teste",
    paymentProofDetected: json.paymentProofDetected,
    id: `local-${Date.now()}`
  };

  const classified = await classifyPaymentProof(message);
  recordIncoming(classified);
  const replies = await runAutomation(classified, false);
  sendJson(res, 200, { replies });
}

function conversationDraft(id) {
  const conversation = store.conversation(id);
  const lastCustomer = [...(conversation.messages || [])].reverse().find((message) => message.role === "customer");
  const selected = catalog.getById(conversation.selectedProductId);

  if (conversation.awaitingDeliveryData) return DELIVERY_FIELDS;
  if (conversation.requiresPixIntervention && selected) {
    return `Pix Black Cat Pay para ${selected.name.trim()} - ${formatBRL(selected.price)}\n\nCole aqui o Pix copia e cola gerado no Black Cat Pay.`;
  }
  if (selected) return `Perfeito, ${selected.name.trim()} fica ${formatBRL(selected.price)}. Posso fechar esse para entrega?`;

  const products = catalog.search(lastCustomer ? lastCustomer.text : "flores presente", { limit: 3 });
  return products.length
    ? formatSuggestionList(products)
    : "Me fala a ocasião, estilo e orçamento que eu separo 3 opções do catálogo 😊";
}

async function handleConversationApi(req, res, url, segments) {
  const id = decodeURIComponent(segments[2] || "");

  if (segments.length === 2 && req.method === "GET") {
    return sendJson(res, 200, {
      conversations: store.list().map(enrichConversation)
    });
  }

  if (!id) return sendJson(res, 400, { ok: false, error: "conversation_id_required" });

  if (segments.length === 3 && req.method === "GET") {
    store.markRead(id);
    return sendJson(res, 200, { conversation: enrichConversation(store.conversation(id)) });
  }

  if (segments.length === 3 && req.method === "PATCH") {
    const { json } = await readJsonBody(req);
    const patch = {};
    for (const key of ["automationPaused", "customerName", "notes", "status", "tags"]) {
      if (Object.prototype.hasOwnProperty.call(json, key)) patch[key] = json[key];
    }
    return sendJson(res, 200, { conversation: enrichConversation(store.update(id, patch)) });
  }

  if (segments[3] === "send" && req.method === "POST") {
    const { json } = await readJsonBody(req);
    const text = String(json.text || "").trim();
    if (!text) return sendJson(res, 400, { ok: false, error: "text_required" });

    const markPixSent = Boolean(json.markPixSent);
    const current = store.conversation(id);
    const pauseAutomation = markPixSent ? false : json.pauseAutomation !== false;
    store.update(id, {
      automationPaused: pauseAutomation,
      requiresPixIntervention: markPixSent ? false : current.requiresPixIntervention,
      paymentRequested: markPixSent ? true : current.paymentRequested,
      status: markPixSent ? "aguardando_pagamento" : (pauseAutomation ? "manual" : current.status)
    });
    const result = await sendAndLog(id, text, "agent", { source: "admin" });
    if (markPixSent && result.status !== "error") {
      store.update(id, {
        automationPaused: false,
        requiresPixIntervention: false,
        paymentRequested: true,
        status: "aguardando_pagamento"
      });
    }
    return sendJson(res, 200, { ok: true, result, conversation: enrichConversation(store.conversation(id)) });
  }

  if (segments[3] === "draft" && req.method === "POST") {
    return sendJson(res, 200, { draft: conversationDraft(id) });
  }

  if (segments[3] === "quick-action" && req.method === "POST") {
    const { json } = await readJsonBody(req);
    const action = json.action;
    const conversation = store.conversation(id);
    const selected = catalog.getById(conversation.selectedProductId);
    let text = "";

    if (action === "delivery-fields") text = DELIVERY_FIELDS;
    if (action === "mark-pix-sent") {
      store.addMessage(id, {
        role: "system",
        type: "text",
        text: "Pix marcado como enviado. A automação voltou a aguardar o comprovante.",
        status: "ok",
        meta: { source: "quick-action", action }
      });
      store.update(id, {
        automationPaused: false,
        requiresPixIntervention: false,
        paymentRequested: true,
        status: "aguardando_pagamento"
      });
      return sendJson(res, 200, { ok: true, conversation: enrichConversation(store.conversation(id)) });
    }
    if (action === "payment-received") {
      const name = (conversation.customerName || conversation.profileName || "cliente").split(/\s+/)[0];
      text = `Pagamento recebido, ${name}! 💜 Despachando, chega em 30 a 60 min.`;
      store.update(id, { orderClosed: true, status: "finalizado" });
    }

    if (!text) return sendJson(res, 400, { ok: false, error: "invalid_action" });

    const result = await sendAndLog(id, text, "agent", { source: "quick-action", action });
    return sendJson(res, 200, { ok: true, result, conversation: enrichConversation(store.conversation(id)) });
  }

  return sendJson(res, 404, { ok: false, error: "not_found" });
}

async function handleKnowledgeApi(req, res, segments) {
  if (segments.length === 2 && req.method === "GET") {
    return sendJson(res, 200, knowledge.all());
  }

  if (segments.length === 2 && req.method === "PUT") {
    const { json } = await readJsonBody(req);
    return sendJson(res, 200, knowledge.updateSettings(json));
  }

  if (segments[2] === "entries" && segments.length === 3 && req.method === "POST") {
    const { json } = await readJsonBody(req);
    return sendJson(res, 201, { entry: knowledge.upsert(json) });
  }

  if (segments[2] === "entries" && segments[3] && (req.method === "PATCH" || req.method === "PUT")) {
    const { json } = await readJsonBody(req);
    return sendJson(res, 200, { entry: knowledge.upsert({ ...json, id: decodeURIComponent(segments[3]) }) });
  }

  if (segments[2] === "entries" && segments[3] && req.method === "DELETE") {
    return sendJson(res, 200, { ok: knowledge.remove(decodeURIComponent(segments[3])) });
  }

  return sendJson(res, 404, { ok: false, error: "not_found" });
}

async function handleApi(req, res, url) {
  if (!requireAdmin(req, res, url)) return;

  const segments = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/api/summary" && req.method === "GET") {
    const conversations = store.list();
    return sendJson(res, 200, {
      products: catalog.products.length,
      conversations: conversations.length,
      unread: conversations.filter((item) => item.unread).length,
      manual: conversations.filter((item) => item.automationPaused).length,
      pixPending: conversations.filter((item) => item.status === "pix_pendente").length,
      awaitingPayment: conversations.filter((item) => item.status === "aguardando_pagamento").length,
      closed: conversations.filter((item) => item.status === "finalizado").length
    });
  }

  if (segments[1] === "conversations") {
    return handleConversationApi(req, res, url, segments);
  }

  if (segments[1] === "knowledge") {
    return handleKnowledgeApi(req, res, segments);
  }

  if (url.pathname === "/api/products" && req.method === "GET") {
    const query = url.searchParams.get("q") || "";
    const limit = Math.min(Number(url.searchParams.get("limit") || 30), 100);
    const products = query
      ? catalog.search(query, { limit }).map(publicProduct)
      : catalog.products.slice(0, limit).map(publicProduct);
    return sendJson(res, 200, { products });
  }

  if (url.pathname === "/api/catalog/rebuild" && req.method === "POST") {
    buildCatalog();
    catalog = Catalog.load();
    evelyn = createEvelyn({ catalog, store, knowledge });
    return sendJson(res, 200, { ok: true, products: catalog.products.length });
  }

  return sendJson(res, 404, { ok: false, error: "not_found" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
        products: catalog.products.length,
        conversations: store.list().length,
        adminProtected: Boolean(process.env.ADMIN_TOKEN)
      });
    }

    if (req.method === "GET" && url.pathname === "/webhook") {
      const query = Object.fromEntries(url.searchParams.entries());
      return verifyWebhook({ query }, res, process.env.WHATSAPP_VERIFY_TOKEN || "");
    }

    if (req.method === "POST" && url.pathname === "/webhook") {
      return await handleWebhookPost(req, res);
    }

    if (req.method === "POST" && url.pathname === "/test") {
      if (!requireAdmin(req, res, url)) return;
      return await handleTestPost(req, res);
    }

    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url);
    }

    if (url.pathname === "/" || url.pathname === "/admin") {
      res.writeHead(302, { Location: "/admin/" });
      return res.end();
    }

    if (url.pathname.startsWith("/admin/")) {
      const requested = url.pathname === "/admin/" ? "index.html" : url.pathname.replace(/^\/admin\//, "");
      return serveFile(res, safePath(adminRoot, requested));
    }

    if (url.pathname.startsWith("/catalog-assets/")) {
      const requested = url.pathname.replace(/^\/catalog-assets\//, "");
      return serveFile(res, safePath(repoRoot, requested));
    }

    if (url.pathname.startsWith("/media/")) {
      if (!requireAdmin(req, res, url)) return;
      const requested = url.pathname.replace(/^\/media\//, "");
      return serveFile(res, safePath(path.join(repoRoot, "bot", "data", "media"), requested));
    }

    sendJson(res, 404, { ok: false, error: "not_found" });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { ok: false, error: error.message, details: error.payload || undefined });
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Evelyn online na porta ${port}`);
  console.log(`Painel: ${process.env.BASE_URL || `http://localhost:${port}`}/admin/`);
  console.log(`Webhook: ${process.env.BASE_URL || `http://localhost:${port}`}/webhook`);
});
