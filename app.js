/* =========================================================================
   SPAZIO | Spa a domicilio
   Interacciones y animaciones.
   - Todo lo funcional (menú, acordeones, formulario) NO depende de GSAP.
   - GSAP + ScrollTrigger + Lenis solo añaden la capa cinematográfica.
   - Se respeta prefers-reduced-motion en todas las animaciones.
   ========================================================================= */
(() => {
    'use strict';

    const WA_NUMBER = '525567311875';

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const html = document.documentElement;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    let lenis = null;
    let intro = null; // timeline de entrada del hero (se crea en buildScroll)

    if (hasGsap) {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
    }

    /* ---------------------------------------------------------------------
       Utilidades
       --------------------------------------------------------------------- */
    const debounce = (fn, ms) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };
    const refreshTriggers = debounce(() => { if (hasGsap) ScrollTrigger.refresh(); }, 950);

    /** Divide el texto de un elemento en palabras (conserva spans hijos). */
    function splitWords(el, { mask = true } = {}) {
        const words = [];
        const label = el.textContent.replace(/\s+/g, ' ').trim();
        el.setAttribute('aria-label', label);

        const walk = (node) => {
            Array.from(node.childNodes).forEach((child) => {
                if (child.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach((part) => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const outer = document.createElement('span');
                        outer.setAttribute('aria-hidden', 'true');
                        if (mask) {
                            const inner = document.createElement('span');
                            outer.className = 'w';
                            inner.className = 'wi';
                            inner.textContent = part;
                            outer.appendChild(inner);
                            words.push(inner);
                        } else {
                            outer.className = 'word';
                            outer.textContent = part;
                            words.push(outer);
                        }
                        frag.appendChild(outer);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1 && !child.classList.contains('inline-img')) {
                    walk(child);
                }
            });
        };
        walk(el);
        return words;
    }

    /* ---------------------------------------------------------------------
       Menú móvil
       --------------------------------------------------------------------- */
    const burger = $('#burger');
    const menu = $('#menu');

    function setMenu(open) {
        if (!burger || !menu) return;
        menu.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        if (open) { menu.removeAttribute('inert'); } else { menu.setAttribute('inert', ''); }
        if (lenis) { open ? lenis.stop() : lenis.start(); }
        else { html.style.overflow = open ? 'hidden' : ''; }
        if (open) $('#nav')?.classList.remove('is-hidden');
    }
    burger?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1000px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    /* ---------------------------------------------------------------------
       Anclas con scroll suave (Lenis si existe)
       --------------------------------------------------------------------- */
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const id = link.getAttribute('href');
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        setMenu(false);
        if (lenis) {
            lenis.scrollTo(id === '#inicio' ? 0 : target, { offset: -72, duration: 1.7 });
        } else {
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
    });

    /* ---------------------------------------------------------------------
       Acordeón de masajes
       --------------------------------------------------------------------- */
    (function initServices() {
        const items = $$('[data-svc]');
        if (!items.length) return;
        const hoverMode = window.matchMedia('(min-width: 1000px) and (hover: hover)');
        let hoverTimer;

        const activate = (item) => {
            if (item.classList.contains('is-active')) return;
            items.forEach((el) => {
                const on = el === item;
                el.classList.toggle('is-active', on);
                $('.svc__btn', el).setAttribute('aria-expanded', String(on));
            });
            refreshTriggers();
        };

        items.forEach((item) => {
            $('.svc__btn', item).addEventListener('click', () => activate(item));
            item.addEventListener('pointerenter', () => {
                if (!hoverMode.matches) return;
                clearTimeout(hoverTimer);
                hoverTimer = setTimeout(() => activate(item), 90);
            });
            item.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
        });
    })();

    /* ---------------------------------------------------------------------
       FAQ
       --------------------------------------------------------------------- */
    (function initFaq() {
        const items = $$('.faq__item');
        items.forEach((item) => {
            const btn = $('.faq__q', item);
            btn.addEventListener('click', () => {
                const willOpen = !item.classList.contains('is-open');
                items.forEach((el) => {
                    const on = el === item && willOpen;
                    el.classList.toggle('is-open', on);
                    $('.faq__q', el).setAttribute('aria-expanded', String(on));
                });
                refreshTriggers();
            });
        });
    })();

    /* ---------------------------------------------------------------------
       Formulario -> WhatsApp
       --------------------------------------------------------------------- */
    (function initForm() {
        const form = $('#contactForm');
        if (!form) return;

        const dateInput = $('#f-date');
        if (dateInput) {
            const d = new Date();
            dateInput.min = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        const rules = [
            { id: 'f-name', err: 'e-name', msg: 'Dinos tu nombre para saludarte bien.' },
            { id: 'f-service', err: 'e-service', msg: 'Elige el masaje que te interesa.' },
            { id: 'f-zone', err: 'e-zone', msg: 'Indícanos tu colonia o zona.' }
        ];

        const setError = (rule, message) => {
            const input = $('#' + rule.id);
            const field = input.closest('.field');
            field.classList.toggle('has-error', Boolean(message));
            $('#' + rule.err).textContent = message || '';
            if (message) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', rule.err); }
            else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
        };

        rules.forEach((rule) => {
            const input = $('#' + rule.id);
            const clear = () => { if (input.value.trim()) setError(rule, ''); };
            input.addEventListener('input', clear);
            input.addEventListener('change', clear);
        });

        const prettyDate = (iso) => {
            if (!iso) return 'por definir';
            const [y, m, d] = iso.split('-');
            return `${d}/${m}/${y}`;
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            let firstInvalid = null;
            rules.forEach((rule) => {
                const input = $('#' + rule.id);
                const empty = !input.value.trim();
                setError(rule, empty ? rule.msg : '');
                if (empty && !firstInvalid) firstInvalid = input;
            });
            if (firstInvalid) { firstInvalid.focus(); return; }

            const data = new FormData(form);
            const lines = [
                `Hola Spazio, soy ${String(data.get('nombre')).trim()}.`,
                `Me interesa: ${data.get('masaje')}.`,
                `Día preferido: ${prettyDate(data.get('dia'))}.`,
                `Horario: ${data.get('horario') || 'sin preferencia'}.`,
                `Zona: ${String(data.get('zona')).trim()}.`
            ];
            const extra = String(data.get('mensaje') || '').trim();
            if (extra) lines.push(`Comentarios: ${extra}`);
            lines.push('Quedo atento(a) para confirmar. Gracias.');

            const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
            const ok = $('#formOk');
            $('#formOkLink').href = url;
            ok.hidden = false;
            window.open(url, '_blank', 'noopener');
        });
    })();

    /* ---------------------------------------------------------------------
       Spotlight que sigue al cursor en las tarjetas del bento
       --------------------------------------------------------------------- */
    if (finePointer) {
        $$('.spot').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', `${e.clientX - r.left}px`);
                el.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    /* ---------------------------------------------------------------------
       Partículas (motas de luz que flotan como vapor)
       Dibujo en canvas; solo corre cuando es visible.
       --------------------------------------------------------------------- */
    function createMotes(canvas, { count = 60, rgb = '46,143,119', speed = 1, track = null } = {}) {
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        const rand = (a, b) => a + Math.random() * (b - a);
        const mouse = { x: -9999, y: -9999 };
        let w = 0, h = 0, raf = 0, last = 0, visible = false, particles = [];

        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 64;
        const sctx = sprite.getContext('2d');
        const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, `rgba(${rgb},.6)`);
        grad.addColorStop(.4, `rgba(${rgb},.2)`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);

        const spawn = (initial) => {
            const ring = Math.random() < .2;
            return {
                x: rand(0, w),
                y: initial ? rand(0, h) : h + rand(10, 80),
                r: ring ? rand(5, 12) : rand(4, 18),
                vy: rand(.12, .5),
                vx: rand(-.08, .08),
                ph: rand(0, 6.28),
                sw: rand(.3, .9),
                a: rand(.4, 1),
                ring
            };
        };

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = rect.width; h = rect.height;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.round(count * Math.min(1, w / 1000 + .35));
            particles = Array.from({ length: n }, () => spawn(true));
            if (reduceMotion) drawFrame(0);
        };

        const drawFrame = (dt) => {
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                p.ph += .008 * dt;
                p.x += (p.vx + Math.sin(p.ph) * p.sw * .35) * dt * speed;
                p.y -= p.vy * dt * speed;

                const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 14400) {
                    const d = Math.sqrt(d2) || 1, f = 1 - d / 120;
                    p.x += (dx / d) * f * 2.4 * dt;
                    p.y += (dy / d) * f * 2.4 * dt;
                }
                if (p.y < -40 || p.x < -60 || p.x > w + 60) Object.assign(p, spawn(false));

                const edge = Math.min(1, p.y / (h * .2), (h - p.y) / (h * .08) + .25);
                ctx.globalAlpha = Math.max(0, p.a * edge);
                if (p.ring) {
                    ctx.strokeStyle = `rgba(${rgb},.55)`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                    ctx.stroke();
                } else {
                    ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
                }
            }
            ctx.globalAlpha = 1;
        };

        const loop = (t) => {
            raf = requestAnimationFrame(loop);
            const dt = Math.min((t - last) / 16.67, 3) || 1;
            last = t;
            drawFrame(dt);
        };
        const start = () => { if (!raf && !reduceMotion) { last = performance.now(); raf = requestAnimationFrame(loop); } };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };

        new ResizeObserver(resize).observe(canvas);
        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            visible && !document.hidden ? start() : stop();
        }).observe(canvas);
        document.addEventListener('visibilitychange', () => { document.hidden ? stop() : (visible && start()); });

        if (track && finePointer) {
            track.addEventListener('pointermove', (e) => {
                const r = canvas.getBoundingClientRect();
                mouse.x = e.clientX - r.left;
                mouse.y = e.clientY - r.top;
            });
            track.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
        }
        resize();
    }

    createMotes($('#motes'), { count: 64, track: $('.hero') });
    createMotes($('#motes2'), { count: 34, speed: .8 });

    /* ---------------------------------------------------------------------
       Titulares: se dividen siempre (la animación solo si hay movimiento)
       --------------------------------------------------------------------- */
    const heroWords = $('[data-hero-split]') ? splitWords($('[data-hero-split]')) : [];
    const sectionHeadings = $$('[data-split]').map((el) => ({ el, words: splitWords(el) }));
    const manifestoEl = $('[data-scrub-words]');
    const manifestoWords = manifestoEl ? splitWords(manifestoEl, { mask: false }) : [];

    /* ---------------------------------------------------------------------
       Capa cinematográfica (GSAP + ScrollTrigger + Lenis)
       --------------------------------------------------------------------- */
    function buildScroll() {
        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const navH = 60;

            /* ---- Hero: estados iniciales + línea de entrada ---- */
            gsap.set(heroWords, { yPercent: 118 });
            gsap.set('[data-hero-fade]', { y: 26, opacity: 0 });
            gsap.set('.arch--main .arch__clip', { clipPath: 'inset(100% 0% 0% 0%)' });
            gsap.set('.arch--small .arch__clip', { clipPath: 'inset(100% 0% 0% 0%)' });
            gsap.set('.arch--main img, .arch--small img', { scale: 1.35 });
            gsap.set('.rings', { opacity: 0, scale: .72 });
            gsap.set('.nav__bar', { y: -34, opacity: 0 });

            intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
            intro
                .to(heroWords, { yPercent: 0, duration: 1.5, stagger: .1 }, 0)
                .to('[data-hero-fade]', { y: 0, opacity: 1, duration: 1.2, stagger: .14 }, .55)
                .to('.arch--main .arch__clip', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut', clearProps: 'clipPath' }, .1)
                .to('.arch--main img', { scale: 1, duration: 2.2 }, .1)
                .to('.arch--small .arch__clip', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', clearProps: 'clipPath' }, .45)
                .to('.arch--small img', { scale: 1, duration: 2.2 }, .45)
                .to('.rings', { opacity: 1, scale: 1, duration: 2, clearProps: 'scale' }, .2)
                .to('.nav__bar', { y: 0, opacity: 1, duration: 1.2 }, .7);

            /* Paralaje del hero al hacer scroll */
            gsap.to('.hero__visual', { yPercent: -7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
            gsap.to('.hero__copy', { yPercent: -10, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: '45% top', end: 'bottom top', scrub: true } });
            gsap.to('.blob--a', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

            /* Paralaje con el mouse (solo punteros finos) */
            if (finePointer) {
                const hero = $('.hero');
                const layers = $$('[data-depth]', hero).map((el) => ({
                    d: Number(el.dataset.depth),
                    x: gsap.quickTo(el, 'x', { duration: 1.3, ease: 'power3.out' }),
                    y: gsap.quickTo(el, 'y', { duration: 1.3, ease: 'power3.out' })
                }));
                hero.addEventListener('pointermove', (e) => {
                    const r = hero.getBoundingClientRect();
                    const nx = (e.clientX - r.left) / r.width - .5;
                    const ny = (e.clientY - r.top) / r.height - .5;
                    layers.forEach((l) => { l.x(-nx * l.d * 2); l.y(-ny * l.d * 2); });
                });
                hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.x(0); l.y(0); }));
            }

            /* ---- Progreso de scroll ---- */
            gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

            /* ---- Navegación: se oculta al bajar, vuelve al subir ---- */
            const nav = $('#nav');
            ScrollTrigger.create({
                start: 0, end: 'max',
                onUpdate: (self) => {
                    if (menu && menu.classList.contains('is-open')) return;
                    nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 520);
                }
            });
            $$('.nav__links a[data-nav]').forEach((link) => {
                const section = $('#' + link.dataset.nav);
                if (!section) return;
                ScrollTrigger.create({
                    trigger: section, start: 'top 55%', end: 'bottom 55%',
                    onToggle: (self) => link.classList.toggle('is-current', self.isActive)
                });
            });

            /* ---- Marquee: acelera con la velocidad del scroll ---- */
            const track = $('#marqueeTrack');
            const anim = track && track.getAnimations ? track.getAnimations()[0] : null;
            if (anim) {
                let vel = 0, rate = 1, sign = 1;
                ScrollTrigger.create({
                    start: 0, end: 'max',
                    onUpdate: (self) => { vel = self.getVelocity(); if (vel) sign = Math.sign(vel); }
                });
                gsap.ticker.add(() => {
                    vel *= .92;
                    const desired = sign * (1 + Math.min(Math.abs(vel) / 260, 9));
                    rate += (desired - rate) * .08;
                    anim.updatePlaybackRate(Math.abs(rate) < .05 ? .05 : rate);
                });
            }

            /* ---- Manifiesto: palabras que se encienden con el scroll ---- */
            if (manifestoWords.length) {
                const pieces = manifestoWords.concat($$('.inline-img', manifestoEl));
                gsap.set(pieces, { opacity: .14 });
                gsap.to(pieces, {
                    opacity: 1, ease: 'none', stagger: .12,
                    scrollTrigger: { trigger: manifestoEl, start: 'top 82%', end: 'bottom 52%', scrub: true }
                });
            }

            /* ---- Imagen que se abre a pantalla completa (pin + scrub) ---- */
            const reveal = $('.reveal');
            if (reveal) {
                const media = $('#revealMedia');
                const mediaImg = $('img', media);
                const content = $('#revealContent');
                const wordL = $('.reveal__word--l');
                const wordR = $('.reveal__word--r');
                const desktop = () => window.innerWidth >= 1000;

                const startClip = () => {
                    const W = window.innerWidth, H = window.innerHeight;
                    const w = desktop() ? Math.min(W * .28, 430) : W * .62;
                    const hh = desktop() ? Math.min(H * .62, 600) : H * .5;
                    const x = (W - w) / 2, y = (H - hh) / 2, r = w / 2;
                    return `inset(${y}px ${x}px ${y}px ${x}px round ${r}px ${r}px 28px 28px)`;
                };
                const endClip = 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)';

                gsap.set(content, { opacity: 0, y: 36 });
                const tl = gsap.timeline({
                    defaults: { ease: 'none' },
                    scrollTrigger: {
                        trigger: reveal, start: 'top top', end: '+=150%',
                        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true
                    }
                });
                tl.fromTo(media, { clipPath: startClip }, { clipPath: endClip, duration: 1 }, 0)
                  .fromTo(mediaImg, { scale: 1.4 }, { scale: 1, duration: 1 }, 0)
                  .to(wordL, { x: () => -window.innerWidth * .3, opacity: 0, duration: .8 }, 0)
                  .to(wordR, { x: () => window.innerWidth * .3, opacity: 0, duration: .8 }, 0)
                  .to(content, { opacity: 1, y: 0, duration: .4 }, .62)
                  .to({}, { duration: .3 });
            }

            /* ---- Titulares de sección ---- */
            sectionHeadings.forEach(({ el, words }) => {
                gsap.set(words, { yPercent: 118 });
                ScrollTrigger.create({
                    trigger: el, start: 'top 88%', once: true,
                    onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: .07 })
                });
            });

            /* ---- Elementos genéricos que entran al hacer scroll ---- */
            gsap.set('[data-reveal]', { opacity: 0, y: 42 });
            ScrollTrigger.batch('[data-reveal]', {
                start: 'top 91%', once: true,
                onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .09, overwrite: true })
            });

            /* ---- Masajes: las tiras entran en cascada ---- */
            gsap.from('.svc__item', {
                y: 70, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .1,
                scrollTrigger: { trigger: '#svc', start: 'top 82%', once: true }
            });

            /* ---- Paralaje interno de imágenes ---- */
            $$('[data-parallax]').forEach((img) => {
                gsap.fromTo(img, { yPercent: -6 }, {
                    yPercent: 6, ease: 'none',
                    scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
                });
            });

            /* ---- Proceso: tarjetas que se apilan ---- */
            const cards = $$('.stack__card');
            cards.forEach((card, i) => {
                if (i === cards.length - 1) return;
                gsap.to(card, {
                    scale: .93, ease: 'none',
                    scrollTrigger: {
                        trigger: cards[i + 1],
                        start: 'top bottom',
                        end: () => `top ${navH + 30 + (i + 1) * 14}px`,
                        scrub: true
                    }
                });
            });

            /* ---- Footer: la palabra gigante sube ---- */
            gsap.from('.footer__word span', {
                yPercent: 55, ease: 'none',
                scrollTrigger: { trigger: '.footer__word', start: 'top 105%', end: 'bottom bottom', scrub: true }
            });

            /* ---- Botones magnéticos ---- */
            if (finePointer) {
                $$('[data-magnetic]').forEach((btn) => {
                    const xTo = gsap.quickTo(btn, 'x', { duration: .7, ease: 'power3.out' });
                    const yTo = gsap.quickTo(btn, 'y', { duration: .7, ease: 'power3.out' });
                    btn.addEventListener('pointermove', (e) => {
                        const r = btn.getBoundingClientRect();
                        xTo((e.clientX - r.left - r.width / 2) * .26);
                        yTo((e.clientY - r.top - r.height / 2) * .38);
                    });
                    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
                });
            }
        });
    }

    /* ---------------------------------------------------------------------
       Loader + arranque
       --------------------------------------------------------------------- */
    (function boot() {
        const loader = $('#loader');
        const pctEl = $('#loaderPct');
        const barEl = $('#loaderBar');
        const breathEl = $('#loaderBreath');

        const startLenis = () => {
            if (!hasGsap || reduceMotion || typeof window.Lenis === 'undefined') return;
            lenis = new Lenis({
                duration: 1.15,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true
            });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
            lenis.stop();
        };

        const finishLoading = () => {
            html.classList.remove('is-loading');
            if (lenis) lenis.start();
            if (hasGsap) ScrollTrigger.refresh();
            loader && loader.remove();
        };

        const exit = () => {
            if (!loader) return finishLoading();
            loader.style.animation = 'none';

            if (!hasGsap || reduceMotion) {
                loader.style.transition = 'opacity .6s ease';
                loader.style.opacity = '0';
                setTimeout(finishLoading, 650);
                return;
            }

            let built = true;
            try {
                startLenis();
                buildScroll();
            } catch (err) {
                built = false;
                console.error('Spazio: error en animaciones, se muestra el sitio sin ellas.', err);
                gsap.set('*', { clearProps: 'all' });
            }

            const tl = gsap.timeline({ onComplete: finishLoading });
            tl.to('.loader__foot', { opacity: 0, y: 12, duration: .4, ease: 'power2.in' })
              .to('.loader__stage', { scale: 1.08, opacity: 0, duration: .7, ease: 'power2.in' }, '<')
              .fromTo(loader,
                  { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)' },
                  { clipPath: 'inset(0% 0% 100% 0% round 0px 0px 50vw 50vw)', duration: 1.2, ease: 'expo.inOut' },
                  '-=.25');
            if (built && intro) tl.add(() => intro.play(), '-=.85');
        };

        /* Progreso: sube con el tiempo y espera a que cargue de verdad */
        const MIN_MS = reduceMotion ? 500 : 2600;
        const t0 = performance.now();
        let pageReady = document.readyState === 'complete';
        let fontsReady = !document.fonts;
        window.addEventListener('load', () => { pageReady = true; }, { once: true });
        if (document.fonts) document.fonts.ready.then(() => { fontsReady = true; });
        setTimeout(() => { pageReady = true; fontsReady = true; }, 6000);

        let shown = 0;
        const breathTimer = setInterval(() => {
            if (breathEl) breathEl.textContent = breathEl.textContent === 'Inhala' ? 'Exhala' : 'Inhala';
        }, 1300);

        const tick = (now) => {
            const timeP = Math.min((now - t0) / MIN_MS, 1);
            const cap = pageReady && fontsReady ? 100 : 92;
            const target = Math.min(cap, timeP * 100);
            shown += (target - shown) * .12;
            if (target >= 100 && 100 - shown < .5) shown = 100;
            const rounded = Math.round(shown);
            if (pctEl) pctEl.textContent = rounded;
            if (barEl) barEl.style.transform = `scaleX(${shown / 100})`;
            if (shown >= 100) { clearInterval(breathTimer); exit(); return; }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    })();

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
