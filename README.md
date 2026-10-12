# Lumio

Website for **Lumio**, a software and web studio. Dark design with a lime accent and a 3D hero (Three.js) that changes as you scroll.

Status: **step 1, Home page only.** Work, Services, About and Contact pages come next. Projects shown are placeholders marked "Sample".

## Run it
```
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run typecheck
```

## Where things are
| Path | What |
|---|---|
| `src/config/site.ts` | Name, services, sample projects, process steps (edit text here) |
| `src/pages/index.astro` | Home page sections and their styles |
| `src/scripts/main.ts` | Smooth scroll (Lenis), animations (GSAP), cursor, menu |
| `src/scripts/three/` | The 3D scene and its shaders |
| `src/styles/global.css` | Colours, fonts, spacing |

## How the 3D works
- A canvas sits behind the whole page. Each section has a `data-scene` value (position, size, how wavy, how bright), and the shape moves to it when that section scrolls into view.
- Three.js loads after the text, so the page is readable straight away.
- Phones get fewer particles, a lower-detail shape and a dimmer glow.
- With "reduce motion" switched on, there is no loader, no smooth scroll and no animation: one still frame.
- If WebGL is not available, a soft CSS glow is shown instead.

## Before launch
- Remove `<meta name="robots" content="noindex">` in `src/layouts/Base.astro` and set the real domain in `astro.config.mjs` and `src/config/site.ts`.
- Replace the sample projects with real ones (with each client's permission).
- `CONTACT_EMAIL` (see `.env.example`) is for the contact form in step 2. Never commit the real value.
