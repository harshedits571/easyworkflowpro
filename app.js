/**
 * CREATIVE GALAXY - REALISTIC 3D ORRERY SIMULATION (NASA EYES STYLE)
 * Upgraded with Firebase Auth, Firestore licensing, and dynamic configurations.
 */

// ═══════════════════════════════════════════════════════════════════
// 🔑 FIREBASE INTEGRATION & SECURITY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════
const firebaseConfig = {
    apiKey: "AIzaSyDE0F8ZF1yGWuju-tBUmzCAvN8_LinhW9Y",
    authDomain: "easy-workflow-pro.firebaseapp.com",
    projectId: "easy-workflow-pro",
    storageBucket: "easy-workflow-pro.firebasestorage.app",
    messagingSenderId: "326042721605",
    appId: "1:326042721605:web:759d3d272f263299dd722c",
};

// Initialize Firebase SDKs compat layer
let db = null;
let auth = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("🚀 Firebase connected successfully in Orrery theme.");
    }
} catch (e) {
    console.error("❌ Firebase initialization error:", e);
}

// Admin UIDs allowed to enter the admin dashboard route
const ALLOWED_ADMIN_UIDS = [
    'htqWVNfy8GYaCwvcMnerPKFjUFu2'
];

// --- FIREBASE CACHES ---
let currentUser = null;
let userLicenses = {};          // Maps tier -> licenseKey
let downloadLinksCache = {};    // Maps tier -> dynamic download url
let pricingCache = {};          // Maps tier pricing fields

// ═══════════════════════════════════════════════════════════════════
// 🪐 ECOSYSTEM DATA: CORE ADOBE & SOFTWHERE HUB PRODUCTS
// ═══════════════════════════════════════════════════════════════════
const ECOSYSTEM_DATA = {
    core: [
        {
            id: 'photoshop',
            name: 'Photoshop CC',
            logoText: 'Ps',
            category: 'Design & Image Editing',
            version: 'v25.9 (2026)',
            size: '3.2 GB',
            compatibility: 'Windows / macOS',
            accentColor: '#00C8FF',
            accentColorGlow: 'rgba(0, 200, 255, 0.4)',
            downloadUrl: 'https://creativecloud.adobe.com/apps/all-apps',
            description: 'The industry-standard for digital image editing and composition. Bring designs to life on desktop with advanced layer options and generative AI powered by Adobe Firefly.',
            features: [
                'Generative Fill & Expand for fluid canvas additions',
                'Advanced layer masking and non-destructive adjustments',
                'Content-Aware fill, healing, and patch tools',
                'Seamless vector path imports from Illustrator'
            ],
            requirements: 'Intel Core i7, 16 GB RAM, NVIDIA RTX 3060, 20 GB free space, Windows 10/11 or macOS Monterey+',
            orbitRadius: 180,
            inclination: 0.05,
            ascNode: 0.8,
            eccentricity: 0.04,
            speed: 0.006,
            sizeScale: 1.0,
            moons: [
                { name: 'Layers & Masking', color: '#00C8FF', radius: 24, speed: 0.03 },
                { name: 'Generative Fill', color: '#FFD700', radius: 36, speed: 0.018 }
            ]
        },
        {
            id: 'illustrator',
            name: 'Illustrator CC',
            logoText: 'Ai',
            category: 'Vector Graphics & Illustration',
            version: 'v28.2 (2026)',
            size: '2.4 GB',
            compatibility: 'Windows / macOS',
            accentColor: '#FF9A00',
            accentColorGlow: 'rgba(255, 154, 0, 0.4)',
            downloadUrl: 'https://creativecloud.adobe.com/apps/all-apps',
            description: 'Create vector layouts, logos, sketches, and typography that scale cleanly from mobile screens up to massive billboard displays.',
            features: [
                'Generative Vector Graphic tools (text-to-vector)',
                'Precise Pen, Anchor Point, and Curvature controls',
                'Recolor Artwork utilizing intelligent color palettes',
                'Dynamic typography styling and OpenType glyphs'
            ],
            requirements: 'Intel Core i5, 8 GB RAM (16 GB recommended), GPU with 4GB VRAM, Windows 10/11 or macOS Ventura+',
            orbitRadius: 260,
            inclination: -0.04,
            ascNode: 1.6,
            eccentricity: 0.03,
            speed: 0.0045,
            sizeScale: 0.95,
            moons: [
                { name: 'Vector Engine', color: '#FF9A00', radius: 24, speed: 0.025 },
                { name: 'Path Finder', color: '#E53935', radius: 35, speed: 0.016 }
            ]
        },
        {
            id: 'premiere',
            name: 'Premiere Pro CC',
            logoText: 'Pr',
            category: 'Professional Video Editing',
            version: 'v24.4 (2026)',
            size: '4.1 GB',
            compatibility: 'Windows / macOS',
            accentColor: '#EA77FF',
            accentColorGlow: 'rgba(234, 119, 255, 0.4)',
            downloadUrl: 'https://creativecloud.adobe.com/apps/all-apps',
            description: 'The industry-standard timeline video editor for social media, broadcast, and feature films, integrated with unified audio-visual workflow panels.',
            features: [
                'Speech-to-Text auto-captioning & transcription',
                'Three-point timeline editing and multi-cam workflows',
                'Lumetri Color panel for cinematic grading',
                'Essential Sound panel with automatic ducking'
            ],
            requirements: 'Intel 11th Gen CPU or Apple Silicon, 16 GB RAM (32 GB for 4K), 8 GB VRAM GPU, SSD storage',
            orbitRadius: 350,
            inclination: 0.03,
            ascNode: 2.4,
            eccentricity: 0.02,
            speed: 0.0035,
            sizeScale: 1.05,
            moons: [
                { name: 'Timeline UI', color: '#EA77FF', radius: 25, speed: 0.022 },
                { name: 'Lumetri Color', color: '#00E5FF', radius: 38, speed: 0.015 }
            ]
        },
        {
            id: 'aftereffects',
            name: 'After Effects CC',
            logoText: 'Ae',
            category: 'Motion Graphics & VFX',
            version: 'v24.4 (2026)',
            size: '3.8 GB',
            compatibility: 'Windows / macOS',
            accentColor: '#D29BFF',
            accentColorGlow: 'rgba(210, 155, 255, 0.4)',
            downloadUrl: 'https://creativecloud.adobe.com/apps/all-apps',
            description: 'Create cinematic movie titles, transitions, visual effects compositions, and advanced character animations with GPU acceleration.',
            features: [
                'Complex 2D/3D compositing & camera tracking',
                'Text and shape animators with custom keyframing',
                'Rotobrush 3 for AI-driven object isolation',
                'Robust Expressions engine supporting JavaScript'
            ],
            requirements: 'Intel Core i9 or Apple M2 Pro, 32 GB RAM, 8 GB VRAM GPU, dedicated scratch SSD, Windows 10/11 or macOS Ventura+',
            orbitRadius: 450,
            inclination: -0.05,
            ascNode: 3.2,
            eccentricity: 0.05,
            speed: 0.0028,
            sizeScale: 1.02,
            moons: [
                { name: '3D Tracker', color: '#D29BFF', radius: 26, speed: 0.02 },
                { name: 'Expressions', color: '#00E676', radius: 36, speed: 0.014 }
            ]
        },
        {
            id: 'indesign',
            name: 'InDesign CC',
            logoText: 'Id',
            category: 'Editorial & Page Layout',
            version: 'v19.4 (2026)',
            size: '1.8 GB',
            compatibility: 'Windows / macOS',
            accentColor: '#FF3366',
            accentColorGlow: 'rgba(255, 51, 102, 0.4)',
            downloadUrl: 'https://creativecloud.adobe.com/apps/all-apps',
            description: 'Design professional, multi-page page layouts for books, digital magazines, posters, and interactive PDFs.',
            features: [
                'Responsive Liquid Layout configurations',
                'Paragraph, character, and master page style grids',
                'Publish Online service for instant interactive previews',
                'Preflight checker to catch layout & font errors'
            ],
            requirements: 'Intel Core i5, 8 GB RAM, SSD storage, Windows 10/11 or macOS Big Sur+',
            orbitRadius: 550,
            inclination: 0.02,
            ascNode: 4.0,
            eccentricity: 0.03,
            speed: 0.0022,
            sizeScale: 0.92,
            moons: [
                { name: 'Grid Master', color: '#FF3366', radius: 24, speed: 0.018 }
            ]
        }
    ],
    plugins: [
        {
            id: 'easyworkflow',
            name: 'Easy Workflow Pro',
            logoText: 'Ew',
            category: 'CEP Automation Extension',
            version: 'v3.7.0',
            size: '48 MB',
            compatibility: 'Ps / Pr / Ae (Win / Mac)',
            accentColor: '#FFD700', // Gold
            accentColorGlow: 'rgba(255, 215, 0, 0.4)',
            downloadUrl: 'https://easyworkflow.store',
            description: 'The ultimate professional After Effects/Premiere CEP script bundle. Automate anchor points, bake math expressions, inject custom JSX scripts, sync libraries cloud-wide, and securely package layouts in one click.',
            features: [
                'Double-click custom Expression Baking & Script Injector',
                'Automated file structuring and workspace organizer',
                'Integrated JSXBIN build scripts for secure code deployment',
                'Highly polished, micro-animated glassmorphic extension UI'
            ],
            requirements: 'Adobe CEP 10+ (Photoshop CC 2021+, Premiere Pro CC 2021+, After Effects CC 2021+), Windows 10/11 or macOS',
            orbitRadius: 180,
            inclination: 0.05,
            ascNode: 0.6,
            eccentricity: 0.04,
            speed: 0.0065,
            sizeScale: 1.15,
            
            // Storefront integration keys
            tier: 'pro',
            priceKey: 'pro_inr',
            defaultPrice: 1500,
            moons: [
                { name: 'Bake Expressions', color: '#FFD700', radius: 24, speed: 0.032 },
                { name: 'JSXBIN Compiler', color: '#00FFFF', radius: 36, speed: 0.02 },
                { name: 'Directory Map', color: '#FF7043', radius: 46, speed: 0.014 }
            ]
        },
        {
            id: 'easyworkflowbasic',
            name: 'Easy Workflow Basic',
            logoText: 'Eb',
            category: 'CEP Automation Script',
            version: 'v3.7.0',
            size: '12 MB',
            compatibility: 'AE (Win / Mac)',
            accentColor: '#a78bfa', // Purple
            accentColorGlow: 'rgba(167, 139, 250, 0.4)',
            downloadUrl: 'https://easyworkflow.store',
            description: 'The essential toolkit for motion design beginners. Instantly align layers, replace project fonts, adjust anchor offsets, and clean up effects configurations.',
            features: [
                'Essential Font replacement panel',
                'Static layer alignments & centering',
                'FX Cleaner parameters optimizer',
                'Save Comp standalone script'
            ],
            requirements: 'Adobe After Effects CC 2020 or newer, Windows or macOS',
            orbitRadius: 260,
            inclination: -0.04,
            ascNode: 1.4,
            eccentricity: 0.03,
            speed: 0.0052,
            sizeScale: 0.95,
            
            tier: 'basic',
            priceKey: 'basic_inr',
            defaultPrice: 100,
            moons: [
                { name: 'Font Replacer', color: '#a78bfa', radius: 24, speed: 0.028 },
                { name: 'Layer Align', color: '#E040FB', radius: 36, speed: 0.018 }
            ]
        },
        {
            id: 'autocaptions',
            name: 'Auto Captions Pro',
            logoText: 'Ac',
            category: 'AI Transcription Tool',
            version: 'v1.4.0',
            size: '420 MB',
            compatibility: 'AE / Pr (Win / Mac)',
            accentColor: '#10b981', // Green
            accentColorGlow: 'rgba(16, 185, 129, 0.4)',
            downloadUrl: 'https://easyworkflow.store',
            description: 'Transcribe and caption your timelines instantly utilizing local AI Whisper parameters. Ingest audio tracks, generate captions, adjust fonts, and burn in text styles in seconds.',
            features: [
                'Local AI speech transcription engine (Whisper)',
                'Auto text styling & subtitles generation',
                'Import external SRT files from Premiere Pro',
                'Dynamic marker timings and caption splits'
            ],
            requirements: 'After Effects CC 2021+ or Premiere Pro CC 2021+, GPU Acceleration recommended',
            orbitRadius: 350,
            inclination: 0.03,
            ascNode: 2.2,
            eccentricity: 0.02,
            speed: 0.0042,
            sizeScale: 1.0,
            
            tier: 'autocaptions',
            priceKey: 'autocaptions_inr',
            defaultPrice: 800,
            moons: [
                { name: 'AI Whisper', color: '#10b981', radius: 24, speed: 0.025 },
                { name: 'SRT Importer', color: '#00E5FF', radius: 35, speed: 0.016 }
            ]
        },
        {
            id: 'projectmanager',
            name: 'Project Manager Pro',
            logoText: 'Pm',
            category: 'Ecosystem Asset Browser',
            version: 'v2.1.0',
            size: '85 MB',
            compatibility: 'AE (Win / Mac)',
            accentColor: '#f59e0b', // Amber/Orange
            accentColorGlow: 'rgba(245, 158, 11, 0.4)',
            downloadUrl: 'https://easyworkflow.store',
            description: 'A Premiere Pro-style visual browser panel for After Effects. Catalog folders, map templates, generate live image thumbnails, filter assets, and handle proxies in real time.',
            features: [
                'Visual browser supporting drag-and-drop imports',
                'Real-time thumbnail renders for compositions & assets',
                'Proxy manager with background transcode hooks',
                'Fuzzy search, tagging, and advanced filters grid'
            ],
            requirements: 'After Effects CC 2021+ or Premiere Pro CC 2021+, SSD scratch disk recommended',
            orbitRadius: 450,
            inclination: -0.05,
            ascNode: 3.0,
            eccentricity: 0.04,
            speed: 0.0032,
            sizeScale: 1.05,
            
            tier: 'projectmanager',
            priceKey: 'projectmanager_inr',
            defaultPrice: 1500,
            moons: [
                { name: 'Visual Browser', color: '#f59e0b', radius: 24, speed: 0.02 },
                { name: 'Proxy Manager', color: '#E53935', radius: 36, speed: 0.012 }
            ]
        },
        {
            id: 'saber',
            name: 'Video Copilot Saber',
            logoText: 'Sb',
            category: 'AE Glow & Energy Plugin',
            version: 'v1.0.40',
            size: '15 MB',
            compatibility: 'After Effects (C++ Plugin)',
            accentColor: '#0088FF',
            accentColorGlow: 'rgba(0, 136, 255, 0.4)',
            downloadUrl: 'https://www.videocopilot.net/blog/2016/03/new-plug-in-saber-now-available-100-free/',
            description: 'A famous free After Effects plugin for generating glowing energy beams, lasers, neon titles, and lightsabers. High GPU acceleration.',
            features: [
                'Organic glowing algorithms with customizable drop-off',
                'Trace text layers, masks, and paths',
                '25 built-in presets (Fire, Shockwave, Laser, etc.)',
                'Dynamic displacement maps and displacement noise'
            ],
            requirements: 'After Effects CS6 or newer, dedicated GPU with OpenGL support',
            orbitRadius: 550,
            inclination: 0.02,
            ascNode: 4.0,
            eccentricity: 0.03,
            speed: 0.0024,
            sizeScale: 0.98,
            moons: [
                { name: 'Glow Shader', color: '#0088FF', radius: 24, speed: 0.028 }
            ]
        },
        {
            id: 'overlord',
            name: 'Battle Axe Overlord',
            logoText: 'Ol',
            category: 'Ai / Ae Vector Bridge',
            version: 'v1.24',
            size: '12 MB',
            compatibility: 'Illustrator & After Effects',
            accentColor: '#FF6600',
            accentColorGlow: 'rgba(255, 102, 0, 0.4)',
            downloadUrl: 'https://www.battleaxe.co/overlord',
            description: 'The vector gateway connecting Illustrator and After Effects. Transfer vector paths, coordinates, shapes, and texts instantly without import files.',
            features: [
                'Instant transfer of vector shapes without file saving',
                'Maintains gradients, shape groups, strokes, and transparency',
                'Transfer layers from After Effects back to Illustrator',
                'Convert texts to editable shape outlines on-the-fly'
            ],
            requirements: 'Adobe Illustrator CC 2019+ and After Effects CC 2019+ running concurrently',
            orbitRadius: 650,
            inclination: -0.03,
            ascNode: 4.8,
            eccentricity: 0.02,
            speed: 0.0018,
            sizeScale: 0.92,
            moons: [
                { name: 'Vector Bridge', color: '#FF6600', radius: 24, speed: 0.022 }
            ]
        }
    ]
};

// --- AUDIO SYNTHESIZER: PREMIUM SYNTHETIC SPACE AMBIENCE ---
class SpaceAudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.ambientGain = null;
        this.filterNode = null;
        this.isPlaying = false;
        this.oscillators = [];
        this.lfo = null;
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(250, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(3, this.ctx.currentTime);
        this.filterNode.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);
    }

    startAmbience() {
        this.init();
        if (this.isPlaying) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
        
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65.8, this.ctx.currentTime);

        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(77.78, this.ctx.currentTime); // Eb2

        const osc4 = this.ctx.createOscillator();
        osc4.type = 'sawtooth';
        osc4.frequency.setValueAtTime(98.0, this.ctx.currentTime); // G2
        
        const sawGain = this.ctx.createGain();
        sawGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        osc1.connect(this.filterNode);
        osc2.connect(this.filterNode);
        osc3.connect(this.filterNode);
        osc4.connect(sawGain);
        sawGain.connect(this.filterNode);

        osc1.start();
        osc2.start();
        osc3.start();
        osc4.start();
        
        this.oscillators = [osc1, osc2, osc3, osc4, sawGain];

        this.lfo = this.ctx.createOscillator();
        this.lfo.frequency.setValueAtTime(0.06, this.ctx.currentTime); // Slow, 16 sec
        
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(100, this.ctx.currentTime);
        
        this.lfo.connect(lfoGain);
        lfoGain.connect(this.filterNode.frequency);
        this.lfo.start();

        this.ambientGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 3);
        this.isPlaying = true;
    }

    stopAmbience() {
        if (!this.isPlaying) return;
        this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);
        setTimeout(() => {
            this.oscillators.forEach(osc => {
                try { osc.stop(); } catch(e) {}
            });
            try { this.lfo.stop(); } catch(e) {}
            this.isPlaying = false;
        }, 1100);
    }

    playHoverBeep() {
        if (!this.isPlaying) return;
        const synthOsc = this.ctx.createOscillator();
        const synthGain = this.ctx.createGain();
        synthOsc.type = 'sine';
        synthOsc.frequency.setValueAtTime(750, this.ctx.currentTime);
        synthOsc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.08);
        synthGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
        synthGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        synthOsc.connect(synthGain);
        synthGain.connect(this.ctx.destination);
        synthOsc.start();
        synthOsc.stop(this.ctx.currentTime + 0.12);
    }

    playSelectionChime() {
        if (!this.isPlaying) return;
        const now = this.ctx.currentTime;
        const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        chordFreqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + (idx * 0.04));
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(450, now + 0.7);
            
            gain.gain.setValueAtTime(0.025, now + (idx * 0.04));
            gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.04) + 0.65);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + (idx * 0.04));
            osc.stop(now + (idx * 0.04) + 0.75);
        });
    }
}

const audioSynth = new SpaceAudioSynthesizer();

// --- STATE MANAGEMENT ---
let currentSystem = 'core';
let globalSpeedFactor = 1.0;
let viewMode = '3d';

// Orbit / Projection states
let planets = [];
let stars = [];
let hoveredPlanet = null;
let selectedPlanet = null;
let animationFrameId = null;

// Camera System (Fitted for NASA Eyes endless zoom and tracking)
const camera = {
    x: 0,
    y: 0,
    z: 0,
    pitch: 1.1,      // Incline rotation around X-axis
    yaw: 0.0,        // Rotation around Y-axis
    zoom: 1.0,       // Render zoom multiplier
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    targetZoom: 0.85,
    focusedPlanetId: null // Id of locked target planet
};

// Drag state
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// --- CANVAS & HUD INITIALIZATION ---
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

// HUD Clock, Telemetries
const hudClockTime = document.getElementById('hud-clock-time');
const hudCameraStatus = document.getElementById('hud-camera-status');
const hudTrackingTarget = document.getElementById('hud-tracking-target');
const hudTelemetryZoom = document.getElementById('hud-telemetry-zoom');
const hudTelemetryPitch = document.getElementById('hud-telemetry-pitch');
const hudTelemetryYaw = document.getElementById('hud-telemetry-yaw');

const gridView = document.getElementById('grid-view');
const gridContainer = document.getElementById('grid-container');

// Controls
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
const btnFocusSun = document.getElementById('btn-focus-sun');
const btnUnlockCamera = document.getElementById('btn-unlock-camera');

const btnView3d = document.getElementById('btn-view-3d');
const btnViewGrid = document.getElementById('btn-view-grid');
const audioToggle = document.getElementById('audio-toggle');
const audioOnIcon = audioToggle.querySelector('.audio-on-icon');
const audioOffIcon = audioToggle.querySelector('.audio-off-icon');

// Tabs & Search
const tabCore = document.getElementById('tab-core');
const tabPlugins = document.getElementById('tab-plugins');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');

// Drawer Panels
const detailsPane = document.getElementById('details-pane');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const drawerFocusLockBtn = document.getElementById('drawer-focus-lock-btn');
const detailLogoBadge = document.getElementById('detail-logo-badge');
const detailLogoGlow = document.getElementById('detail-logo-glow');
const detailCategory = document.getElementById('detail-category');
const detailTitle = document.getElementById('detail-title');
const detailVersion = document.getElementById('detail-version');
const detailCompatibility = document.getElementById('detail-compatibility');
const detailSize = document.getElementById('detail-size');
const detailType = document.getElementById('detail-type');
const detailDownloadBtn = document.getElementById('detail-download-btn');
const detailDescription = document.getElementById('detail-description');
const detailFeatures = document.getElementById('detail-features');
const detailRequirements = document.getElementById('detail-requirements');

// License specific drawer elements
const detailLicenseContainer = document.getElementById('detail-license-container');
const detailLicenseKey = document.getElementById('detail-license-key');
const detailCopyLicenseBtn = document.getElementById('detail-copy-license-btn');

// --- PRELOAD VECTOR SUN SVGS ---
const ccSvgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M50 15C30.67 15 15 30.67 15 50C15 69.33 30.67 85 50 85C69.33 85 85 69.33 85 50C85 30.67 69.33 15 50 15ZM50 78C34.54 78 22 65.46 22 50C22 34.54 34.54 22 50 22C65.46 22 78 34.54 78 50C78 65.46 65.46 78 50 78Z" fill="%23FF3A3A"/><path d="M50 28C37.85 28 28 37.85 28 50C28 62.15 37.85 72 50 72C58.4 72 65.69 67.31 69.37 60.36C67.43 61.42 65.21 62 62.86 62C55.21 62 49 55.79 49 48.14C49 42.66 52.18 37.93 56.78 35.65C54.73 34.6 52.43 34 50 34C48.29 34 46.66 34.3 45.14 34.85" fill="%23E62222"/></svg>`;
const pluginSvgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="50,12 85,32 85,72 50,92 15,72 15,32" stroke="%2300FFCC" stroke-width="6" stroke-linejoin="round" fill="none"/><circle cx="50" cy="52" r="13" fill="%230088FF"/><path d="M43,45 L57,45 L57,55 L53,59 L47,59 L43,55 Z" fill="%2307070F"/></svg>`;

const ccSunImg = new Image();
ccSunImg.src = ccSvgData;
const pluginSunImg = new Image();
pluginSunImg.src = pluginSvgData;

// --- INITIALIZE STARFIELD ---
function generateStarfield() {
    stars = [];
    const count = 600;
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 2800 + Math.random() * 600;

        stars.push({
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi),
            size: Math.random() * 1.5 + 0.4,
            alpha: Math.random() * 0.7 + 0.3
        });
    }
}

// --- INITIALIZE PLANETS FOR ACTIVE SYSTEM ---
function initSystem(systemId) {
    currentSystem = systemId;
    
    const list = ECOSYSTEM_DATA[systemId];
    planets = [];

    list.forEach((app, idx) => {
        const orbitalTilt = app.inclination; 
        const nodeAngle = app.ascNode;
        const semiMinor = app.orbitRadius * Math.sqrt(1 - app.eccentricity * app.eccentricity);
        
        const spawnAngle = (idx * (360 / list.length) * Math.PI) / 180;

        planets.push({
            id: app.id,
            name: app.name,
            logoText: app.logoText,
            category: app.category,
            accentColor: app.accentColor,
            accentColorGlow: app.accentColorGlow,
            data: app,
            
            // Orbital parameters
            a: app.orbitRadius,
            b: semiMinor,
            ecc: app.eccentricity,
            inc: orbitalTilt,
            ascNode: nodeAngle,
            
            // State
            theta: spawnAngle,
            baseSpeed: app.speed,
            sizeScale: app.sizeScale,
            
            // Projected screen coordinates
            screenX: 0,
            screenY: 0,
            screenSize: 0,
            zDepth: 0,
            visible: false,
            
            // Moons
            moons: (app.moons || []).map(moon => ({
                name: moon.name,
                color: moon.color,
                radius: moon.radius,
                speed: moon.speed,
                theta: Math.random() * Math.PI * 2,
                x: 0, y: 0, z: 0
            }))
        });
    });

    if (camera.focusedPlanetId) {
        const found = planets.find(p => p.id === camera.focusedPlanetId);
        if (!found) {
            unlockCamera();
        }
    }
    
    if (selectedPlanet) {
        const found = planets.find(p => p.id === selectedPlanet.id);
        if (found) {
            selectedPlanet = found;
        } else {
            closeDetailsPane();
        }
    }
}

// --- resize canvas ---
function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// --- 3D PERSPECTIVE PROJECTION SYSTEM ---
function project(x, y, z) {
    const width = canvas.width;
    const height = canvas.height;

    const dx = x - camera.x;
    const dy = y - camera.y;
    const dz = z - camera.z;

    const cosYaw = Math.cos(camera.yaw);
    const sinYaw = Math.sin(camera.yaw);
    const x1 = dx * cosYaw - dz * sinYaw;
    const z1 = dx * sinYaw + dz * cosYaw;

    const cosPitch = Math.cos(camera.pitch);
    const sinPitch = Math.sin(camera.pitch);
    const y2 = dy * cosPitch - z1 * sinPitch;
    const z2 = dy * sinPitch + z1 * cosPitch;

    const fov = 1100;
    const scale = (fov / (fov + z2)) * camera.zoom;

    return {
        x: width / 2 + x1 * scale,
        y: height / 2 + y2 * scale,
        zDepth: z2,
        scale: scale,
        visible: z2 > -fov
    };
}

// --- GET PLANET POSITION IN 3D SPACE ---
function getPlanet3DPosition(planet) {
    const orbitCenterX = -planet.a * planet.ecc;
    
    const localX = orbitCenterX + planet.a * Math.cos(planet.theta);
    const localZ = planet.b * Math.sin(planet.theta);
    const localY = 0;

    const cosNode = Math.cos(planet.ascNode);
    const sinNode = Math.sin(planet.ascNode);
    const cosInc = Math.cos(planet.inc);
    const sinInc = Math.sin(planet.inc);

    const x = localX * cosNode - localZ * sinNode * cosInc;
    const z = localX * sinNode + localZ * cosNode * cosInc;
    const y = localZ * sinInc;

    return { x, y, z };
}

// --- RENDER CLOOP ---
function drawFrame() {
    const width = canvas.width;
    const height = canvas.height;

    updateTelemetryHUD();

    camera.x += (camera.targetX - camera.x) * 0.12;
    camera.y += (camera.targetY - camera.y) * 0.12;
    camera.z += (camera.targetZ - camera.z) * 0.12;
    camera.zoom += (camera.targetZoom - camera.zoom) * 0.1;

    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, width, height);

    const renderQueue = [];

    stars.forEach(star => {
        const cosYaw = Math.cos(camera.yaw);
        const sinYaw = Math.sin(camera.yaw);
        const x1 = star.x * cosYaw - star.z * sinYaw;
        const z1 = star.x * sinYaw + star.z * cosYaw;

        const cosPitch = Math.cos(camera.pitch);
        const sinPitch = Math.sin(camera.pitch);
        const y2 = star.y * cosPitch - z1 * sinPitch;
        const z2 = star.y * sinPitch + z1 * cosPitch;

        const fov = 1100;
        const scale = (fov / (fov + z2)) * camera.zoom;

        if (z2 > -fov) {
            renderQueue.push({
                type: 'star',
                x: width / 2 + x1 * scale,
                y: height / 2 + y2 * scale,
                zDepth: z2 + 5000,
                size: star.size * Math.min(1.5, scale),
                alpha: star.alpha
            });
        }
    });

    planets.forEach(p => {
        let speed = p.baseSpeed * globalSpeedFactor;
        if (p === hoveredPlanet) speed *= 0.15;
        if (camera.focusedPlanetId === p.id) speed = 0;

        p.theta = (p.theta + speed) % (Math.PI * 2);

        const pos = getPlanet3DPosition(p);
        const proj = project(pos.x, pos.y, pos.z);
        
        p.screenX = proj.x;
        p.screenY = proj.y;
        p.screenSize = Math.max(12, 24 * p.sizeScale * proj.scale);
        p.zDepth = proj.zDepth;
        p.visible = proj.visible;

        if (camera.zoom > 1.2 || camera.focusedPlanetId === p.id) {
            p.moons.forEach(m => {
                m.theta = (m.theta + m.speed * globalSpeedFactor) % (Math.PI * 2);
                
                const mxLocal = m.radius * Math.cos(m.theta);
                const mzLocal = m.radius * Math.sin(m.theta);
                
                const mx = pos.x + mxLocal;
                const my = pos.y;
                const mz = pos.z + mzLocal;

                const mProj = project(mx, my, mz);
                if (mProj.visible) {
                    renderQueue.push({
                        type: 'moon',
                        x: mProj.x,
                        y: mProj.y,
                        zDepth: mProj.zDepth,
                        color: m.color,
                        name: m.name,
                        size: 4 * mProj.scale,
                        planet: p
                    });
                }
            });
        }

        if (p.visible) {
            renderQueue.push({
                type: 'planet',
                planet: p,
                x: p.screenX,
                y: p.screenY,
                zDepth: p.zDepth,
                size: p.screenSize
            });
        }
    });

    const sunProj = project(0, 0, 0);
    if (sunProj.visible) {
        renderQueue.push({
            type: 'sun',
            x: sunProj.x,
            y: sunProj.y,
            zDepth: sunProj.zDepth,
            size: Math.max(30, 80 * sunProj.scale)
        });
    }

    planets.forEach(p => {
        const points = [];
        const steps = 120;
        
        for (let i = 0; i <= steps; i++) {
            const angle = (i * Math.PI * 2) / steps;
            const orbitCenterX = -p.a * p.ecc;
            
            const localX = orbitCenterX + p.a * Math.cos(angle);
            const localZ = p.b * Math.sin(angle);
            
            const cosNode = Math.cos(p.ascNode);
            const sinNode = Math.sin(p.ascNode);
            const cosInc = Math.cos(p.inc);
            const sinInc = Math.sin(p.inc);

            const ox = localX * cosNode - localZ * sinNode * cosInc;
            const oz = localX * sinNode + localZ * cosNode * cosInc;
            const oy = localZ * sinInc;

            const ptProj = project(ox, oy, oz);
            if (ptProj.visible) {
                points.push(ptProj);
            }
        }

        if (points.length > 0) {
            let sumDepth = 0;
            points.forEach(pt => sumDepth += pt.zDepth);
            const avgDepth = sumDepth / points.length;

            renderQueue.push({
                type: 'orbit',
                points: points,
                planet: p,
                zDepth: avgDepth
            });
        }
    });

    renderQueue.sort((a, b) => b.zDepth - a.zDepth);

    renderQueue.forEach(item => {
        if (item.type === 'star') {
            ctx.fillStyle = `rgba(255, 255, 255, ${item.alpha})`;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (item.type === 'orbit') {
            const isHighlighted = (item.planet === hoveredPlanet) || (selectedPlanet && selectedPlanet.id === item.planet.id);
            ctx.strokeStyle = isHighlighted ? 'rgba(0, 255, 204, 0.45)' : 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = isHighlighted ? 1.8 : 0.8;
            ctx.setLineDash(isHighlighted ? [] : [4, 4]);

            ctx.beginPath();
            ctx.moveTo(item.points[0].x, item.points[0].y);
            for (let i = 1; i < item.points.length; i++) {
                ctx.lineTo(item.points[i].x, item.points[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        } 
        else if (item.type === 'sun') {
            const glowRad = item.size * 1.5;
            const grad = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, glowRad);
            
            if (currentSystem === 'core') {
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.2, 'rgba(255, 50, 50, 0.9)');
                grad.addColorStop(0.5, 'rgba(156, 39, 176, 0.3)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.2, 'rgba(0, 255, 204, 0.9)');
                grad.addColorStop(0.5, 'rgba(0, 136, 255, 0.3)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(item.x, item.y, glowRad, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#06060c';
            ctx.strokeStyle = currentSystem === 'core' ? '#FF3A3A' : '#00FFCC';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(item.x, item.y, item.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const iconSize = item.size * 0.55;
            const sunImg = currentSystem === 'core' ? ccSunImg : pluginSunImg;
            if (sunImg.complete) {
                ctx.drawImage(sunImg, item.x - iconSize / 2, item.y - iconSize / 2, iconSize, iconSize);
            }
        } 
        else if (item.type === 'moon') {
            if (camera.focusedPlanetId === item.planet.id && camera.zoom > 3.0) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                
                const planetPos = getPlanet3DPosition(item.planet);
                const steps = 40;
                let isFirst = true;

                for (let i = 0; i <= steps; i++) {
                    const ang = (i * Math.PI * 2) / steps;
                    const mx = planetPos.x + item.radius * Math.cos(ang);
                    const mz = planetPos.z + item.radius * Math.sin(ang);
                    const mProj = project(mx, planetPos.y, mz);
                    
                    if (mProj.visible) {
                        if (isFirst) {
                            ctx.moveTo(mProj.x, mProj.y);
                            isFirst = false;
                        } else {
                            ctx.lineTo(mProj.x, mProj.y);
                        }
                    }
                }
                ctx.stroke();
            }

            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(item.x, item.y, Math.max(1.5, item.size), 0, Math.PI * 2);
            ctx.fill();

            if (camera.focusedPlanetId === item.planet.id && camera.zoom > 8.0) {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '8px "Share Tech Mono"';
                ctx.fillText(item.name, item.x + 6, item.y + 3);
            }
        } 
        else if (item.type === 'planet') {
            const p = item.planet;
            const isSel = (selectedPlanet && selectedPlanet.id === p.id);
            const isGov = (p === hoveredPlanet);

            if (isGov || isSel) {
                ctx.fillStyle = p.accentColorGlow;
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.size * 0.95, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(10, 11, 22, 0.9)';
            ctx.strokeStyle = (isGov || isSel) ? p.accentColor : 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = (isGov || isSel) ? 2 : 1;
            
            const size = item.size;
            const x = item.x - size / 2;
            const y = item.y - size / 2;
            const r = Math.max(4, size * 0.22);

            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + size - r, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + r);
            ctx.lineTo(x + size, y + size - r);
            ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
            ctx.lineTo(x + r, y + size);
            ctx.quadraticCurveTo(x, y + size, x, y + size - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = p.id.startsWith('easyworkflow') ? '#FFD700' : '#FFFFFF';
            ctx.font = `800 ${Math.max(8, size * 0.38)}px "Outfit"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.logoText, item.x, item.y);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            
            ctx.fillStyle = isSel ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)';
            ctx.font = `${isSel ? 'bold' : 'normal'} ${Math.max(10, size * 0.45)}px "Share Tech Mono"`;
            
            const textOffset = size * 0.7;
            ctx.fillText(p.name, item.x + textOffset, item.y);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(item.x, item.y);
            ctx.lineTo(item.x + textOffset - 4, item.y);
            ctx.stroke();

            if (isGov || isSel || camera.focusedPlanetId === p.id) {
                ctx.fillStyle = p.accentColor;
                ctx.font = '8px "Share Tech Mono"';
                ctx.fillText(`DST: ${p.a} AU`, item.x + textOffset, item.y + 13);
                ctx.fillText(`INC: ${(p.inc * 180 / Math.PI).toFixed(1)}°`, item.x + textOffset, item.y - 13);
            }
        }
    });

    if (camera.focusedPlanetId) {
        const lockedPlanet = planets.find(p => p.id === camera.focusedPlanetId);
        if (lockedPlanet) {
            const targetPos = getPlanet3DPosition(lockedPlanet);
            camera.targetX = targetPos.x;
            camera.targetY = targetPos.y;
            camera.targetZ = targetPos.z;
        }
    }

    if (viewMode === '3d') {
        animationFrameId = requestAnimationFrame(drawFrame);
    }
}

// --- UPDATE TELEMETRY TEXT ON HUD ---
function updateTelemetryHUD() {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getUTCMonth()];
    const date = d.getUTCDate();
    const year = d.getUTCFullYear();
    
    let hours = d.getUTCHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const sec = String(d.getUTCSeconds()).padStart(2, '0');

    hudClockTime.textContent = `${month} ${date}, ${year} ${hours}:${min}:${sec} ${ampm} UTC`;

    hudTelemetryZoom.textContent = `${camera.zoom.toFixed(2)}x`;
    hudTelemetryPitch.textContent = `${Math.round(camera.pitch * 180 / Math.PI)}°`;
    
    let yawDeg = Math.round((camera.yaw * 180 / Math.PI) % 360);
    if (yawDeg < 0) yawDeg += 360;
    hudTelemetryYaw.textContent = `${yawDeg}°`;
}

// --- SELECT PLANET (DRAWER & HUD UPDATE) ---
function selectPlanet(planetId) {
    const planet = planets.find(p => p.id === planetId);
    if (!planet) return;

    selectedPlanet = planet;
    audioSynth.playSelectionChime();

    // Populate Sidebar Details Panel
    detailLogoBadge.textContent = planet.logoText;
    detailLogoBadge.style.backgroundColor = 'rgba(10, 11, 22, 0.9)';
    detailLogoBadge.style.borderColor = planet.accentColor;
    
    if (planet.id.startsWith('easyworkflow')) {
        detailLogoBadge.style.color = '#FFD700';
        detailLogoBadge.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.4)';
    } else {
        detailLogoBadge.style.color = '#FFF';
        detailLogoBadge.style.textShadow = 'none';
    }

    detailsPane.style.setProperty('--accent-color', planet.accentColor);
    detailsPane.style.setProperty('--accent-color-glow', planet.accentColorGlow);
    detailLogoGlow.style.background = `radial-gradient(circle, ${planet.accentColorGlow} 0%, rgba(0,0,0,0) 70%)`;
    
    detailCategory.textContent = planet.category;
    detailCategory.style.color = planet.accentColor;
    detailTitle.textContent = planet.name;
    detailVersion.textContent = planet.version;
    detailCompatibility.textContent = planet.compatibility;
    detailSize.textContent = planet.size;
    detailType.textContent = planet.data.tier ? 'Featured Script' : 'Ecosystem App';

    // Overview Description & Features
    detailDescription.textContent = planet.description;
    detailFeatures.innerHTML = '';
    planet.data.features.forEach(feat => {
        const li = document.createElement('li');
        li.textContent = feat;
        detailFeatures.appendChild(li);
    });
    detailRequirements.textContent = planet.requirements;

    // 🔒 Gating & License Key Setup
    if (planet.data.tier) {
        const tier = planet.data.tier;
        const defaultPrice = planet.data.defaultPrice;
        
        // Load dynamic price if synced
        const syncedPrice = pricingCache[`${tier}_inr`];
        const displayPrice = syncedPrice !== undefined ? syncedPrice : defaultPrice;

        if (!currentUser) {
            // Case 1: Logged Out
            detailLicenseContainer.style.display = 'none';
            detailDownloadBtn.href = "#";
            detailDownloadBtn.removeAttribute('target');
            detailDownloadBtn.style.background = 'rgba(239, 68, 68, 0.15)';
            detailDownloadBtn.style.borderColor = '#ef4444';
            detailDownloadBtn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.1)';
            detailDownloadBtn.innerHTML = `<span class="btn-text"><i class="fa-solid fa-lock" style="margin-right:8px;"></i> Sign In to Download</span>`;
            detailDownloadBtn.onclick = (e) => {
                e.preventDefault();
                handleLogin();
            };
        } else {
            // Case 2: Logged In
            const licenseKey = userLicenses[tier];
            if (licenseKey) {
                // Case 2A: Purchased
                detailLicenseContainer.style.display = 'block';
                detailLicenseKey.textContent = licenseKey;

                // Load dynamic download link from cache
                const dynamicUrl = downloadLinksCache[tier];
                const activeDownloadLink = dynamicUrl || `https://easyworkflow.store/download/${tier}`;

                detailDownloadBtn.href = activeDownloadLink;
                detailDownloadBtn.setAttribute('target', '_blank');
                detailDownloadBtn.style.background = `linear-gradient(135deg, ${planet.accentColor}, rgba(8, 9, 18, 0.8))`;
                detailDownloadBtn.style.borderColor = planet.accentColor;
                detailDownloadBtn.style.boxShadow = `0 8px 20px ${planet.accentColorGlow}`;
                detailDownloadBtn.innerHTML = `<span class="btn-text"><i class="fa-solid fa-download" style="margin-right:8px;"></i> Download Installer</span>`;
                detailDownloadBtn.onclick = null;
            } else {
                // Case 2B: Not Purchased
                detailLicenseContainer.style.display = 'none';
                detailDownloadBtn.href = "https://easyworkflow.store";
                detailDownloadBtn.setAttribute('target', '_blank');
                detailDownloadBtn.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.8), rgba(8, 9, 18, 0.8))';
                detailDownloadBtn.style.borderColor = '#f59e0b';
                detailDownloadBtn.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.2)';
                detailDownloadBtn.innerHTML = `<span class="btn-text"><i class="fa-solid fa-cart-shopping" style="margin-right:8px;"></i> Buy License (₹${displayPrice})</span>`;
                detailDownloadBtn.onclick = null;
            }
        }
    } else {
        // Free/External Plugins (e.g. Saber, Overlord)
        detailLicenseContainer.style.display = 'none';
        detailDownloadBtn.href = planet.downloadUrl;
        detailDownloadBtn.setAttribute('target', '_blank');
        detailDownloadBtn.style.background = `linear-gradient(135deg, ${planet.accentColor}, rgba(8, 9, 18, 0.8))`;
        detailDownloadBtn.style.borderColor = planet.accentColor;
        detailDownloadBtn.style.boxShadow = `0 8px 20px ${planet.accentColorGlow}`;
        detailDownloadBtn.innerHTML = `<span class="btn-text">Download Installer</span>`;
        detailDownloadBtn.onclick = null;
    }

    // Slide Open details
    detailsPane.classList.add('open');

    // Update camera lock button state inside details
    if (camera.focusedPlanetId === planet.id) {
        drawerFocusLockBtn.innerHTML = '🔓 UNLOCK CAMERA FOCUS';
        drawerFocusLockBtn.style.background = 'rgba(230, 34, 34, 0.15)';
        drawerFocusLockBtn.style.borderColor = '#FF3A3A';
    } else {
        drawerFocusLockBtn.innerHTML = '🎯 FOCUS LOCK TARGET';
        drawerFocusLockBtn.style.background = 'rgba(0, 255, 204, 0.08)';
        drawerFocusLockBtn.style.borderColor = planet.accentColor;
    }
}

function lockCameraOn(planetId) {
    const planet = planets.find(p => p.id === planetId);
    if (!planet) return;

    camera.focusedPlanetId = planet.id;
    hudCameraStatus.classList.add('locked');
    hudTrackingTarget.textContent = planet.name.toUpperCase();

    btnUnlockCamera.classList.remove('disabled');
    
    // Zoom in closer to show moons
    camera.targetZoom = 4.5;

    drawerFocusLockBtn.innerHTML = '🔓 UNLOCK CAMERA FOCUS';
    drawerFocusLockBtn.style.background = 'rgba(230, 34, 34, 0.15)';
    drawerFocusLockBtn.style.borderColor = '#FF3A3A';

    audioSynth.playSelectionChime();
}

function unlockCamera() {
    camera.focusedPlanetId = null;
    hudCameraStatus.classList.remove('locked');
    hudTrackingTarget.textContent = 'FREE';

    btnUnlockCamera.classList.add('disabled');

    camera.targetX = 0;
    camera.targetY = 0;
    camera.targetZ = 0;
    camera.targetZoom = 0.85;

    drawerFocusLockBtn.innerHTML = '🎯 FOCUS LOCK TARGET';
    drawerFocusLockBtn.style.background = 'rgba(0, 255, 204, 0.08)';
    if (selectedPlanet) {
        drawerFocusLockBtn.style.borderColor = selectedPlanet.accentColor;
    }

    audioSynth.playHoverBeep();
}

function focusSun() {
    unlockCamera();
    camera.targetX = 0;
    camera.targetY = 0;
    camera.targetZ = 0;
    camera.targetZoom = 0.85;
    camera.yaw = 0.0;
    camera.pitch = 1.1;
    closeDetailsPane();
    audioSynth.playSelectionChime();
}

function closeDetailsPane() {
    selectedPlanet = null;
    detailsPane.classList.remove('open');
}

// --- SEARCH & FILTER ---
function applySearchFilter() {
    const query = searchInput.value.toLowerCase().trim();

    if (query === '') {
        clearSearchBtn.style.display = 'none';
        return;
    }

    clearSearchBtn.style.display = 'block';

    const match = planets.find(p => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const catMatch = p.category.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        const featMatch = p.data.features.some(f => f.toLowerCase().includes(query));
        return nameMatch || catMatch || descMatch || featMatch;
    });

    if (match) {
        selectPlanet(match.id);
        lockCameraOn(match.id);
    }
}

// --- VIEW MODE CONTROLLER ---
function toggleViewMode(mode) {
    viewMode = mode;
    if (mode === '3d') {
        btnView3d.classList.add('active');
        btnViewGrid.classList.remove('active');
        gridView.style.display = 'none';
        canvas.style.display = 'block';
        if (!animationFrameId) {
            drawFrame();
        }
    } else {
        btnView3d.classList.remove('active');
        btnViewGrid.classList.add('active');
        canvas.style.display = 'none';
        gridView.style.display = 'flex';
        buildGridView();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

// --- BUILD GRID LIST OVERVIEW ---
function buildGridView() {
    gridContainer.innerHTML = '';
    const list = planets.length > 0 ? planets : ECOSYSTEM_DATA[currentSystem];

    list.forEach((p) => {
        const app = p.data || p;
        const card = document.createElement('article');
        card.className = 'grid-card';
        card.style.setProperty('--accent-color', app.accentColor);
        card.style.setProperty('--accent-color-glow', app.accentColorGlow);
        
        const isEW = app.id.startsWith('easyworkflow');
        const ewGlow = isEW ? 'box-shadow: 0 0 15px rgba(255,215,0,0.2); border-color: rgba(255,215,0,0.35);' : '';
        const ewTextColor = isEW ? 'color: #FFD700; text-shadow: 0 0 8px rgba(255,215,0,0.3);' : '';

        card.style.cssText += ewGlow;

        card.innerHTML = `
            <div class="card-header">
                <div class="card-logo" style="background-color: rgba(10, 11, 22, 0.9); border: 2px solid ${app.accentColor}; ${ewTextColor}">
                    ${app.logoText}
                </div>
                <div class="card-title-group">
                    <span class="card-category" style="color: ${app.accentColor}">${app.category}</span>
                    <h3 class="card-title">${app.name}</h3>
                </div>
            </div>
            <p class="card-description">${app.description}</p>
            <div class="card-footer">
                <span class="card-version">${app.version}</span>
                <span class="card-action-btn" style="color: ${isEW ? '#FFD700' : 'var(--text-secondary)'}">
                    Get Installer ➜
                </span>
            </div>
        `;

        card.addEventListener('click', () => {
            toggleViewMode('3d');
            selectPlanet(app.id);
            lockCameraOn(app.id);
        });

        gridContainer.appendChild(card);
    });
}

// --- INTERACTIVE MOUSE / TOUCH EVENTS ---
function setupInteractionEvents() {
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;

            camera.yaw += dx * 0.006;
            camera.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, camera.pitch - dy * 0.006));
            return;
        }

        if (viewMode !== '3d') return;
        
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let foundHover = null;
        for (let i = 0; i < planets.length; i++) {
            const p = planets[i];
            const dx = mx - p.screenX;
            const dy = my - p.screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < p.screenSize / 2 + 10) {
                foundHover = p;
                break;
            }
        }

        if (foundHover !== hoveredPlanet) {
            hoveredPlanet = foundHover;
            if (hoveredPlanet) {
                audioSynth.playHoverBeep();
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('click', (e) => {
        if (hoveredPlanet) {
            selectPlanet(hoveredPlanet.id);
        } else {
            closeDetailsPane();
        }
    });

    canvas.addEventListener('dblclick', (e) => {
        if (hoveredPlanet) {
            lockCameraOn(hoveredPlanet.id);
        } else {
            unlockCamera();
        }
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = 1 - e.deltaY * 0.0012;
        camera.targetZoom = Math.max(0.015, Math.min(180.0, camera.targetZoom * factor));
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastMouseX;
            const dy = e.touches[0].clientY - lastMouseY;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
            
            camera.yaw += dx * 0.008;
            camera.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, camera.pitch - dy * 0.008));
        }
    });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// --- SETUP INTERACTION UI BINDINGS ---
function setupUIHandlers() {
    tabCore.addEventListener('click', () => {
        if (currentSystem === 'core') return;
        tabCore.classList.add('active');
        tabPlugins.classList.remove('active');
        initSystem('core');
        if (viewMode === 'grid') buildGridView();
    });

    tabPlugins.addEventListener('click', () => {
        if (currentSystem === 'plugins') return;
        tabPlugins.classList.add('active');
        tabCore.classList.remove('active');
        initSystem('plugins');
        if (viewMode === 'grid') buildGridView();
    });

    speedSlider.addEventListener('input', (e) => {
        globalSpeedFactor = parseFloat(e.target.value);
        speedVal.textContent = `${globalSpeedFactor.toFixed(1)}x`;
    });

    btnFocusSun.addEventListener('click', focusSun);
    btnUnlockCamera.addEventListener('click', unlockCamera);

    btnView3d.addEventListener('click', () => toggleViewMode('3d'));
    btnViewGrid.addEventListener('click', () => toggleViewMode('grid'));

    audioToggle.addEventListener('click', () => {
        if (audioSynth.isPlaying) {
            audioSynth.stopAmbience();
            audioOnIcon.classList.add('hidden');
            audioOffIcon.classList.remove('hidden');
        } else {
            audioSynth.startAmbience();
            audioOnIcon.classList.remove('hidden');
            audioOffIcon.classList.add('hidden');
        }
    });

    searchInput.addEventListener('input', applySearchFilter);
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        unlockCamera();
        closeDetailsPane();
    });

    closeDrawerBtn.addEventListener('click', closeDetailsPane);
    
    drawerFocusLockBtn.addEventListener('click', () => {
        if (selectedPlanet) {
            if (camera.focusedPlanetId === selectedPlanet.id) {
                unlockCamera();
            } else {
                lockCameraOn(selectedPlanet.id);
            }
        }
    });

    document.getElementById('header-logo-btn').addEventListener('click', focusSun);

    // Copy License Key logic
    detailCopyLicenseBtn.addEventListener('click', () => {
        const key = detailLicenseKey.textContent;
        navigator.clipboard.writeText(key).then(() => {
            detailCopyLicenseBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
                detailCopyLicenseBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            }, 2000);
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// 🌐 GLOBAL FIREBASE CUSTOM AUTH FLOWS
// ═══════════════════════════════════════════════════════════════════
window.handleLogin = async function() {
    if (!auth) {
        alert("Firebase Auth SDK not loaded.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        audioSynth.playSelectionChime();
    } catch (e) {
        console.error("Sign-in error:", e);
        alert("Sign-in failed: " + e.message);
    }
};

window.handleLogout = async function(e) {
    if (e) e.stopPropagation();
    if (!auth) return;
    if (confirm("Are you sure you want to sign out?")) {
        try {
            await auth.signOut();
            closeUserDropdown();
            closeDetailsPane();
        } catch (err) {
            console.error("Sign-out error:", err);
        }
    }
};

window.toggleUserDropdown = function(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('userProfile');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
};

function closeUserDropdown() {
    const dropdown = document.getElementById('userProfile');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// Close dropdown on outside clicks
window.addEventListener('click', () => {
    closeUserDropdown();
});

// --- DYNAMIC DATABASE LOADERS ---
async function fetchFirebaseConfigurations(email) {
    if (!db) return;
    try {
        // 1. Fetch User Licenses
        const snap = await db.collection('licenses')
            .where('email', '==', email.toLowerCase().trim())
            .get();
        
        userLicenses = {};
        snap.forEach(doc => {
            const data = doc.data();
            if (data.tier && data.licenseKey) {
                userLicenses[data.tier.toLowerCase()] = data.licenseKey;
            }
        });
        console.log("Synced active licenses from database:", userLicenses);

        // 2. Fetch Downloads link configs
        const dlDoc = await db.collection('config').doc('downloads').get();
        if (dlDoc.exists) {
            downloadLinksCache = dlDoc.data() || {};
        }

        // 3. Fetch Pricing Configs
        const prDoc = await db.collection('config').doc('pricing').get();
        if (prDoc.exists) {
            pricingCache = prDoc.data() || {};
        }

    } catch (err) {
        console.error("Error fetching configurations:", err);
    }
}

// --- INIT APP ---
function initApp() {
    handleResize();
    window.addEventListener('resize', handleResize);

    generateStarfield();
    initSystem('core');
    setupInteractionEvents();
    setupUIHandlers();

    // Setup Firebase Auth State Listeners
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            const loginBtn = document.getElementById('loginBtn');
            const userProfile = document.getElementById('userProfile');
            
            if (user) {
                currentUser = user;
                
                // Update profile HUD pill
                if (loginBtn) loginBtn.style.display = 'none';
                if (userProfile) userProfile.style.display = 'flex';
                
                document.getElementById('userName').textContent = user.displayName?.split(' ')[0] || 'Creator';
                document.getElementById('userPhoto').src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`;
                
                document.getElementById('dropdown-user-name').textContent = user.displayName || 'Creator';
                document.getElementById('dropdown-user-email').textContent = user.email;

                // Toggle Admin Panel link visibility
                const adminLink = document.getElementById('admin-panel-link');
                if (adminLink) {
                    adminLink.style.display = ALLOWED_ADMIN_UIDS.includes(user.uid) ? 'flex' : 'none';
                }

                // Sync data dynamically
                await fetchFirebaseConfigurations(user.email);

                // Update current side details drawer if open
                if (selectedPlanet) {
                    selectPlanet(selectedPlanet.id);
                }
            } else {
                currentUser = null;
                userLicenses = {};
                
                if (loginBtn) loginBtn.style.display = 'flex';
                if (userProfile) userProfile.style.display = 'none';

                if (selectedPlanet) {
                    selectPlanet(selectedPlanet.id);
                }
            }
        });
    }

    drawFrame();
}

// Bootstrap
document.addEventListener('DOMContentLoaded', initApp);
