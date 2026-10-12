import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { blobFragment, blobVertex, pointsFragment, pointsVertex } from './shaders';

/**
 * Values the page's scroll animation tweens. x and y are fractions of half
 * the visible width/height, so the same numbers work on any screen size.
 */
export interface SceneState {
  x: number;
  y: number;
  scale: number;
  amp: number;
  freq: number;
  opacity: number;
}

export interface HeroScene {
  state: SceneState;
  start(): void;
  renderOnce(): void;
}

const ACCENT = new Color('#c6ff3d');

export function createScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }): HeroScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }

  const narrow = window.matchMedia('(max-width: 767px)').matches;
  const lowPower = narrow || (navigator.hardwareConcurrency ?? 8) <= 4;
  const pixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const state: SceneState = { x: 0.5, y: 0, scale: 0.95, amp: 0.2, freq: 0.75, opacity: 1 };

  // Main shape.
  const blobUniforms = {
    uTime: { value: 0 },
    uAmp: { value: state.amp },
    uFreq: { value: state.freq },
    uMouse: { value: new Vector2() },
    uAccent: { value: ACCENT },
    uOpacity: { value: 1 },
  };
  const blob = new Mesh(
    new IcosahedronGeometry(1.35, lowPower ? 40 : 96),
    new ShaderMaterial({
      vertexShader: blobVertex,
      fragmentShader: blobFragment,
      uniforms: blobUniforms,
      transparent: true,
    }),
  );

  // Particle shell around the shape.
  const count = lowPower ? 700 : 1800;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 2.2 + Math.random() * 2.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = 1 + Math.random() * 2.5;
    seeds[i] = Math.random();
  }
  const pointsGeo = new BufferGeometry();
  pointsGeo.setAttribute('position', new BufferAttribute(positions, 3));
  pointsGeo.setAttribute('aSize', new BufferAttribute(sizes, 1));
  pointsGeo.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  const pointsUniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uAccent: { value: ACCENT },
    uOpacity: { value: 1 },
  };
  const points = new Points(
    pointsGeo,
    new ShaderMaterial({
      vertexShader: pointsVertex,
      fragmentShader: pointsFragment,
      uniforms: pointsUniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );

  const group = new Group();
  group.add(blob, points);
  scene.add(group);

  // Half of the visible area at z = 0, in world units.
  const half = { w: 1, h: 1 };
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    half.h = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    half.w = half.h * camera.aspect;
  }
  resize();

  const pointer = new Vector2();
  const pointerSmooth = new Vector2();
  if (!opts.reducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      },
      { passive: true },
    );
  }

  let elapsed = 0;
  function apply(dt: number) {
    elapsed += dt;
    pointerSmooth.lerp(pointer, Math.min(1, dt * 3));

    // On phones the shape sits behind the text, centred and a bit smaller.
    const xScale = narrow ? 0.15 : 1;
    const sizeScale = narrow ? 0.8 : Math.min(1, half.w / 3.2);
    group.position.x = state.x * half.w * xScale;
    group.position.y = state.y * half.h + (narrow ? half.h * 0.12 : 0);
    group.scale.setScalar(state.scale * sizeScale);

    blob.rotation.y = elapsed * 0.12 + pointerSmooth.x * 0.4;
    blob.rotation.x = elapsed * 0.05 - pointerSmooth.y * 0.3;
    points.rotation.y = -elapsed * 0.03 + pointerSmooth.x * 0.15;
    points.rotation.x = pointerSmooth.y * 0.1;

    blobUniforms.uTime.value = elapsed;
    blobUniforms.uAmp.value = state.amp;
    blobUniforms.uFreq.value = state.freq;
    blobUniforms.uMouse.value.copy(pointerSmooth).multiplyScalar(0.6);
    // On phones the shape is behind the text, so keep it softer there.
    const opacity = state.opacity * (narrow ? 0.5 : 1);
    blobUniforms.uOpacity.value = opacity;
    pointsUniforms.uTime.value = elapsed;
    pointsUniforms.uOpacity.value = opacity;

    renderer.render(scene, camera);
  }

  let running = false;
  let last = 0;
  function loop(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    apply(dt);
    requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    resize();
    if (!running) apply(0);
  });

  // Save battery when the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (opts.reducedMotion) return;
    if (document.hidden) running = false;
    else start();
  });

  return {
    state,
    start,
    renderOnce: () => {
      elapsed = 4; // a pleasing still pose
      apply(0);
    },
  };
}
