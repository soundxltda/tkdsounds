/* TKD Sounds — comportamento global do tema (vanilla JS, sem dependências).
   Portado de: Navbar.tsx (relógio, menu mobile), useScrollReveal.ts (reveal). */
(function () {
  'use strict';

  /* Relógio SYS://HH:MM:SS na barra de título do header */
  function initClock() {
    var els = document.querySelectorAll('[data-tkd-clock]');
    if (!els.length) return;
    function tick() {
      var d = new Date();
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      var ss = String(d.getSeconds()).padStart(2, '0');
      var t = hh + ':' + mm + ':' + ss;
      els.forEach(function (el) { el.textContent = t; });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* Menu mobile [MENU] */
  function initMobileMenu() {
    var toggle = document.querySelector('[data-tkd-menu-toggle]');
    var panel = document.querySelector('[data-tkd-mobile-menu]');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        panel.setAttribute('hidden', '');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Scroll reveal (IntersectionObserver) */
  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.revealed)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(function (el) { obs.observe(el); });
  }

  /* Contador do carrinho no header — atualiza após add-to-cart sem reload.
     Usa o pub/sub nativo do Refresh quando disponível. */
  function initCartCount() {
    var els = document.querySelectorAll('[data-tkd-cart-count]');
    if (!els.length) return;
    function render(count) {
      els.forEach(function (el) {
        el.textContent = count > 0 ? ' (' + count + ')' : '';
      });
    }
    function refresh() {
      fetch((window.routes && window.routes.cart_url ? window.routes.cart_url : '/cart') + '.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) { render(cart.item_count || 0); })
        .catch(function () {});
    }
    if (typeof window.subscribe === 'function' && window.PUB_SUB_EVENTS && window.PUB_SUB_EVENTS.cartUpdate) {
      window.subscribe(window.PUB_SUB_EVENTS.cartUpdate, refresh);
    }
    document.addEventListener('cart:refresh', refresh);
  }

  /* Contador de urgência das landing pages de produto (tkd-landing-pricing) */
  function initCountdowns() {
    var els = document.querySelectorAll('[data-tkd-countdown]:not([data-armed])');
    if (!els.length) return;
    els.forEach(function (el) {
      el.setAttribute('data-armed', 'true');
      var end = new Date(el.dataset.end).getTime();
      if (!end || isNaN(end)) {
        el.hidden = true;
        return;
      }
      var dEl = el.querySelector('[data-tkd-countdown-d]');
      var hEl = el.querySelector('[data-tkd-countdown-h]');
      var mEl = el.querySelector('[data-tkd-countdown-m]');
      var sEl = el.querySelector('[data-tkd-countdown-s]');
      var pad = function (n) { return String(n).padStart(2, '0'); };
      var tick = function () {
        var diff = end - Date.now();
        if (diff <= 0) {
          el.hidden = true;
          clearInterval(timer);
          return;
        }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        if (dEl) dEl.textContent = pad(d);
        if (hEl) hEl.textContent = pad(h);
        if (mEl) mEl.textContent = pad(m);
        if (sEl) sEl.textContent = pad(s);
      };
      tick();
      var timer = setInterval(tick, 1000);
    });
  }

  /* Produtos relacionados — busca via API nativa de recomendações da
     Shopify quando a seção entra na viewport (mesmo padrão do Dawn). */
  function initRecommendations() {
    var els = document.querySelectorAll('[data-tkd-recommendations]:not([data-loaded])');
    if (!els.length) return;
    function load(el) {
      el.setAttribute('data-loaded', 'true');
      fetch(el.dataset.url)
        .then(function (r) { return r.text(); })
        .then(function (text) {
          var html = document.createElement('div');
          html.innerHTML = text;
          var fresh = html.querySelector('[data-tkd-recommendations]');
          if (fresh && fresh.innerHTML.trim().length) {
            el.innerHTML = fresh.innerHTML;
          }
        })
        .catch(function () {});
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach(load);
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            obs.unobserve(entry.target);
            load(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    els.forEach(function (el) { obs.observe(el); });
  }

  function init() {
    initClock();
    initMobileMenu();
    initReveal();
    initCartCount();
    initRecommendations();
    initCountdowns();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-executa o reveal quando o Theme Editor recarrega sections */
  document.addEventListener('shopify:section:load', function () {
    initReveal();
  });
})();
