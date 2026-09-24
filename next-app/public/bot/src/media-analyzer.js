const fs = require("fs");
const path = require("path");

function extensionFromMime(mimeType) {
  return {
    "application/pdf": ".pdf",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  }[String(mimeType || "").toLowerCase()] || ".bin";
}

function saveMediaFile({ root, messageId, buffer, mimeType }) {
  if (!buffer || !messageId) return null;

  const dir = path.join(root, "bot", "data", "media");
  fs.mkdirSync(dir, { recursive: true });

  const safeName = String(messageId).replace(/[^a-z0-9_.-]/gi, "_");
  const fileName = `${safeName}${extensionFromMime(mimeType)}`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    path: filePath,
    publicUrl: `/media/${fileName}`,
    mimeType
  };
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function outputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;

  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

async function analyzeWithOpenAI({ buffer, mimeType, expectedAmount }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !buffer || !String(mimeType || "").startsWith("image/")) {
    return {
      isPaymentProof: Boolean(buffer),
      confidence: apiKey ? 0.35 : 0.55,
      amount: null,
      paidTo: null,
      payer: null,
      transactionId: null,
      date: null,
      reason: apiKey
        ? "Arquivo recebido, mas o analisador automatico so processa imagens."
        : "OPENAI_API_KEY nao configurada; usando confirmacao por fluxo."
    };
  }

  const model = process.env.OPENAI_VISION_MODEL || "gpt-5.5";
  const imageUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const expected = expectedAmount ? `Valor esperado: R$ ${Number(expectedAmount).toFixed(2)}.` : "Valor esperado desconhecido.";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analise esta imagem de WhatsApp e diga se ela e um comprovante de pagamento Pix brasileiro. ${expected}

Responda somente JSON valido neste formato:
{
  "isPaymentProof": true ou false,
  "confidence": numero de 0 a 1,
  "amount": "valor encontrado ou null",
  "paidTo": "titular/recebedor ou null",
  "payer": "pagador ou null",
  "transactionId": "id/autenticacao/endToEnd ou null",
  "date": "data/hora ou null",
  "reason": "motivo curto em portugues"
}

Se parecer conversa, selfie, produto, foto comum, print sem comprovante ou comprovante ilegivel, use isPaymentProof false.`
            },
            {
              type: "input_image",
              image_url: imageUrl,
              detail: "high"
            }
          ]
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      isPaymentProof: true,
      confidence: 0.45,
      amount: null,
      paidTo: null,
      payer: null,
      transactionId: null,
      date: null,
      reason: `Falha ao analisar imagem automaticamente: ${response.status}`,
      error: payload
    };
  }

  const parsed = extractJson(outputText(payload));
  if (!parsed) {
    return {
      isPaymentProof: true,
      confidence: 0.45,
      amount: null,
      paidTo: null,
      payer: null,
      transactionId: null,
      date: null,
      reason: "Nao foi possivel interpretar a resposta do analisador."
    };
  }

  return {
    isPaymentProof: Boolean(parsed.isPaymentProof),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    amount: parsed.amount || null,
    paidTo: parsed.paidTo || null,
    payer: parsed.payer || null,
    transactionId: parsed.transactionId || null,
    date: parsed.date || null,
    reason: parsed.reason || ""
  };
}

function isConfidentPaymentProof(analysis) {
  if (!analysis) return false;
  return analysis.isPaymentProof && Number(analysis.confidence || 0) >= 0.65;
}

module.exports = {
  analyzeWithOpenAI,
  isConfidentPaymentProof,
  saveMediaFile
};
