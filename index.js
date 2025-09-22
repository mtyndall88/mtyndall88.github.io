/* ===================================================================
 * Custom merged JS
 * For Mark Tyndall Portfolio
 * ------------------------------------------------------------------- */

/* ===== Topbar controller: hide over hero text, show after; dark after hero ===== */
(function initTopbarController(){
    const topbar = document.getElementById('topbar');
    const hero   = document.getElementById('home');                 // full hero section
    const heroContent = document.querySelector('.hero__content');    // name/tagline/icons wrapper
    if (!topbar || !hero || !heroContent) return;

    let heroBottom = 0;          // absolute Y where hero ends
    let contentBottomAbs = 0;    // absolute Y where hero text ends
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
            const overlappingHeroText = (scrollY + topbarH) < (contentBottomAbs + 50);
            topbar.classList.toggle('is-hidden', overlappingHeroText);
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
            window.scrollTo({ top, behavior: 'smooth' });
            history.pushState(null, '', `#${id}`);
        });
    });

    updateByScroll();
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

/* ===== Contact form demo (no backend) ===== */
(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        console.log('Contact form submitted:', data);
        alert('Thanks! Your message has been captured locally. Wire this up to a backend/service to send.');
        form.reset();
    });
})();
