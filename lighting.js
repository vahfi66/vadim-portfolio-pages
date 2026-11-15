const hero = document.querySelector('.intro');
const scene = hero.querySelector('.intro-scene');
const spotlight = hero.querySelector('.intro-spotlight');
const toggle = hero.querySelector('.lights-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

let inView = false;
let enabled = true;
let frame = 0;
let previousTime = 0;
let current = null;
let target = null;

function stopTracking() {
  hero.removeAttribute('data-tracking');
  cancelAnimationFrame(frame);
  frame = 0;
  target = null;
  current = null;
}

function syncLighting() {
  const moving = enabled && inView && !reduced.matches && !document.hidden;
  hero.toggleAttribute('data-lighting', moving);
  toggle.hidden = reduced.matches;
  if (!moving || !finePointer.matches) stopTracking();
}

function renderSpotlight(time) {
  const weight = 1 - Math.exp(-Math.min(time - previousTime, 50) / 82);
  previousTime = time;
  current.x += (target.x - current.x) * weight;
  current.y += (target.y - current.y) * weight;
  const remaining = Math.hypot(target.x - current.x, target.y - current.y);
  if (remaining < .5) current = { ...target };
  spotlight.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
  frame = remaining >= .5 ? requestAnimationFrame(renderSpotlight) : 0;
}

hero.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || event.pointerType === 'touch' || !hero.hasAttribute('data-lighting')) return;
  const rect = scene.getBoundingClientRect();
  target = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  if (!current) current = { ...target };
  hero.setAttribute('data-tracking', '');
  if (!frame) {
    previousTime = performance.now();
    frame = requestAnimationFrame(renderSpotlight);
  }
}, { passive: true });
hero.addEventListener('pointerleave', stopTracking);

toggle.addEventListener('click', () => {
  enabled = !enabled;
  document.documentElement.toggleAttribute('data-decor-paused', !enabled);
  toggle.setAttribute('aria-pressed', String(enabled));
  syncLighting();
});

const minimumVisible = .12;
const visibility = new IntersectionObserver(([entry]) => {
  inView = entry.intersectionRatio >= minimumVisible;
  syncLighting();
}, { threshold: minimumVisible });
visibility.observe(hero);
document.addEventListener('visibilitychange', syncLighting);
reduced.addEventListener('change', syncLighting);
finePointer.addEventListener('change', syncLighting);
syncLighting();

// Magic Card's pointer-local edge highlight, on the existing preview links.
document.querySelectorAll('.stage').forEach((stage) => {
  stage.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || reduced.matches || event.pointerType === 'touch') return;
    const card = event.target.closest('.slide[data-slide]');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--glow-x', `${100 * (event.clientX - rect.left) / rect.width}%`);
    card.style.setProperty('--glow-y', `${100 * (event.clientY - rect.top) / rect.height}%`);
  }, { passive: true });
});
