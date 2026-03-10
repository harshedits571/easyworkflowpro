/* ===== Easy Workflow Pro — Main JavaScript ===== */

// ===== GEO-BASED CURRENCY DETECTION =====
// Pricing config: Indian users see INR, everyone else sees USD
const PRICING = {
    IN: {
        currency: 'INR',
        symbol: '₹',
        basic: { amount: 100, label: '₹100', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflow', formValue: 'basic - ₹100' },
        pro: { amount: 1500, label: '₹1500', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - ₹1500' },
        proAfterDeadline: { amount: 2000, label: '₹2000', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - ₹2000' },
        showUPI: true,
        badge: '🇮🇳 Prices in INR'
    },
    US: {
        currency: 'USD',
        symbol: '$',
        basic: { amount: 2, label: '$2', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflow', formValue: 'basic - $2' },
        pro: { amount: 18, label: '$18', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - $18' },
        proAfterDeadline: { amount: 24, label: '$24', gumroadLink: 'https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n', formValue: 'pro - $24' },
        showUPI: false,
        badge: '🌍 Prices in USD'
    }
};

// ===== PRICE INCREASE DEADLINE =====
// After this date, Pro price increases automatically
const PRICE_DEADLINE = new Date('2026-03-20T23:59:59+05:30'); // March 20, 2026 end of day IST

function isPastDeadline() {
    return new Date() > PRICE_DEADLINE;
}

// Apply deadline pricing — overwrite pro config if past deadline
function applyDeadlinePricing(region) {
    if (isPastDeadline() && region.proAfterDeadline) {
        region.pro = { ...region.proAfterDeadline };
    }
    return region;
}

// Detected region config — defaults to IN until API call completes
// (site is India-primary; non-Indian users switch to USD once geo-API responds)
window.pricingRegion = applyDeadlinePricing({ ...PRICING.IN });

// ===== COUNTDOWN TIMER =====
function initCountdownTimer() {
    const banner = document.getElementById('countdown-banner');
    if (!banner) return;

    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const newPriceLabel = document.getElementById('new-price-label');

    // Update the "increases to" label based on detected currency
    function updateNewPriceLabel() {
        const region = window.pricingRegion || PRICING.IN;
        // Show the post-deadline price from the original config (not the overwritten one)
        const originalRegion = (region.currency === 'USD') ? PRICING.US : PRICING.IN;
        if (newPriceLabel && originalRegion.proAfterDeadline) {
            newPriceLabel.textContent = originalRegion.proAfterDeadline.label;
        }
    }

    function updateTimer() {
        const now = new Date();
        const diff = PRICE_DEADLINE - now;

        if (diff <= 0) {
            // Deadline passed — completely hide the countdown banner
            banner.style.display = 'none';
            return; // stop ticking
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

        setTimeout(updateTimer, 1000);
    }

    updateNewPriceLabel();
    updateTimer();

    // Re-update label whenever pricing region changes
    window._updateCountdownLabel = updateNewPriceLabel;
}

function applyPricingToPage(region) {
    const p = region;
    const sym = p.symbol;
    const basicAmt = p.basic.amount;
    const proAmt = p.pro.amount;

    // --- Pricing section currencies and values ---
    // Price currency symbols
    document.querySelectorAll('.price-currency').forEach(el => { el.textContent = sym; });

    // Price values — update based on sibling label context
    document.querySelectorAll('.price-card').forEach(card => {
        const titleEl = card.querySelector('h3');
        const valueEl = card.querySelector('.price-value');
        const noteEl = card.querySelector('.price-note');
        const btnBlock = card.querySelector('.btn-block');
        if (!titleEl || !valueEl) return;

        const isProCard = titleEl.textContent.trim().toLowerCase().includes('pro');

        if (isProCard) {
            valueEl.textContent = proAmt;
            // Update inline CTA button text
            if (btnBlock && btnBlock.id === 'btn-pro') {
                btnBlock.textContent = `Get Pro — ${p.pro.label}`;
            }
        } else {
            valueEl.textContent = basicAmt;
            // Update note text
            if (noteEl && noteEl.textContent.includes('100') || noteEl && noteEl.textContent.includes('2')) {
                noteEl.innerHTML = `Just ${p.basic.label} for lifetime access`;
            }
            // Update Basic card button
            if (btnBlock && (btnBlock.dataset.tier === 'basic' || btnBlock.id === 'btn-free')) {
                const isPayBtn = btnBlock.classList.contains('btn-pay');
                if (isPayBtn) btnBlock.textContent = `Get Basic — ${p.basic.label}`;
            }
        }
    });

    // Price badge on free version card ("JUST ₹100" / "JUST $2")
    document.querySelectorAll('.price-badge').forEach(badge => {
        if (badge.textContent.includes('POPULAR')) return; // skip "MOST POPULAR"
        badge.textContent = `JUST ${p.basic.label}`;
    });

    // --- CTA section buttons ---
    document.querySelectorAll('a[href="#pricing"].btn-primary.pro-only').forEach(btn => {
        btn.textContent = `Get Pro — ${p.pro.label}`;
    });
    document.querySelectorAll('.btn-pay').forEach(btn => {
        btn.textContent = `Get Basic Script — ${p.basic.label}`;
    });

    // --- Hero section CTA (has an inner <span>, needs separate targeting) ---
    const heroCTAText = document.getElementById('hero-pro-cta-text');
    if (heroCTAText) heroCTAText.textContent = `Get Pro — ${p.pro.label}`;

    // --- Hero free subtitle inline price ---
    const heroBasicInline = document.getElementById('hero-basic-price-inline');
    if (heroBasicInline) heroBasicInline.textContent = p.basic.label;

    // Inline text notes
    document.querySelectorAll('.price-note').forEach(note => {
        if (note.querySelector('a')) return; // skip notes with links
        if (note.textContent.includes('Just') || note.textContent.includes('Instant')) {
            if (note.closest('.price-card-pro')) {
                note.innerHTML = `Instant download • Lifetime access`;
            }
        }
    });

    // --- FAQ text updates ---
    document.querySelectorAll('.faq-answer p').forEach(p_el => {
        // Replace INR mentions with correct currency
        if (p.currency === 'USD') {
            p_el.innerHTML = p_el.innerHTML
                .replace(/₹100/g, '$2')
                .replace(/₹1[,.]?500/g, '$18')
                .replace(/₹1500/g, '$18');
        }
    });

    // --- Currency badge in pricing header ---
    // Inject or update a small badge showing which currency is active
    let badge = document.getElementById('currency-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'currency-badge';
        badge.style.cssText = [
            'display:inline-flex', 'align-items:center', 'gap:6px',
            'background:rgba(255,255,255,0.06)', 'border:1px solid rgba(255,255,255,0.12)',
            'border-radius:20px', 'padding:4px 14px', 'font-size:12px',
            'color:var(--text-secondary)', 'margin-top:12px', 'letter-spacing:0.03em'
        ].join(';');
        // Append after each pricing section-header subtitle
        document.querySelectorAll('.pricing .section-subtitle').forEach(subtitle => {
            const clone = badge.cloneNode(true);
            clone.textContent = p.badge;
            subtitle.insertAdjacentElement('afterend', clone);
        });
    } else {
        document.querySelectorAll('#currency-badge').forEach(b => { b.textContent = p.badge; });
    }
}

async function detectAndApplyCurrency() {
    // ---- URL OVERRIDE FOR TESTING ----
    // Add ?currency=usd or ?currency=inr to the URL to force a currency
    const urlParam = new URLSearchParams(window.location.search).get('currency');
    if (urlParam === 'usd') {
        window.pricingRegion = applyDeadlinePricing({ ...PRICING.US });
        applyPricingToPage(window.pricingRegion);
        if (window._updateCountdownLabel) window._updateCountdownLabel();
        return;
    }
    if (urlParam === 'inr') {
        window.pricingRegion = applyDeadlinePricing({ ...PRICING.IN });
        applyPricingToPage(window.pricingRegion);
        if (window._updateCountdownLabel) window._updateCountdownLabel();
        return;
    }
    // ----------------------------------

    // Helper: try a single geo API, returns country code string or null
    async function tryGeoAPI(url, extractor) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (!res.ok) return null;
            const data = await res.json();
            const code = extractor(data);
            return (typeof code === 'string' && code.length === 2) ? code.toUpperCase() : null;
        } catch (e) {
            return null;
        }
    }

    // Try 4 HTTPS-compatible geo APIs in order — stops as soon as one works
    // NOTE: ip-api.com was removed — it does NOT support HTTPS on the free tier
    let countryCode =
        await tryGeoAPI('https://ipapi.co/json/', d => d.country_code) ||
        await tryGeoAPI('https://freeipapi.com/api/json', d => d.countryCode) ||
        await tryGeoAPI('https://api.country.is/', d => d.country) ||
        await tryGeoAPI('https://ipinfo.io/json', d => d.country);

    if (countryCode) {
        window.pricingRegion = applyDeadlinePricing((countryCode === 'IN') ? { ...PRICING.IN } : { ...PRICING.US });
    } else {
        // All APIs failed — default to INR (site is India-primary)
        window.pricingRegion = applyDeadlinePricing({ ...PRICING.IN });
    }

    applyPricingToPage(window.pricingRegion);
    if (window._updateCountdownLabel) window._updateCountdownLabel();
}

// Run geo-detection immediately (before DOM ready, catches early elements)
detectAndApplyCurrency();

// Re-apply after DOM is fully ready to catch elements rendered after script runs
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let the page fully paint before re-applying
    setTimeout(() => applyPricingToPage(window.pricingRegion), 100);
    initCountdownTimer(); // Start the countdown!
});

document.addEventListener('DOMContentLoaded', () => {

    // ===== LENIS SMOOTH SCROLL =====
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // ===== NAVBAR SCROLL =====
    const navbar = document.getElementById('navbar');

    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // ===== MOBILE MENU =====
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
        document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('mobile-open');
            document.body.style.overflow = '';
        });
    });

    // ===== SCROLL REVEAL ANIMATIONS =====
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, parseInt(delay));
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ===== COUNTER ANIMATION =====
    const counters = document.querySelectorAll('.stat-number[data-target]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    function animateCounter(el) {
        const target = parseInt(el.dataset.target);
        const duration = 2000;
        const start = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            el.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ===== INTERACTIVE TABS =====
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update active button
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active panel
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `tab-${targetTab}`) {
                    panel.classList.add('active');
                }
            });
        });
    });

    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all items
            faqItems.forEach(i => i.classList.remove('open'));

            // Toggle clicked item
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = navbar.offsetHeight + 20;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== PARTICLE BACKGROUND (HERO) =====
    const hero = document.querySelector('.hero-bg');
    if (hero) {
        createParticles(hero);
    }

    function createParticles(container) {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        function resize() {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.1,
                hue: Math.random() > 0.5 ? 270 : 190 // purple or cyan
            };
        }

        function init() {
            resize();
            particles = Array.from({ length: 60 }, createParticle);
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
                if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(124, 58, 237, ${0.06 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(draw);
        }

        init();
        draw();

        window.addEventListener('resize', () => {
            resize();
        });
    }

    // ===== NAVBAR ACTIVE LINK HIGHLIGHT =====
    const sections = document.querySelectorAll('section[id]');

    const activeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.querySelectorAll('a').forEach(link => {
                    link.classList.toggle('active',
                        link.getAttribute('href') === `#${id}`
                    );
                });
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => activeObserver.observe(section));

    // ===== MOCKUP TAB SWITCHING =====
    const mockupTabs = document.querySelectorAll('.mockup-tab[data-mockup-tab]');
    const mockupPanels = document.querySelectorAll('.mockup-panel[data-panel]');

    mockupTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.mockupTab;

            // Switch active tab
            mockupTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch active panel
            mockupPanels.forEach(p => {
                p.classList.remove('active');
                if (p.dataset.panel === target) {
                    p.classList.add('active');
                }
            });
        });
    });
    // ===== CURSOR GLOW =====
    const cursorGlow = document.createElement('div');
    cursorGlow.classList.add('cursor-glow');
    document.body.appendChild(cursorGlow);

    let glowX = 0, glowY = 0, currentX = 0, currentY = 0;
    document.addEventListener('mousemove', (e) => {
        glowX = e.clientX;
        glowY = e.clientY;
    });

    function updateGlow() {
        currentX += (glowX - currentX) * 0.08;
        currentY += (glowY - currentY) * 0.08;
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';
        requestAnimationFrame(updateGlow);
    }
    updateGlow();

    // ===== SCROLL PROGRESS BAR =====
    const scrollProgress = document.createElement('div');
    scrollProgress.classList.add('scroll-progress');
    document.body.appendChild(scrollProgress);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
        scrollProgress.style.transform = `scaleX(${scrollPercent})`;
    }, { passive: true });

    // ===== PAGE LOADER =====
    const loader = document.querySelector('.page-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 300);
        });
    }

    // ===== SUBTLE PARALLAX ON GLOW ORBS =====
    const orbs = document.querySelectorAll('.glow-orb');
    if (orbs.length > 0) {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            orbs.forEach((orb, i) => {
                const speed = (i + 1) * 0.03;
                orb.style.transform = `translateY(${scrollY * speed}px)`;
            });
        }, { passive: true });
    }
    // ===== VERSION TOGGLE (FREE / PRO) =====
    const toggleOptions = document.querySelectorAll('.toggle-option');
    const body = document.body;

    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            const version = option.dataset.version;
            const currentVersion = body.getAttribute('data-version');

            // Don't switch if already on this version
            if (version === currentVersion) return;

            // Update toggle UI
            toggleOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');

            // Start transition animation (3D flip out)
            body.classList.add('version-transitioning');

            // Wait for flip-out to complete
            setTimeout(() => {
                // Switch version
                body.setAttribute('data-version', version);

                // Swap classes for entrance animation (3D flip in)
                body.classList.remove('version-transitioning');
                body.classList.add('version-entering');

                // Re-trigger reveal animations for newly visible content
                const newVisibleElements = document.querySelectorAll(
                    `.${version === 'free' ? 'free' : 'pro'}-only .reveal, .${version === 'free' ? 'free' : 'pro'}-only.reveal`
                );
                newVisibleElements.forEach(el => {
                    el.classList.remove('active');
                    void el.offsetWidth; // Force reflow
                    el.classList.add('active');
                });

                // Reset deep-dive tabs - activate the first tab for current version
                const activeTabsNav = document.querySelector(`.tabs-nav.${version}-only`);
                if (activeTabsNav) {
                    const firstBtn = activeTabsNav.querySelector('.tab-btn');
                    if (firstBtn) {
                        // Clear all tab buttons active state
                        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                        firstBtn.classList.add('active');

                        // Clear all panels, activate the first one
                        const targetTab = firstBtn.dataset.tab;
                        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                        const targetPanel = document.getElementById(`tab-${targetTab}`);
                        if (targetPanel) targetPanel.classList.add('active');
                    }
                }

                // Reset mockup tabs - activate the first tab for current version
                const activeMockupTabsNav = document.querySelector(`.mockup-tabs.${version}-only`);
                if (activeMockupTabsNav) {
                    const firstMockupBtn = activeMockupTabsNav.querySelector('.mockup-tab');
                    if (firstMockupBtn) {
                        // Clear all mockup tab buttons active state
                        document.querySelectorAll('.mockup-tab').forEach(b => b.classList.remove('active'));
                        firstMockupBtn.classList.add('active');

                        // Clear all mockup panels, activate the first one correctly
                        const targetMockup = firstMockupBtn.dataset.mockupTab;
                        document.querySelectorAll('.mockup-panel').forEach(p => p.classList.remove('active'));

                        const targetPanels = document.querySelectorAll(`.mockup-panel[data-panel="${targetMockup}"]`);
                        targetPanels.forEach(p => {
                            if (p.classList.contains('pro-only') && version !== 'pro') return;
                            if (p.classList.contains('free-only') && version !== 'free') return;
                            p.classList.add('active');
                        });
                    }
                }

                // Re-animate stat counters
                const visibleCounters = document.querySelectorAll(
                    `.${version === 'free' ? 'free' : 'pro'}-only .stat-number[data-target]`
                );
                visibleCounters.forEach(counter => {
                    counter.textContent = '0';
                    animateCounter(counter);
                });

                // End transition animation
                setTimeout(() => {
                    body.classList.remove('version-entering');
                }, 600);
            }, 500);
        });
    });

    // ===== GET PRO MODAL LOGIC =====
    const proButtons = document.querySelectorAll('#btn-pro');

    // Create Modal Element
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);z-index:9999;display:none;justify-content:center;align-items:center;opacity:0;transition:opacity 0.3s ease;';

    const modalBox = document.createElement('div');
    modalBox.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:32px;max-width:500px;width:90%;position:relative;transform:translateY(20px);transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);box-shadow:0 20px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1);text-align:center;';

    // Modal Content
    modalBox.innerHTML = `
        <button id="close-modal" style="position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text-secondary);font-size:24px;cursor:pointer;line-height:1;">&times;</button>
        <h2 id="modal-title" style="font-family:var(--font-heading);color:white;margin-bottom:8px;font-size:24px;">Upgrade to Pro</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;font-size:14px;">Choose your preferred payment method. After UPI payment, you will receive a 100% discount Gumroad link.</p>
        
        <div style="display:flex;flex-direction:column;gap:16px;">
            <!-- Gumroad Option -->
            <a id="gumroad-link" href="https://harshedits55.gumroad.com/l/Easyworkflowpro/lo8on3n" target="_blank" style="text-decoration:none;">
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;transition:all 0.2s ease;cursor:pointer;" onmouseover="this.style.background='rgba(124,58,237,0.1)';this.style.borderColor='var(--purple)';" onmouseout="this.style.background='rgba(255,255,255,0.03)';this.style.borderColor='rgba(255,255,255,0.1)';">
                    <div style="width:40px;height:40px;background:#ff90e8;border-radius:8px;display:flex;justify-content:center;align-items:center;font-weight:bold;color:black;">G</div>
                    <div style="text-align:left;">
                        <h3 style="color:white;font-size:16px;margin:0;">Pay via Gumroad</h3>
                        <p style="color:var(--text-muted);font-size:12px;margin:2px 0 0 0;">International & Cards • Instant Download</p>
                    </div>
                </div>
            </a>

            <!-- UPI Option -->
            <div id="upi-option" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px;transition:all 0.2s ease;cursor:pointer;" onmouseover="this.style.background='rgba(16,185,129,0.1)';this.style.borderColor='var(--green)';" onmouseout="this.style.background='rgba(255,255,255,0.03)';this.style.borderColor='rgba(255,255,255,0.1)';">
                <div style="width:40px;height:40px;background:#10b981;border-radius:8px;display:flex;justify-content:center;align-items:center;color:white;"><i class="fa-solid fa-qrcode"></i></div>
                <div style="text-align:left;">
                    <h3 style="color:white;font-size:16px;margin:0;">Pay via UPI (India)</h3>
                    <p style="color:var(--text-muted);font-size:12px;margin:2px 0 0 0;">Google Pay, PhonePe, Paytm</p>
                </div>
            </div>
        </div>
        
        <!-- UPI Details Form (Hidden Initially) -->
        <div id="upi-details" style="display:none;margin-top:24px;text-align:left;animation:panelFadeIn 0.3s ease;">
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin-bottom:24px;">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="width:150px;height:150px;background:white;margin:0 auto 12px auto;border-radius:8px;display:flex;justify-content:center;align-items:center;color:black;font-size:12px;overflow:hidden;">
                    <img src="qr-code.png" alt="PhonePe QR Code" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />
                </div>
                <p style="color:var(--text-secondary);font-size:13px;">Scan to pay <strong id="upi-price">₹1500</strong></p>
            </div>
            
            <form id="upi-form" action="https://formspree.io/f/mgolnydk" method="POST">
                <input type="hidden" name="purchased_tier" id="form-tier" value="pro">
                <div style="margin-bottom:12px;">
                    <label style="display:block;color:var(--text-secondary);font-size:12px;margin-bottom:4px;">Full Name</label>
                    <input type="text" name="name" required style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--border);padding:10px 12px;border-radius:8px;color:white;font-family:inherit;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;color:var(--text-secondary);font-size:12px;margin-bottom:4px;">Email Address</label>
                    <input type="email" name="email" required style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--border);padding:10px 12px;border-radius:8px;color:white;font-family:inherit;font-size:14px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block;color:var(--text-secondary);font-size:12px;margin-bottom:4px;">Phone Number (WhatsApp)</label>
                    <input type="tel" name="phone" required style="width:100%;background:rgba(0,0,0,0.3);border:1px solid var(--border);padding:10px 12px;border-radius:8px;color:white;font-family:inherit;font-size:14px;box-sizing:border-box;">
                </div>
                <button type="submit" id="upi-submit-btn" class="btn btn-primary btn-block">Confirm Payment</button>
                <p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:12px;">We'll email you a 100% discount Gumroad link after verifying the payment.</p>
            </form>
        </div>
    `;

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    // Open Modal function
    function openModal(e) {
        if (e) e.preventDefault();

        // Determine if basic or pro was clicked
        let tier = 'pro';
        if (e && e.currentTarget && e.currentTarget.getAttribute('data-tier') === 'basic') {
            tier = 'basic';
        } else if (e && e.currentTarget && e.currentTarget.getAttribute('data-tier') === 'pro') {
            tier = 'pro';
        } else {
            // fallback if called generically, assume current view context
            tier = document.body.getAttribute('data-version') === 'pro' ? 'pro' : 'basic';
        }

        // Dynamically update modal content based on the selected tier + detected currency
        const region = window.pricingRegion || PRICING.IN;
        const tierConfig = (tier === 'basic') ? region.basic : region.pro;

        if (tier === 'basic') {
            document.getElementById('modal-title').textContent = 'Get Workflow Basic';
        } else {
            document.getElementById('modal-title').textContent = 'Upgrade to Pro';
        }
        document.getElementById('gumroad-link').href = tierConfig.gumroadLink;
        document.getElementById('upi-price').textContent = tierConfig.label;
        document.getElementById('form-tier').value = tierConfig.formValue;

        // Update the modal sub-description based on region
        const modalDesc = modalBox.querySelector('p');
        if (modalDesc) {
            if (region.showUPI) {
                modalDesc.textContent = 'Choose your preferred payment method. After UPI payment, you will receive a 100% discount Gumroad link.';
            } else {
                modalDesc.textContent = 'Click below to complete your purchase securely via Gumroad. Instant download after payment.';
            }
        }

        // Show/Hide UPI option based on region
        const upiOptionEl = document.getElementById('upi-option');
        const upiDetailsEl = document.getElementById('upi-details');
        if (upiOptionEl) {
            upiOptionEl.style.display = region.showUPI ? 'flex' : 'none';
        }
        if (!region.showUPI && upiDetailsEl) {
            upiDetailsEl.style.display = 'none';
        }

        // Update Gumroad button label for non-Indian users
        const gumroadInnerLabel = modalBox.querySelector('#gumroad-link h3');
        if (gumroadInnerLabel) {
            gumroadInnerLabel.textContent = region.showUPI ? 'Pay via Gumroad' : `Pay via Gumroad — ${tierConfig.label}`;
        }

        modalOverlay.style.display = 'flex';
        // Trigger layout reflow
        void modalOverlay.offsetWidth;
        modalOverlay.style.opacity = '1';
        modalBox.style.transform = 'translateY(0)';
        document.body.style.overflow = 'hidden'; // prevent bg scroll
    }

    // Close Modal function
    function closeModal() {
        modalOverlay.style.opacity = '0';
        modalBox.style.transform = 'translateY(20px)';
        setTimeout(() => {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
            // reset UPI form visibility if it was open
            document.getElementById('upi-details').style.display = 'none';
        }, 300);
    }

    // Attach listeners to Pro buttons
    proButtons.forEach(btn => btn.addEventListener('click', openModal));
    // Also attach to navbar Get Pro button
    const navProBtns = document.querySelectorAll('a[href="#pricing"].btn-primary.pro-only');
    navProBtns.forEach(btn => btn.addEventListener('click', openModal));

    // Attach listeners to basic buttons
    const basicBtns = document.querySelectorAll('.btn-pay');
    basicBtns.forEach(btn => btn.addEventListener('click', openModal));

    // Close listeners
    document.getElementById('close-modal').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // UPI Option Click -> Show Form
    document.getElementById('upi-option').addEventListener('click', () => {
        const upiDetails = document.getElementById('upi-details');
        if (upiDetails.style.display === 'none') {
            upiDetails.style.display = 'block';
        }
    });

    // Form Submission (Handle via Formspree AJAX to stay on page)
    const upiForm = document.getElementById('upi-form');
    upiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('upi-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        const formData = new FormData(upiForm);

        try {
            const response = await fetch(upiForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                showToast('Details submitted successfully! Verification usually takes a few minutes. We will email you the Gumroad link with a 100% discount code shortly.', 'success');
                closeModal();
                upiForm.reset();
            } else {
                showToast('Oops! There was a problem submitting your form. Please try again.', 'error');
            }
        } catch (error) {
            showToast('Oops! There was a problem submitting your form. Please check your internet connection and try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

});

// ===== CENTERED ALERT NOTIFICATION ======
function showToast(message, type = 'success') {
    // Alert Overlay
    const alertOverlay = document.createElement('div');
    alertOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(5px);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    const textColor = type === 'success' ? '#10b981' : '#ef4444';

    // Alert Box
    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
        background: var(--bg-card);
        border: 2px solid ${bgColor};
        color: white;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 20px 80px rgba(0,0,0,0.6);
        font-size: 16px;
        text-align: center;
        max-width: 500px;
        width: 90%;
        transform: translateY(20px) scale(0.95);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    alertBox.innerHTML = `
        <div style="font-weight:700; font-family:var(--font-heading); font-size:24px; margin-bottom:12px; color:${textColor};">
            ${type === 'success' ? 'Success!' : 'Error'}
        </div>
        <div style="color:var(--text-secondary); line-height:1.6; font-size:16px; margin-bottom:24px;">
            ${message}
        </div>
        <button id="alert-ok-btn" style="
            background: ${bgColor}; 
            color: white; 
            border: none; 
            padding: 12px 32px; 
            font-size: 16px; 
            font-weight: 600; 
            border-radius: 8px; 
            cursor: pointer;
            transition: opacity 0.2s;
        ">OK</button>
    `;

    alertOverlay.appendChild(alertBox);
    document.body.appendChild(alertOverlay);

    // Fade in
    setTimeout(() => {
        alertOverlay.style.opacity = '1';
        alertBox.style.transform = 'translateY(0) scale(1)';
    }, 10);

    // Dismiss Logic
    function dismissAlert() {
        alertOverlay.style.opacity = '0';
        alertBox.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => {
            alertOverlay.remove();
        }, 300);
    }

    // Attach click listener to OK button
    const okBtn = alertBox.querySelector('#alert-ok-btn');
    okBtn.addEventListener('click', dismissAlert);

    // Hover effect on OK button
    okBtn.addEventListener('mouseover', () => okBtn.style.opacity = '0.8');
    okBtn.addEventListener('mouseout', () => okBtn.style.opacity = '1');
}

// ===== TIMELINE PREVIEW LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
    const previewButtons = document.querySelectorAll('[data-preview]');
    const layersList = document.getElementById('timeline-layers-list');
    const timelineTime = document.querySelector('.timeline-time');
    const timelinePlayhead = document.querySelector('.timeline-playhead');
    const compViewer = document.getElementById('comp-viewer');
    const compObject = document.getElementById('comp-object');
    const timelinePreview = document.getElementById('timeline-preview');

    if (!layersList) return;

    // AE exact colors
    const C = {
        red: { bg: '#ef4444', bar: 'rgba(239, 68, 68, 0.4)' },
        teal: { bg: '#06b6d4', bar: 'rgba(6, 182, 212, 0.4)' },
        orange: { bg: '#f59e0b', bar: 'rgba(245, 158, 11, 0.4)' },
        purple: { bg: '#a855f7', bar: 'rgba(168, 85, 247, 0.4)' },
        blue: { bg: '#3b82f6', bar: 'rgba(59, 130, 246, 0.4)' },
        pink: { bg: '#ec4899', bar: 'rgba(236, 72, 153, 0.4)' },
    };

    let sequenceTimer = null;
    let scenarioIndex = 0;

    const createLayer = (num, name, color, left, width, isAnimated, isSelected = false, extras = '') => {
        const selectStyle = isSelected ? 'background:rgba(255,255,255,0.15); border-radius:3px; padding:0 4px;' : '';
        const selectBar = isSelected ? 'border:1px solid #fff;' : `border:1px solid ${color.bg};`;
        const animClass = isAnimated ? 'animated-in' : '';
        return `
            <div class="timeline-layer ${animClass}">
                <div class="layer-info" style="${isSelected ? 'background:#333;' : ''}">
                    <span class="layer-color" style="background:${color.bg}"></span>
                    <span class="layer-num">${num}</span>
                    <span class="layer-name" style="${selectStyle}">${name}</span>
                </div>
                <div class="layer-bar-container">
                    <div class="layer-bar" style="background:${color.bar}; ${selectBar} left:${left}; width:${width};">
                        ${extras}
                    </div>
                </div>
            </div>
        `;
    };

    // Universal State Machine for all Button Previews
    const ACTION_SCENARIOS = {
        'SOLID': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;transition:background 0.3s;background:transparent;"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Full_Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = '#ef4444';
                        return createLayer(1, '[Solid 1]', C.red, '0%', '100%', true) + createLayer(2, '[Full_Video.mp4]', C.teal, '0%', '100%', false);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'NULL': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.teal, '10%', '60%', false, true) + createLayer(2, '[Layer 2]', C.purple, '20%', '40%', false, true),
                    after: () => createLayer(1, '[Null 1]', C.orange, '10%', '60%', true) + createLayer(2, '[Layer 1]', C.teal, '10%', '60%', false) + createLayer(3, '[Layer 2]', C.purple, '20%', '40%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'CAMERA': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Camera Controller]', C.orange, '0%', '100%', true) + createLayer(2, '[Camera 1]', C.teal, '0%', '100%', true) + createLayer(3, '[Video.mp4]', C.teal, '0%', '100%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TEXT': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'TEXT'; o.style.cssText = 'color: white; font-size: 0px; font-weight:800; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform:scale(0);'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.transform = 'scale(1)';
                        return createLayer(1, '[Text 1]', C.purple, '0%', '100%', true) + createLayer(2, '[Video.mp4]', C.teal, '0%', '100%', false);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'BOUNCE': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'TEXT'; o.className = 'comp-object'; o.style.cssText = 'color:white; font-size:28px; font-weight:800;'; },
            steps: [
                {
                    before: () => createLayer(1, 'TEXT', C.purple, '10%', '80%', false, true, '<div class="keyframe-dot" style="left:5%;"></div>'),
                    after: () => {
                        compObject.classList.add('bounce-active');
                        return createLayer(1, 'TEXT', C.purple, '10%', '80%', false, true, '<div class="keyframe-dot" style="left:5%;"></div><div class="keyframe-dot" style="left:15%;"></div>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;02'
                }
            ]
        },
        'RAMP': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;transition:background 0.5s;background:#888;"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Shape Layer]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = 'linear-gradient(180deg, #ff00ff 0%, #00ffff 100%)';
                        return createLayer(1, '[Shape Layer]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'FIT': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:20px;height:10px;background:#06b6d4;transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Small_Image.png]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.width = '100%';
                        compObject.firstChild.style.height = '100%';
                        return createLayer(1, '[Small_Image.png]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'GLOW': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'GLOW'; o.style.cssText = 'color: white; font-size: 28px; font-weight:800; transition: text-shadow 0.5s; text-shadow: none;'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Logo.png]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.textShadow = '0 0 10px #fff, 0 0 20px #f0f, 0 0 30px #f0f';
                        return createLayer(1, '[Logo.png]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'ADJ': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;background:#444;position:relative;"><div id="adjOverlay" style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background 0.5s;"></div></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        const overlay = o.querySelector('#adjOverlay');
                        if (overlay) overlay.style.background = 'rgba(255,100,200,0.3)';
                        return createLayer(1, '[Adjustment 1]', C.cyan, '0%', '100%', true) + createLayer(2, '[Video.mp4]', C.teal, '0%', '100%', false);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TRIM': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer_To_Trim.mp4]', C.teal, '0%', '100%', false, true) + createLayer(2, '[Base_Layer.mp4]', C.purple, '30%', '40%', false),
                    after: () => createLayer(1, '[Layer_To_Trim.mp4]', C.teal, '30%', '40%', true, true) + createLayer(2, '[Base_Layer.mp4]', C.purple, '30%', '40%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'MIRROR': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'IMG'; o.style.cssText = 'color:white; font-size:28px; font-weight:800; transition:transform 0.5s; transform:scaleX(1);'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.transform = 'scaleX(-1)';
                        return createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'FILL': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:40px;height:40px;border-radius:50%;background:#fff;transition:background 0.5s;"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Shape]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = '#ef4444';
                        return createLayer(1, '[Shape]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TINT': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(45deg,#00f,#f0f);transition:filter 0.5s, background 0.5s;filter:grayscale(0%);"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.background = 'linear-gradient(45deg,#000,#fff)';
                        return createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'BLUR': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'FOCUS'; o.style.cssText = 'color:white; font-size:24px; font-weight:800; transition: filter 0.5s; filter: blur(0px);'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Text]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.filter = 'blur(4px)';
                        return createLayer(1, '[Text]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'LUM': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:100%;height:100%;background:url(https://images.unsplash.com/photo-1542204165-65bf26472b9b?h=120) center/cover; transition:filter 0.5s; filter:contrast(50%) brightness(80%) saturate(10%);"></div>'; o.className = 'comp-object'; o.style.cssText = ''; },
            steps: [
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => {
                        compObject.firstChild.style.filter = 'contrast(130%) brightness(100%) saturate(140%) hue-rotate(10deg)';
                        return createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'CAPITAL': {
            useViewer: true,
            setupViewer: (v, o) => { o.textContent = 'text layer'; o.style.cssText = 'color:white; font-size:20px; text-transform:lowercase; font-weight:800; transition:all 0.3s;'; o.className = 'comp-object'; },
            steps: [
                {
                    before: () => createLayer(1, '[Text]', C.purple, '0%', '100%', false, true),
                    after: () => {
                        compObject.style.textTransform = 'uppercase';
                        return createLayer(1, '[Text]', C.purple, '0%', '100%', false, true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'FXLOCK': {
            useViewer: true,
            setupViewer: (v, o) => { o.innerHTML = '<div style="width:80px;height:80px;border-radius:10px;background:linear-gradient(135deg,#f0f,#00f);position:absolute;transition:all 0.5s cubic-bezier(0.175,0.885,0.32,1.275);left:10%;top:20%;"></div>'; o.className = 'comp-object'; o.style.cssText = 'width:100%;height:100%;position:relative;'; },
            steps: [
                {
                    before: () => createLayer(1, '[Shape Layer (Gradient)]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#ef4444; color:#fff; padding:1px 3px; border-radius:2px;">🔒</span>'),
                    after: () => {
                        compObject.firstChild.style.left = '60%';
                        compObject.firstChild.style.background = 'linear-gradient(135deg,#f0f,#00f)'; // gradient moves with it perfectly
                        return createLayer(1, '[Shape Layer (Gradient)]', C.purple, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#ef4444; color:#fff; padding:1px 3px; border-radius:2px;">🔒</span><div class="keyframe-dot" style="left:50%;"></div>');
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;01;00'
                }
            ]
        },
        'ALIGN': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.orange, '0%', '40%', false, true) + createLayer(2, '[Layer 2]', C.teal, '30%', '40%', false),
                    after: () => createLayer(1, '[Layer 1]', C.orange, '70%', '40%', true, true) + createLayer(2, '[Layer 2]', C.teal, '30%', '40%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'REMOVE_FX': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true, '<span style="position:absolute; right:5px; top:2px; font-size:9px; background:#fff; color:#000; padding:1px 3px; border-radius:2px;">fx</span>'),
                    after: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TRUE_DUP': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Composition 1]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Composition 2]', C.purple, '0%', '100%', true, true) + createLayer(2, '[Composition 1]', C.purple, '0%', '100%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'SEQ_LAYERS': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Image 1]', C.purple, '0%', '20%', false, true) + createLayer(2, '[Image 2]', C.teal, '0%', '20%', false, true) + createLayer(3, '[Image 3]', C.orange, '0%', '20%', false, true),
                    after: () => createLayer(1, '[Image 1]', C.purple, '0%', '20%', true) + createLayer(2, '[Image 2]', C.teal, '20%', '20%', true) + createLayer(3, '[Image 3]', C.orange, '40%', '20%', true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;10'
                }
            ]
        },
        'DEL_BEFORE': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00',
                    playheadBefore: '0%', playheadAfter: '40%'
                },
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '40%', '60%', true, true),
                    timeBefore: '0;00;05;00', timeAfter: '0;00;05;00',
                    playheadBefore: '40%', playheadAfter: '40%'
                }
            ]
        },
        'DEL_AFTER': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;07;12',
                    playheadBefore: '0%', playheadAfter: '60%'
                },
                {
                    before: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Footage.mp4]', C.teal, '0%', '60%', true, true),
                    timeBefore: '0;00;07;12', timeAfter: '0;00;07;12',
                    playheadBefore: '60%', playheadAfter: '60%'
                }
            ]
        },
        'PRECOMP_TOG': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.blue, '0%', '40%', false, true) +
                        createLayer(2, '[Layer 2]', C.pink, '20%', '50%', false, true) +
                        createLayer(3, '[Layer 3]', C.orange, '40%', '60%', false, true),
                    after: () => createLayer(1, '[Precomp 1]', C.purple, '0%', '100%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00'
                }
            ]
        },
        'PRECOMP_SEP': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Layer 1]', C.blue, '0%', '40%', false, true) +
                        createLayer(2, '[Layer 2]', C.pink, '20%', '50%', false, true) +
                        createLayer(3, '[Layer 3]', C.orange, '40%', '60%', false, true),
                    after: () => createLayer(1, '[Layer 1 Comp]', C.purple, '0%', '40%', true, true) +
                        createLayer(2, '[Layer 2 Comp]', C.purple, '20%', '50%', true, true) +
                        createLayer(3, '[Layer 3 Comp]', C.purple, '40%', '60%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00'
                }
            ]
        },
        'UNPRECOMP': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[Precomp 1]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Layer 1]', C.blue, '0%', '40%', true, true) +
                        createLayer(2, '[Layer 2]', C.pink, '20%', '50%', true, true) +
                        createLayer(3, '[Layer 3]', C.orange, '40%', '60%', true, true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00'
                }
            ]
        },
        'ORGANIZE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#18181b;color:#ddd;font-size:12px;font-family:var(--font-body);padding:10px;box-sizing:border-box;';
            },
            steps: [
                {
                    before: () => {
                        compObject.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;justify-content:center;">
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-file-video" style="color:#2dd4bf"></i> video.mp4</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-file-image" style="color:#f472b6"></i> logo.png</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-layer-group" style="color:#a78bfa"></i> Comp 1</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-volume-up" style="color:#fb923c"></i> audio.wav</div>
                            <div style="background:#333;padding:4px 8px;border-radius:4px;"><i class="fa-solid fa-layer-group" style="color:#a78bfa"></i> Comp 2</div>
                        </div>`;
                        return createLayer(1, '[Project Panel]', C.teal, '0%', '100%', false, true);
                    },
                    after: () => {
                        compObject.innerHTML = `<div style="display:flex;flex-direction:row;gap:12px;align-items:flex-start;width:100%;justify-content:center;">
                            <div style="color:#a78bfa;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 01_Comps</div>
                            <div style="color:#2dd4bf;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 02_Video</div>
                            <div style="color:#f472b6;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 03_Images</div>
                            <div style="color:#fb923c;display:flex;flex-direction:column;align-items:center;gap:4px;"><i class="fa-solid fa-folder fa-2x"></i> 04_Audio</div>
                        </div>`;
                        return createLayer(1, '[Project Organized]', C.purple, '0%', '100%', true, true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        ...['ALIGN_L', 'ALIGN_CX', 'ALIGN_R', 'ALIGN_T', 'ALIGN_CY', 'ALIGN_B'].reduce((acc, type) => {
            acc[type] = {
                useViewer: true,
                hideTimeline: true,
                setupViewer: (v, o) => {
                    o.className = 'comp-object';
                    // We'll mimic a video layer in a composition frame
                    v.style.background = '#222';
                    o.innerHTML = '<div id="align-target" style="width:120px; height:67px; background:#06b6d4; border-radius:4px; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); transition:all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-clapperboard" style="color:rgba(0,0,0,0.3); font-size:24px;"></i></div>';
                },
                steps: [
                    {
                        before: () => {
                            const t = document.getElementById('align-target');
                            if (t) {
                                t.style.transition = 'none';
                                t.style.left = '50%';
                                t.style.top = '50%';
                                t.style.transform = 'translate(-50%, -50%)';
                                void t.offsetWidth;
                                t.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            }
                            return '';
                        },
                        after: () => {
                            const t = document.getElementById('align-target');
                            if (!t) return '';
                            if (type === 'ALIGN_L') { t.style.left = '0%'; t.style.transform = 'translate(0, -50%)'; }
                            if (type === 'ALIGN_CX') { t.style.left = '50%'; t.style.transform = 'translate(-50%, -50%)'; }
                            if (type === 'ALIGN_R') { t.style.left = '100%'; t.style.transform = 'translate(-100%, -50%)'; }
                            if (type === 'ALIGN_T') { t.style.top = '0%'; t.style.transform = 'translate(-50%, 0)'; }
                            if (type === 'ALIGN_CY') { t.style.top = '50%'; t.style.transform = 'translate(-50%, -50%)'; }
                            if (type === 'ALIGN_B') { t.style.top = '100%'; t.style.transform = 'translate(-50%, -100%)'; }
                            return '';
                        },
                        timeBefore: '', timeAfter: ''
                    }
                ]
            };
            return acc;
        }, {}),
        ...['ANCHOR_TL', 'ANCHOR_TC', 'ANCHOR_TR', 'ANCHOR_ML', 'ANCHOR_MC', 'ANCHOR_MR', 'ANCHOR_BL', 'ANCHOR_BC', 'ANCHOR_BR'].reduce((acc, type) => {
            acc[type] = {
                useViewer: true,
                hideTimeline: true,
                setupViewer: (v, o) => {
                    o.className = 'comp-object';
                    v.style.background = '#222';
                    // Video layer with anchor point visual
                    o.innerHTML = `
                        <div style="width:120px; height:67px; background:rgba(168, 85, 247, 0.3); border:1px solid #a855f7; border-radius:4px; position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); display:flex; align-items:center; justify-content:center;">
                            <i class="fa-solid fa-clapperboard" style="color:rgba(168, 85, 247, 0.5); font-size:24px;"></i>
                            <div id="anchor-target" style="position:absolute; width:12px; height:12px; border:2px solid #fff; border-radius:50%; transform:translate(-50%, -50%); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); left:50%; top:50%;">
                                <div style="position:absolute; width:20px; height:1px; background:#fff; left:50%; top:50%; transform:translate(-50%, -50%);"></div>
                                <div style="position:absolute; width:1px; height:20px; background:#fff; left:50%; top:50%; transform:translate(-50%, -50%);"></div>
                            </div>
                        </div>
                    `;
                },
                steps: [
                    {
                        before: () => {
                            const t = document.getElementById('anchor-target');
                            if (t) {
                                t.style.transition = 'none';
                                t.style.left = '50%';
                                t.style.top = '50%';
                                void t.offsetWidth;
                                t.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            }
                            return '';
                        },
                        after: () => {
                            const t = document.getElementById('anchor-target');
                            if (!t) return '';
                            const dir = type.split('_')[1]; // TL, TC, TR, etc.
                            if (dir.includes('L')) t.style.left = '0%';
                            if (dir.includes('C')) t.style.left = '50%';
                            if (dir.includes('R')) t.style.left = '100%';
                            if (dir.includes('T')) t.style.top = '0%';
                            if (dir.includes('M')) t.style.top = '50%';
                            if (dir.includes('B')) t.style.top = '100%';
                            return '';
                        },
                        timeBefore: '', timeAfter: ''
                    }
                ]
            };
            return acc;
        }, {}),
        'IMPORT_SRT': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; overflow:hidden; background:#111;';
                o.innerHTML = `
                    <div id="srt-vid-bg" style="width:100%;height:100%;background:linear-gradient(180deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);position:relative;display:flex;align-items:center;justify-content:center;">
                        <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.5);color:#aaa;font-size:7px;padding:2px 5px;border-radius:3px;">▶ Comp 1 | 0:00:00:00</div>
                        <div style="font-size:10px;color:rgba(255,255,255,0.15);letter-spacing:2px;text-transform:uppercase;">Video Preview</div>
                        <div id="srt-subtitle-display" style="position:absolute;bottom:16%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:3px;border:1px solid rgba(255,255,255,0.2);white-space:nowrap;opacity:0;transition:opacity 0.3s ease;text-align:center;min-width:80px;"></div>
                    </div>
                    <div id="srt-file-drop" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;opacity:0;transition:opacity 0.2s;">
                        <div style="font-size:20px;">📄</div>
                        <div style="color:#f59e0b;font-size:8px;font-weight:700;letter-spacing:1px;">subtitles.srt</div>
                    </div>
                `;
                // Animate drop → subtitles appear
                let srtPhase = 0;
                const subtitles = ['Hi there!', 'Welcome to this video', 'Easy Workflow Pro', 'Import SRT ✓'];
                const subDisplay = o.querySelector('#srt-subtitle-display');
                const fileIcon = o.querySelector('#srt-file-drop');
                if (window._srtViewerInterval) clearInterval(window._srtViewerInterval);
                // Show file drop hint first
                setTimeout(() => { if (fileIcon) fileIcon.style.opacity = '1'; }, 200);
                setTimeout(() => { if (fileIcon) fileIcon.style.opacity = '0'; }, 800);
                window._srtViewerInterval = setInterval(() => {
                    if (!subDisplay) return;
                    subDisplay.style.opacity = '1';
                    subDisplay.textContent = subtitles[srtPhase % subtitles.length];
                    srtPhase++;
                    setTimeout(() => { if (subDisplay) subDisplay.style.opacity = '0'; }, 900);
                }, 1400);
            },
            steps: [
                {
                    before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                    after: () => createLayer(1, '[Sub] Hi there!', C.purple, '0%', '20%', true) +
                        createLayer(2, '[Sub] Welcome to this video', C.purple, '22%', '30%', true) +
                        createLayer(3, '[Sub] Easy Workflow Pro', C.purple, '55%', '15%', true) +
                        createLayer(4, '[Sub] Import SRT ✓', C.purple, '72%', '28%', true) +
                        createLayer(5, '[Video.mp4]', C.teal, '0%', '100%', false),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;04;12'
                }
            ]
        },
        'RESIZE_COMP': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; background:#111; display:flex; align-items:center; justify-content:center; overflow:hidden;';
                o.innerHTML = `
                    <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);color:#555;font-size:7px;letter-spacing:1px;text-transform:uppercase;">COMPOSITION SIZE</div>
                    <div id="rc-frame" style="
                        width:42%; height:72%;
                        background:rgba(124,58,237,0.12);
                        border:2px solid rgba(124,58,237,0.7);
                        border-radius:4px;
                        display:flex; flex-direction:column;
                        align-items:center; justify-content:center;
                        transition: width 0.7s cubic-bezier(0.175,0.885,0.32,1.275), height 0.7s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.4s ease;
                        position:relative;
                    ">
                        <div id="rc-label" style="color:#a78bfa;font-size:9px;font-weight:700;letter-spacing:1px;transition:opacity 0.3s;">1080×1920</div>
                        <div style="color:rgba(255,255,255,0.25);font-size:7px;margin-top:2px;">9:16</div>
                    </div>
                    <div id="rc-arrow" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:#00e676;font-size:8px;font-weight:700;opacity:0;transition:opacity 0.4s;">✓ Resized!</div>
                `;
                if (window._rcInterval) clearInterval(window._rcInterval);
                const sizes = [
                    { w: '42%', h: '72%', label: '1080×1920', ratio: '9:16', color: 'rgba(124,58,237,0.7)' },
                    { w: '88%', h: '50%', label: '1920×1080', ratio: '16:9', color: 'rgba(6,182,212,0.7)' },
                    { w: '55%', h: '55%', label: '1080×1080', ratio: '1:1', color: 'rgba(245,158,11,0.7)' },
                    { w: '48%', h: '60%', label: '1080×1350', ratio: '4:5', color: 'rgba(236,72,153,0.7)' },
                ];
                let si = 0;
                const frame = o.querySelector('#rc-frame');
                const label = o.querySelector('#rc-label');
                const arrow = o.querySelector('#rc-arrow');
                window._rcInterval = setInterval(() => {
                    si = (si + 1) % sizes.length;
                    const s = sizes[si];
                    if (!frame || !label) return;
                    label.style.opacity = '0';
                    setTimeout(() => {
                        if (!frame || !label) return;
                        frame.style.width = s.w;
                        frame.style.height = s.h;
                        frame.style.borderColor = s.color;
                        frame.style.background = s.color.replace('0.7', '0.1');
                        label.textContent = s.label;
                        label.style.color = s.color.replace('0.7', '1');
                        frame.querySelector('div:last-child').textContent = s.ratio;
                        label.style.opacity = '1';
                        if (arrow) { arrow.style.opacity = '1'; setTimeout(() => { if (arrow) arrow.style.opacity = '0'; }, 600); }
                    }, 250);
                }, 1800);
            },
            steps: [
                {
                    before: () => createLayer(1, '[Comp] 1080×1920', C.purple, '0%', '100%', false, true),
                    after: () => {
                        return createLayer(1, '[Comp] 1920×1080  ✓', C.teal, '0%', '100%', true, true);
                    },
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'TEXT_EXPLODE': {
            useViewer: false,
            steps: [
                {
                    before: () => createLayer(1, '[TEXT]', C.purple, '0%', '100%', false, true),
                    after: () => createLayer(1, '[T]', C.teal, '0%', '100%', true) +
                        createLayer(2, '[E]', C.teal, '0%', '100%', true) +
                        createLayer(3, '[X]', C.teal, '0%', '100%', true) +
                        createLayer(4, '[T]', C.teal, '0%', '100%', true),
                    timeBefore: '0;00;00;00', timeAfter: '0;00;00;05'
                }
            ]
        },
        'NUM_COUNTER': {
            useViewer: true,
            setupViewer: (v, o, step) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; background:#18181b; color:#10b981; font-family:monospace; font-size:36px; gap:8px; font-weight:800;';
                if (window.numCountInt) clearInterval(window.numCountInt);
                if (window.numSeqTo) clearTimeout(window.numSeqTo);

                const updateTitle = t => {
                    const el = document.getElementById('num-title');
                    if (el) el.innerText = t;
                };

                o.innerHTML = `<div id="num-title" style="font-size:10px; color:#aaa; font-family:var(--font-body); letter-spacing:1px; white-space:nowrap;">1. Smooth Counting</div><div id="num-disp">0</div>`;

                let c = 0;
                let phase = 'COUNT';
                let symI = 0;
                const syms = ['$', '₹', '€', '£', '¥'];
                let fmtI = 0;
                const fmts = ['9,000.00', '9,000', '09000', '9k'];
                let pfxI = 0;
                const pfxs = ['₹ 9k', '9k USD', 'Price: 9k', '9k views'];
                let pc = 8000;

                const tick = () => {
                    const disp = document.getElementById('num-disp');
                    if (!disp) return;

                    if (phase === 'COUNT') {
                        c += 187;
                        if (c > 9000) c = 9000;
                        disp.innerText = c;
                    } else if (phase === 'SYMBOLS') {
                        disp.innerText = `${syms[symI]} 9000`;
                        symI = (symI + 1) % syms.length;
                    } else if (phase === 'FORMAT') {
                        disp.innerText = `₹ ${fmts[fmtI]}`;
                        fmtI = (fmtI + 1) % fmts.length;
                    } else if (phase === 'PREFIX') {
                        disp.innerText = pfxs[pfxI];
                        pfxI = (pfxI + 1) % pfxs.length;
                    } else if (phase === 'POSTERIZE') {
                        pc += 100;
                        if (pc > 9000) pc = 9000;
                        disp.innerText = pc + ' views';
                    }
                };

                // Master Sequencer
                window.numCountInt = setInterval(tick, 20);

                window.numSeqTo = setTimeout(() => {
                    // Start SYMBOLS phase
                    phase = 'SYMBOLS';
                    updateTitle('2. Change Symbols');
                    clearInterval(window.numCountInt);
                    window.numCountInt = setInterval(tick, 250);

                    setTimeout(() => {
                        // Start FORMAT phase
                        phase = 'FORMAT';
                        updateTitle('3. Formats (US / Indian / Insta)');
                        clearInterval(window.numCountInt);
                        window.numCountInt = setInterval(tick, 350);

                        setTimeout(() => {
                            // Start PREFIX phase
                            phase = 'PREFIX';
                            updateTitle('4. Prefixes & Suffixes');
                            clearInterval(window.numCountInt);
                            window.numCountInt = setInterval(tick, 350);

                            setTimeout(() => {
                                // Start POSTERIZE phase
                                phase = 'POSTERIZE';
                                updateTitle('5. Posterize Time Frame Rate');
                                clearInterval(window.numCountInt);
                                window.numCountInt = setInterval(tick, 300); // Slower choppy tick frame rate
                            }, 1800);
                        }, 1800);
                    }, 1800);
                }, 1200);
            },
            steps: [
                {
                    before: () => createLayer(1, '[Numbers]', C.green, '0%', '20%', false, true),
                    after: () => createLayer(1, '[Numbers]', C.green, '0%', '100%', true, true) + `<div class="keyframe-dot" style="left:20%; background:#ef4444; transition:left 6.6s linear;"></div><div class="keyframe-dot" style="left:90%; background:#ef4444; transition:none;"></div>`,
                    timeBefore: '0;00;00;00', timeAfter: '0;00;05;00',
                    actionDuration: 800,
                    loopDelay: 6600
                }
            ]
        },
        'CLIP_SLOT_1': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-scissors fa-3x" style="color:#2979ff;"></i>
                    <span>Clipboard Slot 1 Active</span>
                </div>`;
            },
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.classList.toggle('active', n === 1);
                    });
                    return '';
                },
                after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_SLOT_2': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-scissors fa-3x" style="color:#2979ff;"></i>
                    <span>Clipboard Slot 2 Active</span>
                </div>`;
            },
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.classList.toggle('active', n === 2);
                    });
                    return '';
                },
                after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_SLOT_3': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-scissors fa-3x" style="color:#2979ff;"></i>
                    <span>Clipboard Slot 3 Active</span>
                </div>`;
            },
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.classList.toggle('active', n === 3);
                    });
                    return '';
                },
                after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_COPY': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                        <div id="clip-l1" style="width:140px; height:40px; background:#2979ff; border:2px solid #fff; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; font-weight:bold; box-shadow:0 0 10px rgba(41,121,255,0.5);">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> BLUE LAYER [SELECTED]
                        </div>
                        <div style="width:140px; height:40px; background:#f472b6; border:1px solid #444; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; opacity:0.6;">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER
                        </div>
                    </div>
                `;
            },
            steps: [{
                before: () => {
                    const s = document.getElementById('clip-slot-1');
                    if (s) s.innerText = '1';
                    return '';
                },
                after: () => {
                    const s = document.getElementById('clip-slot-1');
                    if (s) s.innerHTML = '1 <span style="color:#00e676">•</span>';
                    return createLayer(1, 'Properties Copied to Slot 1', C.blue, '0%', '100%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_PASTE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                        <div style="width:140px; height:40px; background:#2979ff; border:1px solid #444; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; opacity:0.6;">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> BLUE LAYER
                        </div>
                        <div id="clip-l2" style="width:140px; height:40px; background:#f472b6; border:2px solid #fff; border-radius:4px; display:flex; align-items:center; padding:0 10px; color:#fff; font-size:10px; font-weight:bold; transition: background 0.3s, box-shadow 0.3s;">
                            <i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER [SELECTED]
                        </div>
                    </div>
                `;
                const s = document.getElementById('clip-slot-1');
                if (s) s.innerHTML = '1 <span style="color:#00e676">•</span>';
            },
            steps: [{
                before: () => {
                    const l2 = document.getElementById('clip-l2');
                    if (l2) {
                        l2.style.background = '#f472b6';
                        l2.style.boxShadow = 'none';
                        l2.innerHTML = '<i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER [SELECTED]';
                    }
                    return '';
                },
                after: () => {
                    const l2 = document.getElementById('clip-l2');
                    if (l2) {
                        l2.style.background = '#2979ff';
                        l2.style.boxShadow = '0 0 15px rgba(41,121,255,0.7)';
                        l2.innerHTML = '<i class="fa-solid fa-layer-group" style="margin-right:8px;"></i> PINK LAYER (PASTED)';
                    }
                    return createLayer(1, 'Properties Pasted from Slot 1', C.purple, '0%', '100%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'CLIP_CLEAR': {
            useViewer: false,
            steps: [{
                before: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.innerHTML = `${n} <span style="color:#00e676">•</span>`;
                    });
                    return createLayer(1, 'Active Clipboard Slots', C.orange, '0%', '100%', false, true);
                },
                after: () => {
                    [1, 2, 3].forEach(n => {
                        const s = document.getElementById(`clip-slot-${n}`);
                        if (s) s.innerText = n;
                    });
                    return createLayer(1, 'All Slots Cleared', C.red, '0%', '100%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'IMPORT_SRT': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; overflow:hidden; background:#111;';
                o.innerHTML = `
                    <div style="width:100%;height:100%;background:linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;">
                        <div style="position:absolute;top:0;left:0;right:0;height:18px;background:rgba(0,0,0,0.4);display:flex;align-items:center;padding:0 6px;gap:4px;">
                            <span style="color:#888;font-size:7px;">⬛ Comp 1</span>
                            <span style="color:#555;font-size:7px;margin-left:auto;">0:00:00:00</span>
                        </div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.12);letter-spacing:2px;text-transform:uppercase;margin-top:8px;">Video</div>
                        <div id="srt-free-drop" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;opacity:1;transition:all 0.5s ease;">
                            <div style="font-size:22px;filter:drop-shadow(0 0 8px rgba(245,158,11,0.8));">📄</div>
                            <div style="color:#f59e0b;font-size:7px;font-weight:700;letter-spacing:1px;background:rgba(245,158,11,0.15);padding:2px 6px;border-radius:3px;border:1px solid rgba(245,158,11,0.4);">subtitles.srt</div>
                        </div>
                        <div id="srt-free-sub" style="position:absolute;bottom:18%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:600;padding:4px 14px;border-radius:3px;border:1px solid rgba(255,255,255,0.25);white-space:nowrap;opacity:0;transition:opacity 0.4s ease;min-width:80px;text-align:center;"></div>
                        <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);color:#00e676;font-size:7px;opacity:0;transition:opacity 0.3s;" id="srt-free-ok">✓ Subtitles Created</div>
                    </div>
                `;
                const subs = ['Hi there!', 'Welcome back!', 'Easy Workflow Pro', 'SRT Imported!'];
                const dropEl = o.querySelector('#srt-free-drop');
                const subEl = o.querySelector('#srt-free-sub');
                const okEl = o.querySelector('#srt-free-ok');
                if (window._srtFreeInt) clearInterval(window._srtFreeInt);
                let si = 0;
                // Drop animation: icon falls into place, then subtitles start cycling
                setTimeout(() => {
                    if (dropEl) { dropEl.style.opacity = '0'; dropEl.style.transform = 'translate(-50%,-50%) scale(1.3)'; }
                    setTimeout(() => {
                        if (okEl) okEl.style.opacity = '1';
                        window._srtFreeInt = setInterval(() => {
                            if (!subEl) return;
                            subEl.style.opacity = '1';
                            subEl.textContent = subs[si % subs.length];
                            si++;
                            setTimeout(() => { if (subEl) subEl.style.opacity = '0'; }, 1000);
                        }, 1500);
                    }, 400);
                }, 600);
            },
            steps: [{
                before: () => createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false, true),
                after: () =>
                    createLayer(1, '[Sub] Hi there!', C.purple, '0%', '18%', true) +
                    createLayer(2, '[Sub] Welcome back!', C.purple, '20%', '22%', true) +
                    createLayer(3, '[Sub] Easy Workflow Pro', C.purple, '45%', '20%', true) +
                    createLayer(4, 'SUBTITLES_TRACK', C.blue, '0%', '100%', true) +
                    createLayer(5, '[Video.mp4]', C.teal, '0%', '100%', false),
                timeBefore: '0;00;00;00', timeAfter: '0;00;04;08'
            }]
        },
        'RESIZE_COMP': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                o.style.cssText = 'width:100%; height:100%; position:relative; background:#111; display:flex; align-items:center; justify-content:center; overflow:hidden;';
                o.innerHTML = `
                    <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);color:#555;font-size:7px;letter-spacing:1px;text-transform:uppercase;">COMP SIZE</div>
                    <div id="rc-free-frame" style="
                        width:88%; height:50%;
                        background:rgba(6,182,212,0.1);
                        border:2px solid rgba(6,182,212,0.7);
                        border-radius:4px;
                        display:flex; flex-direction:column;
                        align-items:center; justify-content:center; gap:2px;
                        transition: width 0.65s cubic-bezier(0.175,0.885,0.32,1.275), height 0.65s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.35s ease, background 0.35s ease;
                        position:relative;
                    ">
                        <div id="rc-free-label" style="color:#22d3ee;font-size:9px;font-weight:700;letter-spacing:1px;transition:opacity 0.3s;">1920×1080</div>
                        <div id="rc-free-ratio" style="color:rgba(255,255,255,0.25);font-size:7px;">16:9</div>
                    </div>
                    <div id="rc-free-badge" style="position:absolute;bottom:8px;right:8px;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.5);color:#00e676;font-size:7px;font-weight:700;padding:2px 6px;border-radius:3px;opacity:0;transition:opacity 0.4s;">✓ Done</div>
                `;
                if (window._rcFreeInt) clearInterval(window._rcFreeInt);
                const sizes = [
                    { w: '88%', h: '50%', label: '1920×1080', ratio: '16:9', bc: 'rgba(6,182,212,0.7)', bg: 'rgba(6,182,212,0.1)', lc: '#22d3ee' },
                    { w: '42%', h: '72%', label: '1080×1920', ratio: '9:16', bc: 'rgba(124,58,237,0.7)', bg: 'rgba(124,58,237,0.1)', lc: '#a78bfa' },
                    { w: '55%', h: '55%', label: '1080×1080', ratio: '1:1', bc: 'rgba(245,158,11,0.7)', bg: 'rgba(245,158,11,0.1)', lc: '#fbbf24' },
                    { w: '50%', h: '62%', label: '1080×1350', ratio: '4:5', bc: 'rgba(236,72,153,0.7)', bg: 'rgba(236,72,153,0.1)', lc: '#f472b6' },
                ];
                let si = 0;
                const frame = o.querySelector('#rc-free-frame');
                const label = o.querySelector('#rc-free-label');
                const ratio = o.querySelector('#rc-free-ratio');
                const badge = o.querySelector('#rc-free-badge');
                window._rcFreeInt = setInterval(() => {
                    si = (si + 1) % sizes.length;
                    const s = sizes[si];
                    if (!frame || !label) return;
                    label.style.opacity = '0';
                    setTimeout(() => {
                        if (!frame || !label) return;
                        frame.style.width = s.w;
                        frame.style.height = s.h;
                        frame.style.borderColor = s.bc;
                        frame.style.background = s.bg;
                        label.textContent = s.label;
                        label.style.color = s.lc;
                        if (ratio) ratio.textContent = s.ratio;
                        label.style.opacity = '1';
                        if (badge) { badge.style.opacity = '1'; setTimeout(() => { if (badge) badge.style.opacity = '0'; }, 700); }
                    }, 250);
                }, 1800);
            },
            steps: [{
                before: () => createLayer(1, 'Comp: 1920×1080 (16:9)', C.teal, '0%', '100%', false, true),
                after: () => createLayer(1, 'Resized → 1080×1920 (9:16)', C.purple, '0%', '100%', true),
                timeBefore: '0;00;00;00', timeAfter: '0;00;00;01'
            }]
        },
        'TEXT_EXPLODE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="font-size:24px; color:#fff; font-weight:800; text-transform:uppercase; letter-spacing:2px;">EXPLODE!</div>`;
            },
            steps: [{
                before: () => createLayer(1, 'EXPLODE!', C.purple, '0%', '100%', false, true),
                after: () => {
                    compObject.innerHTML = `
                    <div style="display:flex; gap:4px">
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(-30px, -20px) rotate(-15deg); opacity:0.8;">E</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(-15px, -35px) rotate(10deg); opacity:0.8;">X</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(0, -45px) rotate(-5deg); opacity:0.8;">P</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(15px, -35px) rotate(20deg); opacity:0.8;">L</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(30px, -20px) rotate(-10deg); opacity:0.8;">O</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(45px, -40px) rotate(5deg); opacity:0.8;">D</span>
                        <span style="display:inline-block; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: translate(60px, -25px) rotate(-15deg); opacity:0.8;">E</span>
                    </div>`;
                    return createLayer(1, 'E', C.pink, '0%', '10%', true) + createLayer(2, 'X', C.pink, '10%', '10%', true) + createLayer(3, 'P', C.pink, '20%', '10%', true) + createLayer(4, 'L', C.pink, '30%', '10%', true);
                },
                timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_REFRESH': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="color:#aaa; font-size:12px; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px;">
                    <i class="fa-solid fa-sync fa-spin fa-3x" style="color:#2979ff;"></i>
                    <span>Scanning Compositions for Fonts...</span>
                </div>`;
            },
            steps: [{
                before: () => '',
                after: () => {
                    return createLayer(1, 'Font List Refreshed', C.blue, '0%', '100%', true);
                },
                timeBefore: '1000', timeAfter: ''
            }]
        },
        'FONT_LIST_ITEM': {
            useViewer: true, hideTimeline: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `<div style="display:flex; flex-direction:column; gap:15px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                    <div style="font-family:sans-serif; font-size:24px; color:#fff; font-weight:bold; border:2px solid #fff; padding:10px 20px; border-radius:4px; text-transform:uppercase;">Montserrat Bold</div>
                    <div style="font-family:sans-serif; font-size:14px; color:#aaa;">(Used in 3 layers)</div>
                </div>`;
            },
            steps: [{
                before: () => '', after: () => '', timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_ADD': {
            useViewer: false,
            steps: [{
                before: () => createLayer(1, 'Selected Font: Montserrat-Bold', C.purple, '0%', '100%', false, true),
                after: () => createLayer(1, 'Added to Replacement List', C.green, '0%', '100%', true),
                timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_REPLACE': {
            useViewer: true,
            setupViewer: (v, o) => {
                o.className = 'comp-object';
                v.style.background = '#1a1a1a';
                o.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:20px; padding:20px; width:100%; height:100%; justify-content:center; align-items:center;">
                        <div class="font-target" style="font-family:'Space Grotesk', sans-serif; font-size:28px; color:#fff; font-weight:700; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); text-transform:uppercase;">Design Studio</div>
                        <div class="font-target" style="font-family:'Space Grotesk', sans-serif; font-size:16px; color:#2979ff; letter-spacing:4px; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); text-transform:uppercase;">Creative</div>
                    </div>
                `;
            },
            steps: [{
                before: () => {
                    const targets = document.querySelectorAll('.font-target');
                    targets.forEach(t => {
                        t.style.fontFamily = "'Space Grotesk', sans-serif";
                    });
                    return createLayer(1, 'Source Font: Montserrat-Bold', C.orange, '0%', '100%', false, true);
                },
                after: () => {
                    const targets = document.querySelectorAll('.font-target');
                    targets.forEach(t => {
                        t.style.fontFamily = "'Inter', sans-serif";
                        t.style.color = '#fff';
                        t.style.letterSpacing = '0px';
                        t.animate([
                            { transform: 'scale(1.1)', filter: 'blur(2px)' },
                            { transform: 'scale(1)', filter: 'blur(0)' }
                        ], { duration: 300, easing: 'ease-out' });
                    });
                    return createLayer(1, 'Replaced with Inter-Regular', C.green, '0%', '100%', true);
                },
                timeBefore: '800', timeAfter: ''
            }]
        },
        'FONT_REMOVE': {
            useViewer: false,
            steps: [{
                before: () => createLayer(1, 'Selected Font: Montserrat-Bold', C.red, '0%', '100%', false, true),
                after: () => createLayer(1, 'Removed from List', C.orange, '0%', '100%', true),
                timeBefore: '', timeAfter: ''
            }]
        },
        'FONT_FAV': {
            useViewer: false,
            steps: [{
                before: () => createLayer(1, 'Marking Font as Favorite', C.yellow, '0%', '100%', false, true),
                after: () => createLayer(1, 'Added to Favorites ★', C.yellow, '0%', '100%', true),
                timeBefore: '', timeAfter: ''
            }]
        }
    };

    let currentActionName = null;

    const runGenericSequence = () => {
        if (!currentActionName || !ACTION_SCENARIOS[currentActionName]) return;
        const scenarioDef = ACTION_SCENARIOS[currentActionName];

        let step = scenarioDef.steps[scenarioIndex];

        const timelineBody = document.querySelector('.timeline-body');

        // Before State Setup
        if (scenarioDef.useViewer) {
            if (compViewer) compViewer.style.display = 'flex';
            if (scenarioDef.setupViewer) {
                scenarioDef.setupViewer(compViewer, compObject, step);
                // Force layout reflow to ensure CSS transitions execute correctly
                void compObject.offsetWidth;
            }
        } else {
            if (compViewer) compViewer.style.display = 'none';
        }

        if (scenarioDef.hideTimeline) {
            if (timelineBody) timelineBody.style.display = 'none';
            if (step.before) step.before();
        } else {
            if (timelineBody) timelineBody.style.display = 'flex';

            if (timelinePlayhead) {
                if (step.playheadBefore) {
                    timelinePlayhead.style.display = 'block';
                    timelinePlayhead.style.transition = 'none';
                    timelinePlayhead.style.left = step.playheadBefore;
                    void timelinePlayhead.offsetWidth; // force reflow
                } else {
                    timelinePlayhead.style.display = 'none';
                }
            }
            layersList.innerHTML = step.before();
            if (timelineTime) timelineTime.textContent = step.timeBefore;
        }
        if (timelineTime) timelineTime.textContent = step.timeBefore;

        const actionAtStart = currentActionName;
        // Action Exec
        sequenceTimer = setTimeout(() => {
            if (currentActionName !== actionAtStart) return; // Action changed mid-flight

            if (!scenarioDef.hideTimeline) {
                if (timelinePlayhead && step.playheadAfter) {
                    if (step.playheadBefore !== step.playheadAfter) {
                        timelinePlayhead.style.transition = 'left 0.8s linear';
                    } else {
                        timelinePlayhead.style.transition = 'none';
                    }
                    timelinePlayhead.style.left = step.playheadAfter;
                }

                layersList.innerHTML = step.after();
                if (timelineTime) timelineTime.textContent = step.timeAfter;
            } else if (step.after) {
                // Allows the viewer-only steps to trigger their 'after' functions (like moving the anchor/align box)
                step.after();
            }

            scenarioIndex = (scenarioIndex + 1) % scenarioDef.steps.length;

            // Loop Back
            const delay = step.loopDelay !== undefined ? step.loopDelay : 2000;
            sequenceTimer = setTimeout(() => {
                runGenericSequence();
            }, delay);
        }, step.actionDuration !== undefined ? step.actionDuration : 800);
    };

    const setDefaultState = () => {
        currentActionName = null;
        if (sequenceTimer) clearTimeout(sequenceTimer);
        if (window.numCountInt) clearInterval(window.numCountInt);
        if (window.numSeqTo) clearTimeout(window.numSeqTo);
        if (window._srtViewerInterval) clearInterval(window._srtViewerInterval);
        if (window._srtFreeInt) clearInterval(window._srtFreeInt);
        if (window._rcInterval) clearInterval(window._rcInterval);
        if (window._rcFreeInt) clearInterval(window._rcFreeInt);
        // Hide the panel — only shows on button hover
        if (timelinePreview) timelinePreview.classList.remove('preview-active');
        scenarioIndex = 0;
        const timelineBody = document.querySelector('.timeline-body');
        if (timelineBody) timelineBody.style.display = 'flex';
        layersList.innerHTML = createLayer(1, '[Video.mp4]', C.teal, '0%', '100%', false);
        if (timelineTime) timelineTime.textContent = `0;00;00;00`;
        if (timelinePlayhead) timelinePlayhead.style.display = 'none';
        if (compViewer) compViewer.style.display = 'none';
        if (compObject) {
            compObject.className = 'comp-object';
            compObject.style.cssText = '';
            compObject.textContent = '';
        }
    };

    // Initialize the default visual
    setDefaultState();

    previewButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const action = btn.getAttribute('data-preview');
            if (action && ACTION_SCENARIOS[action]) {
                if (sequenceTimer) clearTimeout(sequenceTimer);
                scenarioIndex = 0;
                currentActionName = action;
                // Show the panel only when hovering a valid button
                if (timelinePreview) timelinePreview.classList.add('preview-active');
                runGenericSequence();
            }
        });

        // When mouse leaves the button, revert back to normal state
        btn.addEventListener('mouseleave', () => {
            setDefaultState();
        });
    });

    // ===== MOCKUP FONT REPLACER INTERACTIVITY =====
    function initFontInteractivity() {
        const fontPanel = document.querySelector('.mockup-panel[data-panel="font"]');
        if (!fontPanel) return;

        const items = fontPanel.querySelectorAll('.ew-list-item');
        const refreshBtn = fontPanel.querySelector('[data-preview="FONT_REFRESH"]');
        const favoriteBtn = fontPanel.querySelector('[data-preview="FONT_FAV"]');
        const addBtn = fontPanel.querySelector('[data-preview="FONT_ADD"]');
        const replaceBtn = fontPanel.querySelector('[data-preview="FONT_REPLACE"]');

        // Selection logic
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // Visual feedback for selection
                const fontName = item.querySelector('span:first-child').textContent;
                console.log('Selected font:', fontName);
            });
        });

        // Add to List logic
        addBtn?.addEventListener('click', () => {
            const selected = fontPanel.querySelector('.ew-list-item.selected');
            if (selected) {
                const name = selected.querySelector('span:first-child').textContent;
                showToast(`Font <b>${name}</b> added to the replacement list!`, 'success');
            } else {
                showToast('Please select a font from the list first.', 'error');
            }
        });

        // Favorite logic
        favoriteBtn?.addEventListener('click', () => {
            const selected = fontPanel.querySelector('.ew-list-item.selected');
            if (selected) {
                const name = selected.querySelector('span:first-child').textContent;
                showToast(`<b>${name}</b> added to your favorite fonts! ★`, 'success');
                selected.style.color = '#f59e0b';
            }
        });

        // Refresh logic
        refreshBtn?.addEventListener('click', () => {
            showToast('Scanning your After Effects composition for text layers...', 'success');
            // Simulate refresh by blinking items
            items.forEach((item, idx) => {
                item.style.opacity = '0.3';
                setTimeout(() => {
                    item.style.opacity = '1';
                    // Randomize counts for effect
                    const badge = item.querySelector('.ew-badge');
                    if (badge) badge.textContent = `${Math.floor(Math.random() * 8) + 1} layer${idx === 1 ? '' : 's'}`;
                }, 100 * idx);
            });
        });

        // Replace Button logic
        replaceBtn?.addEventListener('click', () => {
            const selected = fontPanel.querySelector('.ew-list-item.selected');
            if (selected) {
                showToast('Searching for layers with source font and replacing...', 'success');
            }
        });
    }

    // Initialize Font Interactivity
    initFontInteractivity();
});
