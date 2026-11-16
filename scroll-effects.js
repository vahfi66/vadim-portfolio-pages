const stages = document.querySelectorAll('.stage');

const floats = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.closest('[data-showcase]').toggleAttribute('data-floating', entry.isIntersecting);
  }
});

for (const stage of stages) floats.observe(stage);
