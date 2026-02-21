/* ===== Easy Workflow Pro — Main JavaScript ===== */

document.addEventListener('DOMContentLoaded', () => {

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

});
