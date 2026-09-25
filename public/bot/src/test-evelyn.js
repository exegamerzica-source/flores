const assert = require("assert");
const fs = require("fs");
const path = require("path");

const { Catalog } = require("./catalog");
const { createEvelyn } = require("./evelyn");
const { SessionStore } = require("./session-store");

const repoRoot = path.resolve(__dirname, "..", "..");
const testSessionPath = path.join(repoRoot, "bot", "data", ".test-sessions.json");

if (fs.existsSync(testSessionPath)) fs.unlinkSync(testSessionPath);

const catalog = Catalog.load();
const store = new SessionStore(testSessionPath);
const evelyn = createEvelyn({ catalog, store });

function send(text, extra = {}) {
  return evelyn({
    from: "5511999999999",
    profileName: "Ana",
    type: "text",
    text,
    ...extra
  });
}

let replies = send("oi");
assert.strictEqual(replies.length, 1);
assert.match(replies[0], /https:\/\/www\.beijaflorfloricultura\.com/);

replies = send("Rua 8, chacara 213, residencial elion, Vicente Pires");
assert.strictEqual(replies.length, 1);
assert.match(replies[0], /Recebi o endere/i);
assert.doesNotMatch(replies[0], /^1\. .+ - R\$/);

replies = send("eu ja mandei meu endereco moca");
assert.strictEqual(replies.length, 1);
assert.match(replies[0], /Recebi o endere/i);
assert.doesNotMatch(replies[0], /^1\. .+ - R\$/);

replies = send("quero flores romanticas ate 150 reais");
assert.strictEqual(replies.length, 1);
assert.doesNotMatch(replies[0], /https?:\/\/|www\./i);
assert.ok(replies[0].split("\n").length <= 3);
assert.match(replies[0], /^1\. .+ - R\$/);

replies = send("quero a opção 1");
assert.ok(replies.some((reply) => /fica R\$/.test(reply)));
assert.ok(replies.some((reply) => /quem envia/i.test(reply)));

replies = send("Quem envia: Ana\nQuem recebe: Julia\nRua das Flores, 123, Centro, CEP 01001-000\nHoje 15h\nCartao: Feliz aniversario");
assert.strictEqual(replies.length, 1);
assert.match(replies[0], /vou gerar o Pix/);
assert.doesNotMatch(replies[0], /https?:\/\/|www\./i);

let session = store.get("5511999999999");
assert.strictEqual(session.requiresPixIntervention, true);
assert.strictEqual(session.automationPaused, true);
assert.strictEqual(session.status, "pix_pendente");

store.update("5511999999999", {
  requiresPixIntervention: false,
  automationPaused: false,
  paymentRequested: true,
  status: "aguardando_pagamento"
});

replies = send("paguei");
assert.match(replies[0], /comprovante do Pix/);

replies = send("segue comprovante", { type: "image", paymentProofDetected: true });
assert.strictEqual(replies[0], "Pagamento recebido, Ana! 💜 Despachando, chega em 30 a 60 min.");

replies = send("aceita cartão?");
assert.match(replies[0], /apenas Pix/);
assert.doesNotMatch(replies[0], /https?:\/\/|www\./i);

if (fs.existsSync(testSessionPath)) fs.unlinkSync(testSessionPath);
console.log("Testes da Evelyn passaram.");
