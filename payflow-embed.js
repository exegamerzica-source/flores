/**
 * PayFlow Embed â€” v2.0
 * Integre links de pagamento em qualquer site com 2 linhas de cÃ³digo.
 *
 * MODO 1 â€” Slug prÃ©-criado (link jÃ¡ existe no painel):
 *   <button data-payflow-slug="meu-produto-abc12">Pagar</button>
 *
 * MODO 2 â€” DinÃ¢mico (cria o link na hora, ideal para 200+ produtos):
 *   <button data-payflow-product="BuquÃª de Rosas" data-payflow-price="150.00">Pagar</button>
 */
(function () {
  "use strict";

  // â”€â”€â”€ Detecta a origem do script automaticamente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var PAYFLOW_ORIGIN = scriptTag
    ? scriptTag.src.replace(/\/payflow-embed\.js.*$/, "")
    : window.PAYFLOW_ORIGIN || "";

  // â”€â”€â”€ Estilos injetados uma Ãºnica vez â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function injectStyles() {
    if (document.getElementById("payflow-styles")) return;
    var style = document.createElement("style");
    style.id = "payflow-styles";
    style.textContent = [
      ".payflow-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;",
      "padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-size:15px;",
      "font-weight:600;font-family:inherit;text-decoration:none;transition:opacity .15s,transform .1s;",
      "background:var(--payflow-color,#0fcfb0);color:var(--payflow-text,#ffffff);",
      "box-shadow:0 2px 8px rgba(15,207,176,.35);}",
      ".payflow-btn:hover{opacity:.88;transform:translateY(-1px);}",
      ".payflow-btn:active{transform:translateY(0);}",
      ".payflow-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}",
      ".payflow-btn svg{flex-shrink:0;}",

      /* Spinner */
      "@keyframes pf-spin{to{transform:rotate(360deg)}}",
      ".pf-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);",
      "border-top-color:#fff;border-radius:50%;animation:pf-spin .7s linear infinite;flex-shrink:0;}",

      /* Modal overlay */
      "#payflow-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);",
      "z-index:99999;align-items:center;justify-content:center;padding:16px;}",
      "#payflow-overlay.pf-open{display:flex;}",
      "#payflow-modal{background:#fff;border-radius:16px;width:100%;max-width:480px;",
      "height:85vh;max-height:780px;overflow:hidden;display:flex;flex-direction:column;",
      "box-shadow:0 24px 64px rgba(0,0,0,.25);}",
      "#payflow-modal-bar{display:flex;align-items:center;justify-content:space-between;",
      "padding:12px 16px;background:#0fcfb0;color:#fff;border-radius:16px 16px 0 0;}",
      "#payflow-modal-bar span{font-weight:600;font-size:14px;}",
      "#payflow-modal-close{background:none;border:none;color:#fff;cursor:pointer;",
      "font-size:22px;line-height:1;padding:0 4px;}",
      "#payflow-modal-close:hover{opacity:.75;}",
      "#payflow-iframe{flex:1;border:none;width:100%;display:block;}",
    ].join("");
    document.head.appendChild(style);
  }

  // â”€â”€â”€ Ãcone de pagamento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  var ICON_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>';

  // â”€â”€â”€ Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function ensureModal() {
    if (document.getElementById("payflow-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "payflow-overlay";
    overlay.innerHTML = [
      '<div id="payflow-modal">',
      '  <div id="payflow-modal-bar">',
      '    <span>&#128274; Pagamento seguro Â· PayFlow</span>',
      '    <button id="payflow-modal-close" aria-label="Fechar">&times;</button>',
      '  </div>',
      '  <iframe id="payflow-iframe" title="Checkout PayFlow"></iframe>',
      "</div>",
    ].join("");
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    document.getElementById("payflow-modal-close").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  }

  function openModal(url, label) {
    ensureModal();
    var overlay = document.getElementById("payflow-overlay");
    var iframe  = document.getElementById("payflow-iframe");
    var bar     = document.querySelector("#payflow-modal-bar span");
    iframe.src  = url;
    if (bar && label) bar.textContent = "\uD83D\uDD12 " + label + " \u00B7 PayFlow";
    overlay.classList.add("pf-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    var overlay = document.getElementById("payflow-overlay");
    var iframe  = document.getElementById("payflow-iframe");
    if (overlay) overlay.classList.remove("pf-open");
    if (iframe)  iframe.src = "about:blank";
    document.body.style.overflow = "";
  }

  // â”€â”€â”€ Cria link dinamicamente via API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function createDynamicLink(origin, product, price, description, quantity, callback) {
    var apiUrl = origin + "/api/public/create-link";
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_name: product,
        amount: parseFloat(price),
        description: description || "",
        quantity: parseInt(quantity, 10) || 1,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok && data.url) {
          callback(null, data.url);
        } else {
          callback(data.error || "Erro ao criar link", null);
        }
      })
      .catch(function (err) {
        callback(err.message || "Erro de rede", null);
      });
  }

  // â”€â”€â”€ Inicializa um botÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function initButton(el) {
    // Atributos comuns
    var slug        = el.getAttribute("data-payflow-slug");
    var product     = el.getAttribute("data-payflow-product");
    var price       = el.getAttribute("data-payflow-price");
    var description = el.getAttribute("data-payflow-description") || "";
    var quantity    = el.getAttribute("data-payflow-quantity")    || "1";
    var label       = el.getAttribute("data-payflow-label")       || product || "Pagar agora";
    var color       = el.getAttribute("data-payflow-color")       || null;
    var mode        = el.getAttribute("data-payflow-mode")        || "modal";
    var origin      = el.getAttribute("data-payflow-origin")      || PAYFLOW_ORIGIN;

    // Precisa de slug OU de (product + price)
    var isDynamic = !slug && product && price;
    if (!slug && !isDynamic) {
      console.warn("[PayFlow] Informe data-payflow-slug OU data-payflow-product + data-payflow-price em:", el);
      return;
    }

    // Transforma em botÃ£o
    var btn;
    if (el.tagName === "BUTTON" || el.tagName === "A") {
      btn = el;
    } else {
      btn = document.createElement("button");
      el.parentNode.replaceChild(btn, el);
    }

    btn.className = (btn.className ? btn.className + " " : "") + "payflow-btn";
    btn.innerHTML = ICON_SVG + "<span>" + label + "</span>";
    btn.setAttribute("data-payflow-ready", "1");
    if (color) btn.style.setProperty("--payflow-color", color);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;

      // MODO 1 â€” slug jÃ¡ existe
      if (slug) {
        var url = origin + "/pay/" + slug;
        if (mode === "modal")    openModal(url, label);
        else if (mode === "blank") window.open(url, "_blank", "noopener");
        else window.location.href = url;
        return;
      }

      // MODO 2 â€” cria o link dinamicamente
      btn.disabled = true;
      btn.innerHTML = '<span class="pf-spinner"></span><span>Preparando...</span>';

      createDynamicLink(origin, product, price, description, quantity, function (err, url) {
        btn.disabled = false;
        btn.innerHTML = ICON_SVG + "<span>" + label + "</span>";

        if (err) {
          console.error("[PayFlow] Erro ao criar link:", err);
          alert("NÃ£o foi possÃ­vel abrir o pagamento. Tente novamente.");
          return;
        }

        if (mode === "modal")    openModal(url, label);
        else if (mode === "blank") window.open(url, "_blank", "noopener");
        else window.location.href = url;
      });
    });
  }

  // â”€â”€â”€ Inicializa todos os elementos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function init() {
    injectStyles();
    var els = document.querySelectorAll(
      "[data-payflow-slug]:not([data-payflow-ready])," +
      "[data-payflow-product]:not([data-payflow-ready])"
    );
    els.forEach(initButton);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // SPA-friendly: observa novos elementos
  var observer = new MutationObserver(function () { init(); });
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

  // API pÃºblica
  window.PayFlow = {
    open: openModal,
    close: closeModal,
    init: init,
    createAndOpen: function (origin, product, price, label, mode) {
      createDynamicLink(origin, product, price, "", 1, function (err, url) {
        if (err) { console.error("[PayFlow]", err); return; }
        if (mode === "blank") window.open(url, "_blank", "noopener");
        else openModal(url, label || product);
      });
    },
    version: "2.0.0",
  };
})();

