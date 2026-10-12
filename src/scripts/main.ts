import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { SceneState } from './three/scene';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const root = document.documentElement;

/* ---------- Smooth scroll ---------- */
let lenis: Lenis | null = null;
if (!reducedMotion) {
  lenis = new Lenis({ lerp: 0.1, anchors: { offset: -80 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- 3D scene (loaded after the text so the page paints first) ---------- */
async function initScene() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-canvas]');
  if (!canvas) return;
  const { createScene } = await import('./three/scene');
  const scene = createScene(canvas, { reducedMotion });
  if (!scene) {
    root.classList.add('no-webgl');
    return;
  }
  root.classList.add('has-webgl');

  // Each section can ask the shape to move, grow or calm down while it is on screen.
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((section) => {
    const target = JSON.parse(section.dataset.scene ?? '{}') as Partial<SceneState>;
    const go = () =>
      reducedMotion
        ? (Object.assign(scene.state, target), scene.renderOnce())
        : gsap.to(scene.state, { ...target, duration: 1.6, ease: 'power3.out', overwrite: true });
    ScrollTrigger.create({ trigger: section, start: 'top 55%', end: 'bottom 55%', onEnter: go, onEnterBack: go });
  });

  if (reducedMotion) scene.renderOnce();
  else scene.start();
  gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: reducedMotion ? 0 : 2, ease: 'power2.out' });
}

/* ---------- Intro: short loader, then the headline slides up ---------- */
function intro() {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  const count = document.querySelector<HTMLElement>('[data-loader-count]');
  const heroLines = gsap.utils.toArray<HTMLElement>('[data-hero] .line-inner');
  const heroFade = gsap.utils.toArray<HTMLElement>('[data-hero-fade]');

  if (reducedMotion || !loader || !count) {
    loader?.remove();
    return;
  }

  const counter = { v: 0 };
  const tl = gsap.timeline();
  tl.to(counter, {
    v: 100,
    duration: 1.1,
    ease: 'power2.inOut',
    onUpdate: () => (count.textContent = String(Math.round(counter.v)).padStart(3, '0')),
  })
    .to(loader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' })
    .from(heroLines, { yPercent: 110, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, '-=0.45')
    .from(heroFade, { opacity: 0, y: 20, duration: 1, stagger: 0.08, ease: 'power3.out' }, '-=0.9')
    .add(() => loader.remove());
}

/* ---------- Scroll reveals ---------- */
function reveals() {
  if (reducedMotion) return;

  gsap.utils.toArray<HTMLElement>('[data-lines]').forEach((el) => {
    gsap.from(el.querySelectorAll('.line-inner'), {
      yPercent: 110,
      duration: 1.1,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // Work cards drift at slightly different speeds for depth.
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = Number(el.dataset.parallax ?? 0.1);
    gsap.fromTo(
      el,
      { yPercent: speed * 40 },
      { yPercent: -speed * 40, ease: 'none', scrollTrigger: { trigger: el, scrub: true } },
    );
  });

  // The big closing headline grows as it comes into view.
  const cta = document.querySelector<HTMLElement>('[data-cta-title]');
  if (cta) {
    gsap.fromTo(
      cta,
      { scale: 0.86 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: cta, start: 'top bottom', end: 'center center', scrub: true } },
    );
  }
}

/* ---------- Header hides on the way down, returns on the way up ---------- */
function header() {
  const el = document.querySelector<HTMLElement>('[data-header]');
  if (!el) return;
  let lastY = 0;
  const onScroll = (y: number) => {
    el.classList.toggle('is-scrolled', y > 40);
    el.classList.toggle('is-hidden', y > lastY && y > 400 && !el.classList.contains('menu-open'));
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }: { scroll: number }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  // Mobile menu.
  const toggle = el.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  toggle?.addEventListener('click', () => {
    const open = el.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    if (open) lenis?.stop();
    else lenis?.start();
  });
  el.querySelectorAll('[data-menu] a').forEach((a) =>
    a.addEventListener('click', () => {
      el.classList.remove('menu-open');
      toggle?.setAttribute('aria-expanded', 'false');
      lenis?.start();
    }),
  );
}

/* ---------- Cursor and magnetic buttons (mouse only) ---------- */
function cursor() {
  if (!finePointer || reducedMotion) return;
  const dot = document.querySelector<HTMLElement>('[data-cursor]');
  if (!dot) return;
  root.classList.add('has-cursor');
  const x = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    dot.classList.add('is-visible');
    x(e.clientX);
    y(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor-label]');
    dot.classList.toggle('is-active', !!target);
    dot.dataset.label = target?.dataset.cursorLabel ?? '';
  });
  document.documentElement.addEventListener('pointerleave', () => dot.classList.remove('is-active', 'is-visible'));

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('pointerleave', () => {
      mx(0);
      my(0);
    });
  });

  // Work cards tilt towards the pointer.
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const media = el.querySelector<HTMLElement>('[data-tilt-media]') ?? el;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(media, { rotateY: px * 8, rotateX: -py * 8, duration: 0.6, ease: 'power3.out' });
      media.style.setProperty('--gx', `${(px + 0.5) * 100}%`);
      media.style.setProperty('--gy', `${(py + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', () =>
      gsap.to(media, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'power3.out' }),
    );
  });
}

/* ---------- Footer clock (local studio time) ---------- */
function clock() {
  const el = document.querySelector<HTMLElement>('[data-clock]');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => (el.textContent = `${fmt.format(new Date())} IST`);
  tick();
  setInterval(tick, 30_000);
}

intro();
reveals();
header();
cursor();
clock();
initScene();
