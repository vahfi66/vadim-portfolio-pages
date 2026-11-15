const stages = document.querySelectorAll('.stage');

const floats = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.closest('[data-showcase]').toggleAttribute('data-floating', entry.isIntersecting);
  }
});

for (const stage of stages) floats.observe(stage);

const introParts = [...document.querySelectorAll('[data-scroll-exit]')];
const revealParts = [...document.querySelectorAll('[data-scroll-reveal], .service-list > li')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = 0;

function writeProgress(element, progress) {
  const fraction = Math.max(0, Math.min(1, progress));
  const eased = fraction * fraction * (3 - 2 * fraction);
  element.style.setProperty('--scroll-progress', eased.toFixed(4));
}

function updateScrollMotion() {
  scrollFrame = 0;
  if (reducedMotion.matches || document.documentElement.hasAttribute('data-decor-paused')) return;

  const height = window.innerHeight;
  const remaining = document.documentElement.scrollHeight - height - window.scrollY;
  const introProgress = introParts.map((part) => {
    const box = part.getBoundingClientRect();
    return (box.top + box.height / 2) / (height * .28);
  });
  const revealProgress = revealParts.map((part) => {
    const box = part.getBoundingClientRect();
    const halfHeight = part.offsetHeight / 2;
    // Scaling around the center leaves the original layout position recoverable.
    const top = box.top + box.height / 2 - halfHeight;
    const target = height * .67 - Math.min(halfHeight, height * .16);
    // Finish elements near the footer at the last reachable scroll position.
    const full = Math.min(height - 1, Math.max(target, top - remaining));
    return (height - top) / (height - full);
  });

  for (const [index, part] of introParts.entries()) {
    writeProgress(part, introProgress[index]);
  }
  for (const [index, part] of revealParts.entries()) {
    writeProgress(part, revealProgress[index]);
  }
}

function scheduleScrollMotion() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
}

window.addEventListener('scroll', scheduleScrollMotion, { passive: true });
window.addEventListener('resize', scheduleScrollMotion);
reducedMotion.addEventListener('change', scheduleScrollMotion);
new MutationObserver(scheduleScrollMotion).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-decor-paused'],
});
scheduleScrollMotion();
