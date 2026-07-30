/* TKD Sounds — comportamento de UI (design system v2)
   JS puro, sem dependências. Reveal on scroll, stagger de título,
   contadores animados, estado do header, menu mobile, contador do
   carrinho, countdown e lazy-load de recomendações. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Header: borda ao rolar ---- */
  function initHeaderState() {
    var header = document.querySelector('[data-tkd-header]');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ---- Menu mobile ---- */
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

  /* ---- Reveal on scroll ---- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal:not(.revealed)');
    if (!els.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---- Stagger de palavras nos títulos ---- */
  function splitWords(el) {
    if (el.hasAttribute('data-staggered')) return;
    el.setAttribute('data-staggered', 'true');
    var accentIdx = parseInt(el.getAttribute('data-accent-word') || '-1', 10);
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (word, i) {
      var span = document.createElement('span');
      span.className = 'tkd-word' + (i === accentIdx ? ' tkd-word--accent' : '');
      span.textContent = word;
      span.style.transitionDelay = (i * 70) + 'ms';
      el.appendChild(span);
    });
  }

  function initStagger() {
    var els = document.querySelectorAll('[data-tkd-stagger]:not(.is-in)');
    if (!els.length) return;
    els.forEach(splitWords);
    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---- Contadores animados (tkd-stats) ---- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-tkd-counter')) || 0;
    var decimals = (String(el.getAttribute('data-tkd-counter')).split('.')[1] || '').length;
    var duration = 1600;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var els = document.querySelectorAll('[data-tkd-counter]:not([data-counted])');
    if (!els.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.setAttribute('data-counted', 'true');
        el.textContent = el.getAttribute('data-tkd-counter');
      });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-counted', 'true');
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---- Scroll cue do hero ---- */
  function initScrollCue() {
    document.querySelectorAll('[data-tkd-scroll-cue]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var section = btn.closest('.shopify-section');
        var next = section && section.nextElementSibling;
        if (next) next.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        else window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
      });
    });
  }

  /* ---- Contador do carrinho no header ---- */
  function initCartCount() {
    var els = document.querySelectorAll('[data-tkd-cart-count]');
    if (!els.length) return;
    function render(count) {
      els.forEach(function (el) { el.textContent = String(count); });
    }
    function refresh() {
      fetch(window.Shopify && window.Shopify.routes ? window.Shopify.routes.root + 'cart.js' : '/cart.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) { render(cart.item_count || 0); })
        .catch(function () {});
    }
    if (typeof window.subscribe === 'function' && window.PUB_SUB_EVENTS && window.PUB_SUB_EVENTS.cartUpdate) {
      window.subscribe(window.PUB_SUB_EVENTS.cartUpdate, refresh);
    }
    document.addEventListener('cart:refresh', refresh);
  }

  /* ---- Countdown (landing sections) ---- */
  function initCountdowns() {
    var els = document.querySelectorAll('[data-tkd-countdown]:not([data-armed])');
    if (!els.length) return;
    els.forEach(function (el) {
      el.setAttribute('data-armed', 'true');
      var deadline = new Date(el.getAttribute('data-tkd-countdown')).getTime();
      if (isNaN(deadline)) return;
      var dEl = el.querySelector('[data-tkd-countdown-d]');
      var hEl = el.querySelector('[data-tkd-countdown-h]');
      var mEl = el.querySelector('[data-tkd-countdown-m]');
      var sEl = el.querySelector('[data-tkd-countdown-s]');
      var pad = function (n) { return String(n).padStart(2, '0'); };
      var tick = function () {
        var diff = Math.max(0, deadline - Date.now());
        var d = Math.floor(diff / 86400000);
        var h = Math.floor(diff / 3600000) % 24;
        var m = Math.floor(diff / 60000) % 60;
        var s = Math.floor(diff / 1000) % 60;
        if (dEl) dEl.textContent = pad(d);
        if (hEl) hEl.textContent = pad(h);
        if (mEl) mEl.textContent = pad(m);
        if (sEl) sEl.textContent = pad(s);
        if (diff > 0) setTimeout(tick, 1000);
      };
      tick();
    });
  }

  /* ---- Lazy-load de recomendações (related products) ---- */
  function initRecommendations() {
    var els = document.querySelectorAll('[data-tkd-recommendations]:not([data-loaded])');
    if (!els.length) return;
    function load(el) {
      el.setAttribute('data-loaded', 'true');
      fetch(el.getAttribute('data-url'))
        .then(function (r) { return r.text(); })
        .then(function (text) {
          var html = new DOMParser().parseFromString(text, 'text/html');
          var fresh = html.querySelector('[data-tkd-recommendations]');
          if (fresh && fresh.innerHTML.trim().length) {
            el.innerHTML = fresh.innerHTML;
            initReveal();
          }
        })
        .catch(function () {});
    }
    if (!('IntersectionObserver' in window)) {
      els.forEach(load);
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          load(entry.target);
        }
      });
    }, { rootMargin: '400px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  function init() {
    initHeaderState();
    initMobileMenu();
    initReveal();
    initStagger();
    initCounters();
    initScrollCue();
    initCartCount();
    initCountdowns();
    initRecommendations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Theme Editor: re-inicializa ao recarregar sections */
  document.addEventListener('shopify:section:load', function () {
    initReveal();
    initStagger();
    initCounters();
    initScrollCue();
    initCountdowns();
    initRecommendations();
  });
})();
