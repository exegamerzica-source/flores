(function () {
  var WHATSAPP_PHONE = '5511962158598';

  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function nodeText(node) {
    if (!node) {
      return '';
    }

    return cleanText(node.innerText || node.textContent);
  }

  function absoluteUrl(pathname) {
    try {
      return new URL(pathname || window.location.href, window.location.href).href;
    } catch (error) {
      return window.location.href;
    }
  }

  function pageTitle() {
    var title = cleanText(document.title);
    return title.replace(/\s*\|\s*Bethy Flores.*$/i, '').replace(/\s*-\s*Bethy Flores.*$/i, '');
  }

  function priceFromText(value) {
    var text = cleanText(value);
    var salePrice = text.match(/por\s*(R\$\s*[\d.,]+)/i);
    if (salePrice) {
      return cleanText(salePrice[1]).replace(/R\$\s+/, 'R$');
    }

    var prices = text.match(/R\$\s*[\d.,]+/g);
    return prices && prices.length ? cleanText(prices[prices.length - 1]).replace(/R\$\s+/, 'R$') : '';
  }

  function selectedQuantity() {
    var quantityNode = document.querySelector(
      'input[name="quantidade"], input[name="qtd"], #quantidade, #qtd, .quantidade input'
    );
    var value = quantityNode && cleanText(quantityNode.value);
    return value && /^\d+$/.test(value) ? value : '1';
  }

  function cardInfo(trigger) {
    var card = trigger.closest && trigger.closest('.produtox, .box_produto24');
    if (!card) {
      return null;
    }

    var titleNode = card.querySelector('.nome_produto') || card.querySelector('a[href] img + br + div');
    var linkNode = card.querySelector('a[href^="/"]');
    var priceNode = card.querySelector('.valor_produto') || card.querySelector('.vitrine_preco');

    return {
      title: nodeText(titleNode) || pageTitle() || 'produto',
      url: absoluteUrl(linkNode && linkNode.getAttribute('href')),
      price: priceFromText(nodeText(priceNode)),
      quantity: selectedQuantity()
    };
  }

  function productInfo(trigger) {
    var fromCard = cardInfo(trigger);
    if (fromCard) {
      return fromCard;
    }

    var titleNode =
      document.querySelector('#info_produto > span') ||
      document.querySelector('[itemprop="name"]') ||
      document.querySelector('.produto_nome') ||
      document.querySelector('.nome_produto') ||
      document.querySelector('#nome_produto');

    var priceNode =
      document.querySelector('[itemprop="price"]') ||
      document.querySelector('.valor_produto') ||
      document.querySelector('.preco_produto') ||
      document.querySelector('.preco');

    var productInfoBox = document.getElementById('info_produto');

    return {
      title: nodeText(titleNode) || pageTitle() || 'produto',
      url: absoluteUrl(window.location.href),
      price: priceFromText(nodeText(priceNode) || nodeText(productInfoBox)),
      quantity: selectedQuantity()
    };
  }

  function whatsappUrl(info) {
    var message = [
      'Ola! Quero comprar pelo WhatsApp:',
      'Produto: ' + info.title,
      'Quantidade: ' + (info.quantity || '1'),
      'Valor: ' + (info.price || 'consultar'),
      'Entrega desejada: ainda vou escolher',
      'Link: ' + info.url
    ].join('\n');

    return 'https://api.whatsapp.com/send?phone=' + WHATSAPP_PHONE + '&text=' + encodeURIComponent(message);
  }

  function injectStyles() {
    if (document.getElementById('bethy_whatsapp_sales_style')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'bethy_whatsapp_sales_style';
    style.textContent = [
      '#bethy_whatsapp_buy {',
      '  display: flex !important;',
      '  align-items: center;',
      '  justify-content: center;',
      '  width: 280px;',
      '  min-height: 50px;',
      '  box-sizing: border-box;',
      '  margin: 20px 0 18px 0 !important;',
      '  padding: 13px 22px;',
      '  background: linear-gradient(180deg, #2bd66f 0%, #18b957 100%);',
      '  border: 1px solid #159d4a;',
      '  border-radius: 7px;',
      '  box-shadow: 0 4px 0 #0d7f39;',
      '  color: #fff !important;',
      "  font-family: 'Source Sans Pro', Arial, sans-serif;",
      '  font-size: 18px;',
      '  font-weight: 700;',
      '  line-height: 1.15;',
      '  text-align: center;',
      '  text-decoration: none !important;',
      '  text-shadow: 0 1px 0 rgba(0,0,0,.16);',
      '}',
      '#bethy_whatsapp_buy:hover {',
      '  background: linear-gradient(180deg, #35df78 0%, #16aa50 100%);',
      '  color: #fff !important;',
      '  transform: translateY(1px);',
      '  box-shadow: 0 3px 0 #0d7f39;',
      '}',
      '.bethy-whatsapp-product #bot_delivery,',
      '.bethy-whatsapp-product #div_botao_up,',
      '.bethy-whatsapp-product #div_botao_down,',
      '.bethy-whatsapp-product #divcartao,',
      '.bethy-whatsapp-product #container,',
      '.bethy-whatsapp-product .abanxx {',
      '  display: none !important;',
      '}',
      '#whatsapp-button {',
      '  z-index: 9999;',
      '}',
      '@media screen and (max-width: 540px) {',
      '  #whatsapp-button {',
      '    width: 58px !important;',
      '    height: 58px !important;',
      '    left: 8px !important;',
      '    bottom: 8px !important;',
      '    overflow: hidden;',
      '    border-radius: 50%;',
      '    box-shadow: 0 3px 10px rgba(0,0,0,.24);',
      '    background: #25D366;',
      '  }',
      '  #whatsapp-button img {',
      '    width: 170px !important;',
      '    max-width: none !important;',
      '    height: auto !important;',
      '    margin-left: 0;',
      '    margin-top: 0;',
      '  }',
      '  .bethy-whatsapp-product #whatsapp-button {',
      '    display: none !important;',
      '  }',
      '  #bethy_whatsapp_buy {',
      '    width: 100%;',
      '    max-width: 280px;',
      '  }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
  }

  function buyTrigger(target) {
    if (!target || !target.closest) {
      return null;
    }

    return target.closest(
      '[data-whatsapp-buy], #bot_comprar, #div_botao_up, #comprar2, .comprar_div, a[href*="acessorios_pre"], a[href*="add_carrinho"]'
    );
  }

  function buildProductButton() {
    var productInfoBox = document.getElementById('info_produto');
    var deliveryButton = document.getElementById('bot_delivery');

    if (!productInfoBox || !deliveryButton || document.getElementById('bethy_whatsapp_buy')) {
      return;
    }

    injectStyles();
    document.body.className = cleanText(document.body.className + ' bethy-whatsapp-product');

    var link = document.createElement('a');
    link.id = 'bethy_whatsapp_buy';
    link.href = whatsappUrl(productInfo(link));
    link.setAttribute('data-whatsapp-buy', '1');
    link.textContent = 'Comprar pelo WhatsApp';

    deliveryButton.parentNode.insertBefore(link, deliveryButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
    document.addEventListener('DOMContentLoaded', buildProductButton);
  } else {
    injectStyles();
    buildProductButton();
  }

  document.addEventListener('click', function (event) {
    var trigger = buyTrigger(event.target);
    if (!trigger) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    window.location.href = whatsappUrl(productInfo(trigger));
  }, true);
})();
