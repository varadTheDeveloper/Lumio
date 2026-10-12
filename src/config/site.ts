// Brand and content for the site. Change text here, not in the components.

export const site = {
  name: 'Lumio',
  tagline: 'Software & web studio',
  description:
    'Lumio is a software and web studio. We design and build websites, SaaS products, cloud platforms and desktop apps.',
  // Set once the domain is bought.
  url: 'https://www.lumio.example',
  location: 'Maharashtra, India',
};

export const nav = [
  { label: 'Work', href: '/#work' },
  { label: 'Services', href: '/#services' },
  { label: 'Process', href: '/#process' },
  { label: 'About', href: '/#about' },
];

export const services = [
  { title: 'Websites', text: 'Fast, search-friendly business sites, landing pages and online stores.' },
  { title: 'Web apps & SaaS', text: 'Dashboards, portals and subscription products, from first idea to launch.' },
  { title: 'Desktop apps', text: 'Reliable Windows and Mac apps for teams that work offline or on-site.' },
  { title: 'Mobile apps', text: 'Android and iOS apps that share one codebase and one design system.' },
  { title: 'Cloud & DevOps', text: 'AWS set-up, CI/CD pipelines, monitoring and hosting that stays up.' },
  { title: '3D & interactive', text: 'WebGL scenes, product viewers and motion that make a brand memorable.' },
  { title: 'UI/UX design', text: 'Research, wireframes and polished interfaces people understand at once.' },
  { title: 'Care & support', text: 'Updates, backups, security patches and small changes every month.' },
];

// Placeholder projects. Replace with real work (with the client's permission).
export const projects = [
  { title: 'Orbit Analytics', kind: 'SaaS dashboard', year: '2026', hue: 78 },
  { title: 'Kiran Clinics', kind: 'Booking web app', year: '2026', hue: 165 },
  { title: 'Northline Logistics', kind: 'Cloud & DevOps', year: '2025', hue: 250 },
  { title: 'Atelier Mira', kind: 'E-commerce + 3D viewer', year: '2025', hue: 320 },
].map((p) => ({ ...p, sample: true }));

export const process = [
  { step: '01', title: 'Discover', text: 'We learn your goals, users and limits, and agree on scope and timeline.' },
  { step: '02', title: 'Design', text: 'Wireframes, then clickable designs you can try before any code is written.' },
  { step: '03', title: 'Build', text: 'Short cycles with a live preview link, so you see progress every week.' },
  { step: '04', title: 'Launch & care', text: 'Testing, launch, then monitoring and support so it keeps working.' },
];
