/* ═══════════════════════════════════════════════════════
   ROCKIT ENERGY — Premium script.js
   Features:
   - Loading screen with real progress tracking
   - Hero text revealed on load (not on scroll)
   - Scroll-based canvas animation
   - IntersectionObserver for all section reveals
   - Interactive bar chart with tooltip
   - Nav scroll states
   - Mobile menu
════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────── */
const loadingScreen  = document.getElementById('loadingScreen');
const loaderBarFill  = document.getElementById('loaderBarFill');
const loaderPercent  = document.getElementById('loaderPercent');

const canvas            = document.getElementById('scrollCanvas');
const ctx               = canvas.getContext('2d');
const animationContainer = document.getElementById('animationContainer');
const mainNav           = document.getElementById('mainNav');

const FRAME_COUNT = 241;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const images      = [];
let loadedCount   = 0;
let currentFrame  = 0;
let loaderDone    = false;

function updateLoader(pct) {
    const p = Math.min(100, Math.round(pct));
    if (loaderBarFill) loaderBarFill.style.width = p + '%';
    if (loaderPercent) loaderPercent.textContent  = p + '%';
}

function hideLoader() {
    if (loaderDone) return;
    loaderDone = true;
    updateLoader(100);

    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        revealHeroText();
    }, 300);
}

function onImageLoaded() {
    loadedCount++;
    const pct = (loadedCount / FRAME_COUNT) * 100;
    updateLoader(pct);

    if (loadedCount === 1) {
        resizeCanvas();
        canvas.classList.add('loaded');
    }
    if (loadedCount >= FRAME_COUNT) {
        hideLoader();
    }
}

// Safety: hide loader after 4s even if frames stall
setTimeout(hideLoader, 4000);

/* ─────────────────────────────────────────────────────
   CANVAS / FRAMES
───────────────────────────────────────────────────── */
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFrame(currentFrame);
}
window.addEventListener('resize', resizeCanvas);

function getFrameName(i) {
    const timeNum    = ((i - 1) / 30).toFixed(2);
    const padded     = String(i).padStart(4, '0');
    return `frames/frame_${padded}_${timeNum}s.png`;
}

function preloadImages() {
    if (isMobile) {
        const img = new Image();
        img.src = getFrameName(FRAME_COUNT);
        images[FRAME_COUNT - 1] = img;
        img.onload = () => {
            currentFrame = FRAME_COUNT - 1;
            resizeCanvas();
            canvas.classList.add('loaded');
            renderFrame(currentFrame);
            updateLoader(100);
            hideLoader();
        };
        img.onerror = img.onload;
        return;
    }
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = getFrameName(i);
        images.push(img);
        img.onload = onImageLoaded;
        img.onerror = onImageLoaded;
    }
}

function drawCover(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const hR = canvas.width  / img.naturalWidth;
    const vR = canvas.height / img.naturalHeight;
    const r  = Math.max(hR, vR);
    const x  = (canvas.width  - img.naturalWidth  * r) / 2;
    const y  = (canvas.height - img.naturalHeight * r) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, img.naturalWidth * r, img.naturalHeight * r);
}

function renderFrame(idx) {
    const img = images[idx];
    if (img && img.complete && img.naturalWidth > 0) drawCover(img);
}

/* ─────────────────────────────────────────────────────
   SCROLL
───────────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
     if (isMobile) return; // no scroll-jack frame animation on mobile
    const rect             = animationContainer.getBoundingClientRect();
    const scrollable       = rect.height - window.innerHeight;
    const scrolled         = -rect.top;
    const progress         = Math.max(0, Math.min(1, scrolled / scrollable));

    // Nav state
    if (progress > 0.04) {
        mainNav.classList.add('scrolled');
    } else {
        mainNav.classList.remove('scrolled');
    }

    // Frame
    const frameIdx = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
    if (frameIdx !== currentFrame) {
        currentFrame = frameIdx;
        requestAnimationFrame(() => renderFrame(frameIdx));
    }
}, { passive: true });

/* ─────────────────────────────────────────────────────
   HERO TEXT — reveal after loader
───────────────────────────────────────────────────── */
function revealHeroText() {
    const words    = document.querySelectorAll('.hero-word');
    const sub      = document.querySelector('.hero-sub');
    const actions  = document.querySelector('.hero-actions');
    const trust    = document.querySelector('.hero-trust');

    words.forEach((w, i) => {
        const delay = parseInt(w.dataset.delay || 0, 10);
        setTimeout(() => w.classList.add('visible'), delay);
    });

    if (sub)     setTimeout(() => sub.classList.add('visible'),     400);
    if (actions) setTimeout(() => actions.classList.add('visible'), 550);
    if (trust)   setTimeout(() => trust.classList.add('visible'),   700);
}

/* ─────────────────────────────────────────────────────
   INTERSECTION OBSERVER — section reveals
───────────────────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || 0, 10);

        setTimeout(() => {
            el.classList.add('visible');
        }, delay);

        // Hardware title underline
        if (el.classList.contains('hardware-title-main')) {
            el.classList.add('in-view');
        }

        // Bar chart
        if (el.classList.contains('chart-container')) {
            animateBars(el);
        }

        io.unobserve(el);
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

/* ─────────────────────────────────────────────────────
   BAR CHART ANIMATION + TOOLTIP
───────────────────────────────────────────────────── */
const chartTooltip = document.getElementById('chartTooltip');

function animateBars(container) {
    const bars = container.querySelectorAll('.interactive-bar');
    bars.forEach((bar, i) => {
        const h = bar.getAttribute('data-height');
        setTimeout(() => {
            bar.style.height = h + '%';
        }, i * 140);
    });
}

// Tooltip on bar groups
document.querySelectorAll('.bar-group').forEach(group => {
    group.addEventListener('mouseenter', (e) => {
        if (!chartTooltip) return;
        chartTooltip.textContent = group.dataset.tip || '';
        chartTooltip.classList.add('visible');
    });
    group.addEventListener('mousemove', (e) => {
        if (!chartTooltip) return;
        const rect   = group.closest('.chart-wrap').getBoundingClientRect();
        const x      = e.clientX - rect.left + 12;
        const y      = e.clientY - rect.top  - 36;
        chartTooltip.style.left = x + 'px';
        chartTooltip.style.top  = y + 'px';
    });
    group.addEventListener('mouseleave', () => {
        if (!chartTooltip) return;
        chartTooltip.classList.remove('visible');
    });
    // Click: highlight bar
    group.addEventListener('click', () => {
        const bar = group.querySelector('.bar-fill');
        if (!bar) return;
        bar.style.filter = 'brightness(1.3)';
        setTimeout(() => bar.style.filter = '', 600);
    });
});

/* ─────────────────────────────────────────────────────
   HARDWARE TITLE special observer
───────────────────────────────────────────────────── */
const hwTitle = document.querySelector('.hardware-title-main');
if (hwTitle) {
    const hwIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in-view');
                hwIO.unobserve(e.target);
            }
        });
    }, { threshold: 0.3 });
    hwIO.observe(hwTitle);
}

/* ─────────────────────────────────────────────────────
   MOBILE MENU
───────────────────────────────────────────────────── */
const navHamburger = document.getElementById('navHamburger');
const mobileMenu   = document.getElementById('mobileMenu');

if (navHamburger && mobileMenu) {
    navHamburger.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('open');
        navHamburger.setAttribute('aria-expanded', open);
        // Animate hamburger → X
        const spans = navHamburger.querySelectorAll('span');
        if (open) {
            spans[0].style.transform = 'translateY(7px) rotate(45deg)';
            spans[1].style.opacity   = '0';
            spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
        } else {
            spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
        }
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            const spans = navHamburger.querySelectorAll('span');
            spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
        });
    });
}

/* ─────────────────────────────────────────────────────
   SMOOTH SCROLL for anchor links
───────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id  = a.getAttribute('href').slice(1);
        const el  = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

/* ─────────────────────────────────────────────────────
   ACTIVE NAV LINK on scroll
───────────────────────────────────────────────────── */
const sections  = ['hero-section', 'flavors', 'story', 'buy'];
const navLinks  = document.querySelectorAll('.nav-link');

const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.id;
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
    });
}, { threshold: 0.4 });

sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionIO.observe(el);
});

/* ─────────────────────────────────────────────────────
   OBSERVE all .reveal-up & .hw-card elements
───────────────────────────────────────────────────── */
function initObservers() {
    document.querySelectorAll('.reveal-up').forEach(el => io.observe(el));
    document.querySelectorAll('.hw-card').forEach(el => io.observe(el));

    const chart = document.querySelector('.chart-container');
    if (chart) io.observe(chart);
}

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
preloadImages();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObservers);
} else {
    initObservers();
}