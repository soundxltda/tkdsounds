window.tuneboom = window.tuneboom || {};

tuneboom.config = {
  env: 'prod',
  dev: {
    baseUrl: 'https://api.tuneboom.io',
    searchUrl: `/tracks/_search`,
    suggestUrl: `/tracks/suggest`,
    collectionsUrl: `/tracklists/collections`,
    shop: `tuneboom-staging.myshopify.com`,
  },
  prod: {
    baseUrl: 'https://api.tuneboom.io',
    searchUrl: `/tracks/_search`,
    suggestUrl: `/tracks/suggest`,
    collectionsUrl: `/tracklists/collections`,
  }
};


tuneboom.templates = {
  player: `
  <div class="tuneboom">
    <div class="player-footer" id="player-footer">
    <div id="waveform-container">
         <div id="waveform-progress-wrap">
            <div id="waveform-progress"></div>
         <div id="waveform-ticks"></div>
        </div>

          <input id="waveform-overlay" type="range" class="slider-overlay" min="0" max="1" value="0" step="0.0001">
        <div id="waveform"></div>
    </div>
    <div class="row play-bar">
        <div class="col col-sm-3 col-xs-6 d-flex flex-row">
            <div class="button-group">
                <div id="tuneboom-player-previous" class="hidden-sm">
                  <i class="fas fa-step-backward text-white"></i>
                </div>
                <div id="tuneboom-player-play">
                      <i class="fas fa-play text-white"></i>
                </div>
                <div id="tuneboom-player-pause">
                      <i class="fas fa-pause text-white"></i>
                </div>
                <div id="tuneboom-player-next" class="hidden-sm">
                    <i class="fas fa-step-forward text-white"></i>
                </div>
            </div>
            <div class="tuneboom-title text-white">
                <div id="tuneboom-title-text"></div>
                <div id="title-subtitle-text" class="item-text"></div>
            </div>
        </div>
        <div class="col col-md-9 col-sm-9 d-flex flex-row justify-content-end align-items-center">
            <div class="duration-box mr-4 hidden-sm">
                <div id="duration" class="text-white"></div>
                <div id="bpm" class="item-text" align="right"></div>
            </div>
            <div class="hidden-sm">
                <div class="d-flex flex-row align-items-center mr-4">
                    <div class="vol-icon mr-3">
                        <div id="tuneboom-player-mute">
                            <i id="icon-volume-up" class="fas fa-volume-up text-white"></i>
                            <i id="icon-volume-down" class="fas fa-volume-down text-white"></i>
                            <i id="icon-volume-mute" class="fas fa-volume-mute text-white"></i>
                            <i id="icon-volume-off" class="fas fa-volume-off text-white"/>
                        </div>
                    </div>
                    <input id="volume" type="range" class="slider-x" min="0" max="100" step="0.01">
                </div>
            </div>
            <button id="player-add-to-cart" class="btn btn-primary-x float-right" onclick="">
                <i class="fas fa-cart-plus"></i>
                <span id="player-price"></span>
            </button>
        </div>
    </div>
</div>
</div>
  `,
  renderLicenseOverlay: function(track)  {
    const licenseModal = `
        <div id="tuneboom-modal-container" class="tuneboom d-flex justify-content-center align-items-center">
           <div id="tuneboom-modal">
                <div class="row d-flex flex-row align-items-center mb-4">
                    <div class="col-auto">
                        <h3 class="m-0">
                            Pricing & Licenses
                        </h3>
                    </div>
                    <div class="col text-right">
                        <i class="fas fa-times" id="tuneboom-close-modal" onclick="window.tuneboom.templates.hideLicenseOverlay()"></i>
                    </div>
                </div>
                <div id="modal-content">
                    <div class="artwork-container text-center">
                      <div class="artwork" onclick="${track && track.preview.enabled === 'true' ? `window.tuneboom.player.togglePlaySong('${track._id}', '${track.preview.link}')` : ''}">
                        <img class="artwork" src="${track.images.medium}"/>
                        <div class="artwork-overlay d-flex justify-content-center align-items-center">
                            ${track && track.preview.enabled === 'true' ? `
                               <div id="circle-container">
                            <button id="play-modal" class="btn-play">
                              <i class="fas fa-play fa-play"></i>
                            </button>
                            <button id="pause-modal" class="btn-pause">
                              <i class="fas fa-pause"></i>
                            </button>
                          </div>` : ''}

                        </div>
                      </div>
                       <h4 class="mt-2 mb-1 artwork-width">
                           ${track.title}
                       </h4>
                    </div>
                    <div id="licenses-list">
                    </div>
                </div>
             </div>
        </div>`;
    $(licenseModal).appendTo('body').show();
    document.getElementById('tuneboom-close-modal').addEventListener('click', document.getElementById('tuneboom-modal-container').remove);
    document.getElementById('tuneboom-modal-container').classList.add('visible');
  },
  renderLicense: function({defaultPrice, license, shopify}, track){
    const newItem = `
      <div class="license">
          <div class="d-flex flex-row align-items-center justify-content-between">
            <div>
            <h4 class="m-0">${license.title || 'License'}</h4>
              <span class="files-available">
                  ${license.mp3Included ? "Mp3" : ''}
                  ${license.wavIncluded ? "Wav" : ''}
                  ${license.trackStemsIncluded ? "Stems" : ''}
              </span>
            </div>
            <button class="btn float-right" onclick="window.tuneboom.cart.addToCart('${track._id}', '${shopify.variantId}')">
                <i class="fas fa-cart-plus"></i>
                $${defaultPrice.toFixed(2)}
            </button>
          </div>
          <div class="terms d-flex flex-row align-items-center mt-3 collapsible">
              <i class="fas fa-chevron-down mr-2 mt-1"/>
              <span>
                  Show usage terms
              </span>
          </div>
          <div class="collapsed-content">
              <div class="row">
                 <div class="col col-6">
                    <i class="fas fa-microphone-alt mr-2"/>
                   Used for Music Recording
                </div>
                <div class="col col-6">
                  <i class="fas fa-layer-group mr-2"/>
                   Distribute up to ${license.contract.copies} copies
                </div>
              </div>
             <div class="row">
                <div class="col col-6">
                    <i class="fas fa-video mr-2"/>
                   ${license.contract.musicVideo} Music Videos
                </div>
                <div class="col col-6">
                  <i class="fas fa-satellite-dish mr-2"/>
                   ${license.contract.audioStreams} Online Audio Streams
                </div>
              </div>
              <div class="row">
                <div class="col col-6">
                  ${license.contract.performancesProfit ? '<i class="fas fa-hand-holding-usd mr-2"/>' :'<i class="fas fa-hand-holding-heart mr-2"/>' }
                   For ${license.contract.performancesProfit ? '' : 'Non-'}Profit Live Performances
                </div>
                <div class="col col-6">
                    <i class="fas fa-broadcast-tower mr-2"/>
                   ${license.contract.broadcasting ? '' : 'No'} Radio Broadcasting Rights
                </div>
              </div>
        </div>
      </div>`;
    $(newItem).appendTo('#licenses-list').show();
  },
  hideLicenseOverlay: function(){
    document.getElementById('tuneboom-modal-container').remove();
  },
};
tuneboom.utils = {
  buildTuneboomSku: function (type, id, licenseId) {
    switch (type) {
      case 'Digital Track':
        return `tk_${id}_li_${licenseId}`;
      case 'Digital Album':
        return `al_${id}_li_${licenseId}`;
      case 'Digital Soundkit':
        return `so_${id}_li_${licenseId}`
    }
  },
  formatSeconds: function (secs) {
    if (!secs) return null;

    const sec_num = parseInt(secs, 10);
    const hours   = Math.floor(sec_num / 3600);
    const minutes = Math.floor(sec_num / 60) % 60;
    const seconds = sec_num % 60;

    return [hours,minutes,seconds]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v,i) => v !== "00" || i > 0)
      .join(":")
  },
  formatUrlParam: function(params) {
    const urlParams = [];
    params.forEach((val, key) => {
      urlParams.push(`${key}=${val}`)
    });
    return urlParams.join('&');
  },
  debounce: function(func, wait, immediate) {
    let timeout;
    return function () {
      const context = this, args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }
};
tuneboom.cache = {};
tuneboom.cart = {
  addToCart: function(resourceID, variantId){
    $.post('/cart/add.json', { quantity: 1, id: variantId },
      function(variant) {
        document.getElementById(`add-to-cart-id-${resourceID}`).classList.add('light');
        document.getElementById(`add-to-cart-id-${resourceID}`).innerHTML = '<i class="fas fa-check-circle animate__bounceIn mr-1"></i> In cart';
        document.getElementById(`mini-add-to-cart-id-${resourceID}`).innerHTML = '<i class="fas fa-check-circle animate__bounceIn"></i>';

        document.getElementById('tuneboom-modal-container').remove();

      }).fail(function() {
      alert('Failed to add track to cart!');
    });
  }
};
tuneboom.track = {
  openTrackLicenses: function (type, track) {
    window.tuneboom.templates.renderLicenseOverlay(track);
    track.licenses.filter((license) => license.defaultPrice !== null).sort((a,b) => a.defaultPrice - b.defaultPrice).forEach(item => {
      window.tuneboom.templates.renderLicense(item, track)
    });

    const setCollapseTerms = () => {
      const coll = document.getElementsByClassName("collapsible");
      let i;
      for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
          this.classList.toggle("active");
          var content = this.nextElementSibling;
          if (content.style.display === "block") {
            content.style.display = "none";
          } else {
            content.style.display = "block";
          }
        });
      }
    };
    setCollapseTerms();
  },
};
tuneboom.player = {
  wavesurfer: null,
  currentTrack: null,
  previousTrack: null,
  tracksMap: {},
  tracks: [],
  togglePlaySong: function(trackId, trackUrl) {
    // restart song if its the same track being played.
    if (window.tuneboom.player.currentTrack === trackId) {
      window.tuneboom.player.wavesurfer.playPause();
      return;
    }

    if (window.tuneboom.player.currentTrack === null) {
      document.getElementById('player-footer').style.bottom = 0;
    }

    window.tuneboom.player.setCurrentSong(trackId);
    window.tuneboom.player.setPlayerDetails(trackId);
    window.tuneboom.player.wavesurfer.load(trackUrl);
  },
  setCurrentSong: function(trackId) {
    if (window.tuneboom.player.currentTrack) {
      window.tuneboom.player.previousTrack = window.tuneboom.player.currentTrack;
      document.getElementById(`data-track-id-${window.tuneboom.player.currentTrack}`).classList.remove('active');
      document.getElementById(`pause-${window.tuneboom.player.currentTrack}`).style.display = "none";
      document.getElementById(`play-${window.tuneboom.player.currentTrack}`).style.display = "block";
    }
    window.tuneboom.player.currentTrack = trackId;
    document.getElementById(`data-track-id-${trackId}`).classList.add('active');
  },
  setPlayerDetails: function(trackId) {
    const track = window.tuneboom.player.tracksMap[trackId];
    const subTitle = track.collaborators || track?.moods || track.genres;
    document.getElementById('tuneboom-title-text').innerHTML = track.title;
    document.getElementById('title-subtitle-text').innerHTML = subTitle;
    document.getElementById('player-price').innerText = `$${track.minPrice.toFixed(2)}`;

    if (track.type === 'song') {
      document.getElementById("player-add-to-cart").addEventListener('click', () => {
        window.tuneboom.cart.addToCart(track._id, track.shopify.variantID)
      });
      return;
    }
    document.getElementById("player-add-to-cart").addEventListener('click', () => {
      window.tuneboom.track.openTrackLicenses('Digital Track', track);
    });
  },
  setup: function() {
    $(window.tuneboom.templates.player).appendTo('body').show();
    const wavesurfer = WaveSurfer.create({
      container: document.querySelector('#waveform'),
      waveColor: 'none',
      progressColor: 'none',
      cursorColor: 'none',
      backend: 'MediaElement',
      height: 7,
      responsive: true,
      backgroundColor:'none',
    });

    // add the wavesurfer globally.
    window.tuneboom.player.wavesurfer = wavesurfer;
    const playArtwork = document.getElementById("play-artwork");
    const pauseArtwork = document.getElementById("pause-artwork");

    // Track controls
    const trackNext = document.getElementById("tuneboom-player-next");
    const trackPrevious = document.getElementById("tuneboom-player-previous");
    const trackPlay = document.getElementById("tuneboom-player-play");
    const trackPause = document.getElementById("tuneboom-player-pause");

    // wave overlay
    const waveOverlay = document.getElementById("waveform-overlay");
    const waveTicks = document.getElementById("waveform-ticks");
    const waveProgress = document.getElementById("waveform-progress");

    // Volume controls and icons
    const iconVolumeUp = document.getElementById("icon-volume-up");
    const iconVolumeDown = document.getElementById("icon-volume-down");
    const iconVolumeOff = document.getElementById("icon-volume-off");
    const volumeInput = document.querySelector('#volume');
    const iconVolumeMute = document.getElementById("icon-volume-mute");

    // setup listeners
    trackPlay.addEventListener('click', tuneboomPlay);
    trackNext.addEventListener('click', tuneboomNext);
    trackPrevious.addEventListener('click', tuneboomPrevious);
    trackPause.addEventListener('click', tuneboomPause);
    playArtwork.addEventListener('click', tuneboomPlay);
    pauseArtwork.addEventListener('click', tuneboomPause);

    $('#waveform-overlay')
      .on('input', tuneboomSeek)
      .mouseover(() => waveProgress.classList.add('active'))
      .mouseout(() => waveProgress.classList.remove('active'));

    function tuneboomPlay() {
      if (wavesurfer.isPlaying()) {
        return wavesurfer.pause();
      }

      if (window.tuneboom.player.currentTrack === null && window.tuneboom.player.tracks[0]) {
        document.getElementById('player-footer').style.bottom = 0;
        window.tuneboom.player.togglePlaySong(window.tuneboom.player.tracks[0]._id, window.tuneboom.player.tracks[0].preview.link);
        return;
      }
      wavesurfer.play();
    }
    function tuneboomPause() {
      wavesurfer.pause();
    }
    function tuneboomPrevious() {
      const currentIndex = window.tuneboom.player.tracks.findIndex((track) => window.tuneboom.player.currentTrack === track._id);
      const previousTrack = window.tuneboom.player.tracks[currentIndex - 1];
      if (previousTrack) {
        window.tuneboom.player.togglePlaySong(previousTrack._id, previousTrack.preview.link);
      }
    }
    function tuneboomNext() {
      const currentIndex =  window.tuneboom.player.tracks.findIndex((track) => window.tuneboom.player.currentTrack === track._id);
      const nextTrack =  window.tuneboom.player.tracks[currentIndex + 1];
      if (nextTrack) {
        window.tuneboom.player.togglePlaySong(nextTrack._id, nextTrack.preview.link);
      }
    }
    function tuneboomSeek(event) {
      wavesurfer.seekTo(parseFloat(event.target.value));
      updateWaveProgress();
    };

    function tuneboomInit() {
      wavesurfer.setVolume(.5);
      volumeInput.value = wavesurfer.backend.getVolume() * 100;
      volumeInput.style.background = setVolumeGradient(wavesurfer.backend.getVolume());
      volumeInput.addEventListener('input', onChangePlayerVolume);
      volumeInput.addEventListener('change', onChangePlayerVolume)
    }

    wavesurfer.on('ready', function () {
      tuneboomPlay();
    });

    wavesurfer.on('audioprocess', function () {
      updateWaveProgress();
    });

    wavesurfer.on('finish', function () {
      playArtwork.style.display = "flex";
      pauseArtwork.style.display = "none";
      trackPlay.style.display = "block";
      trackPause.style.display = "none";
      if(document.getElementById('play-modal')){
        document.getElementById('play-modal').style.display = 'block';
        document.getElementById('pause-modal').style.display = 'none';
      }
    });

    // Toggle play/pause text
    wavesurfer.on('play', function() {
      trackPlay.style.display = 'none';
      trackPause.style.display = 'block';
      document.getElementById(`pause-${window.tuneboom.player.currentTrack}`).style.display = "block";
      document.getElementById(`play-${window.tuneboom.player.currentTrack}`).style.display = "none";
      playArtwork.style.display = 'none';
      pauseArtwork.style.display = 'flex';
      if(document.getElementById('play-modal')){
        document.getElementById('play-modal').style.display = 'none';
        document.getElementById('pause-modal').style.display = 'block';
      }
    });
    wavesurfer.on('pause', function() {
      console.log(`play-${window.tuneboom.player.currentTrack}\``);
      trackPlay.style.display = 'block';
      trackPause.style.display = 'none';
      document.getElementById(`pause-${window.tuneboom.player.currentTrack}`).style.display = "none";
      document.getElementById(`play-${window.tuneboom.player.currentTrack}`).style.display = "block";
      playArtwork.style.display = 'flex';
      pauseArtwork.style.display = 'none';
      if(document.getElementById('play-modal')){
        document.getElementById('play-modal').style.display = 'block';
        document.getElementById('pause-modal').style.display = 'none';
      }
    });

    // AUDIO PLAYER SCRIPT

    const onChangePlayerVolume = function (e) {
      wavesurfer.setVolume(e.target.value / 100);
      clearIcons();
      if (wavesurfer.getVolume() == 0) iconVolumeOff.style.display = "block";
      if (wavesurfer.getVolume() < .5 && wavesurfer.getVolume() > 0) iconVolumeDown.style.display = "block";
      if (wavesurfer.getVolume() >= .5) iconVolumeUp.style.display = "block";
      volumeInput.style.background = setVolumeGradient(e.target.value / 100);
    };

    const clearIcons = () => {
      iconVolumeUp.style.display = "none";
      iconVolumeDown.style.display = "none";
      iconVolumeOff.style.display = "none";
      iconVolumeMute.style.display = "none";
    };

    const toggleMute = () => {
      clearIcons();
      wavesurfer.toggleMute();

      if (wavesurfer.getMute()) {
        volumeInput.style.background = setVolumeGradient(0);
        volumeInput.value = 0;
        iconVolumeMute.style.display = "block";
      } else {
        volumeInput.style.background = setVolumeGradient(.5);
        volumeInput.value = .5;
        if (wavesurfer.getVolume() < .5) iconVolumeDown.style.display = "block";
        if (wavesurfer.getVolume() >= .5) iconVolumeUp.style.display = "block";
      }
    };
    const updatePlayerTime = () => {
      const timer = new Date(wavesurfer.getCurrentTime() * 1000).toISOString().substr(14, 5);
      const fullTime = new Date((wavesurfer.getDuration() || 0) * 1000).toISOString().substr(14, 5);
      duration.innerHTML = `${timer} / ${fullTime}`;
    };

    const updateWaveProgress = () => {
      const progress = (wavesurfer.getCurrentTime() / wavesurfer.getDuration() || 0);
      waveOverlay.value = progress;
      // offset progress to align with needle
      const tickOffset = (99.5 + progress) - (progress * 100);
      const progressOffset = (progress * 100) + (.5 - progress);
      waveTicks.style.width = `${tickOffset}%`;
      waveProgress.style.width = `${progressOffset}%`;

      updatePlayerTime();
    };

    function setVolumeGradient(val) {
      return 'linear-gradient(to right, white 0%, white ' + val * 100  + '%, #828282 ' + val * 100 + '%, #828282 100%)';
    }

    tuneboomInit();
  }
};
tuneboom.api = {
  searchApi: function (query, offset = 0) {
    const ENV = window.tuneboom.config.env;
    const facetMenu = document.getElementById("collection-filter-menu");
    const resultList = document.getElementById("collection-list__tracks-content");
    const tagsList = document.getElementById("collection-list__tag-wrapper");
    const sortMenu = document.getElementById("collection-list__sort_input");
    const paginationButton = document.getElementById("collection-list-pagination-button");
    const shop = ENV === 'dev' ? window.tuneboom.config.dev.shop : facetMenu.dataset.shopName;
    const request = new XMLHttpRequest();
    const urlParams = new URLSearchParams(window.location.search);

    if (sortMenu.options.length === 0) {
      renderSortMenu(sortMenu);
    }
    if (facetMenu.getElementsByClassName("collection-list__tab-item").length === 0) {
      facetMenu.innerHTML = renderFacetSkeletons(6);
    }

    if (offset > 0) {
      $( "#collection-list__tracks-content" ).append(renderItemSkeletons(5));
    } else {
      resultList.innerHTML = renderItemSkeletons(5);
    }

    urlParams.set('shop', shop);
    urlParams.set('limit', urlParams.get('limit') || '10');
    urlParams.set('offset', offset.toString());

    if (query) {
      urlParams.set('q', query);
    }

    if(urlParams.get('collection') === 'tuneboom') {
      urlParams.delete('collection');
    }

    request.open(
      "GET",
      window.tuneboom.config[ENV].baseUrl + window.tuneboom.config[ENV].searchUrl + "?" + window.tuneboom.utils.formatUrlParam(urlParams)
    );

    request.onload = function () {
      if (request.status > 300) {
        return hideFilterMenu();
      }

      const {total, results, facets, offset, limit} = JSON.parse(request.response);
      const hasSearchResults = total !== 0;

      if (showPagination(total, offset, limit)) {
        paginationButton.style.display = 'flex';
      } else {
        paginationButton.style.display = 'none';
      }

      window.tuneboom.player.tracks.push(...results.filter((track) => track.preview.enabled));
      results.forEach((result) => {
        window.tuneboom.player.tracksMap[result._id] = result;
      });

      // render facets and sort by listing index
      facetMenu.innerHTML = Object.keys(facets)
        .sort((a,b) => facets[a].callback - facets[b].callback) // sort by index
        .filter((key) => !(facets[key].type === 'checkbox' && facets[key].items.length === 0) ) // remove facets with no items
        .map((key) => renderSection(key, facets[key])).join(''); // render menu

      if (hasSearchResults) {
        if (offset) {
          $('#collection-list__tracks-content > .collection-list__tracks-content-item').slice(-5).remove();
          $( "#collection-list__tracks-content" ).append(renderList(results));
        } else {
          resultList.innerHTML = renderList(results);
        }
        renderListListeners();
      } else {
        resultList.innerHTML = renderEmptySearch();
      }
      tagsList.innerHTML = renderTags(facets, urlParams);
      addTagsEventListeners();
      addFacetListeners();
      addPaginationListener(results.length, offset);
    };

    request.onerror = function () {
      hideFilterMenu();
    };

    // Send AJAX request
    request.send();

    const dateFormatter = (newKey, oldDate) => {
      const dateString = oldDate + newKey;
      if (dateString.length === 1 && newKey > 5)
        return '0' + newKey + ':';
      if (dateString.length === 3 && newKey > 5)
        return dateString.substring(0, 2) + ':' + '0' + newKey;
      if (dateString.length < 2)
        return dateString;
      if (dateString.length === 2)
        return dateString + ':' ;
      if (dateString.length > 2 && dateString.length < 4)
        return dateString.substring(0, 2) + ':' + dateString.substring(2, 3);
      return dateString.substring(0, 2) + ':' + dateString.substring(2, 4);
    };

    const addDurationFormatter = (event, selection) => {
      if (event.keyCode === 13) {
        addRangeChangeListener(event, selection);
        return;
      }
      if (event.keyCode === 8) return;

      const isValidInput = /[0-9]|\./;
      if (!isValidInput.test(event.key)) return event.returnValue = false;

      event.returnValue = '';
      selection.value = dateFormatter(event.key, selection.value.replace(':', ''));
    };

    const addFacetListeners = () => {
      const facetSelections = document.querySelectorAll('.col-filter');
      facetSelections.forEach((selection) => {
        const type = selection.dataset.sectionType;
        const sectionName = selection.dataset.sectionName;

        if (type === 'checkbox'){
          selection.addEventListener('change', (event) => addCheckboxListeners(facetSelections, selection));
          return;
        }

        if (type === 'range' && sectionName === 'duration'){
          selection.addEventListener('keydown', (event) => addDurationFormatter(event, selection));
          return;
        }

        if (type === 'range'){
          selection.addEventListener('change', (event) => addRangeChangeListener(event, selection));
          return;
        }
      });
    };
    const addPaginationListener = (results, offset) => {
      $('#collection-list-pagination-button').one('click', () => {
          window.tuneboom.api.searchApi(null, offset + results);
        });
    };

    const resetStateCache = () => {
      window.tuneboom.player.tracksMap = {};
      window.tuneboom.player.tracks = [];
    }

    const addCheckboxListeners = (facetSelections, selection) => {

      let paramParts = [];
      let selectionName = selection.dataset.sectionName;

      facetSelections.forEach((selection) => {
        let localSelectionName = selection.dataset.sectionName;
        if (selectionName !== localSelectionName) {
          return;
        }

        if (selection.checked) {
          paramParts.push(selection.value);
        } else {
          paramParts = paramParts.filter((part) => part !== selection.value);
        }
      });

      if (paramParts.length === 0){
        urlParams.delete(selection.dataset.sectionName);
      } else {
        urlParams.set(selection.dataset.sectionName, paramParts.join(','));
      }
      resetStateCache();
      window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));
      window.tuneboom.api.searchApi();
    };

    const addRangeChangeListener = (event, selection) => {
      let selectionName = selection.dataset.sectionName;

      const rangeSelections = document.querySelectorAll(`.col-filter-${selectionName}`);

      urlParams.delete(selectionName);
      urlParams.set(selectionName, `${rangeSelections[0].value}-${rangeSelections[1].value}` );

      resetStateCache();
      window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));
      window.tuneboom.api.searchApi();
    };

    const addTagsEventListeners = () => {
      const tagsItems = document.querySelectorAll('.collection-list__tag');

      tagsItems.forEach((selection) => {
        const dataParts = selection.dataset.tagItem.split('.');
        const key = dataParts[0];
        const value = dataParts[1];

        selection.addEventListener('click', function () {
          const paramParts = urlParams.get(key).split(',');
          if (paramParts.length === 1) {
            if (key === "collection") {
              document.getElementById("collection-list-hero").style.maxHeight = "0";
            }
            urlParams.delete(key);
          } else {
            const filteredParamParts = paramParts.filter((part) => part !== value);
            if (filteredParamParts.length === 0) {
              urlParams.delete(key);
            } else {
              urlParams.set(key, filteredParamParts.join(','))
            }
          }

          resetStateCache();
          window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));
          window.tuneboom.api.searchApi();
        })
      })
    };

    const hideFilterMenu = () => {
      console.log()
    };

    function renderEmptySearch() {
      return `
        <div class="collection-list__empty-state mt-4">
          <h1>
             No search results found.
          </h1>
          <h4>
          Please try different search criteria
          </h4>
        </div>
      `
    };

    const renderList = (results) => {
      return results.map((result) => renderItem(result)).join('');
    };

    const renderListListeners = () => {
      const buyButtons = document.querySelectorAll('.tuneboom-buy-button');
      const playButtons = document.querySelectorAll('.tracks-content-item_play-button');

      playButtons.forEach((selection) => {
        if (selection.getAttribute('listener') === 'true') return;
        const {trackId, trackPreview} = selection.dataset;
        selection.addEventListener('click', () => window.tuneboom.player.togglePlaySong(trackId, trackPreview));
        selection.setAttribute('listener', 'true');
      });

      buyButtons.forEach((selection) => {
        if (selection.getAttribute('listener') === 'true') return;
        const { trackId } = selection.dataset;
        const track = window.tuneboom.player.tracksMap[trackId];

        selection.setAttribute('listener', 'true');

        if (track.type === 'song') {
          selection.addEventListener('click', () => window.tuneboom.cart.addToCart(track._id, track.shopify.variantID));
          return;
        }
        selection.addEventListener('click', () => window.tuneboom.track.openTrackLicenses('Digital Track', track));
      });
    };

    const capitalize = (s) => {
      if (typeof s !== 'string') return '';
      return s.charAt(0).toUpperCase() + s.slice(1)
    };

    const isFacetSectionInUse = (section) => {
      return window.tuneboom.cache[section];
    };

    const isFacetInUse = (section, facet) => {
      const param = urlParams.get(section);
      if (!param) return false;
      return urlParams.get(section).includes(facet.slug);
    };

    const getRangeValue = (section, defaultVal, index) => {
      if (!urlParams.get(section)) {
        return defaultVal;
      }
      return urlParams.get(section).split('-')[index];
    };

    function renderSortMenu(menu) {
      const menuItems = [
        {
          text: "Most Relevant",
          value: "_score"
        },
        {
          text: "Most Recent",
          value: "createdAt"
        },
        {
          text: "Alphabetical",
          value: "title.sortable"
        },
        {
          text: "BPM (lowest first)",
          value: "bpm"
        },
        {
          text: "BPM (highest first)",
          value: "-bpm"
        },
        {
          text: "Duration (shortest first)",
          value: "duration"
        },
        {
          text: "Duration (longest first)",
          value: "-duration"
        },
      ];

      menuItems.forEach((item) => {
        const option = document.createElement("option");
        option.text = item.text;
        option.value = item.value;
        menu.add(option);
      });
      sortMenu.addEventListener('change', function (item) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('sort');
        urlParams.set('sort', item.target.value);
        window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));
        window.tuneboom.api.searchApi();
      })
    }

    function showPagination(total, offset, limit) {
      if (total > (limit + offset)) {
        return true
      }
      return false
    }

    function renderItemSkeletons(rows) {
      const array = [];
      for(let i = 0; i < rows; i++) {
        array.push(renderSkeleton());
      }
      return array.join('');
    }

    function renderSkeleton() {
      return `
        <div class="collection-list__tracks-content-item" id="skeleton-tracks">
          <div class="row align-items-center flex-nowrap">
            <div class="col-auto" style="width: 75px;">
              <div class="ssc-circle"></div>
            </div>
            <div class="col-6">
              <div class="tracks-content-item__title" style="width: 300px;">
                <div class="ssc-head-line"></div>
              </div>
              <div class="tracks-content-item__artist mt-2" style="width: 150px;">
                <div class="ssc-line"></div>
              </div>
            </div>
            <div class="col-1 d-none d-md-block text-right metadata">
              <div class="ssc-line ml-auto" style="width: 30px;"></div>
            </div>
            <div class="col-1 d-none d-md-block text-right metadata">
              <div class="ssc-line ml-auto" style="width: 30px;"></div>
            </div>
            <div class="col-auto ml-auto d-none d-md-block">
                <div class="ssc-head-line" style="width: 100px; height: 35px;"></div>
            </div>
          </div>
        </div>`
    };

    function renderItem(result) {

      const previewButton = result.preview.enabled ? `
         <div class="tracks-content-item_play-button" data-track-id="${result._id}" data-track-preview="${result.preview.link}">
            <i class="fas fa-play" id="play-${result._id}"></i>
            <i class="fas fa-pause" id="pause-${result._id}"></i>
        </div>  
      ` : '';

      return `
          <div class="collection-list__tracks-content-item" id="data-track-id-${result._id}">
            <div class="row align-items-center flex-nowrap">
              <div class="col-auto" style="width: 75px;">
                ${previewButton}
              </div>
              <div class="col-6">
                <div class="tracks-content-item__title" onclick="window.location.href = '/products/${result.shopify.handle}';">
                  ${result.title}
                </div>
                <div class="tracks-content-item__artist">
                <a class="tracks-content-item__artist-name">${result.collaborators}</a>
                </div>
              </div>
              <div class="col-1 d-none d-md-block text-right metadata">
                ${window.tuneboom.utils.formatSeconds(result.duration) || '00:00'}
              </div>
              <div class="col-1 d-none d-md-block text-right metadata">
                ${result.bpm || 0}
              </div>
               <div class="col-auto ml-auto d-none d-sm-block">
                <div class="tracks-content-item__buy-button tuneboom-buy-button" data-track-id="${result._id}" id="add-to-cart-id-${result._id}">
                    <i class="fas fa-cart-plus mr-2"></i>
                    $${result.minPrice.toFixed(2)}
                </div>
              </div>
              <div class="col-auto ml-auto d-sm-none">
                 <div class="tracks-content-item__buy-button-icon tuneboom-buy-button" data-track-id="${result._id}" id="mini-add-to-cart-id-${result._id}">
                      <i class="fas fa-cart-plus"></i>
                </div>
              </div>
            </div>
          </div>
      `
    }

    function renderRange(section, facet) {
      return `
        <div class="form-input-range py-1">
          <input 
            class="form-check-input collection-list__filters-range col-filter col-filter-${section}"
            data-section-type="${facet.type}" 
            data-section-name="${section}" 
            type="number"
             value="${getRangeValue(section, '0', 0)}"
            ${isFacetInUse(section, facet) ? 'checked' : ''}
            />
           <span class="range-divider">to</span>
           <input 
             class="form-check-input collection-list__filters-range col-filter col-filter-${section}"
             data-section-name="${section}"
             data-section-type="${facet.type}"
             type="number"
             value="${getRangeValue(section, '100', 1)}"
             ${isFacetInUse(section, facet) ? 'checked' : ''}
             />
        </div>
      `;
    }

    function renderDurationRange(section, facet) {
      return `
        <div class="form-input-range py-1">
          <input 
            class="form-check-input collection-list__filters-range col-filter col-filter-duration"
            data-section-type="${facet.type}" 
            data-section-name="${section}" 
            maxlength="5"
            placeholder="00:00"
            type="text"
            value="${getRangeValue(section, '01:00', 0)}"
            ${isFacetInUse(section, facet) ? 'checked' : ''}
            />
           <span class="range-divider">to</span>
           <input 
             class="form-check-input collection-list__filters-range col-filter col-filter-duration"
             data-section-name="${section}"
             data-section-type="${facet.type}"
             type="text"
             placeholder="00:00"
             value="${getRangeValue(section, '10:00', 1)}"
             ${isFacetInUse(section, facet) ? 'checked' : ''}
             />
        </div>
      `;
    }

    function renderCheckbox(section, facet) {
      return `
        <div class="form-check py-1">
          <input 
            class="form-check-input collection-list__filters-checkbox col-filter" 
            type="checkbox" 
            data-section-type="checkbox" 
            data-section-name="${section}" 
            value="${facet.slug}" 
            id="flexCheckDefault-${section}-${facet.slug}"
            ${isFacetInUse(section, facet) ? 'checked' : ''}
            />
          <span class="checkmark"></span>
          <label class="form-check-label collection-list__filters-checkbox-label" for="flexCheckDefault-${section}-${facet.slug}">
            ${facet.name}
            <span class="collection-list__filters-checkbox-count">
            
            </span>
          </label>
        </div>
      `;
    }

    function renderFacetSkeletons(rows) {
      const facetSkeleton = `
      <div class="collection-list__tab-item">
          <div class="collection-list__tab_header p-0">
            <div class="collection-list__tab-text">
              <div class="scc-circle mr-2"></div>
                <div class="ssc-head-line"></div>
            </div>
          </div>
        </div>`;
      const items = [];
      for (let i = 0; i < rows; i++) {
        items.push(facetSkeleton)
      }
      return items.join('');
    }

    function renderSection(section, facet) {
      return `
      <div class="collection-list__tab-item">
          <div class="collection-list__tab_header ${isFacetSectionInUse(section) ? '' : 'collapsed'}" data-toggle="collapse" data-target="#collapse-${section}" aria-expanded="${isFacetSectionInUse(section) ? 'true' : 'false'}" aria-controls="collapse-${section}" onclick="openMenu('${section}')">
            <div class="collection-list__tab-text">
              <h4 class="m-0">${capitalize(section)}</h4>
            </div>
            <div  class="collection-list__tab-icon">
              <i class="fas fa-chevron-up"></i>
            </div>
          </div>
          <div class="collection-list__tab_content collapse ${isFacetSectionInUse(section) ? 'show' : ''}" id="collapse-${section}" aria-labelledby="heading${section}">
           ${renderType(section, facet)}
          </div>
        </div>`
    }

    function renderType(section, facet) {
      switch(facet.type) {
        case "checkbox":
          return facet.items.map((facet) => renderCheckbox(section, facet)).join('');
        case "range":
          if (section === 'duration') {
            return renderDurationRange(section, facet);
          }
          return renderRange(section, facet);
        default:
          return '';
      }
    }

    function renderTags(facets, urlParams) {
      const activeKeys = Object.keys(facets).filter((key) => urlParams.get(key));
      const tags = [];
      activeKeys.forEach((key) => {
        const parts = urlParams.get(key).split(',');
        parts.forEach((part) =>{
          if (facets[key].type === 'checkbox') {
            tags.push(
              {
                key: key,
                slug: part,
                keyName: capitalize(key),
                name: facets[key].items.find((item) => item.slug === part).name
              }
            )
          } else {
            tags.push(
              {
                key: key,
                slug: part,
                keyName: capitalize(key),
                name: urlParams.get(key)
              }
            )
          }
        });
      });

      if (urlParams.get('q')){
        tags.push({key: 'q', slug: null, keyName: 'Search', name: urlParams.get('q')})
      }

      if (urlParams.get('collection')) {
        tags.push({key: 'collection', slug: null, keyName: 'Tracklist', name: urlParams.get('collection')})
      }

      return tags.map((tag) => renderTag(tag)).join('');
    }

    function renderTag(tag) {
      return `
         <div class="collection-list__tag" data-tag-item="${tag.key}.${tag.slug || 'none'}">
              <a class="d-flex justify-content-center align-items-center">
                ${tag.keyName}: ${tag.name}
                <i class="fas fa-times ml-2"></i>
              </a>
        </div>
      `
    }
  },
  suggestTerm: function() {
    const ENV = window.tuneboom.config.env;
    const searchInput = document.getElementById("collection-list_search-input");
    const searchContainer = document.getElementById("collection-list_search-item-container");
    const searchInputWrapper = document.getElementById("collection-list_search-inner-wrapper");

    const shop = ENV === 'dev' ? window.tuneboom.config.dev.shop : searchInput.dataset.shopName;
    const request = new XMLHttpRequest();
    const debouncedRequest = window.tuneboom.utils.debounce(function(e) {
      if (searchInput.value === '' || searchInput.value === null) {
        searchContainer.classList.remove('active');
        searchContainer.style.height = '0px';
        searchContainer.innerHTML = '';
        return;
      }

      if (e.key === 'Enter' || e.keyCode === 13) {
        return window.tuneboom.api.searchApi(searchInput.value);
      }

      request.open("GET", window.tuneboom.config[ENV].baseUrl + window.tuneboom.config[ENV].suggestUrl + `?shop=${shop}&q=` + searchInput.value);

      request.onload = function () {
        const {suggestions} = JSON.parse(request.response);

        if (suggestions.length === 0) {
          searchContainer.classList.remove('active');
          searchContainer.style.height = '0px';
          searchContainer.innerHTML = '';
          return;
        }

        searchContainer.innerHTML = renderSuggestions(suggestions);
        addEventListenersSuggestions();
        searchContainer.classList.add('active');
        searchContainer.style.height = (suggestions.length * 33) + 20 + 'px';
      };

      request.onerror = function () {
      };

      // Send AJAX request
      request.send();
    }, 200);
    searchInput.addEventListener('keydown', debouncedRequest);
    searchInput.addEventListener('click', function () {
      const itemCount = document.querySelectorAll('.collection-list_search-item').length;
      searchInputWrapper.classList.add('active');
      searchInput.classList.add('active');

      if (itemCount === 0) {
        searchContainer.style.height = '0px';
        return;
      }

      searchContainer.style.height = itemCount * 33 + 20 + 'px';
      searchContainer.classList.add('active');
    });
    searchInput.addEventListener('focusout', function (event) {
      if (event.target !== document.activeElement) {
        searchInputWrapper.classList.remove('active');
        searchInput.classList.remove('active');
        searchContainer.classList.remove('active');
        searchContainer.style.height = '0px';
      }
    });

    const addEventListenersSuggestions = () => {
      const selections = document.querySelectorAll('.collection-list_search-item');
      selections.forEach((selection) => {
        selection.addEventListener(('click'), function () {
          const selectionParts = selection.dataset.searchItem.split('.');
          const itemType = selectionParts[0];
          const itemValue = selectionParts[1];
          const urlParams = new URLSearchParams();
          urlParams.set('shop', shop);
          urlParams.set('limit', '5');
          switch(itemType) {
            case "track":
              window.location.href = `/products/${itemValue}`;
              break;
            case "genre":
              urlParams.set('genres', itemValue);
              window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));
              window.tuneboom.api.searchApi();
              break;
            case "mood":
              urlParams.set('moods', itemValue);
              window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));
              window.tuneboom.api.searchApi();
              break;
          }
        })
      })
    };
    const renderSuggestions = (suggestions) => {
      return suggestions.map((item)=> {
        return  `
         <div class="collection-list_search-item" data-search-item="${item.type}.${item.slug || item._id}">
            <div class="collection-list_search-item-highlight">
            ${item.highlight} 
           </div>
          <span class="collection-list_search-item-type ml-2">${item.type}</span>
         </div>
        `
      }).join('');
    }
  },
  getCollections: function() {
    const ENV = window.tuneboom.config.env;
    const request = new XMLHttpRequest();
    const tuneboom = document.getElementById("tuneboom-container");
    const playlists = document.getElementById("collection-list__playlists");
    const shop = ENV === 'dev' ? window.tuneboom.config.dev.shop : tuneboom.dataset.shopName;

    request.open("GET", window.tuneboom.config[ENV].baseUrl + window.tuneboom.config[ENV].collectionsUrl + `?shop=${shop}`);

    request.onload = function () {
      const {docs: collections} = JSON.parse(request.response);

      playlists.innerHTML = renderCollections(collections);
    };

    request.onerror = function () {
    };

    // Send AJAX request
    request.send();

    function renderItem(collection) {
      return `
      <div class="collection-list_playlist-item-container mr-3" onclick="window.location.pathname='/collections/${collection.shopify.handle}'">
        <div class="collection-list_playlist-item-wrapper">
        <div class="collection-list__playlist-item" style="background-image: url(${collection.image})">    
        </div>
        <div class="collection-list__playlist-item-overlay">
            <div>
                <i class="fas fa-music mr-2"></i> <b>${collection.tracks.length} Tracks</b>
            </div>
            
            <h1 class="mt-auto mb-2 tuneboom-truncate-text">${collection.title}</h1>
            <h5 class="m-0 tuneboom-truncate-text">${collection.description}</h5>
        </div>
        </div>
      </div>
     `
    }
    function renderCollections(collections) {
      return collections.map((collection) => renderItem(collection)).join('')
    }
  },
  recommendations: function() {
    // Find the container that will hold the recommendations
    const list = document.querySelector(".product-recommendations__list");
    const header = document.querySelector(".thumbnails-wrapper");
    // Get the base URL for translated product recommendations
    const baseUrl = list.dataset.baseUrl;
    // Get the product ID to request the product recommendations
    const productId = list.dataset.productId;
    // Create an AJAX request
    const request = new XMLHttpRequest();

    request.open(
      "GET",
      baseUrl + ".json?product_id=" + productId + "&limit=3"
    );

    request.onload = function () {
      if (request.status === 404 || request.status === 422) {
        return hideRecommendationsSection();
      }

      var products = JSON.parse(request.response).products;

      if (products.length === 0) {
        return hideRecommendationsSection();
      }

      // Append product recommendations to the DOM.
      list.innerHTML = products.map(function (product) {
        return renderProduct(product)
      }).join("");
    };

    request.onerror = function () {
      hideRecommendationsSection();
    };

    // Send AJAX request
    request.send();

    function hideRecommendationsSection() {
      list.style.display = "none";
      header.style.display = "none";
    }

    function renderProduct(product) {
      return `
    <li class="product-single__thumbnails-item product-single__thumbnails-item--{{ section.settings.media_size }} js"}>
        <a href="/products/${product.handle}"
           class="text-link product-single__thumbnail product-single__thumbnail--{{ section.id }}"
           data-thumbnail-id="{{ section.id }}-${product.id}">
            <div class="product-single__thumbnail-image" style="background-image:url('${product.featured_image})'">
                <div class="product-single__thumbnail-play-button">
                    <i class="fas fa-play fa-play"></i>
                </div>
            </div>
            <h5 class="product-single__thumbnail-title mt-2 mb-1">
                ${product.title}
            </h5>
            <dl class="price price--listing
               ${product.available == false && 'price--sold-out'}
               ${product.compare_at_price > product.price && 'price--on-sale'}
               ${product.price_varies == false && product.compare_at_price_varies ? 'price--on-sale' : ''}"
            >
                <div class="price__regular">
                    <dt>
                        <span class="visually-hidden visually-hidden--inline">${Shopify.formatMoneyTuneboom(product.price, window.moneyFormat || Shopify.money_format)}</span>
                    </dt>
                    <dd>
                      <span class="price-item-sub price-item--regular">
                          ${product.price_varies ? 'From ' + Shopify.formatMoneyTuneboom(product.price_min, window.moneyFormat || Shopify.money_format) : Shopify.formatMoneyTuneboom(product.price, window.moneyFormat || Shopify.money_format)}
                      </span>
                    </dd>
                </div>
                <div class="price__sale">
                    <dt>
                        <span class="visually-hidden visually-hidden--inline">${Shopify.formatMoneyTuneboom(product.compare_at_price, window.moneyFormat || Shopify.money_format)}</span>
                    </dt>
                    <dd>
                  <span class="price-item-sub price-item--sale">
                     ${product.price_varies ? 'From ' + Shopify.formatMoneyTuneboom(product.price_min, window.moneyFormat || Shopify.money_format) : Shopify.formatMoneyTuneboom(product.price, window.moneyFormat || Shopify.money_format)}
                  </span>
                    </dd>
                    <div class="price__compare">
                        <dt>
                            <span class="visually-hidden visually-hidden--inline">${Shopify.formatMoneyTuneboom(product.price, window.moneyFormat || Shopify.money_format)}</span>
                        </dt>
                        <dd>
                            <s class="price-item price-item--regular">
                                ${Shopify.formatMoneyTuneboom(product.compare_at_price, window.moneyFormat || Shopify.money_format)}
                            </s>
                        </dd>
                    </div>
                </div>
                <div class="price__badges price__badges--listing">
                    <span class="price__badge price__badge--sale" aria-hidden="true">
                      <span>On sale!</span>
                    </span>
                    <span class="price__badge price__badge--sold-out">
                      <span>Sold out!</span>
                    </span>
                </div>
            </dl>
        </a>
    </li>
    `
    }
  }
};

tuneboom.collections = {
  setup: function() {
    const tuneboomContainer = document.getElementById("tuneboom-container");
    const collectionButton = document.getElementById("collection-list_collections");
    const collections = document.getElementById("collection-list__playlists");
    const collectionHandle = tuneboomContainer.dataset.collectionHandle;

    console.log(tuneboomContainer);
    // add collection handle to url params
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('collection', collectionHandle);
    window.history.pushState(null, null, "?" +  window.tuneboom.utils.formatUrlParam(urlParams));

    collectionButton.addEventListener('click', openCollections);

    function openCollections() {
      if (collections.classList.contains('active')) {
        collections.classList.remove('active')
      } else {
        collections.classList.add('active')
      }
    }

    window.tuneboom.api.getCollections();
  },
};
tuneboom.playlist = {
  setup: function() {
    const renderListListeners = () => {
      const buyButtons = document.querySelectorAll('.tuneboom-buy-button');
      const playButtons = document.querySelectorAll('.tracks-content-item_play-button');

      playButtons.forEach((selection) => {
        if (selection.getAttribute('listener') === 'true') return;
        const {trackId, trackPreview} = selection.dataset;
        selection.addEventListener('click', () => window.tuneboom.player.togglePlaySong(trackId, trackPreview));
        selection.setAttribute('listener', 'true');
      });

      buyButtons.forEach((selection) => {
        if (selection.getAttribute('listener') === 'true') return;
        const {trackId} = selection.dataset;
        const track = window.tuneboom.player.tracksMap[trackId];

        selection.setAttribute('listener', 'true');

        if (track.licenses.length === 0) {
          selection.addEventListener('click', () => window.tuneboom.cart.addToCart(track._id, track.shopify.variantID));
          return;
        }
        selection.addEventListener('click', () => window.tuneboom.track.openTrackLicenses('Digital Track', track));
      });
    };

    renderListListeners();
  },
};
