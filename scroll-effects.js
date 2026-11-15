const stages = document.querySelectorAll('.stage');

const floats = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.closest('[data-showcase]').toggleAttribute('data-floating', entry.isIntersecting);
  }
});

for (const stage of stages) floats.observe(stage);

const intro = document.querySelector('.intro-content');
const sections = [...document.querySelectorAll('.scroll-surface')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scrollFrame = 0;

function writeProgress(element, progress) {
  const fraction = Math.max(0, Math.min(1, progress));
  const eased = fraction * fraction * (3 - 2 * fraction);
  element.style.setProperty('--section-progress', eased.toFixed(4));
}

function updateSections() {
  scrollFrame = 0;
  if (reducedMotion.matches || document.documentElement.hasAttribute('data-decor-paused')) return;

  const height = window.innerHeight;
  const remaining = document.documentElement.scrollHeight - height - window.scrollY;
  const introBox = intro.getBoundingClientRect();
  const boxes = sections.map((section) => {
    const box = section.getBoundingClientRect();
    return { center: box.top + box.height / 2, naturalHeight: section.offsetHeight };
  });

  writeProgress(intro, (introBox.top + introBox.height / 2) / (height / 2));

  for (const [index, { center, naturalHeight }] of boxes.entries()) {
    const start = height + Math.min(naturalHeight / 2, height * .16);
    // The last panel must reach its full size even at the end of the page.
    const full = Math.min(start - 1, Math.max(height * .5, center - remaining));
    writeProgress(sections[index], (start - center) / (start - full));
  }
}

function scheduleSections() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateSections);
}

window.addEventListener('scroll', scheduleSections, { passive: true });
window.addEventListener('resize', scheduleSections);
reducedMotion.addEventListener('change', scheduleSections);
new MutationObserver(scheduleSections).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-decor-paused'],
});
scheduleSections();
