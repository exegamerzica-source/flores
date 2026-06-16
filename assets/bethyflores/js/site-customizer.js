(function () {
  var BRAND_HEADER_COLOR = '#3b0f1f';
  var BRAND_HEADER_SHADOW = '0 2px 0 rgba(155,31,58,.45)';
  var FLOATING_WHATSAPP_ICON = '/assets/bethyflores/images/whatsapp-floating.png';

  var DEFAULT_CONFIG = {
    branding: {
      siteName: 'Praça Das Flores',
      titleSuffix: 'Floricultura Online',
      description: 'Compre flores, buquês, arranjos, kits e presentes especiais. Pagamento via Pix e atendimento pelo WhatsApp.',
      logoUrl: '/assets/bethyflores/images/praca-das-flores-logo-header.png',
      headerLogoUrl: '/assets/bethyflores/images/praca-das-flores-logo-header.png',
      bannerUrl: '/assets/bethyflores/images/praca-das-flores-banner.png',
      faviconUrl: '',
      primaryColor: BRAND_HEADER_COLOR
    },
    contact: {
      whatsappPhone: '551635130795',
      whatsappDisplay: '(16) 3513 - 0795',
      email: 'contato@pracadasflores.com.br',
      instagramUrl: '',
      facebookUrl: ''
    },
    sales: {
      whatsappButtonLabel: 'Comprar pelo WhatsApp',
      paymentLabel: 'Pagamento via PIX',
      deliveryText: 'ainda vou escolher',
      quantityDefault: 1,
      showFloatingWhatsapp: true
    },
    tracking: {
      facebookPixelId: '1787878781386472',
      googleTagManagerId: '',
      googleAnalyticsId: '',
      googleAdsId: 'AW-18243160605',
      googleAdsPageViewSendTo: '',
      googleAdsPageViewConversionLabel: ''
    },
    store: {
      legalName: 'Praça Das Flores',
      cnpj: '54.476.973/0001-20',
      address: 'Pc. Dr. João Batista Vasques, nº1 - São Paulo - SP',
      deliveryEstimate: '30-60 minutos',
      sameDayCutoff: '18:00',
      deliveryAreas: 'São Paulo e região',
      substitutionPolicy: 'Na falta de alguma flor ou embalagem, substituímos por item equivalente ou de maior valor.'
    },
    announcement: {
      enabled: false,
      text: 'Flores frescas e presentes especiais com entrega rápida.',
      link: ''
    }
  };

  function merge(base, update) {
    var output = {};
    Object.keys(base || {}).forEach(function (key) {
      var value = base[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        output[key] = merge(value, update && update[key]);
      } else {
        output[key] = update && update[key] !== undefined ? update[key] : value;
      }
    });

    Object.keys(update || {}).forEach(function (key) {
      if (output[key] === undefined) {
        output[key] = update[key];
      }
    });

    return output;
  }

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function whatsappPhone(config) {
    var phone = digits(config.contact && config.contact.whatsappPhone);
    if (phone.length === 10 || phone.length === 11) {
      return '55' + phone;
    }
    return phone || DEFAULT_CONFIG.contact.whatsappPhone;
  }

  function whatsappDisplay(config) {
    if (config.contact && config.contact.whatsappDisplay) {
      return config.contact.whatsappDisplay;
    }

    var phone = whatsappPhone(config).replace(/^55/, '');
    if (phone.length === 10) {
      return '(' + phone.slice(0, 2) + ') ' + phone.slice(2, 6) + ' - ' + phone.slice(6);
    }
    if (phone.length === 11) {
      return '(' + phone.slice(0, 2) + ') ' + phone.slice(2, 7) + '-' + phone.slice(7);
    }
    return phone;
  }

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setMeta(name, content) {
    if (!content) {
      return;
    }

    var meta = document.querySelector('meta[name="' + name + '"]') || document.createElement('meta');
    meta.setAttribute('name', name);
    meta.setAttribute('content', content);
    if (!meta.parentNode) {
      document.head.appendChild(meta);
    }
  }

  function setFavicon(url) {
    if (!url) {
      return;
    }

    var link = document.querySelector('link[rel~="icon"]') || document.createElement('link');
    link.rel = 'icon';
    link.href = url;
    if (!link.parentNode) {
      document.head.appendChild(link);
    }
  }

  function injectResponsiveGuard() {
    if (document.getElementById('bethy_responsive_guard')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'bethy_responsive_guard';
    style.textContent = [
      '#headerxx, .headerxx, #header_bfb, #header_sticky, #nacho { background:' + BRAND_HEADER_COLOR + ' !important; }',
      '#headerxx { box-shadow:' + BRAND_HEADER_SHADOW + '; }',
      '#nacho { height:2px !important; }',
      '#logoB, #logosticky { background:none !important; object-fit:contain !important; display:block !important; }',
      '#logoB { width:210px !important; height:98px !important; }',
      '#logosticky { width:142px !important; height:54px !important; }',
      '#logodesk { box-sizing:border-box !important; display:flex !important; align-items:center !important; justify-content:center !important; }',
      '#banner, #banner_home123 { display:block !important; overflow:hidden !important; background:#fff4f6 !important; }',
      '#banner { border-radius:0 0 8px 8px; box-shadow:0 8px 24px rgba(59,15,31,.10); }',
      '#banner .bx-wrapper, #banner .bx-viewport, #banner .slider1, #banner .slider1 li { left:0 !important; transform:none !important; width:100% !important; }',
      '#banner img, #banner_home123 img, img.swipe { display:block !important; width:100% !important; max-width:100% !important; object-fit:cover !important; object-position:center center !important; }',
      '#banner img, #banner img.swipe { height:100% !important; }',
      '#whatsapp-button { position:fixed !important; left:18px !important; bottom:18px !important; width:66px !important; height:66px !important; overflow:visible !important; border-radius:999px !important; background:#25D366 !important; box-shadow:0 8px 22px rgba(0,0,0,.25) !important; z-index:99999 !important; display:flex !important; align-items:center !important; justify-content:center !important; border:2px solid rgba(255,255,255,.9) !important; transition:transform .16s ease, box-shadow .16s ease; }',
      '#whatsapp-button:hover { transform:translateY(-2px); box-shadow:0 11px 26px rgba(0,0,0,.28) !important; }',
      '#whatsapp-button img { display:block !important; width:64px !important; height:64px !important; max-width:none !important; object-fit:contain !important; margin:0 !important; border:0 !important; }',
      '@media (min-width: 580px) {',
      '#header_bfb { min-height:112px; padding:5px 0 !important; }',
      '#logodesk { width:32% !important; min-height:102px !important; float:left !important; padding:0 5px !important; margin:0 !important; }',
      '#logoB { width:218px !important; height:102px !important; margin:0 auto !important; }',
      '#banner { margin-top:0 !important; }',
      '#banner { height:280px !important; }',
      '#banner .bx-wrapper, #banner .bx-viewport, #banner .slider1, #banner .slider1 li { height:280px !important; min-height:280px !important; }',
      '}',
      '@media (min-width: 980px) {',
      '#logoB { width:224px !important; height:104px !important; }',
      '#logodesk { min-height:104px !important; }',
      '#banner { height:300px !important; }',
      '#banner .bx-wrapper, #banner .bx-viewport, #banner .slider1, #banner .slider1 li { height:300px !important; min-height:300px !important; }',
      '}',
      '@media (max-width: 768px) {',
      'html, body { max-width: 100%; overflow-x: hidden; }',
      'img, iframe, video { max-width: 100%; }',
      '#bethy_whatsapp_buy { box-sizing: border-box; max-width: 100%; }',
      '}',
      '@media (max-width: 579px) {',
      '#headerxx { min-height:92px !important; height:94px !important; }',
      '#header_bfb { min-height:92px !important; height:92px !important; position:relative; box-sizing:border-box; }',
      '#bannerxx { margin-top:94px !important; }',
      '#conteudo { margin-top:94px !important; }',
      'body.bethy-home #conteudo { margin-top:0 !important; }',
      'body.bethy-home #produto_wrapper { padding-top:10px !important; }',
      'body.bethy-home .link_colecao { font-size:18px !important; line-height:25px !important; white-space:nowrap !important; }',
      '#logodesk { position:absolute; left:14px; top:10px; transform:none; float:none !important; clear:none !important; width:156px !important; height:72px !important; margin:0 !important; padding:0 !important; z-index:1; }',
      '#logoB { width:156px !important; height:72px !important; margin:0 !important; }',
      '#banner { width:100% !important; height:180px !important; margin-top:0 !important; }',
      '#banner .bx-wrapper, #banner .bx-viewport, #banner .slider1, #banner .slider1 li { height:180px !important; min-height:180px !important; }',
      '#whatsapp-button { width:60px !important; height:60px !important; left:12px !important; bottom:12px !important; }',
      '#whatsapp-button img { width:58px !important; height:58px !important; }',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function markPageType() {
    var isHome = !!(document.getElementById('banner') && document.getElementById('escolha_pre'));
    document.body.classList.toggle('bethy-home', isHome);
  }

  function updateLogos(config) {
    var logoUrl = config.branding && (config.branding.headerLogoUrl || config.branding.logoUrl);
    if (!logoUrl) {
      return;
    }

    Array.prototype.forEach.call(document.querySelectorAll('#logoB, #logosticky'), function (logo) {
      logo.src = logoUrl;
      logo.alt = config.branding.siteName || DEFAULT_CONFIG.branding.siteName;
      logo.title = config.branding.siteName || DEFAULT_CONFIG.branding.siteName;
      logo.style.background = 'none';
      logo.style.objectFit = 'contain';
      logo.style.maxWidth = '100%';
      logo.removeAttribute('width');
      logo.removeAttribute('height');
    });
  }

  function updateBanners(config) {
    var bannerUrl = config.branding && config.branding.bannerUrl;
    if (!bannerUrl) {
      return;
    }

    var bannerSelectors = [
      '#banner img',
      '#banner_home123 img',
      '.banner_home',
      '.banner_colecao',
      '.bannerzinho',
      '.banner_touch',
      'img.swipe'
    ].join(',');

    Array.prototype.forEach.call(document.querySelectorAll(bannerSelectors), function (image) {
      if (image.className && String(image.className).indexOf('bx-clone') !== -1) {
        return;
      }
      image.src = bannerUrl;
      image.alt = config.branding.siteName || DEFAULT_CONFIG.branding.siteName;
      image.title = config.branding.siteName || DEFAULT_CONFIG.branding.siteName;
      image.style.display = 'block';
      image.style.width = '100%';
      image.style.height = 'auto';
      image.style.objectFit = 'cover';
      image.style.maxWidth = '100%';
      if (image.parentNode && image.parentNode.tagName === 'A') {
        image.parentNode.href = '/';
      }
      if (image.closest && image.closest('#banner')) {
        image.style.height = '100%';
        image.style.objectFit = 'cover';
        image.style.objectPosition = 'center center';
      }
      reserveBannerSpace(image);
    });

    Array.prototype.forEach.call(document.querySelectorAll('#banner .bx-clone'), function (clone) {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('#banner .slider1 li'), function (slide, index) {
      if (index > 0) {
        slide.parentNode.removeChild(slide);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll('#banner .slider1, #banner .bx-viewport, #banner .bx-wrapper'), function (node) {
      node.style.left = '0';
      node.style.transform = 'none';
      node.style.width = '100%';
      node.style.maxWidth = '100%';
    });
  }

  function reserveBannerSpace(image) {
    function applyHeight() {
      var baseWidth = image.clientWidth || (image.parentNode && image.parentNode.clientWidth) || 980;
      var isHomeBanner = image.closest && image.closest('#banner');
      var height = Math.max(120, Math.round(baseWidth * 724 / 2172));
      if (isHomeBanner) {
        if (baseWidth >= 960) {
          height = 300;
        } else if (baseWidth >= 580) {
          height = 280;
        } else {
          height = Math.max(170, Math.min(190, Math.round(baseWidth * 0.46)));
        }
      }
      var banner = image.closest && image.closest('#banner, #banner_home123');
      var wrapper = image.closest && image.closest('.bx-wrapper');
      var viewport = image.closest && image.closest('.bx-viewport');
      var slider = image.closest && image.closest('.slider1');
      var slide = image.closest && image.closest('li');

      [banner, wrapper, viewport, slider, slide].forEach(function (node) {
        if (node) {
          node.style.height = height + 'px';
          node.style.minHeight = height + 'px';
        }
      });
    }

    if (image.complete) {
      applyHeight();
    } else {
      image.addEventListener('load', applyHeight, { once: true });
    }
    setTimeout(applyHeight, 300);
  }

  function removeSocialLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"]'), function (link) {
      link.parentNode.removeChild(link);
    });

    Array.prototype.forEach.call(document.querySelectorAll('#facebook, #instagram'), function (node) {
      var wrapper = node.closest ? node.closest('a') : null;
      (wrapper || node).parentNode.removeChild(wrapper || node);
    });

    Array.prototype.forEach.call(document.querySelectorAll('#fique'), function (node) {
      var section = node.parentNode;
      if (section && section.parentNode) {
        section.parentNode.removeChild(section);
      }
    });
  }

  function replaceBrandText(config) {
    var siteName = config.branding.siteName || DEFAULT_CONFIG.branding.siteName;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    var node;

    while ((node = walker.nextNode())) {
      nodes.push(node);
    }

    nodes.forEach(function (textNode) {
      textNode.nodeValue = textNode.nodeValue
        .replace(/Bethy Flores/gi, siteName)
        .replace(/\bBethy\b/gi, siteName);
    });
  }

  function updateWhatsappLinks(config) {
    var phone = whatsappPhone(config);
    var display = whatsappDisplay(config);

    Array.prototype.forEach.call(document.querySelectorAll('a[href*="whatsapp"], a[href*="api.whatsapp.com"]'), function (link) {
      var message = '';
      try {
        message = new URL(link.href).searchParams.get('text') || '';
      } catch (error) {
        message = '';
      }

      link.href = 'https://api.whatsapp.com/send?phone=' + phone + (message ? '&text=' + encodeURIComponent(message) : '');
      if (/^\(?\d{2}\)?/.test((link.textContent || '').trim())) {
        link.textContent = display;
      }
    });

    var floating = document.getElementById('whatsapp-button');
    if (floating) {
      floating.style.display = config.sales && config.sales.showFloatingWhatsapp === false ? 'none' : '';
      floating.href = 'https://api.whatsapp.com/send?phone=' + phone;
      var icon = floating.querySelector('img');
      if (icon) {
        icon.src = FLOATING_WHATSAPP_ICON;
        icon.alt = 'WhatsApp';
      }
    }
  }

  function tuneCollectionHeadings() {
    Array.prototype.forEach.call(document.querySelectorAll('.link_colecao'), function (link) {
      var text = (link.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^Queridinhos da Pra(?:ç|Ã§)a Das Flores$/i.test(text)) {
        link.textContent = 'Queridinhos da Praça';
      }
    });
  }

  function updateTexts(config) {
    var brand = config.branding || {};
    var siteName = brand.siteName || DEFAULT_CONFIG.branding.siteName;
    var suffix = brand.titleSuffix || '';
    var title = siteName + (suffix ? ' | ' + suffix : '');

    document.title = title;
    setMeta('description', brand.description);
    setFavicon(brand.faviconUrl);

    Array.prototype.forEach.call(document.querySelectorAll('.vitrine_parcelamento'), function (node) {
      node.textContent = config.sales.paymentLabel || DEFAULT_CONFIG.sales.paymentLabel;
    });

    Array.prototype.forEach.call(document.querySelectorAll('#bethy_whatsapp_buy'), function (node) {
      node.textContent = config.sales.whatsappButtonLabel || DEFAULT_CONFIG.sales.whatsappButtonLabel;
    });

    Array.prototype.forEach.call(document.querySelectorAll('#disclaimer1'), function (node) {
      var parts = [];
      if (config.store.legalName) parts.push(config.store.legalName);
      if (config.store.cnpj) parts.push('CNPJ: ' + config.store.cnpj);
      if (config.store.address) parts.push(config.store.address);
      if (parts.length) {
        var contact = node.querySelector('#disclaimer3');
        node.firstChild.nodeValue = parts.join(' | ') + '\n    ';
        if (contact && config.contact.email) {
          var emailLink = contact.querySelector('a');
          if (emailLink) {
            emailLink.href = 'mailto:' + config.contact.email;
            emailLink.textContent = config.contact.email;
          }
        }
      }
    });
  }

  function addAnnouncement(config) {
    var data = config.announcement || {};
    var old = document.getElementById('bethy_announcement_bar');
    if (old) {
      old.parentNode.removeChild(old);
    }

    if (!data.enabled || !data.text) {
      return;
    }

    var bar = document.createElement(data.link ? 'a' : 'div');
    bar.id = 'bethy_announcement_bar';
    bar.textContent = data.text;
    if (data.link) {
      bar.href = data.link;
    }
    bar.style.cssText = [
      'display:block',
      'padding:9px 12px',
      'background:' + (config.branding.primaryColor || '#88a800'),
      'color:#fff',
      'font:600 14px Source Sans Pro,Arial,sans-serif',
      'text-align:center',
      'text-decoration:none',
      'position:relative',
      'z-index:10000'
    ].join(';');
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function injectFacebookPixel(id) {
    if (!id || window.__bethyFacebookPixelLoaded) {
      return;
    }
    window.__bethyFacebookPixelLoaded = true;
    !function(f,b,e,v,n,t,s) {
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
      t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function injectGoogleTagManager(id) {
    if (!id || window.__bethyGtmLoaded) {
      return;
    }
    window.__bethyGtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function trackingValue(value) {
    return String(value || '').trim();
  }

  function extractGoogleAdsSendTo(value) {
    var text = trackingValue(value);
    if (!text) {
      return '';
    }

    var match = text.match(/AW-[0-9]+\/[A-Za-z0-9_-]+/);
    return match ? match[0] : text;
  }

  function extractGoogleAdsId(value) {
    var match = trackingValue(value).match(/AW-[0-9]+/);
    return match ? match[0] : trackingValue(value);
  }

  function normalizeGtagId(value) {
    var text = trackingValue(value);
    if (text.indexOf('AW-') !== -1) {
      return extractGoogleAdsId(text);
    }
    return text;
  }

  function googleAdsPageViewSendTo(config) {
    var tracking = config.tracking || {};
    var explicitSendTo = extractGoogleAdsSendTo(tracking.googleAdsPageViewSendTo);
    if (explicitSendTo) {
      return explicitSendTo;
    }

    var adsId = extractGoogleAdsId(tracking.googleAdsId);
    var label = trackingValue(tracking.googleAdsPageViewConversionLabel).replace(/^\/+/, '');
    if (adsId && label) {
      return adsId + '/' + label;
    }

    return '';
  }

  function googleAdsPageViewTarget(config) {
    var sendTo = googleAdsPageViewSendTo(config);
    if (sendTo) {
      return {
        eventName: 'conversion',
        sendTo: sendTo
      };
    }

    var tracking = (config && config.tracking) || {};
    var adsId = extractGoogleAdsId(tracking.googleAdsId);
    if (!adsId) {
      return null;
    }

    return {
      eventName: 'page_view',
      sendTo: adsId
    };
  }

  function trackGoogleAdsPageView(config) {
    var target = googleAdsPageViewTarget(config);
    if (!target || !target.sendTo || !window.gtag) {
      return;
    }

    window.__bethyGoogleAdsPageViewSent = window.__bethyGoogleAdsPageViewSent || {};
    var cacheKey = target.eventName + ':' + target.sendTo;
    if (window.__bethyGoogleAdsPageViewSent[cacheKey]) {
      return;
    }

    window.__bethyGoogleAdsPageViewSent[cacheKey] = true;
    window.gtag('event', target.eventName, {
      send_to: target.sendTo,
      page_path: window.location.pathname,
      page_title: document.title
    });
  }

  function injectGtag(ids, config) {
    var conversionSendTo = googleAdsPageViewSendTo(config || {});
    var cleanIds = (ids || []).map(normalizeGtagId).filter(Boolean);
    var conversionAdsId = extractGoogleAdsId(conversionSendTo);
    if (conversionAdsId && cleanIds.indexOf(conversionAdsId) === -1) {
      cleanIds.push(conversionAdsId);
    }
    if (!cleanIds.length) {
      return;
    }
    window.__bethyGtagConfigured = window.__bethyGtagConfigured || {};
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!window.__bethyGtagLoaded) {
      window.__bethyGtagLoaded = true;
      window.gtag('js', new Date());
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cleanIds[0]);
      document.head.appendChild(script);
    }
    cleanIds.forEach(function (id) {
      if (!window.__bethyGtagConfigured[id]) {
        window.__bethyGtagConfigured[id] = true;
        window.gtag('config', id);
      }
    });

    trackGoogleAdsPageView(config || {});
  }

  function applyConfig(config) {
    window.BETHY_SITE_CONFIG = merge(DEFAULT_CONFIG, config || {});
    ready(function () {
      markPageType();
      injectResponsiveGuard();
      updateLogos(window.BETHY_SITE_CONFIG);
      updateBanners(window.BETHY_SITE_CONFIG);
      updateWhatsappLinks(window.BETHY_SITE_CONFIG);
      updateTexts(window.BETHY_SITE_CONFIG);
      removeSocialLinks();
      replaceBrandText(window.BETHY_SITE_CONFIG);
      tuneCollectionHeadings();
      addAnnouncement(window.BETHY_SITE_CONFIG);
    });

    injectFacebookPixel(window.BETHY_SITE_CONFIG.tracking.facebookPixelId);
    injectGoogleTagManager(window.BETHY_SITE_CONFIG.tracking.googleTagManagerId);
    injectGtag([
      window.BETHY_SITE_CONFIG.tracking.googleAnalyticsId,
      window.BETHY_SITE_CONFIG.tracking.googleAdsId
    ], window.BETHY_SITE_CONFIG);
    document.dispatchEvent(new CustomEvent('bethy:config-ready', { detail: window.BETHY_SITE_CONFIG }));
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (response) {
      if (!response.ok) {
        throw new Error('Config indisponivel');
      }
      return response.json();
    });
  }

  window.BETHY_SITE_DEFAULT_CONFIG = DEFAULT_CONFIG;
  window.BETHY_SITE_CONFIG = DEFAULT_CONFIG;

  fetchJson('/api/admin-config')
    .catch(function () {
      return fetchJson('/site-config.json');
    })
    .then(applyConfig)
    .catch(function () {
      applyConfig(DEFAULT_CONFIG);
    });
})();
