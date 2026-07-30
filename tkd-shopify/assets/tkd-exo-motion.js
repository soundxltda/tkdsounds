/**
 * TKD Sounds — camada de motion "Exo" (smooth scroll, reveal on scroll,
 * stagger, contadores, marquee, accordion). Vanilla JS, sem dependências
 * pesadas (só a lib Lenis, self-hosted em assets/lenis.min.js).
 * Tudo aqui respeita prefers-reduced-motion.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------
   * 2) SMOOTH SCROLL (Lenis)
   * ---------------------------------------------------------- */
  function initSmoothScroll() {
    if (reducedMotion || typeof window.Lenis !== 'function') return;

    var lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.tkdLenis = lenis;
  }

  /* ------------------------------------------------------------
   * 4) HERO — stagger por linha/palavra
   * ---------------------------------------------------------- */
  function initHeroStagger() {
    var titles = document.querySelectorAll('[data-tkd-stagger]');
    titles.forEach(function (title) {
      if (title.dataset.tkdStaggerReady) return;
      // Se outro sistema de stagger (tkd-theme.js legado, marcador
      // data-staggered) já processou este título, não mexe: re-dividir
      // o textContent dele perderia os espaços entre as palavras.
      if (title.dataset.staggered) return;
      var text = title.textContent.trim();
      var words = text.split(/\s+/);
      title.textContent = '';
      title.dataset.tkdStaggerReady = 'true';

      var line = document.createElement('span');
      line.className = 'tkd-stagger-line';

      words.forEach(function (word, i) {
        var span = document.createElement('span');
        span.textContent = word;
        span.style.transitionDelay = reducedMotion ? '0ms' : (i * 90) + 'ms';
        line.appendChild(span);
        // Espaço como nó de texto REAL (não margin): o textContent do
        // título continua correto mesmo se outro script reler/reescrever
        if (i < words.length - 1) line.appendChild(document.createTextNode(' '));
      });
      title.appendChild(line);

      if (reducedMotion) {
        title.classList.add('is-in');
        return;
      }

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          title.classList.add('is-in');
        });
      });
    });
  }

  /* ------------------------------------------------------------
   * 5) REVEAL ON SCROLL (+ stagger em grids)
   * ---------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!targets.length) return;

    if (reducedMotion || typeof IntersectionObserver !== 'function') {
      targets.forEach(function (el) {
        el.classList.add('revealed', 'is-in');
      });
      return;
    }

    document.querySelectorAll('.reveal-stagger').forEach(function (group) {
      var items = group.querySelectorAll('.reveal-item');
      items.forEach(function (item, i) {
        item.style.setProperty('--tkd-stagger-i', i);
      });
    });

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed', 'is-in');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------
   * 6) CONTADORES ANIMADOS
   * ---------------------------------------------------------- */
  function easeOutQuad(t) {
    return t * (2 - t);
  }

  function animateCount(el) {
    var target = parseFloat(el.dataset.countTo);
    if (isNaN(target)) return;
    var duration = parseInt(el.dataset.countDuration, 10) || 1800;
    var decimals = (el.dataset.countTo.split('.')[1] || '').length;
    var prefix = el.dataset.countPrefix || '';
    var suffix = el.dataset.countSuffix || '';
    var start = null;

    if (reducedMotion) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var value = target * easeOutQuad(progress);
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    if (typeof IntersectionObserver !== 'function') {
      counters.forEach(animateCount);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------
   * 8) MARQUEE — clona os itens pra loop contínuo (texto e cards)
   * A animação vai de 0 a -50%, então o conteúdo precisa ser sempre
   * um número PAR de cópias do conjunto original; com poucos itens
   * (ex.: 3 kits) duplica de novo até cobrir 2x a largura visível.
   * Clones são decorativos: aria-hidden e sem foco de teclado.
   * ---------------------------------------------------------- */
  function hideCloneFromA11y(node) {
    if (node.nodeType !== 1) return;
    node.setAttribute('aria-hidden', 'true');
    var focusables = node.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    if (node.matches('a, button, input, select, textarea, [tabindex]')) {
      node.setAttribute('tabindex', '-1');
    }
    focusables.forEach(function (el) {
      el.setAttribute('tabindex', '-1');
    });
  }

  function initMarquees() {
    document.querySelectorAll('[data-tkd-marquee]').forEach(function (marquee) {
      var track = marquee.querySelector('.tkd-marquee__track');
      if (!track || track.dataset.tkdCloned) return;
      track.dataset.tkdCloned = 'true';

      var needed = (marquee.clientWidth || window.innerWidth) * 2;
      var guard = 0;
      do {
        var children = Array.prototype.slice.call(track.children);
        children.forEach(function (node) {
          var clone = node.cloneNode(true);
          hideCloneFromA11y(clone);
          track.appendChild(clone);
        });
        guard += 1;
      } while (track.scrollWidth < needed && guard < 6);
    });
  }

  /* ------------------------------------------------------------
   * 4b) ESTEIRA DO HERO — os kits sobem de baixo pra cima em
   * stagger e, quando o último assenta, a esteira começa a
   * deslizar de lado em loop (pausa no hover via CSS).
   * ---------------------------------------------------------- */
  function initHeroStrip() {
    document.querySelectorAll('[data-tkd-hero-strip]').forEach(function (strip) {
      if (strip.dataset.tkdReady) return;
      strip.dataset.tkdReady = 'true';

      var cards = strip.querySelectorAll('.tkd-marquee__card');
      if (!cards.length) return;

      if (reducedMotion) {
        strip.classList.add('is-in', 'is-live');
        return;
      }

      var maxDelay = 0;
      cards.forEach(function (card, i) {
        var delay = Math.min(i, 10) * 80;
        card.style.transitionDelay = delay + 'ms';
        if (delay > maxDelay) maxDelay = delay;
      });

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          strip.classList.add('is-in');
          setTimeout(function () {
            strip.classList.add('is-live');
            cards.forEach(function (card) {
              card.style.transitionDelay = '';
            });
          }, maxDelay + 750);
        });
      });
    });
  }

  /* ------------------------------------------------------------
   * 9) PARALLAX SUTIL — elementos com data-tkd-parallax="0.08"
   * derivam do centro da viewport na velocidade indicada.
   * ---------------------------------------------------------- */
  function initParallax() {
    var els = document.querySelectorAll('[data-tkd-parallax]');
    if (!els.length || reducedMotion) return;

    var items = Array.prototype.map.call(els, function (el) {
      return { el: el, factor: parseFloat(el.dataset.tkdParallax) || 0.08, y: 0 };
    });

    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (item) {
        var rect = item.el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        // rect já inclui o translate atual — remove antes de recalcular
        var baseCenter = rect.top + rect.height / 2 - item.y;
        var delta = (vh / 2 - baseCenter) * item.factor;
        if (Math.abs(delta - item.y) > 0.5) {
          item.y = delta;
          item.el.style.transform = 'translate3d(0, ' + delta.toFixed(1) + 'px, 0)';
        }
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    if (window.tkdLenis) {
      window.tkdLenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ------------------------------------------------------------
   * 10) FAQ ACCORDION — altura animada + ícone
   * ---------------------------------------------------------- */
  function initFaqAccordion() {
    document.querySelectorAll('.tkd-faq__item').forEach(function (details) {
      var summary = details.querySelector('.tkd-faq__q');
      var answer = details.querySelector('.tkd-faq__a');
      if (!summary || !answer || details.dataset.tkdFaqReady) return;
      details.dataset.tkdFaqReady = 'true';

      var inner = document.createElement('div');
      inner.className = 'tkd-faq__a-inner';
      while (answer.firstChild) inner.appendChild(answer.firstChild);
      answer.appendChild(inner);
      inner.style.height = details.open ? 'auto' : '0px';

      var animating = false;

      summary.addEventListener('click', function (event) {
        event.preventDefault();
        if (animating) return;

        if (!details.open) {
          details.open = true;
          if (reducedMotion) {
            inner.style.height = 'auto';
            return;
          }
          var target = inner.scrollHeight;
          inner.style.height = '0px';
          requestAnimationFrame(function () {
            animating = true;
            inner.style.transition = 'height 350ms cubic-bezier(0.16, 1, 0.3, 1)';
            inner.style.height = target + 'px';
          });
          inner.addEventListener('transitionend', function onOpen() {
            inner.removeEventListener('transitionend', onOpen);
            inner.style.height = 'auto';
            animating = false;
          });
        } else {
          if (reducedMotion) {
            details.open = false;
            inner.style.height = '0px';
            return;
          }
          animating = true;
          var current = inner.scrollHeight;
          inner.style.height = current + 'px';
          requestAnimationFrame(function () {
            inner.style.transition = 'height 350ms cubic-bezier(0.16, 1, 0.3, 1)';
            inner.style.height = '0px';
          });
          inner.addEventListener('transitionend', function onClose() {
            inner.removeEventListener('transitionend', onClose);
            details.open = false;
            animating = false;
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------
   * 4) HERO — indicador de scroll (rola uma tela pra baixo)
   * ---------------------------------------------------------- */
  function initScrollCue() {
    document.querySelectorAll('[data-tkd-scroll-cue]').forEach(function (btn) {
      if (btn.dataset.tkdReady) return;
      btn.dataset.tkdReady = 'true';
      btn.addEventListener('click', function () {
        var target = window.scrollY + window.innerHeight * 0.9;
        if (window.tkdLenis) {
          window.tkdLenis.scrollTo(target);
        } else {
          window.scrollTo({ top: target, behavior: reducedMotion ? 'auto' : 'smooth' });
        }
      });
    });
  }

  function init() {
    if (document.body.classList.contains('tkd-motion-ready')) return;
    document.body.classList.add('tkd-motion-ready');

    initSmoothScroll();
    initHeroStagger();
    initReveal();
    initCounters();
    initMarquees();
    initHeroStrip();
    initParallax();
    initFaqAccordion();
    initScrollCue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
