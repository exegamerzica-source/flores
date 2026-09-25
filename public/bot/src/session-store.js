const fs = require("fs");
const path = require("path");

class SessionStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.sessions = {};
    this.load();
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      this.sessions = {};
      return;
    }

    try {
      this.sessions = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
    } catch {
      this.sessions = {};
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.sessions, null, 2)}\n`, "utf8");
  }

  get(key, profileName = "") {
    if (!this.sessions[key]) {
      this.sessions[key] = {
        greeted: false,
        profileName,
        customerName: profileName,
        lastSuggestions: [],
        selectedProductId: null,
        awaitingDeliveryData: false,
        deliveryDetails: "",
        requiresPixIntervention: false,
        paymentRequested: false,
        orderClosed: false,
        automationPaused: false,
        unread: false,
        status: "novo",
        tags: [],
        notes: "",
        messages: [],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    if (profileName && !this.sessions[key].profileName) {
      this.sessions[key].profileName = profileName;
    }

    if (!Array.isArray(this.sessions[key].messages)) this.sessions[key].messages = [];
    if (!Array.isArray(this.sessions[key].tags)) this.sessions[key].tags = [];

    return this.sessions[key];
  }

  set(key, session) {
    this.sessions[key] = {
      ...session,
      updatedAt: new Date().toISOString()
    };
    this.save();
  }

  update(key, patch) {
    const session = this.get(key);
    this.set(key, {
      ...session,
      ...patch
    });
    return this.sessions[key];
  }

  addMessage(key, message) {
    const session = this.get(key, message.profileName || "");
    const now = new Date().toISOString();
    const record = {
      id: message.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: message.role || "system",
      type: message.type || "text",
      text: message.text || "",
      status: message.status || "ok",
      createdAt: message.createdAt || now,
      meta: message.meta || {}
    };

    session.messages.push(record);
    session.lastMessageAt = record.createdAt;
    session.updatedAt = now;
    if (record.role === "customer") {
      session.unread = true;
      session.customerName = message.profileName || session.customerName || session.profileName || "";
    }

    this.save();
    return record;
  }

  list() {
    return Object.entries(this.sessions)
      .map(([id, session]) => ({
        id,
        customerName: session.customerName || session.profileName || id,
        profileName: session.profileName || "",
        status: this.deriveStatus(session),
        automationPaused: Boolean(session.automationPaused),
        unread: Boolean(session.unread),
        paymentRequested: Boolean(session.paymentRequested),
        requiresPixIntervention: Boolean(session.requiresPixIntervention),
        orderClosed: Boolean(session.orderClosed),
        selectedProductId: session.selectedProductId || null,
        tags: session.tags || [],
        notes: session.notes || "",
        messageCount: (session.messages || []).length,
        lastMessage: this.lastMessage(session),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastMessageAt: session.lastMessageAt || session.updatedAt || session.createdAt
      }))
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  }

  conversation(id) {
    const session = this.get(id);
    return {
      id,
      ...session,
      status: this.deriveStatus(session)
    };
  }

  markRead(id) {
    return this.update(id, { unread: false });
  }

  deriveStatus(session) {
    if (session.status && session.status !== "novo") return session.status;
    if (session.orderClosed) return "finalizado";
    if (session.requiresPixIntervention) return "pix_pendente";
    if (session.paymentRequested) return "aguardando_pagamento";
    if (session.awaitingDeliveryData) return "coletando_entrega";
    if (session.selectedProductId) return "produto_confirmado";
    if (session.automationPaused) return "manual";
    return "novo";
  }

  lastMessage(session) {
    const messages = session.messages || [];
    return messages[messages.length - 1] || null;
  }
}

module.exports = { SessionStore };
