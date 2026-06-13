# Bethy Flores

Copia estática do site público da Bethy Flores, preservando visual, imagens, fontes, banners, produtos e links públicos do site original.

## WhatsApp

Os links de WhatsApp da página foram atualizados para `5511962158598`, exibindo `(11) 96215-8598`.

O fluxo de venda também foi direcionado para WhatsApp:

- Botões `Comprar` das vitrines abrem o WhatsApp com nome, preço e link do produto.
- Páginas de produto exibem o botão `Comprar pelo WhatsApp`.
- O botão antigo de compra do produto também é interceptado e redireciona para o WhatsApp.

## Conteúdo espelhado

- Home em `index.html`.
- Categorias e páginas públicas em pastas com `index.html`.
- Arquivos `.asp` públicos salvos como HTML estático, com `.htaccess` para servi-los como `text/html`.
- Fotos, banners, scripts e CSS em `assets/bethyflores/`.

Áreas como login, conta, carrinho e checkout antigo dependem de backend e não foram copiadas como HTML estático.

## Gateway Blackcat

O endpoint `api/blackcatpay.php` faz a chamada server-to-server para a Blackcat Pay sem expor a chave privada no HTML público.

1. Crie um arquivo `.env` na raiz do site usando `.env.example` como modelo.
2. Preencha `BLACKCATPAY_API_KEY` com a chave privada da Blackcat.
3. Opcionalmente preencha `BLACKCATPAY_PUBLIC_KEY` para uso futuro em scripts de checkout.
4. Envie vendas por `POST /api/blackcatpay.php` com o JSON aceito pela Blackcat.
5. Consulte status em `GET /api/blackcatpay.php?action=status&transactionId=ID_DA_TRANSACAO`.

A documentação usada para o endpoint está em https://docs.blackcatpay.com.br/.
