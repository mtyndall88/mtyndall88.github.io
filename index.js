/* ===================================================================
 * Custom Site JS - Mark Tyndall ideas from Ceevee Template
 * I kept things minimal but reliable.
 * FEATURES:
 * - Topbar show/hide + "after hero" styling.
 * - Scroll spy with smooth anchor scrolling
 * - Fade-in on scroll
 * - About carousel
 * - Project modal
 * - Contact form submit (Formspree)
 * - Mobile fixes (no sticky hover, stable nav)
 * - Greeting dismiss, Scroll-down & Back-to-top
 * =================================================================== */

/* ===== First-load intro: mount topbar, then reveal hero text & socials ===== */
(function initIntroMount(){
    const topbar = document.getElementById('topbar');
    const h1 = document.querySelector('.hero__content h1.reveal-up');
    const tagline = document.querySelector('.hero__content .tagline.reveal-up');
    const socials = document.querySelectorAll('.social .reveal-up');

    // Timings
    const TOPBAR_DELAY = 120;   // slide topbar
    const HERO_DELAY   = 900;   // reveal hero text
    const SOCIAL_DELAY = 1400;  // socials start (same time)

    const onLoad = () => {
        if (topbar) {
            setTimeout(() => {
                topbar.classList.add('is-mounted');
                topbar.classList.remove('is-hidden');
            }, TOPBAR_DELAY);
        }

        setTimeout(() => {
            h1?.classList.add('is-in');
            tagline?.classList.add('is-in');
        }, HERO_DELAY);

        // Reveal ALL social icons at once
        setTimeout(() => {
            socials.forEach(icon => icon.classList.add('is-in'));
        }, SOCIAL_DELAY);
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);
})();

/* ===== Topbar controller: hide over hero text, show after; dark after hero ===== */
(function initTopbarController(){
    const topbar = document.getElementById('topbar');
    const hero   = document.getElementById('home'); // full hero section
    const heroContent = document.querySelector('.hero__content'); // name/tagline/icons wrapper
    if (!topbar || !hero || !heroContent) return;

    let heroBottom = 0; // absolute Y where hero ends
    let contentBottomAbs = 0; // absolute Y where hero text ends
    let ticking = false;

    const measure = () => {
        const heroRect = hero.getBoundingClientRect();
        const hcRect   = heroContent.getBoundingClientRect();
        const scrollY  = window.scrollY;

        heroBottom       = scrollY + heroRect.top + heroRect.height;
        contentBottomAbs = scrollY + hcRect.top + hcRect.height;
    };

    const update = () => {
        ticking = false;

        const scrollY = window.scrollY;
        const topbarH = Math.round(topbar.getBoundingClientRect().height);

        // 1) Show at very top; otherwise hide while bar would cover hero text area
        if (scrollY <= 2) {
            topbar.classList.remove('is-hidden');
        } else {
            // delay auto-hide right after a nav click
            const ts = Number(document.documentElement.dataset.navClickTs || 0);
            const suppressHide = ts && (Date.now() - ts < 700); // ~0.7s window
            const overlappingHeroText = (scrollY + topbarH) < (contentBottomAbs + 50);
            topbar.classList.toggle('is-hidden', !suppressHide && overlappingHeroText);
        }

        // 2) Transparent while within hero, dark after hero
        const pastHero = (scrollY + topbarH) >= heroBottom;
        topbar.classList.toggle('scrolled', pastHero);
    };

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    };

    const onResize = () => {
        measure();
        update();
    };

    // init
    measure();
    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);
})();

/* ===== Greeting close ===== */
(function initGreetingClose(){
    const bar = document.getElementById('greeting');
    const btn = document.getElementById('greetingClose');
    if (!bar || !btn) return;

    const KEY = 'mt_greeting_dismissed';

    // If this page load is a *reload*, clear the flag so the banner returns
    try {
        const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        const isReload = nav ? nav.type === 'reload'
            : (performance.navigation && performance.navigation.type === 1); // Safari fallback
        if (isReload) sessionStorage.removeItem(KEY);
    } catch(_) {}

    if (sessionStorage.getItem(KEY) === '1') {
        bar.style.display = 'none';
        return;
    }

    btn.addEventListener('click', () => {
        bar.style.display = 'none';
        sessionStorage.setItem(KEY, '1');
    });
})();

/* ===== Back to top ===== */
(function initBackToTop(){
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const toggle = () => {
        const show = window.scrollY > (window.innerHeight * 0.6);
        btn.classList.toggle('is-visible', show);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    window.addEventListener('resize', toggle);
    toggle();

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

/* ===== Scroll-spy (active nav link) ===== */
(function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (!links.length) return;

    const idToLink = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const sections = Array.from(document.querySelectorAll('header[id], section[id]'))
        .filter(el => idToLink.has(el.id));
    const topbar = document.getElementById('topbar');

    const getOffset = () => (topbar ? topbar.getBoundingClientRect().height : 0);

    const setActive = (id) => {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    };

    const updateByScroll = () => {
        const offset = getOffset();
        const marker = window.scrollY + offset + window.innerHeight * 0.25;

        let currentId = sections[0]?.id || '';
        for (const sec of sections) {
            const top = sec.offsetTop;
            const bottom = top + sec.offsetHeight;
            if (marker >= top && marker < bottom) { currentId = sec.id; break; }
            if (marker >= top) currentId = sec.id;
        }
        if (currentId) setActive(currentId);
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => { updateByScroll(); ticking = false; });
            ticking = true;
        }
    }, { passive: true });
    window.addEventListener('resize', updateByScroll);

    // Smooth scroll for clicks
    links.forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            setActive(id);

            const top = target.offsetTop - getOffset();
            // keep topbar stable during user navigation
            document.documentElement.dataset.navClickTs = Date.now().toString();
            window.scrollTo({ top, behavior: 'smooth' });
            // drop focus to avoid sticky :focus highlight on mobile
            a.blur();
            history.pushState(null, '', `#${id}`);
        });
    });

    updateByScroll();
})();

/* ===== Scroll-down button click ===== */
(function initScrollDown(){
    const btn = document.querySelector('.scroll-down');
    const target = document.getElementById('about'); // the section you want to hit
    const topbar = document.getElementById('topbar');

    if (!btn || !target) return;

    const getOffset = () => (topbar ? topbar.getBoundingClientRect().height : 0);

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const top = target.offsetTop - getOffset();
        window.scrollTo({ top, behavior: 'smooth' });
        history.pushState(null, '', '#about'); // optional: update URL like nav click
    });
})();

/* ===== Reveal on scroll (fade-in) ===== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ===== About: circular image carousel ===== */
(function initAboutCarousel() {
    const viewport = document.querySelector('.about-carousel__viewport');
    const dotsWrap = document.querySelector('.about-carousel__dots');
    if (!viewport || !dotsWrap) return;

    const imgs = Array.from(viewport.querySelectorAll('.about-carousel__img'));
    if (!imgs.length) return;

    let idx = 0, timer;

    imgs.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => show(i, true));
        dotsWrap.appendChild(dot);
    });

    function show(i, userTriggered = false) {
        imgs[idx].classList.remove('is-active');
        dotsWrap.children[idx]?.classList.remove('is-active');

        idx = (i + imgs.length) % imgs.length;

        imgs[idx].classList.add('is-active');
        dotsWrap.children[idx]?.classList.add('is-active');

        if (userTriggered) restart();
    }

    function next() { show(idx + 1); }
    function start() { timer = setInterval(next, 3500); }
    function stop() { clearInterval(timer); }
    function restart() { stop(); start(); }

    show(0);
    start();

    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', start);
    viewport.addEventListener('focusin', stop);
    viewport.addEventListener('focusout', start);
})();

/* ===== Projects: gallery modal ===== */
(function initProjectGallery() {
    const cards = Array.from(document.querySelectorAll('.project'));
    if (!cards.length) return;

    const modal = document.getElementById('projectModal');
    const dlg = modal?.querySelector('.project-modal__dialog');
    const imgEl = modal?.querySelector('#projectModalImg');
    const titleEl = modal?.querySelector('#projectModalTitle');
    const descEl = modal?.querySelector('#projectModalDesc');
    const stackEl = modal?.querySelector('#projectModalStack');
    const linksEl = modal?.querySelector('#projectModalLinks');

    let lastFocus = null;

    const open = (data) => {
        lastFocus = document.activeElement;
        imgEl.src = data.img;
        imgEl.alt = data.title;
        titleEl.textContent = data.title;
        descEl.textContent = data.desc;

        stackEl.innerHTML = '';
        (data.stack || []).forEach(t => {
            const span = document.createElement('span');
            span.className = 'tech-tag';
            span.textContent = t;
            stackEl.appendChild(span);
        });

        linksEl.innerHTML = '';
        (data.links || []).forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = link.label;
            linksEl.appendChild(a);
        });

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        setTimeout(() => dlg?.focus?.(), 0);
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        imgEl.src = '';
        document.body.style.overflow = '';
        lastFocus?.focus?.();
    };

    cards.forEach(card => {
        const btn = card.querySelector('.project-thumb');
        if (!btn) return;
        btn.addEventListener('click', () => {
            try {
                const json = card.getAttribute('data-project');
                const data = JSON.parse(json);
                open(data);
            } catch (e) { console.error('Bad project data JSON', e); }
        });
    });

    modal?.addEventListener('click', (e) => {
        if (e.target.matches('[data-close]') || e.target.classList.contains('project-modal__backdrop')) {
            close();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('is-open')) close();
    });
})();

/* ===== Contact form  ===== */
(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const endpoint = form.getAttribute('action'); // Formspree endpoint
        const data = new FormData(form);

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }  // get JSON back
            });

            if (res.ok) {
                alert('Thanks! Your message has been sent.');
                form.reset();
            } else {
                const err = await res.json().catch(() => ({}));
                console.error('Formspree error:', err);
                alert('Sorry—there was a problem sending your message. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Network error. Please check your connection and try again.');
        }
    });
})();
