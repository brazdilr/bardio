// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Audio Player functionality
class AudioPlayer {
    constructor() {
        this.currentTrack = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 1;
        this.currentTime = 0;
        this.duration = 30; // Default duration
        
        this.tracks = [
            { title: 'Ukázka 1 - Popová píseň', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3', duration: 30 },
            { title: 'Ukázka 2 - Akustická píseň', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3', duration: 30 },
            { title: 'Ukázka 3 - Dětská píseň', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3', duration: 25 }
        ];
        
        this.init();
    }
    
    setupAudioEvents() {
        if (!this.audioElement) return;
        
        // Aktualizuj progress bar při přehrávání
        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.duration = this.audioElement.duration || this.duration;
            this.updateProgress();
        });
        
        // Automaticky přejdi na další track
        this.audioElement.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        // Zpracuj chyby
        this.audioElement.addEventListener('error', (e) => {
            console.log('Audio error:', e);
            this.playSimulated();
        });
    }
    
    init() {
        // Safely query elements (may be hidden or absent in v2)
        this.playBtn = document.getElementById('play-btn') || null;
        this.prevBtn = document.getElementById('prev-btn') || null;
        this.nextBtn = document.getElementById('next-btn') || null;
        this.muteBtn = document.getElementById('mute-btn') || null;
        this.hidePlayerBtn = document.getElementById('hide-player') || null;
        this.progressBar = document.getElementById('progress-bar') || null;
        this.currentTimeEl = document.getElementById('current-time') || { textContent: '' };
        this.durationEl = document.getElementById('duration') || { textContent: '' };
        this.trackTitle = document.querySelector('.track-title') || { textContent: '' };
        this.trackMeta = document.querySelector('.track-meta') || { textContent: '' };
        this.audioPlayer = document.getElementById('audio-player') || null;
        this.floatingBtn = document.getElementById('floating-audio-btn') || null;
        this.heroPlayBtn = document.getElementById('hero-play-btn') || null;
        
        this.setupEventListeners();
        this.updateTrackInfo();
    }
    
    setupEventListeners() {
        if (this.playBtn) this.playBtn.addEventListener('click', () => this.togglePlayPause());
        if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.previousTrack());
        if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.nextTrack());
        if (this.muteBtn) this.muteBtn.addEventListener('click', () => this.toggleMute());
        if (this.hidePlayerBtn) this.hidePlayerBtn.addEventListener('click', () => this.hidePlayer());
        if (this.floatingBtn) this.floatingBtn.addEventListener('click', () => this.showPlayer());
        if (this.heroPlayBtn) this.heroPlayBtn.addEventListener('click', () => this.togglePlayPause());
        
        if (this.progressBar) {
            this.progressBar.addEventListener('input', (e) => {
                this.currentTime = (e.target.value / 100) * this.duration;
                this.updateProgress();
            });
        }
        
        // Simulate audio playback
        this.audioInterval = null;
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        const currentTrack = this.tracks[this.currentTrack];
        
        // Pokud má track audio soubor, použij HTML5 Audio API
        if (currentTrack.file) {
            if (!this.audioElement) {
                this.audioElement = new Audio();
                this.setupAudioEvents();
            }
            
            this.audioElement.src = currentTrack.file;
            this.audioElement.volume = this.isMuted ? 0 : this.volume;
            this.audioElement.play().catch(error => {
                console.log('Audio playback failed:', error);
                // Fallback na simulaci pokud se audio nepodaří načíst
                this.playSimulated();
            });
        } else {
            // Fallback na simulaci pro tracky bez souborů
            this.playSimulated();
        }
        
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.heroPlayBtn.textContent = '⏸ Pozastavit';
    }
    
    playSimulated() {
        // Simulate audio playback
        this.audioInterval = setInterval(() => {
            if (this.currentTime < this.duration) {
                this.currentTime += 0.1;
                this.updateProgress();
            } else {
                this.nextTrack();
            }
        }, 100);
    }
    
    pause() {
        this.isPlaying = false;
        this.playBtn.textContent = '▶';
        this.heroPlayBtn.textContent = '▶ Přehrát ukázky';
        
        // Zastav HTML5 audio pokud běží
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        // Zastav simulaci pokud běží
        if (this.audioInterval) {
            clearInterval(this.audioInterval);
        }
    }
    
    previousTrack() {
        this.currentTrack = (this.currentTrack - 1 + this.tracks.length) % this.tracks.length;
        this.updateTrackInfo();
        this.currentTime = 0;
        this.updateProgress();
        
        // Zastav aktuální audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        
        if (this.isPlaying) {
            this.pause();
            setTimeout(() => this.play(), 100);
        }
    }
    
    nextTrack() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        this.updateTrackInfo();
        this.currentTime = 0;
        this.updateProgress();
        
        // Zastav aktuální audio
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        
        if (this.isPlaying) {
            this.pause();
            setTimeout(() => this.play(), 100);
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        
        // Aktualizuj volume v HTML5 audio elementu
        if (this.audioElement) {
            this.audioElement.volume = this.isMuted ? 0 : this.volume;
        }
    }
    
    hidePlayer() {
        if (this.audioPlayer) this.audioPlayer.style.display = 'none';
        if (this.floatingBtn) this.floatingBtn.style.display = 'block';
    }
    
    showPlayer() {
        if (this.audioPlayer) this.audioPlayer.style.display = 'block';
        if (this.floatingBtn) this.floatingBtn.style.display = 'none';
    }
    
    updateTrackInfo() {
        const t = this.tracks[this.currentTrack];
        if (this.trackTitle) this.trackTitle.textContent = t.title || '';
        if (this.trackMeta) this.trackMeta.textContent = `Ukázka písničky • 0:${String(t.duration).padStart(2, '0')}`;
    }
    
    updateProgress() {
        const progress = (this.currentTime / this.duration) * 100;
        if (this.progressBar) this.progressBar.value = progress;
        this.currentTimeEl.textContent = this.formatTime(this.currentTime);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const audioPlayerHeight = document.getElementById('audio-player').offsetHeight;
            const offset = headerHeight + audioPlayerHeight + 20;
            
            window.scrollTo({
                top: target.offsetTop - offset,
                behavior: 'smooth'
            });
        }
    });
});

// Initialize audio player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioPlayer();
});

// Simple form handling (if you add a contact form)
function handleContactForm(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simple validation
    if (!data.name || !data.email || !data.message) {
        alert('Prosím vyplňte všechna pole.');
        return;
    }
    
    // Simulate form submission
    alert('Děkujeme za váš zájem! Brzy vás budeme kontaktovat.');
    event.target.reset();
}

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Simple analytics (you can replace with Google Analytics)
function trackEvent(eventName, eventData = {}) {
    console.log('Event tracked:', eventName, eventData);
    // Here you would send data to your analytics service
}

// Track button clicks
document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-btn, .hero-btn, .cta-btn, .service-link')) {
        trackEvent('button_click', {
            button_text: e.target.textContent,
            button_href: e.target.href
        });
    }
});

// Track audio player interactions
document.addEventListener('click', (e) => {
    if (e.target.matches('.control-btn, .hero-play-btn')) {
        trackEvent('audio_interaction', {
            button: e.target.textContent || e.target.id
        });
    }
});



function initTopPlayer() {
    const prev = document.getElementById('tp-prev');
    const play = document.getElementById('tp-play');
    const next = document.getElementById('tp-next');
    const title = document.getElementById('tp-title');
    const tabs = document.querySelectorAll('#tp-tabs .tp-tab');

    // Pokud nejsou elementy, neinicializuj
    if (!play) return;

    if (!window.__playerInstance) {
        window.__playerInstance = new AudioPlayer();
    }
    const player = window.__playerInstance;

    // Sync title on track change via updateTrackInfo override
    const originalUpdate = player.updateTrackInfo.bind(player);
    player.updateTrackInfo = function() {
        originalUpdate();
        const t = this.tracks[this.currentTrack];
        if (title && t) title.textContent = t.title || 'Ukázka písničky';
    };
    player.updateTrackInfo();

    // Controls
    if (prev) prev.addEventListener('click', () => player.previousTrack());
    if (next) next.addEventListener('click', () => player.nextTrack());
    if (play) play.addEventListener('click', () => player.togglePlayPause());

    // Tabs -> switch category playlist
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const key = tab.getAttribute('data-category');
            // Activate tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Prepare playlist from category
            const items = categories[key] || [];
            if (!items.length) return;
            player.tracks = items.map(it => ({ title: it.title, file: it.file || null, duration: it.duration }));
            player.currentTrack = 0;
            player.updateTrackInfo();
            player.pause();
            setTimeout(() => player.play(), 50);
        });
    });
}

// FAQ Accordion functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

// Nový přehrávač pro jak-to-funguje
class MusicPlayer {
    constructor() {
        this.currentTrack = 0;
        this.currentCategory = 'pop';
        this.isPlaying = false;
        this.audio = null;
        this.tracks = {};
        
        // Definice skladeb podle kategorií
        this.tracks = {
            pop: [
                { title: 'Popová píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3', duration: 30 },
                { title: 'Popová píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3', duration: 30 },
                { title: 'Popová píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3', duration: 25 }
            ],
            akusticka: [
                { title: 'Akustická píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3', duration: 28 },
                { title: 'Akustická píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3', duration: 25 },
                { title: 'Akustická píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3', duration: 27 }
            ],
            detska: [
                { title: 'Dětská píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3', duration: 20 },
                { title: 'Dětská píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3', duration: 22 },
                { title: 'Dětská píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3', duration: 18 }
            ],
            svatebni: [
                { title: 'Svatební píseň #1', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-2.mp3', duration: 26 },
                { title: 'Svatební píseň #2', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-3.mp3', duration: 27 },
                { title: 'Svatební píseň #3', file: 'https://yfoqiowdqqusnvbkyqhk.supabase.co/storage/v1/object/public/Ukazky-pisni/ukazka-1.mp3', duration: 24 }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.playerElement = document.getElementById('music-player');
        if (!this.playerElement) return;
        
        this.tracksList = document.getElementById('tracks-list');
        
        this.setupEventListeners();
        this.loadCategory('pop');
    }
    
    setupEventListeners() {
        // Category tabs
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                this.loadCategory(category);
            });
        });
    }
    
    loadCategory(category) {
        this.currentCategory = category;
        this.currentTrack = 0;
        
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Load tracks
        this.renderTracks();
    }
    
    renderTracks() {
        if (!this.tracksList) return;
        
        const tracks = this.tracks[this.currentCategory] || [];
        this.tracksList.innerHTML = tracks.map((track, index) => `
            <div class="track-item" data-index="${index}">
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                </div>
                <button class="track-play-btn" data-index="${index}">▶</button>
            </div>
        `).join('');
        
        // Add click listeners to play buttons
        this.tracksList.querySelectorAll('.track-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                this.toggleTrackPlay(index);
            });
        });
    }
    
    toggleTrackPlay(index) {
        // If same track is clicked, toggle play/pause
        if (this.currentTrack === index && this.audio) {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        } else {
            // Different track, play it
            this.currentTrack = index;
            this.play();
        }
    }
    
    play() {
        const track = this.tracks[this.currentCategory][this.currentTrack];
        if (!track) return;
        
        if (this.audio) {
            this.audio.pause();
        }
        
        this.audio = new Audio(track.file);
        this.audio.addEventListener('loadedmetadata', () => {
            console.log('Audio loaded, updating time display');
            this.updateTimeDisplay();
        });
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        this.audio.addEventListener('ended', () => {
            this.nextTrack();
        });
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updatePlayButtons();
        }).catch(error => {
            console.log('Playback failed:', error);
        });
    }
    
    pause() {
        if (this.audio) {
            this.audio.pause();
        }
        this.isPlaying = false;
        this.updatePlayButtons();
    }
    
    updatePlayButtons() {
        // Update all play buttons
        this.tracksList.querySelectorAll('.track-play-btn').forEach((btn, index) => {
            if (index === this.currentTrack && this.isPlaying) {
                btn.textContent = '⏸';
                btn.classList.add('playing');
            } else {
                btn.textContent = '▶';
                btn.classList.remove('playing');
            }
        });
    }
    
    nextTrack() {
        const tracks = this.tracks[this.currentCategory];
        this.currentTrack = (this.currentTrack + 1) % tracks.length;
        if (this.isPlaying) {
            this.play();
        }
    }
}

function initMusicPlayer() {
    // Initialize on both jak-to-funguje and homepage
    if (window.location.pathname.includes('jak-to-funguje') || window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        new MusicPlayer();
    }
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.__playerInstance) {
        window.__playerInstance = new AudioPlayer();
    }
    initTopPlayer();
    initFAQ();
    initMusicPlayer();
});
