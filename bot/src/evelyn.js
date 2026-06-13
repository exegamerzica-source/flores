const {
  formatBRL,
  formatSuggestionList,
  normalizeText,
  parseBudget,
  stripUrls
} = require("./catalog");

const CATALOG_URL = process.env.CATALOG_URL || "https://www.beijaflorfloricultura.com";

const GREETING = `Oi! Aqui é a Evelyn da Beija Flor Floricultura 🌷
${CATALOG_URL}
Dá uma olhadinha no nosso catálogo! É só clicar em 💜 Gostei desse! no produto que quiser 😊
Me passa o CEP ou endereço de entrega?`;

const DELIVERY_FIELDS = `Perfeito! Me envia os dados assim:
👤 Quem envia
🎁 Quem recebe
📍 Endereço
🗓️ Data/horário
💌 Cartão (opcional)`;

const PIX_INTERVENTION_MESSAGE = "Perfeito, vou gerar o Pix certinho pra você e já te envio por aqui 😊";

function hasDecision(text) {
  return /\b(quero|gostei|pode ser|fechar|fechado|vou ficar|esse|essa|opcao|opção|sim)\b/i.test(text || "");
}

function asksAvailability(text) {
  return /\b(tem|disponivel|disponível|valor|preco|preço|quanto|sai|fica)\b/i.test(text || "");
}

function wantsPhoto(text) {
  return /\b(foto|fotos|imagem|imagens|mostrar|mostra|ver)\b/i.test(text || "");
}

function wantsManyPhotos(text) {
  const normalized = normalizeText(text);
  const selectedNumbers = (normalized.match(/\b[1-3]\b/g) || []).length;
  return /\b(todas|todos|varias|varios|opcoes|opcoes|essas|desses)\b/.test(normalized)
    || selectedNumbers > 1
    || /\bfotos\b/.test(normalized);
}

function isPaymentProof(input) {
  if (typeof input.paymentProofDetected === "boolean") {
    return input.paymentProofDetected;
  }
  return false;
}

function asksCatalogAgain(text) {
  const normalized = normalizeText(text);
  return /\b(catalogo|opcoes|outras|mais opcoes|nao gostei|nao curti|nenhuma)\b/.test(normalized);
}

function asksAboutBot(text) {
  const normalized = normalizeText(text);
  return /\b(ia|inteligencia artificial|robo|bot|automatica|automático|atendente virtual)\b/.test(normalized);
}

function mentionsCompetitor(text) {
  const normalized = normalizeText(text);
  return /\b(concorrente|outra floricultura|outra loja|cobrir oferta|mercado livre|ifood|interflora)\b/.test(normalized);
}

function asksOtherPayment(text) {
  if (/\bcart[aã]o\s*[:\-]/i.test(text || "")) return false;
  const normalized = normalizeText(text);
  return /\b(cartao|credito|debito|boleto|dinheiro|parcel|maquininha)\b/.test(normalized);
}

function asksDiscount(text) {
  return /\b(desconto|abaixa|menor valor|negociar|promo)\b/i.test(text || "");
}

function isOutOfScope(text) {
  const normalized = normalizeText(text);
  return /\b(aposta|politica|remedio|medico|advogado|banco|emprestimo|cripto|sexo)\b/.test(normalized);
}

function looksLikeDeliveryDetails(text) {
  const normalized = normalizeText(text);
  const hasAddress = /\b(rua|avenida|av|travessa|alameda|estrada|numero|n |apto|apartamento|bairro|cep|casa|condominio)\b/.test(normalized)
    || /\b\d{5}-?\d{3}\b/.test(text || "");
  const hasPeople = /\b(envia|recebe|remetente|destinatario|para|de )\b/.test(normalized);
  const hasDate = /\b(hoje|amanha|manhã|tarde|noite|\d{1,2}h|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2})\b/i.test(text || "");
  return hasAddress || (hasPeople && hasDate) || String(text || "").length > 80;
}

function deliveryChecklist(text) {
  const normalized = normalizeText(text);
  return {
    address: /\b(rua|avenida|av|travessa|alameda|estrada|numero|n |apto|apartamento|bairro|cep|casa|condominio|chacara|residencial)\b/.test(normalized)
      || /\b\d{5}-?\d{3}\b/.test(text || ""),
    sender: /\b(quem envia|envia|remetente|de\s*:)/.test(normalized),
    receiver: /\b(quem recebe|recebe|destinatario|para\s*:)/.test(normalized),
    date: /\b(data|horario|horario|hoje|amanha|manha|tarde|noite|\d{1,2}h|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2})\b/.test(normalized)
  };
}

function hasEnoughDeliveryData(text) {
  const checklist = deliveryChecklist(text);
  return checklist.address && checklist.sender && checklist.receiver && checklist.date;
}

function missingDeliveryFieldsText(text) {
  const checklist = deliveryChecklist(text);
  const missing = [];
  if (!checklist.sender) missing.push("👤 Nome de quem envia");
  if (!checklist.receiver) missing.push("🎁 Nome de quem vai receber");
  if (!checklist.address) missing.push("📍 Endereço completo de entrega");
  if (!checklist.date) missing.push("🗓️ Data e horário desejados");

  if (!missing.length) return DELIVERY_FIELDS;
  return `Recebi o endereço, obrigada 😊 Só falta me passar:\n${missing.join("\n")}\n💌 Mensagem para o cartão, se quiser`;
}

function saysAddressAlreadySent(text) {
  const normalized = normalizeText(text);
  return /\b(ja mandei|ja enviei|passei|informei|enviei)\b/.test(normalized)
    && /\b(endereco|cep|localizacao|local)\b/.test(normalized);
}

function extractName(session, text) {
  const fromField = String(text || "").match(/quem envia\s*[:\-]\s*([^\n,]+)/i);
  const fromDe = String(text || "").match(/\bde\s*[:\-]?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ ]{1,40})/);
  const candidate = (fromField && fromField[1]) || (fromDe && fromDe[1]) || session.customerName || session.profileName || "cliente";
  return candidate.trim().split(/\s+/)[0].replace(/[^\p{L}'-]/gu, "") || "cliente";
}

function pixMessage(product) {
  return `Pode fazer o Pix nesta chave 💜
Nosso Pix: 11959542685
 Titular: CAROLINE DA CONCEIÇÃO OLIVEIRA 
Valor: ${formatBRL(product.price)}
Me envia o comprovante pra confirmar e despachar 🌷`;
}

function sanitizeMessages(messages, allowCatalogUrl = false) {
  return messages
    .filter(Boolean)
    .map((message) => allowCatalogUrl ? String(message).trim() : stripUrls(message))
    .filter(Boolean);
}

function selectedProduct(catalog, session) {
  return session.selectedProductId ? catalog.getById(session.selectedProductId) : null;
}

function createEvelyn({ catalog, store, knowledge }) {
  function finish(input, session, messages, options = {}) {
    store.set(input.from, session);
    return sanitizeMessages(messages, options.allowCatalogUrl);
  }

  function suggest(input, session, text, preface = "") {
    const budget = parseBudget(text);
    const suggestions = catalog.search(text, { limit: 3, budget });
    if (!suggestions.length) {
      return finish(input, session, [
        "Me fala a ocasião, estilo e orçamento que eu separo 3 opções do catálogo 😊"
      ]);
    }

    session.lastSuggestions = suggestions.map((product) => product.id);
    const list = formatSuggestionList(suggestions);
    return finish(input, session, preface ? [preface, list] : [list]);
  }

  function handleDeliveryContext(input, session, text, currentProduct) {
    const alreadySent = saysAddressAlreadySent(text);
    const hasDeliveryDetails = looksLikeDeliveryDetails(text);

    if (!alreadySent && !hasDeliveryDetails) return null;

    if (hasDeliveryDetails) {
      session.deliveryDetails = session.deliveryDetails
        ? `${session.deliveryDetails}\n${text}`
        : text;
    }

    const deliveryDetails = session.deliveryDetails || text;

    if (session.paymentRequested) {
      return finish(input, session, [
        "Recebi sim. Agora fico no aguardo do comprovante do Pix para confirmar e liberar o entregador 🌷"
      ]);
    }

    if (session.requiresPixIntervention) {
      return finish(input, session, [
        "Recebi sim. Estou gerando o Pix certinho para te enviar por aqui 😊"
      ]);
    }

    if (currentProduct && session.awaitingDeliveryData) {
      if (!hasEnoughDeliveryData(deliveryDetails)) {
        return finish(input, session, [missingDeliveryFieldsText(deliveryDetails)]);
      }

      session.awaitingDeliveryData = false;
      session.requiresPixIntervention = true;
      session.paymentRequested = false;
      session.automationPaused = true;
      session.status = "pix_pendente";
      return finish(input, session, [PIX_INTERVENTION_MESSAGE]);
    }

    if (currentProduct) {
      session.awaitingDeliveryData = true;
      return finish(input, session, [
        `Recebi o endereço. O ${currentProduct.name.trim()} fica ${formatBRL(currentProduct.price)} 🌷`,
        missingDeliveryFieldsText(deliveryDetails)
      ]);
    }

    if ((session.lastSuggestions || []).length) {
      return finish(input, session, [
        "Recebi o endereço, obrigada 😊 Agora me fala qual opção você quer: 1, 2 ou 3?"
      ]);
    }

    return finish(input, session, [
      "Recebi o endereço, obrigada 😊 Agora me fala a ocasião e o estilo que você procura para eu separar 3 opções."
    ]);
  }

  return function handleIncoming(input) {
    const session = store.get(input.from, input.profileName || "");
    const text = String(input.text || "").trim();
    const normalized = normalizeText(text);

    if (!session.greeted) {
      session.greeted = true;
      session.customerName = input.profileName || session.customerName || "";
      return finish(input, session, [GREETING], { allowCatalogUrl: true });
    }

    if (asksAboutBot(text)) {
      return finish(input, session, [
        "Sou a Evelyn, assistente de atendimento da Beija Flor Floricultura 🌷 Me fala o que você procura que eu te ajudo rapidinho."
      ]);
    }

    if (isOutOfScope(text) || mentionsCompetitor(text)) {
      return finish(input, session, [
        "Consigo te ajudar com flores, presentes e entregas da Beija Flor Floricultura 🌷 Qual ocasião você quer atender?"
      ]);
    }

    if (asksOtherPayment(text)) {
      return finish(input, session, [
        "Por segurança, aceitamos apenas Pix. Preciso do comprovante para anexar no sistema e liberar o entregador 🌷"
      ]);
    }

    if (asksDiscount(text)) {
      return finish(input, session, [
        "Os valores do catálogo já estão ajustados com frete grátis. Posso te indicar uma opção mais em conta 😊"
      ]);
    }

    if (isPaymentProof(input)) {
      if (!session.paymentRequested) {
        return finish(input, session, [
          "Recebi aqui. Pra confirmar certinho, preciso primeiro fechar o produto e os dados da entrega 🌷"
        ]);
      }

      session.orderClosed = true;
      const name = extractName(session, session.deliveryDetails || text);
      return finish(input, session, [
        `Pagamento recebido, ${name}! 💜 Despachando, chega em 30 a 60 min.`
      ]);
    }

    if (session.paymentRequested && /\b(paguei|pagamento feito|pix feito|transferi|feito)\b/.test(normalized)) {
      return finish(input, session, [
        "Perfeito! Me envia o comprovante do Pix para eu confirmar no sistema e liberar o entregador 🌷"
      ]);
    }

    if (session.paymentRequested && ["image", "document"].includes(input.type)) {
      return finish(input, session, [
        "Recebi a imagem, mas não consegui confirmar como comprovante Pix. Me envia o comprovante certinho, por favor 🌷"
      ]);
    }

    if (input.type === "image") {
      return suggest(input, session, text || "buque rosa arranjo flores", "Recebi a foto! Tenho essas opções parecidas no catálogo:");
    }

    const lastSuggestions = (session.lastSuggestions || [])
      .map((id) => catalog.getById(id))
      .filter(Boolean);
    const mentioned = catalog.findMentionedProduct(text, lastSuggestions);
    const currentProduct = selectedProduct(catalog, session);
    const deliveryContextReply = handleDeliveryContext(input, session, text, currentProduct);
    if (deliveryContextReply) return deliveryContextReply;

    const knowledgeEntry = knowledge && knowledge.search(text);
    if (knowledgeEntry && !session.awaitingDeliveryData && !session.paymentRequested) {
      return finish(input, session, [knowledgeEntry.answer]);
    }

    if (wantsPhoto(text)) {
      if (wantsManyPhotos(text)) {
        return finish(input, session, [
          "Qual delas quer ver primeiro? 😊"
        ]);
      }

      const product = mentioned || currentProduct;
      if (product) {
        session.selectedProductId = product.id;
        return finish(input, session, [
          `Perfeito, vou te mostrar: ${product.name.trim()} 🌷`
        ]);
      }

      return finish(input, session, [
        "Qual produto você quer ver primeiro? 😊"
      ]);
    }

    if (mentioned && (hasDecision(text) || asksAvailability(text) || normalized.length <= 20)) {
      session.selectedProductId = mentioned.id;
      session.awaitingDeliveryData = true;
      return finish(input, session, [
        `Perfeito, ${mentioned.name.trim()} fica ${formatBRL(mentioned.price)}. Tenho essa opção no catálogo 🌷`,
        session.deliveryDetails ? missingDeliveryFieldsText(session.deliveryDetails) : DELIVERY_FIELDS
      ]);
    }

    if (session.awaitingDeliveryData && currentProduct) {
      if (text) {
        session.deliveryDetails = session.deliveryDetails
          ? `${session.deliveryDetails}\n${text}`
          : text;
      }

      if (!hasEnoughDeliveryData(session.deliveryDetails || "")) {
        return finish(input, session, [missingDeliveryFieldsText(session.deliveryDetails || "")]);
      }

      session.customerName = extractName(session, text);
      session.awaitingDeliveryData = false;
      session.requiresPixIntervention = true;
      session.paymentRequested = false;
      session.automationPaused = true;
      session.status = "pix_pendente";
      return finish(input, session, [PIX_INTERVENTION_MESSAGE]);
    }

    if (currentProduct && hasDecision(text)) {
      session.awaitingDeliveryData = true;
      return finish(input, session, [
        session.deliveryDetails ? missingDeliveryFieldsText(session.deliveryDetails) : DELIVERY_FIELDS
      ]);
    }

    if (asksCatalogAgain(text)) {
      if (/\b(nao gostei|nao curti|nenhuma)\b/.test(normalized)) {
        return finish(input, session, [
          "Sem problema 😊 O catálogo completo ficou na primeira mensagem. Me fala o estilo ou orçamento que eu separo outras 3 opções."
        ]);
      }

      return suggest(input, session, text);
    }

    if (normalized) {
      return suggest(input, session, text);
    }

    return finish(input, session, [
      "Pra eu acertar: é para qual ocasião e quer algo mais romântico, delicado ou alegre? Se tiver orçamento, me fala também 😊"
    ]);
  };
}

module.exports = {
  createEvelyn,
  GREETING,
  DELIVERY_FIELDS,
  PIX_INTERVENTION_MESSAGE,
  pixMessage
};
