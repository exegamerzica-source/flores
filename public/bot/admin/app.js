const state = {
  token: localStorage.getItem("evelyn_admin_token") || "",
  conversations: [],
  selectedId: null,
  selectedConversation: null,
  knowledge: null,
  currentKnowledgeId: "",
  productQuery: ""
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hidden"), 3200);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (state.token) headers["x-admin-token"] = state.token;

  const response = await fetch(path, { ...options, headers });
  if (response.status === 401) {
    $("#tokenOverlay").classList.remove("hidden");
    throw new Error("Token administrativo necessário.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erro na API");
  return payload;
}

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusLabel(status) {
  return {
    aguardando_pagamento: "Aguardando comprovante",
    coletando_entrega: "Coletando entrega",
    finalizado: "Finalizado",
    manual: "Manual",
    novo: "Novo",
    pix_pendente: "Enviar Pix",
    produto_confirmado: "Produto confirmado"
  }[status] || status || "Novo";
}

function badgeClass(conversation) {
  if (conversation.status === "pix_pendente" || conversation.requiresPixIntervention) return "rose";
  if (conversation.automationPaused) return "rose";
  if (conversation.status === "aguardando_pagamento") return "amber";
  if (conversation.status === "finalizado") return "green";
  return "";
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

async function loadSummary() {
  const summary = await api("/api/summary");
  setText("#metricConversations", summary.conversations);
  setText("#metricPixPending", summary.pixPending || 0);
  setText("#metricManual", summary.manual);
  setText("#metricProducts", summary.products);
}

async function loadHealth() {
  const health = await api("/health");
  $("#healthBox").innerHTML = `
    <strong>${health.ok ? "Online" : "Instável"}</strong><br>
    ${health.products} produtos, ${health.conversations} conversas.
    ${health.adminProtected ? "Token administrativo ativo." : "ADMIN_TOKEN não configurado."}
  `;
  $("#webhookUrl").textContent = `${location.origin}/webhook`;
}

async function loadConversations(keepSelection = true) {
  const data = await api("/api/conversations");
  state.conversations = data.conversations || [];
  renderConversationList();

  if (!keepSelection || !state.selectedId) {
    state.selectedId = state.conversations[0] && state.conversations[0].id;
  }

  if (state.selectedId) await selectConversation(state.selectedId, false);
}

function filteredConversations() {
  const query = ($("#conversationSearch").value || "").toLowerCase().trim();
  if (!query) return state.conversations;

  return state.conversations.filter((conversation) => {
    const last = conversation.lastMessage && conversation.lastMessage.text || "";
    return `${conversation.customerName} ${conversation.id} ${last}`.toLowerCase().includes(query);
  });
}

function renderConversationList() {
  const list = $("#conversationList");
  const conversations = filteredConversations();
  list.innerHTML = "";

  if (!conversations.length) {
    list.innerHTML = `<div class="empty-state">Nenhuma conversa encontrada.</div>`;
    return;
  }

  for (const conversation of conversations) {
    const item = document.createElement("article");
    item.className = `conversation-item ${conversation.id === state.selectedId ? "active" : ""}`;
    item.dataset.id = conversation.id;
    const lastText = conversation.lastMessage ? conversation.lastMessage.text : "Sem mensagens";
    item.innerHTML = `
      <div class="conversation-top">
        <strong>${escapeHtml(conversation.customerName || conversation.id)}</strong>
        ${conversation.unread ? '<span class="badge green">nova</span>' : ""}
      </div>
      <div class="conversation-top">
        <span class="badge ${badgeClass(conversation)}">${statusLabel(conversation.status)}</span>
        <small>${formatTime(conversation.lastMessageAt)}</small>
      </div>
      <p class="conversation-preview">${escapeHtml(lastText)}</p>
    `;
    item.addEventListener("click", () => selectConversation(conversation.id));
    list.appendChild(item);
  }
}

async function selectConversation(id, rerenderList = true) {
  state.selectedId = id;
  const data = await api(`/api/conversations/${encodeURIComponent(id)}`);
  state.selectedConversation = data.conversation;
  renderChat();
  renderDetails();
  if (rerenderList) {
    await loadConversations(true);
  } else {
    renderConversationList();
  }
}

function roleName(role) {
  return {
    agent: "Equipe",
    bot: "Evelyn",
    customer: "Cliente",
    system: "Sistema"
  }[role] || role;
}

function renderChat() {
  const conversation = state.selectedConversation;
  if (!conversation) return;

  $("#chatName").textContent = conversation.customerName || conversation.id;
  $("#chatMeta").textContent = `${conversation.id} · ${statusLabel(conversation.status)}`;
  $("#toggleAutomation").textContent = conversation.automationPaused ? "Retomar automação" : "Pausar automação";

  const messages = $("#messageList");
  messages.classList.remove("empty-state");
  messages.innerHTML = "";

  for (const message of conversation.messages || []) {
    const bubble = document.createElement("div");
    bubble.className = `message ${message.role || "system"}`;
    const media = message.meta && message.meta.media;
    const analysis = message.meta && message.meta.paymentProofAnalysis;
    bubble.textContent = message.text || `[${message.type || "mensagem"}]`;
    if (media && media.publicUrl && String(media.mimeType || "").startsWith("image/")) {
      const image = document.createElement("img");
      image.className = "message-media";
      image.src = state.token ? `${media.publicUrl}?token=${encodeURIComponent(state.token)}` : media.publicUrl;
      image.alt = "Mídia enviada";
      bubble.appendChild(image);
    }
    if (analysis) {
      const proof = document.createElement("span");
      proof.className = `analysis-badge ${analysis.isPaymentProof ? "ok" : "fail"}`;
      proof.textContent = `${analysis.isPaymentProof ? "Possível comprovante" : "Não parece comprovante"} · confiança ${Math.round((analysis.confidence || 0) * 100)}%`;
      bubble.appendChild(proof);
    }
    const meta = document.createElement("span");
    meta.className = "message-meta";
    meta.textContent = `${roleName(message.role)} · ${formatTime(message.createdAt)} · ${message.status || "ok"}`;
    bubble.appendChild(meta);
    messages.appendChild(bubble);
  }

  messages.scrollTop = messages.scrollHeight;
}

function renderDetails() {
  const conversation = state.selectedConversation;
  const details = $("#conversationDetails");
  if (!conversation) {
    $("#markPixSentWrap").classList.add("hidden");
    $("#markPixSent").checked = false;
    details.className = "details-empty";
    details.textContent = "Nenhuma conversa selecionada.";
    return;
  }

  const product = conversation.selectedProduct;
  const pixPending = conversation.requiresPixIntervention || conversation.status === "pix_pendente";
  $("#markPixSentWrap").classList.toggle("hidden", !pixPending);
  $("#markPixSent").checked = pixPending;
  $("#pauseAfterSend").checked = !pixPending;
  details.className = "";
  details.innerHTML = `
    <div class="detail-block">
      <h3>Status</h3>
      <span class="badge ${badgeClass(conversation)}">${statusLabel(conversation.status)}</span>
      <span class="badge ${conversation.automationPaused ? "rose" : "green"}">
        ${conversation.automationPaused ? "Automação pausada" : "Automação ativa"}
      </span>
    </div>
    <div class="detail-block">
      <h3>Produto</h3>
      ${product ? `
        <div class="product-mini">
          ${product.imageUrl ? `<img src="${product.imageUrl}" alt="">` : ""}
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>${escapeHtml(product.priceLabel)}</span>
          </div>
        </div>
      ` : "<p class='muted'>Nenhum produto confirmado ainda.</p>"}
    </div>
    ${pixPending && product ? `
      <div class="detail-block pix-alert">
        <h3>Pix pendente</h3>
        <p>Gere o Pix copia e cola no Black Cat Pay para <strong>${escapeHtml(product.priceLabel)}</strong>, cole no campo de resposta e mantenha marcado “esta mensagem é o Pix”. Depois disso a automação volta a aguardar o comprovante.</p>
      </div>
    ` : ""}
    <div class="detail-block quick-actions">
      <h3>Ações rápidas</h3>
      <button data-action="delivery-fields" type="button">Pedir dados de entrega</button>
      <button data-action="mark-pix-sent" type="button" ${product ? "" : "disabled"}>Marcar Pix enviado</button>
      <button data-action="payment-received" type="button">Confirmar pagamento</button>
    </div>
    <div class="detail-block">
      <h3>Notas internas</h3>
      <textarea id="conversationNotes" rows="6" placeholder="Observações da equipe">${escapeHtml(conversation.notes || "")}</textarea>
      <button id="saveNotes" class="secondary" type="button">Salvar notas</button>
    </div>
  `;

  $$(".quick-actions button").forEach((button) => {
    button.addEventListener("click", () => quickAction(button.dataset.action));
  });
  $("#saveNotes").addEventListener("click", saveNotes);
}

async function toggleAutomation() {
  const conversation = state.selectedConversation;
  if (!conversation) return;
  await api(`/api/conversations/${encodeURIComponent(conversation.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ automationPaused: !conversation.automationPaused })
  });
  toast(conversation.automationPaused ? "Automação retomada." : "Automação pausada.");
  await selectConversation(conversation.id);
}

async function sendManual() {
  const conversation = state.selectedConversation;
  const text = $("#manualText").value.trim();
  if (!conversation || !text) return;

  await api(`/api/conversations/${encodeURIComponent(conversation.id)}/send`, {
    method: "POST",
    body: JSON.stringify({
      text,
      pauseAutomation: $("#pauseAfterSend").checked,
      markPixSent: $("#markPixSent").checked
    })
  });
  $("#manualText").value = "";
  toast("Mensagem enviada.");
  await selectConversation(conversation.id);
}

async function draftReply() {
  const conversation = state.selectedConversation;
  if (!conversation) return;
  const data = await api(`/api/conversations/${encodeURIComponent(conversation.id)}/draft`, { method: "POST" });
  $("#manualText").value = data.draft || "";
  $("#manualText").focus();
}

async function quickAction(action) {
  const conversation = state.selectedConversation;
  if (!conversation) return;
  await api(`/api/conversations/${encodeURIComponent(conversation.id)}/quick-action`, {
    method: "POST",
    body: JSON.stringify({ action })
  });
  toast("Ação enviada.");
  await selectConversation(conversation.id);
}

async function saveNotes() {
  const conversation = state.selectedConversation;
  if (!conversation) return;
  await api(`/api/conversations/${encodeURIComponent(conversation.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ notes: $("#conversationNotes").value })
  });
  toast("Notas salvas.");
  await selectConversation(conversation.id);
}

async function loadKnowledge() {
  state.knowledge = await api("/api/knowledge");
  $("#customInstructions").value = state.knowledge.customInstructions || "";
  renderKnowledgeList();
}

function renderKnowledgeList() {
  const list = $("#knowledgeList");
  const entries = state.knowledge && state.knowledge.entries || [];
  list.innerHTML = "";

  if (!entries.length) {
    list.innerHTML = `<div class="empty-state">Nenhum roteiro cadastrado ainda.</div>`;
    return;
  }

  for (const entry of entries) {
    const item = document.createElement("article");
    item.className = `knowledge-item ${entry.id === state.currentKnowledgeId ? "active" : ""}`;
    item.innerHTML = `
      <div class="conversation-top">
        <strong>${escapeHtml(entry.title)}</strong>
        <span class="badge ${entry.enabled ? "green" : "rose"}">${entry.enabled ? "ativo" : "inativo"}</span>
      </div>
      <p>${escapeHtml(entry.triggers || "Sem gatilhos")}</p>
    `;
    item.addEventListener("click", () => editKnowledge(entry));
    list.appendChild(item);
  }
}

function resetKnowledgeForm() {
  state.currentKnowledgeId = "";
  $("#knowledgeFormTitle").textContent = "Novo roteiro";
  $("#knowledgeId").value = "";
  $("#knowledgeTitle").value = "";
  $("#knowledgeTriggers").value = "";
  $("#knowledgeAnswer").value = "";
  $("#knowledgeEnabled").checked = true;
  $("#deleteKnowledge").classList.add("hidden");
  renderKnowledgeList();
}

function editKnowledge(entry) {
  state.currentKnowledgeId = entry.id;
  $("#knowledgeFormTitle").textContent = "Editar roteiro";
  $("#knowledgeId").value = entry.id;
  $("#knowledgeTitle").value = entry.title || "";
  $("#knowledgeTriggers").value = entry.triggers || "";
  $("#knowledgeAnswer").value = entry.answer || "";
  $("#knowledgeEnabled").checked = entry.enabled !== false;
  $("#deleteKnowledge").classList.remove("hidden");
  renderKnowledgeList();
}

async function saveKnowledge(event) {
  event.preventDefault();
  const id = $("#knowledgeId").value;
  const body = {
    title: $("#knowledgeTitle").value,
    triggers: $("#knowledgeTriggers").value,
    answer: $("#knowledgeAnswer").value,
    enabled: $("#knowledgeEnabled").checked
  };

  await api(id ? `/api/knowledge/entries/${encodeURIComponent(id)}` : "/api/knowledge/entries", {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify(body)
  });
  toast("Roteiro salvo.");
  resetKnowledgeForm();
  await loadKnowledge();
}

async function deleteKnowledge() {
  const id = $("#knowledgeId").value;
  if (!id) return;
  await api(`/api/knowledge/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
  toast("Roteiro removido.");
  resetKnowledgeForm();
  await loadKnowledge();
}

async function saveSettings(event) {
  event.preventDefault();
  await api("/api/knowledge", {
    method: "PUT",
    body: JSON.stringify({ customInstructions: $("#customInstructions").value })
  });
  toast("Diretriz salva.");
  await loadKnowledge();
}

async function loadProducts() {
  const query = $("#productSearch").value.trim();
  const data = await api(`/api/products?limit=48&q=${encodeURIComponent(query)}`);
  const grid = $("#productGrid");
  grid.innerHTML = "";

  for (const product of data.products || []) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      ${product.imageUrl ? `<img src="${product.imageUrl}" alt="">` : ""}
      <strong>${escapeHtml(product.name)}</strong>
      <span>${escapeHtml(product.priceLabel)}</span>
    `;
    grid.appendChild(card);
  }

  if (!grid.children.length) {
    grid.innerHTML = `<div class="empty-state">Nenhum produto encontrado.</div>`;
  }
}

async function rebuildCatalog() {
  const data = await api("/api/catalog/rebuild", { method: "POST" });
  toast(`Catálogo regerado com ${data.products} produtos.`);
  await Promise.all([loadSummary(), loadProducts()]);
}

async function simulateMessage() {
  const text = $("#simText").value.trim();
  if (!text) return;
  await api("/test", {
    method: "POST",
    body: JSON.stringify({
      from: $("#simPhone").value.trim() || "local-test",
      profileName: "Cliente Teste",
      text
    })
  });
  $("#simText").value = "";
  toast("Mensagem simulada.");
  await Promise.all([loadSummary(), loadConversations(false)]);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function switchView(view) {
  $$(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  $$(".view").forEach((section) => section.classList.remove("active"));
  $(`#view${view[0].toUpperCase()}${view.slice(1)}`).classList.add("active");
}

function bindEvents() {
  $$(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  $("#refreshConversations").addEventListener("click", () => loadConversations(true));
  $("#conversationSearch").addEventListener("input", renderConversationList);
  $("#toggleAutomation").addEventListener("click", toggleAutomation);
  $("#sendManual").addEventListener("click", sendManual);
  $("#draftReply").addEventListener("click", draftReply);
  $("#simSend").addEventListener("click", simulateMessage);
  $("#knowledgeForm").addEventListener("submit", saveKnowledge);
  $("#newKnowledge").addEventListener("click", resetKnowledgeForm);
  $("#deleteKnowledge").addEventListener("click", deleteKnowledge);
  $("#settingsForm").addEventListener("submit", saveSettings);
  $("#productSearch").addEventListener("input", debounce(loadProducts, 250));
  $("#rebuildCatalog").addEventListener("click", rebuildCatalog);
  $("#tokenForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.token = $("#tokenInput").value.trim();
    localStorage.setItem("evelyn_admin_token", state.token);
    $("#tokenOverlay").classList.add("hidden");
    await boot();
  });
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

async function boot() {
  try {
    await Promise.all([loadSummary(), loadHealth(), loadKnowledge(), loadProducts()]);
    await loadConversations(false);
  } catch (error) {
    toast(error.message);
  }
}

bindEvents();
boot();

setInterval(async () => {
  try {
    if ($("#viewInbox").classList.contains("active")) {
      await Promise.all([loadSummary(), loadConversations(true)]);
    }
  } catch {
    // The visible toast on every polling failure would be noisy.
  }
}, 5000);
