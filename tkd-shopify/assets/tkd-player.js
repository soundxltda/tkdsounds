/* TKD Sounds — player de áudio global em JavaScript puro.
   Port fiel de AudioContext.tsx + GlobalPlayer.tsx + Waveform.tsx (React)
   para o tema Shopify, sem dependências.

   Contrato de DOM (semeado pelas sections/snippets Liquid):
   - [data-tkd-play]      botão de faixa; carrega data-track-id, data-track-src,
                          data-track-name, data-pack-name, data-pack-url,
                          data-variant-id, data-cover, data-accent
   - [data-tkd-row]       linha clicável que contém um [data-tkd-play]
   - [data-tkd-waveform]  container de waveform; data-for=<track-id|@current>,
                          data-bars=N, data-seek=always|playing
   - [data-tkd-time]      display de tempo; data-for=<track-id>, data-default
   - [data-tkd-vinyl]     capa que gira; data-track-prefix=<product-id>-
   - [data-tkd-player]    barra global fixa (snippet tkd-global-player)

   Regras: um único <audio>, uma faixa por vez, play/pause/seek/progresso/
   duração/volume persistido em localStorage — como no site original. */
(function () {
  'use strict';

  /* tkd-header.liquid substitui sections/header.liquid, que é quem
     normalmente carrega cart-drawer.js (o script que registra o
     <cart-drawer> como popup em vez de navegar pra /cart). Injeta o
     script a partir da própria URL deste arquivo, sem depender de
     outra tag <script> no tema. */
  (function loadCartDrawerScript() {
    if (document.querySelector('script[src*="cart-drawer.js"]')) return;
    var selfSrc = document.currentScript ? document.currentScript.src : '';
    var cartDrawerSrc = selfSrc.replace(/tkd-player\.js(\?.*)?$/, 'cart-drawer.js');
    if (!cartDrawerSrc || cartDrawerSrc === selfSrc) return;
    var s = document.createElement('script');
    s.src = cartDrawerSrc;
    s.defer = true;
    document.head.appendChild(s);
  })();

  var audio = null;
  var currentId = null;      /* faixa tocando agora (null = pausado/nada) */
  var currentInfo = null;    /* última faixa carregada (barra continua visível) */
  var rafId = 0;
  var wobbleT = 0;

  var VOLUME_KEY = 'audio-volume';

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function getVolume() {
    var v = parseFloat(localStorage.getItem(VOLUME_KEY) || '');
    return isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8;
  }

  function setVolume(v) {
    var clamped = Math.min(1, Math.max(0, v));
    if (audio) audio.volume = clamped;
    try { localStorage.setItem(VOLUME_KEY, String(clamped)); } catch (e) { /* ignore */ }
  }

  /* ---------- Waveform (port de Waveform.tsx) ---------- */

  function seededHeights(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      var s = Math.sin(i * 12.9898) * 43758.5453;
      var v = s - Math.floor(s);
      var center = 1 - Math.abs(i - count / 2) / (count / 2);
      arr.push(0.25 + v * 0.55 + center * 0.2);
    }
    return arr;
  }

  function buildWaveform(el) {
    if (el.dataset.built === 'true') return;
    el.dataset.built = 'true';
    var bars = parseInt(el.dataset.bars || '64', 10);
    var heights = seededHeights(bars);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < bars; i++) {
      var bar = document.createElement('span');
      bar.className = 'wave-bar';
      bar.style.transform = 'scaleY(' + heights[i] + ')';
      frag.appendChild(bar);
    }
    el.appendChild(frag);
    el._tkdHeights = heights;

    /* seek por pointer (clique/arrasto) */
    var seekFromEvent = function (clientX) {
      if (!seekAllowed(el)) return;
      var rect = el.getBoundingClientRect();
      var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (audio && isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = ratio * audio.duration;
        render();
      }
    };
    el.addEventListener('pointerdown', function (e) {
      if (!seekAllowed(el)) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      seekFromEvent(e.clientX);
    });
    el.addEventListener('pointermove', function (e) {
      if (!seekAllowed(el)) return;
      if (!el.hasPointerCapture(e.pointerId)) return;
      seekFromEvent(e.clientX);
    });
    el.addEventListener('pointerup', function (e) {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    });
    el.addEventListener('click', function (e) {
      if (seekAllowed(el)) e.stopPropagation();
    });
  }

  function waveformTrackId(el) {
    var id = el.dataset.for;
    if (id === '@current') return currentInfo ? currentInfo.id : null;
    return id;
  }

  function seekAllowed(el) {
    var id = waveformTrackId(el);
    if (!id || !currentInfo || currentInfo.id !== id) return false;
    if (el.dataset.seek === 'always') return true;
    return el.dataset.seek === 'playing' && currentId === id;
  }

  /* ---------- Estado / DOM sync ---------- */

  function ensureAudio() {
    if (audio) return audio;
    audio = document.createElement('audio');
    audio.preload = 'none';
    audio.volume = getVolume();
    document.body.appendChild(audio);
    audio.addEventListener('ended', function () {
      currentId = null;
      audio.currentTime = 0;
      render();
    });
    audio.addEventListener('loadedmetadata', render);
    audio.addEventListener('durationchange', render);
    audio.addEventListener('play', function () { startLoop(); render(); });
    audio.addEventListener('pause', render);
    return audio;
  }

  function infoFromButton(btn) {
    return {
      id: btn.dataset.trackId,
      src: btn.dataset.trackSrc,
      trackName: btn.dataset.trackName || '',
      packName: btn.dataset.packName || '',
      packUrl: btn.dataset.packUrl || '',
      variantId: btn.dataset.variantId || '',
      cover: btn.dataset.cover || '',
      accent: btn.dataset.accent || '#e6a635'
    };
  }

  function play(info) {
    if (!info || !info.src) return;
    var a = ensureAudio();
    var sameSource = a.src === info.src || a.src === new URL(info.src, location.href).href;
    currentInfo = info;
    currentId = info.id;
    if (!sameSource) {
      a.src = info.src;
      a.currentTime = 0;
    }
    a.volume = getVolume();
    var p = a.play();
    if (p && p.catch) {
      p.catch(function (err) {
        console.warn('[tkd-player] play failed', err);
        currentId = null;
        render();
      });
    }
    render();
  }

  function pause() {
    if (audio) audio.pause();
    currentId = null;
    render();
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    currentId = null;
    currentInfo = null;
    render();
  }

  function toggleFromButton(btn) {
    var id = btn.dataset.trackId;
    if (currentId === id) {
      pause();
    } else {
      play(infoFromButton(btn));
    }
  }

  /* ---------- Buy now (adiciona ao carrinho a faixa tocando) ---------- */

  function addCurrentToCart(buyBtn) {
    if (!currentInfo || !currentInfo.variantId || buyBtn.dataset.loading === 'true') return;
    buyBtn.dataset.loading = 'true';
    buyBtn.setAttribute('aria-disabled', 'true');

    var cartEl = document.querySelector('cart-drawer') || document.querySelector('cart-notification');
    var formData = new FormData();
    formData.append('id', currentInfo.variantId);
    formData.append('quantity', '1');
    if (cartEl) {
      formData.append('sections', cartEl.getSectionsToRender().map(function (s) { return s.id; }));
      formData.append('sections_url', window.location.pathname);
      cartEl.setActiveElement(document.activeElement);
    }

    var config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    config.body = formData;

    fetch(window.routes.cart_add_url, config)
      .then(function (response) { return response.json(); })
      .then(function (response) {
        if (response.status) {
          console.warn('[tkd-player] add to cart failed', response.description || response.message);
          return;
        }
        if (cartEl) {
          cartEl.renderContents(response);
          cartEl.classList.remove('is-empty');
        } else {
          window.location = window.routes.cart_url;
        }
      })
      .catch(function (e) { console.error('[tkd-player] add to cart error', e); })
      .finally(function () {
        buyBtn.dataset.loading = 'false';
        buyBtn.removeAttribute('aria-disabled');
      });
  }

  /* ---------- Render ---------- */

  function render() {
    var playing = currentId !== null && audio && !audio.paused;
    var curTime = audio ? audio.currentTime : 0;
    var dur = audio && isFinite(audio.duration) ? audio.duration : 0;
    var progress = dur > 0 && currentInfo ? curTime / dur : 0;

    /* botões de faixa — todo botão cujo track-id bate com a faixa atual
       vira "pause" (ícone + cor), não só o que foi clicado: o mesmo pack
       pode aparecer em vários lugares da página (hero, vault, etc.) e
       todos precisam refletir que está tocando */
    document.querySelectorAll('[data-tkd-play]').forEach(function (btn) {
      var active = playing && btn.dataset.trackId === currentId;
      /* só o data-active: a troca dos ícones play/pause é feita no CSS */
      btn.dataset.active = active ? 'true' : 'false';
      if (btn.hasAttribute('aria-label')) {
        var name = btn.dataset.trackName || 'track';
        btn.setAttribute('aria-label', (active ? 'Pause ' : 'Play ') + name);
      }
    });

    /* waveforms */
    document.querySelectorAll('[data-tkd-waveform]').forEach(function (el) {
      buildWaveform(el);
      var id = waveformTrackId(el);
      var mine = currentInfo && id === currentInfo.id;
      var isAnimated = mine && playing && el.dataset.seek !== 'always';
      el.classList.toggle('is-playing', !!isAnimated);
      var barsEls = el.children;
      var n = barsEls.length;
      var idx = 0;
      if (mine && progress > 0) idx = Math.max(1, Math.ceil(progress * n));
      for (var i = 0; i < n; i++) {
        barsEls[i].classList.toggle('wave-bar--played', i < idx);
        if (!isAnimated) {
          barsEls[i].style.transform = 'scaleY(' + el._tkdHeights[i] + ')';
        }
      }
    });

    /* displays de tempo */
    document.querySelectorAll('[data-tkd-time]').forEach(function (el) {
      var mine = currentInfo && el.dataset.for === currentInfo.id;
      if (mine && dur > 0) {
        el.hidden = false;
        el.textContent = fmt(curTime) + ' / ' + fmt(dur);
      } else if (el.dataset.default) {
        el.hidden = false;
        el.textContent = el.dataset.default;
      } else {
        el.hidden = true;
      }
    });

    /* vinil giratório */
    document.querySelectorAll('[data-tkd-vinyl]').forEach(function (el) {
      var prefix = el.dataset.trackPrefix || '';
      var mine = playing && currentId && prefix && currentId.indexOf(prefix) === 0;
      el.classList.toggle('is-playing', !!mine);
    });

    /* barra global */
    var bar = document.querySelector('[data-tkd-player]');
    if (bar) {
      if (!currentInfo) {
        bar.hidden = true;
        document.body.classList.remove('tkd-player-open');
      } else {
        bar.hidden = false;
        document.body.classList.add('tkd-player-open');

        var toggle = bar.querySelector('[data-tkd-player-toggle]');
        if (toggle) {
          toggle.dataset.active = playing ? 'true' : 'false';
          toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        }

        var cover = bar.querySelector('[data-tkd-player-cover]');
        if (cover) {
          cover.style.background = currentInfo.cover
            ? "center / cover no-repeat url('" + currentInfo.cover + "')"
            : 'radial-gradient(circle at 30% 30%, ' + currentInfo.accent + '88, #0a0704 75%)';
        }

        var trackEl = bar.querySelector('[data-tkd-player-track]');
        if (trackEl) trackEl.textContent = currentInfo.trackName;
        var packEl = bar.querySelector('[data-tkd-player-pack]');
        if (packEl) {
          packEl.textContent = currentInfo.packName ? '> ' + currentInfo.packName : '';
          packEl.hidden = !currentInfo.packName;
        }

        var buy = bar.querySelector('[data-tkd-player-buy]');
        if (buy) buy.hidden = !currentInfo.variantId;

        var curEl = bar.querySelector('[data-tkd-player-current]');
        if (curEl) curEl.textContent = fmt(curTime);
        var durEl = bar.querySelector('[data-tkd-player-duration]');
        if (durEl) durEl.textContent = fmt(dur);

        var vol = bar.querySelector('[data-tkd-player-volume]');
        if (vol && document.activeElement !== vol) vol.value = getVolume();
      }
    }
  }

  /* loop de animação: wobble das waveforms ativas a 60fps; progresso,
     tempos e demais estados a ~4fps (mesma cadência do timeupdate do
     site original) para não varrer o DOM a cada frame */
  var lastRender = 0;
  function startLoop() {
    cancelAnimationFrame(rafId);
    var tick = function (now) {
      var playing = currentId !== null && audio && !audio.paused;
      if (playing) {
        wobbleT += 0.08;
        document.querySelectorAll('[data-tkd-waveform].is-playing').forEach(function (el) {
          var barsEls = el.children;
          var base = el._tkdHeights || [];
          for (var i = 0; i < barsEls.length; i++) {
            var wobble = (Math.sin(wobbleT + i * 0.35) + 1) / 2;
            var h = (base[i] || 0.5) * (0.6 + wobble * 0.6);
            barsEls[i].style.transform = 'scaleY(' + Math.min(1, h) + ')';
          }
        });
        if (now - lastRender > 250) {
          lastRender = now;
          render();
        }
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  /* ---------- Bindings (delegação — sobrevive a reloads do editor) ---------- */

  document.addEventListener('click', function (e) {
    var playBtn = e.target.closest('[data-tkd-play]');
    if (playBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggleFromButton(playBtn);
      return;
    }

    var row = e.target.closest('[data-tkd-row]');
    if (row && !e.target.closest('a')) {
      var btn = row.querySelector('[data-tkd-play]');
      if (btn) toggleFromButton(btn);
      return;
    }

    var toggle = e.target.closest('[data-tkd-player-toggle]');
    if (toggle) {
      if (currentId) pause();
      else if (currentInfo) play(currentInfo);
      return;
    }

    var buy = e.target.closest('[data-tkd-player-buy]');
    if (buy) {
      addCurrentToCart(buy);
      return;
    }

    var close = e.target.closest('[data-tkd-player-close]');
    if (close) stop();
  });

  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-tkd-player-volume]')) {
      setVolume(parseFloat(e.target.value));
    }
  });

  function initWaveforms() {
    document.querySelectorAll('[data-tkd-waveform]').forEach(buildWaveform);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaveforms);
  } else {
    initWaveforms();
  }

  /* Theme Editor: re-inicializa waveforms quando sections recarregam */
  document.addEventListener('shopify:section:load', initWaveforms);
})();
