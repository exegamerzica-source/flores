function verifyWebhook(req, res, verifyToken) {
  const params = req.query || {};
  const mode = params["hub.mode"];
  const token = params["hub.verify_token"];
  const challenge = params["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(challenge || "");
    return true;
  }

  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Forbidden");
  return false;
}

function parseIncomingMessages(body) {
  const results = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contacts = new Map((value.contacts || []).map((contact) => [
        contact.wa_id,
        contact.profile && contact.profile.name
      ]));

      for (const message of value.messages || []) {
        const mediaPayload = message.image || message.document || message.video || null;
        const text = message.text && message.text.body
          || message.button && message.button.text
          || message.interactive && message.interactive.button_reply && message.interactive.button_reply.title
          || message.interactive && message.interactive.list_reply && message.interactive.list_reply.title
          || mediaPayload && mediaPayload.caption
          || "";

        results.push({
          from: message.from,
          id: message.id,
          timestamp: message.timestamp,
          type: message.type,
          text,
          media: mediaPayload ? {
            id: mediaPayload.id,
            mimeType: mediaPayload.mime_type,
            sha256: mediaPayload.sha256,
            caption: mediaPayload.caption || "",
            filename: mediaPayload.filename || ""
          } : null,
          profileName: contacts.get(message.from) || ""
        });
      }
    }
  }

  return results;
}

async function sendWhatsAppText({ to, text, accessToken, phoneNumberId, graphVersion = "v25.0" }) {
  if (!accessToken || !phoneNumberId) {
    console.warn(`WhatsApp sem credenciais. Mensagem para ${to}: ${text}`);
    return { skipped: true };
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: text,
        preview_url: false
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`Falha ao enviar WhatsApp: ${response.status}`);
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function downloadWhatsAppMedia({ mediaId, accessToken, graphVersion = "v25.0" }) {
  if (!mediaId || !accessToken) return null;

  const infoResponse = await fetch(`https://graph.facebook.com/${graphVersion}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const info = await infoResponse.json().catch(() => ({}));
  if (!infoResponse.ok || !info.url) {
    const error = new Error(`Falha ao obter midia do WhatsApp: ${infoResponse.status}`);
    error.payload = info;
    throw error;
  }

  const mediaResponse = await fetch(info.url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const arrayBuffer = await mediaResponse.arrayBuffer();
  if (!mediaResponse.ok) {
    throw new Error(`Falha ao baixar midia do WhatsApp: ${mediaResponse.status}`);
  }

  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: info.mime_type || mediaResponse.headers.get("content-type") || "application/octet-stream",
    fileSize: info.file_size,
    sha256: info.sha256
  };
}

module.exports = {
  downloadWhatsAppMedia,
  parseIncomingMessages,
  sendWhatsAppText,
  verifyWebhook
};
