(function () {
  var DEFAULT_CONFIG = {
    branding: {
      siteName: 'Praça Das Flores',
      titleSuffix: 'Floricultura Online',
      description: 'Compre flores, buquês, arranjos, kits e presentes especiais. Pagamento via Pix e atendimento pelo WhatsApp.',
      logoUrl: '/assets/bethyflores/images/praca-das-flores-logo.png',
      bannerUrl: '/assets/bethyflores/images/praca-das-flores-banner.png',
      faviconUrl: '',
      primaryColor: '#9b1f3a'
    },
    contact: {
      whatsappPhone: '5511962158598',
      whatsappDisplay: '(11) 96215-8598',
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
      googleAdsId: ''
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
    if (phone.length === 11) {
      return '55' + phone;
    }
    return phone || DEFAULT_CONFIG.contact.whatsappPhone;
  }

  function whatsappDisplay(config) {
    if (config.contact && config.contact.whatsappDisplay) {
      return config.contact.whatsappDisplay;
    }

    var phone = whatsappPhone(config).replace(/^55/, '');
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
      '@media (max-width: 768px) {',
      'html, body { max-width: 100%; overflow-x: hidden; }',
      'img, iframe, video { max-width: 100%; }',
      '#bethy_whatsapp_buy { box-sizing: border-box; max-width: 100%; }',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function updateLogos(config) {
    var logoUrl = config.branding && config.branding.logoUrl;
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
      reserveBannerSpace(image);
    });

    Array.prototype.forEach.call(document.querySelectorAll('#banner .slider1 li'), function (slide, index) {
      if (index > 0) {
        slide.parentNode.removeChild(slide);
      }
    });
  }

  function reserveBannerSpace(image) {
    function applyHeight() {
      var ratio = image.naturalWidth && image.naturalHeight ? image.naturalHeight / image.naturalWidth : 724 / 2172;
      var baseWidth = image.clientWidth || (image.parentNode && image.parentNode.clientWidth) || 980;
      var height = Math.max(120, Math.round(baseWidth * ratio));
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
    }
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

  function injectGtag(ids) {
    var cleanIds = (ids || []).filter(Boolean);
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
  }

  function applyConfig(config) {
    window.BETHY_SITE_CONFIG = merge(DEFAULT_CONFIG, config || {});
    ready(function () {
      injectResponsiveGuard();
      updateLogos(window.BETHY_SITE_CONFIG);
      updateBanners(window.BETHY_SITE_CONFIG);
      updateWhatsappLinks(window.BETHY_SITE_CONFIG);
      updateTexts(window.BETHY_SITE_CONFIG);
      removeSocialLinks();
      replaceBrandText(window.BETHY_SITE_CONFIG);
      addAnnouncement(window.BETHY_SITE_CONFIG);
    });

    injectFacebookPixel(window.BETHY_SITE_CONFIG.tracking.facebookPixelId);
    injectGoogleTagManager(window.BETHY_SITE_CONFIG.tracking.googleTagManagerId);
    injectGtag([
      window.BETHY_SITE_CONFIG.tracking.googleAnalyticsId,
      window.BETHY_SITE_CONFIG.tracking.googleAdsId
    ]);
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
