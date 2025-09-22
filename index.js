/* ===== Topbar background: transparent over HERO, dark after HERO ===== */
(function initTopbarPastHero(){
    const topbar = document.getElementById('topbar');
    const hero = document.getElementById('home');
    if (!topbar || !hero) return;

    const getTopbarHeight = () => {
        const cs = getComputedStyle(document.documentElement);
        const varVal = cs.getPropertyValue('--topbar-height').trim();
        const fromVar = parseInt(varVal.replace('px',''), 10);
        return Number.isFinite(fromVar) && fromVar > 0
            ? fromVar
            : topbar.getBoundingClientRect().height;
    };

    const buildObserver = () => {
        const offset = getTopbarHeight();
        // Trigger line sits just under the fixed topbar
        const opts = { root: null, rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 };

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // While HERO intersects the trigger line -> transparent; else -> dark
                if (entry.isIntersecting) {
                    topbar.classList.remove('scrolled');
                } else {
                    topbar.classList.add('scrolled');
                }
            });
        }, opts);

        io.observe(hero);
        return io;
    };

    let io = buildObserver();

    // Rebuild on resize (topbar height can change with wrapping)
    const onResize = () => {
        io && io.disconnect();
        io = buildObserver();
    };
    window.addEventListener('resize', onResize);

    // Initial state (in case the page loads mid-scroll)
    setTimeout(() => onResize(), 0);
})();

/* ===== Scroll-spy with immediate click highlight + offset/bias smooth scroll ===== */
(function initScrollSpy(){
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    if (links.length === 0) return;

    const idToLink = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const sections = Array.from(document.querySelectorAll('header[id], section[id]'))
        .filter(el => idToLink.has(el.id));

    const getOffset = () => {
        const cs = getComputedStyle(document.documentElement);
        const v = cs.getPropertyValue('--topbar-height').trim();
        const px = parseInt(v.replace('px',''), 10);
        return Number.isFinite(px) && px > 0 ? px : 0;
    };

    const setActive = (id) => {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    };

    let manualLock = false;   // pause auto-updates while we’re doing a manual scroll
    let scrollIdleTimer = null;

    // Auto update based on a marker line below the fixed topbar, biased into the viewport
    const updateByScroll = () => {
        if (manualLock) return;

        const offset = getOffset();
        const bias = Math.round(window.innerHeight * 0.30); // 30% viewport bias (tweak 0.20–0.40 to taste)
        const marker = window.scrollY + offset + bias;

        let currentId = sections[0]?.id || '';
        for (const sec of sections) {
            const top = sec.offsetTop;
            const bottom = top + sec.offsetHeight;
            if (marker >= top && marker < bottom) {
                currentId = sec.id;
                break;
            }
            if (marker >= top) currentId = sec.id;
        }
        if (currentId) setActive(currentId);
    };

    // Throttle using requestAnimationFrame
    let ticking = false;
    const onScroll = () => {
        if (manualLock) {
            clearTimeout(scrollIdleTimer);
            scrollIdleTimer = setTimeout(() => { manualLock = false; updateByScroll(); }, 180);
        }
        if (!ticking) {
            requestAnimationFrame(() => { updateByScroll(); ticking = false; });
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => updateByScroll());

    // Handle clicks: immediate active + offset smooth scroll + temporary lock
    links.forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (!target) return;

            e.preventDefault();
            manualLock = true;          // pause auto spy
            setActive(id);              // show blue immediately

            const offset = getOffset();
            const top = target.offsetTop - offset;

            // Smooth scroll with topbar offset
            window.scrollTo({ top, behavior: 'smooth' });

            // Keep URL hash in sync (no jump)
            history.pushState(null, '', `#${id}`);

            // Failsafe unlock
            clearTimeout(scrollIdleTimer);
            scrollIdleTimer = setTimeout(() => { manualLock = false; updateByScroll(); }, 600);
        });
    });

    // Initial state
    updateByScroll();
})();

/* ===== Reveal on scroll (fade-in) ===== */
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

/* ===== About: circular image carousel ===== */
(function initAboutCarousel(){
    const viewport = document.querySelector('.about-carousel__viewport');
    const dotsWrap = document.querySelector('.about-carousel__dots');
    if(!viewport || !dotsWrap) return;

    const imgs = Array.from(viewport.querySelectorAll('.about-carousel__img'));
    if(imgs.length === 0) return;

    let idx = 0, timer;

    // Build dots
    imgs.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Slide ${i+1}`);
        dot.addEventListener('click', () => show(i, true));
        dotsWrap.appendChild(dot);
    });

    function show(i, userTriggered=false){
        imgs[idx].classList.remove('is-active');
        dotsWrap.children[idx]?.classList.remove('is-active');

        idx = (i + imgs.length) % imgs.length;

        imgs[idx].classList.add('is-active');
        dotsWrap.children[idx]?.classList.add('is-active');

        if(userTriggered) restart();
    }

    function next(){ show(idx + 1); }
    function start(){ timer = setInterval(next, 3500); }
    function stop(){ clearInterval(timer); }
    function restart(){ stop(); start(); }

    show(0);
    start();

    viewport.addEventListener('mouseenter', stop);
    viewport.addEventListener('mouseleave', start);
    viewport.addEventListener('focusin', stop);
    viewport.addEventListener('focusout', start);
})();

/* ===== Projects: gallery modal ===== */
(function initProjectGallery(){
    const cards = Array.from(document.querySelectorAll('.project'));
    if (!cards.length) return;

    const modal = document.getElementById('projectModal');
    const dlg   = modal?.querySelector('.project-modal__dialog');
    const imgEl = modal?.querySelector('#projectModalImg');
    const titleEl = modal?.querySelector('#projectModalTitle');
    const descEl = modal?.querySelector('#projectModalDesc');
    const stackEl = modal?.querySelector('#projectModalStack');
    const linksEl = modal?.querySelector('#projectModalLinks');

    let lastFocus = null;

    const open = (data) => {
        if (!modal) return;
        lastFocus = document.activeElement;

        // Populate
        imgEl.src = data.img;
        imgEl.alt = data.title;
        titleEl.textContent = data.title;
        descEl.textContent = data.desc;

        // Stack pills
        stackEl.innerHTML = '';
        (data.stack || []).forEach(t => {
            const span = document.createElement('span');
            span.className = 'tech-tag';
            span.textContent = t;
            stackEl.appendChild(span);
        });

        // Links
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

        // Focus management
        setTimeout(() => {
            dlg?.focus?.();
        }, 0);
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        imgEl.src = '';
        document.body.style.overflow = '';
        lastFocus?.focus?.();
    };

    // Open handlers
    cards.forEach(card => {
        const btn = card.querySelector('.project-thumb');
        if (!btn) return;
        btn.addEventListener('click', () => {
            try {
                const json = card.getAttribute('data-project');
                const data = JSON.parse(json);
                open(data);
            } catch (e) {
                console.error('Bad project data JSON', e);
            }
        });
    });

    // Close interactions
    modal?.addEventListener('click', (e) => {
        if (e.target.matches('[data-close]') || e.target.classList.contains('project-modal__backdrop')) {
            close();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('is-open')) close();
    });
})();

/* ===== Contact form demo (no backend) ===== */
(function initContactForm(){
    const form = document.getElementById('contactForm');
    if(!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        console.log('Contact form submitted:', data);
        alert('Thanks! Your message has been captured locally. Wire this up to a backend/service to send.');
        form.reset();
    });
})();
