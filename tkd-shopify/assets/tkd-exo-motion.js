/**
 * TKD Sounds — camada de motion "Exo" (smooth scroll, reveal on scroll,
 * stagger, contadores, marquee, accordion). Vanilla JS, sem dependências
 * pesadas (só a lib Lenis, self-hosted em assets/lenis.min.js).
 * Tudo aqui respeita prefers-reduced-motion.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll é NATIVO de propósito: o tkd-theme.css da loja já usa
     scroll-behavior: smooth, e um smooth scroll de JS (Lenis) por
     cima disputava o controle da rolagem — a página parava no meio
     do caminho e a inércia ficava artificial. */

  /* ------------------------------------------------------------
   * 3b) CENA GRUDADA DA ABERTURA (estilo Exo Audio)
   * Título → Featured Pack → esteira de kits como 3 atos numa tela
   * com scroll travado. O progresso vem da posição do scroll com
   * suavização (lerp), igual ao motor de reveals. Só arma em telas
   * >= 750px e sem prefers-reduced-motion; senão, layout empilhado.
   * ---------------------------------------------------------- */
  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function initHeroScene() {
    var scene = document.querySelector('[data-tkd-scene]');
    if (!scene || scene.dataset.tkdSceneReady) return;
    scene.dataset.tkdSceneReady = 'true';
    if (scene.hasAttribute('data-tkd-scene-disabled')) return;

    var pin = scene.querySelector('[data-tkd-scene-pin]');
    var lTitle = scene.querySelector('[data-tkd-scene-layer="title"]');
    var lFeat = scene.querySelector('[data-tkd-scene-layer="featured"]');
    var lKits = scene.querySelector('[data-tkd-scene-layer="kits"]');
    if (!pin || !lTitle || (!lFeat && !lKits)) return;

    var acts = 1 + (lFeat ? 1 : 0) + (lKits ? 1 : 0);
    var armed = false;
    var running = false;
    var p = 0;
    var kitsUp = false;

    function riseKits() {
      if (kitsUp) return;
      kitsUp = true;
      var strip = scene.querySelector('[data-tkd-hero-strip]');
      if (strip) {
        strip.classList.add('is-in');
        setTimeout(function () {
          strip.classList.add('is-live');
        }, 700);
      }
    }

    function apply() {
      // Janelas dos atos (com featured E kits):
      //   featured entra 0.05–0.42 | título sai 0.10–0.44
      //   featured sai de lado 0.56–0.92 | kits entram 0.56–0.92
      // Sem featured, os kits entram na janela do featured.
      var inA = 0.05, inB = 0.42;
      var outA = 0.56, outB = 0.92;

      var t = clamp01((p - 0.10) / 0.34);
      var te = t * t;
      lTitle.style.opacity = String(1 - te);
      lTitle.style.transform = 'translate3d(0, ' + (-14 * te).toFixed(2) + 'vh, 0) scale(' + (1 - 0.06 * te).toFixed(4) + ')';
      // sem isso, o ato 1 (invisível mas ainda ocupando a tela toda)
      // rouba clique dos CTAs do ato que estiver por cima dele
      lTitle.style.pointerEvents = te > 0.85 ? 'none' : 'auto';

      if (lFeat) {
        var f = clamp01((p - inA) / (inB - inA));
        var fe = 1 - Math.pow(1 - f, 3);
        var g = lKits ? clamp01((p - outA) / (outB - outA)) : 0;
        var ge = g * g * (3 - 2 * g);
        lFeat.style.transform = 'translate3d(' + (-118 * ge).toFixed(2) + 'vw, ' + (100 - 100 * fe).toFixed(2) + 'vh, 0)';
        lFeat.style.pointerEvents = (fe < 0.02 || ge > 0.98) ? 'none' : 'auto';
      }

      if (lKits) {
        var kA = lFeat ? outA : inA;
        var kB = lFeat ? outB : inB;
        var k = clamp01((p - kA) / (kB - kA));
        var ke = 1 - Math.pow(1 - k, 3);
        lKits.style.transform = 'translate3d(0, ' + (62 - 62 * ke).toFixed(2) + 'vh, 0)';
        lKits.style.opacity = String(Math.min(1, k * 1.5).toFixed(3));
        lKits.style.pointerEvents = k < 0.2 ? 'none' : 'auto';
        if (k > 0.25) riseKits();
      }
    }

    function frame() {
      if (!armed) {
        running = false;
        return;
      }
      var rect = scene.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = rect.height - vh;
      var target = total > 0 ? clamp01(-rect.top / total) : 0;

      p += (target - p) * 0.18; // glide: persegue o scroll com suavização
      if (Math.abs(target - p) < 0.0006) p = target;
      apply();

      if (Math.abs(target - p) > 0.0005) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function wake() {
      if (!armed || running) return;
      running = true;
      requestAnimationFrame(frame);
    }

    function headerOffset() {
      // O header é sticky e ocupa espaço real no fluxo antes da cena;
      // sem compensar essa altura, os 100vh do 1º ato centralizam
      // longe do meio real da viewport (ficam empurrados pra baixo).
      var header = document.querySelector('.section-tkd-header');
      return header ? header.getBoundingClientRect().height : 0;
    }

    function arm() {
      armed = true;
      scene.classList.add('is-armed');
      scene.style.height = (acts * 110 + 90) + 'vh';
      scene.style.marginTop = (-headerOffset()) + 'px';
      apply();
      wake();
    }

    function disarm() {
      armed = false;
      scene.classList.remove('is-armed');
      scene.style.height = '';
      scene.style.marginTop = '';
      [lTitle, lFeat, lKits].forEach(function (el) {
        if (el) {
          el.style.transform = '';
          el.style.opacity = '';
          el.style.pointerEvents = '';
        }
      });
      // no layout empilhado a esteira anima do jeito clássico
      riseKits();
    }

    function evaluate() {
      var fits = !reducedMotion && window.innerWidth >= 750;
      if (fits && !armed) arm();
      if (!fits && armed) disarm();
      if (!fits && !armed) riseKits();
    }

    evaluate();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', function () {
      evaluate();
      if (armed) scene.style.marginTop = (-headerOffset()) + 'px';
      wake();
    });
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
   * 5) REVEAL ACOPLADO AO SCROLL (estilo Exo Audio)
   * Em vez de um fade único disparado por observer, cada elemento
   * tem um "progresso" em função da posição do scroll, suavizado
   * com lerp: os blocos ACOMPANHAM a rolagem deslizando pra cima
   * até assentar — rolou devagar, entram devagar; rolou rápido,
   * deslizam com um atraso curto e assentam. Scroll segue nativo.
   * ---------------------------------------------------------- */
  var scrubItems = [];
  var scrubRunning = false;

  function collectScrubTargets() {
    var els = document.querySelectorAll('.reveal:not([data-tkd-scrub]), .reveal-stagger .reveal-item:not([data-tkd-scrub])');
    els.forEach(function (el) {
      el.setAttribute('data-tkd-scrub', '');
      // dentro de marquee os cards são sempre visíveis (os clones nunca
      // seriam observados) — entrega o estado final direto
      if (el.closest('.tkd-marquee')) {
        el.classList.add('revealed', 'is-in');
        return;
      }
      // dentro da cena grudada quem controla opacidade/posição são as
      // camadas da própria cena — elementos entram já visíveis
      if (el.closest('[data-tkd-scene].is-armed')) {
        el.classList.add('revealed', 'is-in');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
        return;
      }
      // neutraliza o sistema antigo (classe .revealed do tkd-theme.js
      // da loja) — o estilo inline do motor manda até o fim
      el.classList.add('revealed');
      el.style.transition = 'none';
      // stagger espacial: irmãos na mesma fileira entram em cascata
      var off = 0;
      if (el.parentElement) {
        var sib = el.parentElement.children;
        var idx = Array.prototype.indexOf.call(sib, el);
        if (idx > 0) off = (idx % 3) * 0.07;
      }
      scrubItems.push({ el: el, p: 0, y: 0, off: off, done: false });
    });
  }

  function scrubFrame() {
    var vh = window.innerHeight;
    var pending = false;

    scrubItems.forEach(function (it) {
      if (it.done) return;

      var rect = it.el.getBoundingClientRect();
      if (rect.height === 0) return; // oculto (ex.: display none)

      var top = rect.top - it.y; // remove o translate aplicado pelo motor
      var raw = (vh * 0.95 - top) / (vh * 0.5) - it.off;
      raw = Math.max(0, Math.min(1, raw));
      // acompanha o scroll na entrada; passado 35% da janela, completa
      // sozinho — nada fica estacionado semi-transparente na tela
      if (raw > 0.35) raw = 1;

      // só mantém o loop acordado enquanto algo estiver em movimento;
      // itens parados fora da tela esperam o próximo scroll
      if (Math.abs(raw - it.p) > 0.001) pending = true;

      it.p += (raw - it.p) * 0.16; // glide: persegue o alvo com suavização

      if (it.p > 0.995 && raw >= 1) {
        it.done = true;
        it.el.style.opacity = '';
        it.el.style.transform = '';
        it.el.style.transition = '';
        it.el.classList.add('is-in');
        return;
      }

      var eased = 1 - Math.pow(1 - it.p, 3);
      var ty = (1 - eased) * 56;
      it.y = ty;
      it.el.style.opacity = Math.min(1, eased * 1.08).toFixed(3);
      it.el.style.transform = 'translate3d(0, ' + ty.toFixed(2) + 'px, 0)';
    });

    if (pending) {
      requestAnimationFrame(scrubFrame);
    } else {
      scrubRunning = false;
    }
  }

  function wakeScrub() {
    if (scrubRunning) return;
    scrubRunning = true;
    requestAnimationFrame(scrubFrame);
  }

  // força uma nova passada mesmo se uma rAF de uma leitura antiga (e
  // possivelmente errada) ainda estiver de pé — usado só na re-conferência
  // pós window.load, pra não ficar refém da guarda de reentrância normal
  function forceWakeScrub() {
    scrubRunning = false;
    wakeScrub();
  }

  function initReveal() {
    var targets = document.querySelectorAll('.reveal, .reveal-stagger, .reveal-stagger .reveal-item');
    if (!targets.length) return;

    if (reducedMotion) {
      targets.forEach(function (el) {
        el.classList.add('revealed', 'is-in');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    document.querySelectorAll('.reveal-stagger').forEach(function (group) {
      group.classList.add('is-in');
    });

    collectScrubTargets();
    window.addEventListener('scroll', wakeScrub, { passive: true });
    window.addEventListener('resize', wakeScrub);
    wakeScrub();

    // initReveal roda no DOMContentLoaded — nesse momento o "boot" do
    // CRT (#MainContent, animação crt-boot no tkd-theme.css) ainda pode
    // estar espremendo o conteúdo em Y (scaleY indo de 0.02 até 1), e
    // fontes podem não ter carregado ainda — a medida acima captura
    // esse layout transitório e nada mais re-mede depois, então itens
    // acima da dobra podem ficar presos invisíveis. Reforça a
    // conferência depois que o boot termina (e por garantia, depois de
    // 1s mesmo que ele não exista ou não dispare o evento).
    var mainContent = document.getElementById('MainContent');
    if (mainContent) {
      mainContent.addEventListener('animationend', forceWakeScrub, { once: true });
    }
    if (document.readyState === 'complete') {
      setTimeout(forceWakeScrub, 50);
    } else {
      window.addEventListener('load', forceWakeScrub, { once: true });
    }
    setTimeout(forceWakeScrub, 1000);
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

      cards.forEach(function (card, i) {
        card.style.transitionDelay = Math.min(i, 10) * 80 + 'ms';
      });

      // dentro da cena grudada quem dispara a subida é a própria cena
      // (initHeroScene → riseKits), no ato certo do scroll
      if (strip.closest('[data-tkd-scene].is-armed')) return;

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          strip.classList.add('is-in');
          setTimeout(function () {
            strip.classList.add('is-live');
          }, 1550);
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

    window.addEventListener('scroll', onScroll, { passive: true });
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
        window.scrollTo({ top: target, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  function init() {
    if (document.body.classList.contains('tkd-motion-ready')) return;
    document.body.classList.add('tkd-motion-ready');

    initHeroScene();
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
