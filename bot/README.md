# Bot WhatsApp Evelyn

Bot de atendimento para a Beija Flor Floricultura usando a base de produtos local deste projeto.

## O que ele faz

- Recebe mensagens pelo webhook oficial do WhatsApp Cloud API.
- Envia a saudacao inicial com o catalogo uma unica vez.
- Busca produtos e precos reais em `bot/data/products.json`.
- Sugere no maximo 3 produtos por vez, sem links.
- Confirma produto, coleta dados de entrega, envia Pix e aguarda comprovante.
- Mantem sessoes em `bot/data/sessions.json`.
- Entrega um painel em `/admin/` para acompanhar conversas, responder manualmente, pausar automacao e alimentar a base de conhecimento.
- Pausa apenas quando precisa do Pix do Black Cat Pay e volta automaticamente depois que voce envia o Pix pelo painel.
- Baixa fotos/documentos do WhatsApp, salva no historico e pode usar visao via OpenAI para identificar comprovante Pix.

## Como rodar

1. Gere o catalogo:

```bash
npm run build:catalog
```

2. Configure o ambiente:

```bash
copy bot\.env.example bot\.env
```

Preencha `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`.
Preencha tambem `ADMIN_TOKEN`; ele protege o painel e as APIs administrativas.
Para leitura automatica de comprovantes por foto, preencha `OPENAI_API_KEY`.

3. Rode:

```bash
npm start
```

4. No painel da Meta, configure o webhook:

```text
https://seu-dominio.com/webhook
```

Use o mesmo valor de `WHATSAPP_VERIFY_TOKEN`.

5. Acesse o painel:

```text
http://localhost:3000/admin/
```

No servidor publicado, use:

```text
https://seu-dominio.com/admin/
```

## Painel administrativo

O painel permite:

- ver todas as conversas e mensagens;
- pausar ou retomar a automacao por cliente;
- responder manualmente pelo WhatsApp;
- gerar sugestao de resposta;
- usar acoes rapidas, como pedir dados de entrega, enviar Pix e confirmar pagamento;
- cadastrar roteiros/FAQs em "Inteligencia";
- buscar produtos do catalogo;
- regerar o catalogo quando os HTMLs locais forem atualizados.

## Fluxo real do atendimento

1. Cliente chama no WhatsApp.
2. A Meta envia a mensagem para `POST /webhook`.
3. A Evelyn responde a saudacao inicial com o link do catalogo.
4. O cliente fala ocasiao, estilo ou orcamento.
5. A Evelyn sugere ate 3 produtos com nome e preco, sem links.
6. O cliente escolhe uma opcao.
7. A Evelyn confirma produto/preco e pede dados de entrega.
8. Quando o cliente envia os dados, a Evelyn NAO envia Pix automaticamente.
9. Ela responde: "Perfeito, vou gerar o Pix certinho pra voce e ja te envio por aqui 😊".
10. A conversa muda para `Pix pendente`, a automacao pausa somente para esse cliente e o painel destaca que voce precisa intervir.
11. Voce abre o Black Cat Pay, gera o Pix copia e cola no valor exato, cola no campo de resposta do painel e deixa marcado `esta mensagem e o Pix`.
12. Ao enviar, o painel marca como `Aguardando comprovante` e a automacao volta sozinha.
13. Quando o cliente manda foto/documento do comprovante, o bot baixa a midia.
14. Com `OPENAI_API_KEY`, o bot analisa a imagem e confirma apenas se parecer comprovante Pix com boa confianca.
15. Se for comprovante, a Evelyn envia: "Pagamento recebido, [nome]! 💜 Despachando, chega em 30 a 60 min."
16. Se nao parecer comprovante, ela pede para reenviar o comprovante correto.

## Como conectar tudo

### 1. Preparar o projeto

Gere o catalogo:

```bash
npm run build:catalog
```

Copie o arquivo de configuracao:

```bash
copy bot\.env.example bot\.env
```

Preencha no `bot/.env`:

```text
PORT=3000
BASE_URL=https://seu-dominio.com
WHATSAPP_VERIFY_TOKEN=um_token_que_voce_criar
WHATSAPP_ACCESS_TOKEN=token_da_meta
WHATSAPP_PHONE_NUMBER_ID=id_do_numero_do_whatsapp
WHATSAPP_GRAPH_VERSION=v25.0
ADMIN_TOKEN=uma_senha_forte_para_o_painel
OPENAI_API_KEY=sua_chave_openai_para_ler_comprovantes
OPENAI_VISION_MODEL=gpt-5.5
```

### 2. Subir o servidor

Em teste local:

```bash
npm start
```

Em producao, hospede esse projeto em uma VPS, Render, Railway ou outro servidor Node.js com HTTPS.

### 3. Configurar o WhatsApp Cloud API

No painel da Meta:

- crie ou abra seu app;
- conecte o WhatsApp Business;
- pegue o `Phone Number ID` e coloque em `WHATSAPP_PHONE_NUMBER_ID`;
- gere um token permanente ou de sistema e coloque em `WHATSAPP_ACCESS_TOKEN`;
- em Webhooks, use a URL `https://seu-dominio.com/webhook`;
- use o mesmo valor de `WHATSAPP_VERIFY_TOKEN`;
- assine o evento de mensagens.

### 4. Usar o painel

Acesse:

```text
https://seu-dominio.com/admin/
```

Se `ADMIN_TOKEN` estiver configurado, informe esse token ao entrar.

### 5. Operar o Pix Black Cat Pay

Quando uma conversa aparecer como `Enviar Pix` ou `Pix pendente`:

- abra o pedido no painel;
- confira produto, valor e dados de entrega;
- gere o Pix no Black Cat Pay;
- cole o copia e cola no campo de resposta;
- deixe marcado `esta mensagem e o Pix`;
- clique em enviar.

Depois disso, nao precisa continuar manualmente: o bot volta para aguardar o comprovante.

## Teste local

```bash
npm run test:evelyn
```

Com o servidor aberto, tambem da para simular uma conversa:

```bash
curl -X POST http://localhost:3000/test ^
  -H "x-admin-token: seu_admin_token" ^
  -H "Content-Type: application/json" ^
  -d "{\"from\":\"5511999999999\",\"profileName\":\"Ana\",\"text\":\"quero rosas ate 150\"}"
```

## Observacao importante

O bot atende como Evelyn e segue o tom comercial informado, mas quando perguntarem se e robo/IA ele se identifica como assistente de atendimento. Isso evita enganar o cliente e deixa a operacao mais segura.
