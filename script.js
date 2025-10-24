/* =============================================
   Navigace – hamburger
============================================= */
(() => {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('active'));
    });
  }
})();

/* =============================================
   Audio – jednotný přehrávač s více UI vstupy
   – zvládá: top bar ovládání, hero tlačítko, 
     kategoriální seznam skladeb (jak-to-funguje)
============================================= */
class AudioController {
  constructor(config) {
    // playlisty podle kategorií (mohou se rozšířit)
    this.catalog = config?.catalog || {
      pop: [
        { title: 'Popová píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3' },
        { title: 'Popová píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3' },
        { title: 'Popová píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3' }
      ],
      akusticka: [
        { title: 'Akustická píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3' },
        { title: 'Akustická píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3' },
        { title: 'Akustická píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3' }
      ],
      detska: [
        { title: 'Dětská píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3' },
        { title: 'Dětská píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3' },
        { title: 'Dětská píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3' }
      ],
      svatebni: [
        { title: 'Svatební píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3' },
        { title: 'Svatební píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3' },
        { title: 'Svatební píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3' }
      ]
    };

    // výchozí stav
    this.category = Object.keys(this.catalog)[0] || 'pop';
    this.queue = [...(this.catalog[this.category] || [])];
    this.index = 0;
    this.isPlaying = false;
    this.isMuted = false;

    // Audio element (instancujeme jen jednou)
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    // === UI uzly – jsou volitelné, proto vždy ověřujeme ===
    // Hlavní/hero ovládání
    this.el = {
      play: document.getElementById('play-btn') || null,
      prev: document.getElementById('prev-btn') || null,
      next: document.getElementById('next-btn') || null,
      mute: document.getElementById('mute-btn') || null,
      heroPlay: document.getElementById('hero-play-btn') || null,
      hide: document.getElementById('hide-player') || null,
      floatBtn: document.getElementById('floating-audio-btn') || null,
      playerWrap: document.getElementById('audio-player') || null,
      progress: document.getElementById('progress-bar') || null,
      curTime: document.getElementById('current-time') || null,
      duration: document.getElementById('duration') || null,
      title: document.querySelector('.track-title') || null,
      meta: document.querySelector('.track-meta') || null
    };

    // Top player
    this.top = {
      prev: document.getElementById('tp-prev') || null,
      play: document.getElementById('tp-play') || null,
      next: document.getElementById('tp-next') || null,
      title: document.getElementById('tp-title') || null,
      tabsWrap: document.getElementById('tp-tabs') || null
    };

    // Jak-to-funguje (seznam + záložky)
    this.list = {
      root: document.getElementById('music-player') || null,
      tracks: document.getElementById('tracks-list') || null,
      categoryTabs: Array.from(document.querySelectorAll('.category-tab'))
    };

    this._bindCoreEvents();
    this._bindUiEvents();
    this._renderCategory(this.category); // naplní UI (title, list, tabs)
    this._loadAndMaybeAutoplay(false);
  }

  /* -----------------------------
     Vnitřní pomocné funkce
  ----------------------------- */
  _fmt(sec) {
    if (!Number.isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  _currentTrack() {
    return this.queue[this.index];
  }

  _syncButtonsPlayingState() {
    const playing = this.isPlaying;
    const setText = (btn, playTxt = '▶', pauseTxt = '⏸') => { if (btn) btn.textContent = playing ? pauseTxt : playTxt; };
    setText(this.el.play);
    setText(this.el.heroPlay, '▶ Přehrát ukázky', '⏸ Pozastavit');
    setText(this.top.play);

    // zvýraznění položek v seznamu
    if (this.list.tracks) {
      this.list.tracks.querySelectorAll('.track-item').forEach((item, i) => {
        const btn = item.querySelector('.track-play-btn');
        if (!btn) return;
        if (i === this.index && playing) {
          btn.textContent = '⏸';
          item.classList.add('playing');
        } else {
          btn.textContent = '▶';
          item.classList.remove('playing');
        }
      });
    }
  }

  _updateMetaUi() {
    const t = this._currentTrack();
    if (!t) return;
    if (this.el.title) this.el.title.textContent = t.title || 'Ukázka písničky';
    if (this.top.title) this.top.title.textContent = t.title || 'Ukázka písničky';
    if (this.el.meta && Number.isFinite(this.audio.duration)) {
      this.el.meta.textContent = `Ukázka písničky • ${this._fmt(this.audio.duration)}`;
    }
  }

  _bindCoreEvents() {
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.el.duration) this.el.duration.textContent = this._fmt(this.audio.duration);
      this._updateMetaUi();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.el.curTime) this.el.curTime.textContent = this._fmt(this.audio.currentTime);
      if (this.el.progress && Number.isFinite(this.audio.duration)) {
        const pct = (this.audio.currentTime / this.audio.duration) * 100;
        this.el.progress.value = pct;
      }
    });

    this.audio.addEventListener('ended', () => this.next());

    this.audio.addEventListener('error', () => {
      // jednoduchý fallback: přeskoč na další stopu
      this.next();
    });
  }

  _bindUiEvents() {
    const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

    // hlavní ovládání
    on(this.el.play, 'click', () => this.toggle());
    on(this.el.prev, 'click', () => this.prev());
    on(this.el.next, 'click', () => this.next());
    on(this.el.mute, 'click', () => this.muteToggle());

    // hero tlačítko
    on(this.el.heroPlay, 'click', () => this.toggle());

    // schování/zobrazení plovoucího přehrávače
    on(this.el.hide, 'click', () => {
      if (this.el.playerWrap) this.el.playerWrap.style.display = 'none';
      if (this.el.floatBtn) this.el.floatBtn.style.display = 'block';
    });
    on(this.el.floatBtn, 'click', () => {
      if (this.el.playerWrap) this.el.playerWrap.style.display = 'block';
      if (this.el.floatBtn) this.el.floatBtn.style.display = 'none';
    });

    // seeking (range input)
    if (this.el.progress) {
      // plynulé posouvání během "input"
      this.el.progress.addEventListener('input', (e) => {
        if (!Number.isFinite(this.audio.duration)) return;
        const pct = Number(e.target.value) / 100;
        this.audio.currentTime = Math.max(0, Math.min(this.audio.duration * pct, this.audio.duration));
      });
      // jistota po "change"
      this.el.progress.addEventListener('change', (e) => {
        if (!Number.isFinite(this.audio.duration)) return;
        const pct = Number(e.target.value) / 100;
        this.audio.currentTime = Math.max(0, Math.min(this.audio.duration * pct, this.audio.duration));
      });
    }

    // top player ovládání
    on(this.top.prev, 'click', () => this.prev());
    on(this.top.play, 'click', () => this.toggle());
    on(this.top.next, 'click', () => this.next());

    // top player tabs (data-category na .tp-tab)
    if (this.top.tabsWrap) {
      this.top.tabsWrap.querySelectorAll('.tp-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          this._switchCategory(tab.getAttribute('data-category'));
          this.top.tabsWrap.querySelectorAll('.tp-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
    }

    // jak-to-funguje záložky (data-category na .category-tab)
    this.list.categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this._switchCategory(tab.getAttribute('data-category'));
        this.list.categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  _renderCategory(category) {
    // aktivní taby
    if (this.top.tabsWrap) {
      this.top.tabsWrap.querySelectorAll('.tp-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-category') === category);
      });
    }
    this.list.categoryTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-category') === category);
    });

    // render seznamu skladeb
    if (this.list.tracks) {
      const tracks = this.catalog[category] || [];
      this.list.tracks.innerHTML = tracks.map((track, i) => `
        <div class="track-item" data-index="${i}">
          <div class="track-info"><div class="track-title">${track.title}</div></div>
          <button class="track-play-btn" data-index="${i}">▶</button>
        </div>
      `).join('');

      // kliky na řádek i na tlačítko
      this.list.tracks.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
          const i = Number(item.getAttribute('data-index'));
          this._playIndex(i);
        });
      });
      this.list.tracks.querySelectorAll('.track-play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const i = Number(btn.getAttribute('data-index'));
          this._playIndex(i);
        });
      });
    }
  }

  _switchCategory(category) {
    if (!this.catalog[category]) return;
    this.category = category;
    this.queue = [...this.catalog[category]];
    this.index = 0;
    this._renderCategory(category);
    this._loadAndMaybeAutoplay(true);
  }

  _playIndex(i) {
    if (i === this.index) {
      // toggle play/pause na stejné stopě
      this.toggle();
      return;
    }
    this.index = i;
    this._loadAndMaybeAutoplay(true);
  }

  _loadAndMaybeAutoplay(autoplay) {
    const t = this._currentTrack();
    if (!t || !t.file) return;
    this.audio.src = t.file;
    this.audio.muted = this.isMuted;
    this._updateMetaUi();
    if (autoplay) this.play();
  }

  /* -----------------------------
     Veřejné metody ovládání
  ----------------------------- */
  play() {
    const t = this._currentTrack();
    if (!t) return;
    this.audio.play().then(() => {
      this.isPlaying = true;
      this._syncButtonsPlayingState();
      this._updateMetaUi();
    }).catch(() => {
      // pokud by přehrání selhalo, zkuste další stopu
      this.next();
    });
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this._syncButtonsPlayingState();
  }

  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  next() {
    if (!this.queue.length) return;
    this.index = (this.index + 1) % this.queue.length;
    this._loadAndMaybeAutoplay(this.isPlaying);
  }

  prev() {
    if (!this.queue.length) return;
    this.index = (this.index - 1 + this.queue.length) % this.queue.length;
    this._loadAndMaybeAutoplay(this.isPlaying);
  }

  muteToggle() {
    this.isMuted = !this.isMuted;
    this.audio.muted = this.isMuted;
    if (this.el.mute) this.el.mute.textContent = this.isMuted ? '🔇' : '🔊';
  }
}

// Singleton instance (vyhneme se více instancím na stránce)
function initAudio() {
  if (!window.__audioController) {
    window.__audioController = new AudioController();
  }
  return window.__audioController;
}

/* =============================================
   FAQ akordeon
============================================= */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const q = item.querySelector('.faq-question');
    const toggle = () => {
      const active = item.classList.contains('active');
      document.querySelectorAll('.faq-item.active').forEach(i => {
        i.classList.remove('active');
        const qi = i.querySelector('.faq-question');
        if (qi) qi.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('active', !active);
      if (q) q.setAttribute('aria-expanded', String(!active));
    };
    if (q) q.addEventListener('click', toggle);
  });
}

/* =============================================
   Plynulé skrolování na kotvy (zohlední header i player)
============================================= */
(() => {
  const header = document.querySelector('.header');
  const player = document.getElementById('audio-player');
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerH = header?.offsetHeight || 0;
      const playerH = player?.offsetHeight || 0;
      const offset = headerH + playerH + 20;
      window.scrollTo({ top: Math.max(0, target.offsetTop - offset), behavior: 'smooth' });
    });
  });
})();

/* =============================================
   Formulář – jednoduché ošetření
============================================= */
function handleContactForm(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  if (!data.name || !data.email || !data.message) {
    alert('Prosím vyplňte všechna pole.');
    return;
  }
  alert('Děkujeme za váš zájem! Brzy vás budeme kontaktovat.');
  event.target.reset();
}

/* =============================================
   Vizuální drobnosti
============================================= */
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (header) header.style.boxShadow = window.scrollY > 100
    ? '0 2px 10px rgba(0, 0, 0, 0.1)'
    : '0 1px 3px rgba(0, 0, 0, 0.1)';
});

window.addEventListener('load', () => document.body.classList.add('loaded'));

/* =============================================
   Jednoduchá "analytics"
============================================= */
function trackEvent(eventName, eventData = {}) {
  // zde lze napojit GA/Pixel apod.
  console.log('Event tracked:', eventName, eventData);
}

document.addEventListener('click', (e) => {
  if (e.target.matches('.nav-btn, .hero-btn, .cta-btn, .service-link')) {
    trackEvent('button_click', { button_text: e.target.textContent, button_href: e.target.href });
  }
  if (e.target.matches('.control-btn, .hero-play-btn, #tp-play, #tp-prev, #tp-next')) {
    trackEvent('audio_interaction', { button: e.target.textContent || e.target.id });
  }
});

/* =============================================
   Start aplikace
============================================= */
document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initFAQ();
});
