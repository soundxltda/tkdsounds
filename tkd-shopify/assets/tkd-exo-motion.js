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
      var text = title.textContent.trim();
      var words = text.split(/\s+/);
      title.textContent = '';
      title.dataset.tkdStaggerReady = 'true';

      var line = document.createElement('span');
      line.className = 'tkd-stagger-line';

      words.forEach(function (word, i) {
        var span = document.createElement('span');
        span.textContent = word + (i < words.length - 1 ? ' ' : '');
        span.style.transitionDelay = reducedMotion ? '0ms' : (i * 90) + 'ms';
        line.appendChild(span);
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
   * 8) MARQUEE — clona os itens pra loop contínuo
   * ---------------------------------------------------------- */
  function initMarquees() {
    document.querySelectorAll('[data-tkd-marquee]').forEach(function (marquee) {
      var track = marquee.querySelector('.tkd-marquee__track');
      if (!track || track.dataset.tkdCloned) return;
      track.dataset.tkdCloned = 'true';

      var originalChildren = Array.prototype.slice.call(track.children);
      originalChildren.forEach(function (node) {
        track.appendChild(node.cloneNode(true));
      });
    });
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
