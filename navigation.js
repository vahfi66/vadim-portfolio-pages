const header = document.querySelector('.site-header');
const toggle = header.querySelector('.menu-toggle');
const nav = header.querySelector('.site-nav');
const mobile = matchMedia('(max-width: 980px)');
const coarsePointer = matchMedia('(pointer: coarse)');
let tappedControl;
let tapTimer;

function showTapFeedback(event) {
  const touchTap = event.pointerType === 'touch' || event.pointerType === 'pen'
    || (!event.pointerType && event.detail > 0 && coarsePointer.matches);
  if (!touchTap) return;
  const control = event.currentTarget;

  clearTimeout(tapTimer);
  tappedControl?.removeAttribute('data-tapped');
  tappedControl = control;
  control.setAttribute('data-tapped', '');
  tapTimer = setTimeout(() => {
    control.removeAttribute('data-tapped');
    tappedControl = undefined;
  }, 150);
}

for (const control of document.querySelectorAll('.button, .site-nav a, .wordmark, .faq-list summary')) {
  control.addEventListener('click', showTapFeedback);
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

for (const details of document.querySelectorAll('.faq-list details')) {
  const summary = details.querySelector('summary');
  const answer = details.querySelector('p');
  let animation;

  summary.addEventListener('click', (event) => {
    const open = !details.open || details.hasAttribute('data-closing');
    if (reducedMotion.matches && !animation) return;
    event.preventDefault();

    const start = details.getBoundingClientRect().height;
    animation?.cancel();

    function finish() {
      details.open = open;
      details.removeAttribute('data-closing');
      details.removeAttribute('data-resizing');
      animation = undefined;
    }

    if (reducedMotion.matches) {
      finish();
      return;
    }

    details.open = true;
    details.toggleAttribute('data-closing', !open);
    details.setAttribute('data-resizing', '');
    const expanded = details.getBoundingClientRect().height;
    const end = open ? expanded : expanded - answer.getBoundingClientRect().height;
    animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
      duration: 280,
      easing: 'cubic-bezier(.25, .7, .25, 1)',
    });
    animation.onfinish = finish;
  });
}

function setMenu(open) {
  header.dataset.menu = open ? 'open' : 'closed';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  nav.inert = mobile.matches && !open;
}

toggle.addEventListener('click', (event) => {
  const open = toggle.getAttribute('aria-expanded') === 'false';
  setMenu(open);
  if (open && event.detail === 0) {
    requestAnimationFrame(() => nav.querySelector('a').focus({ preventScroll: true }));
  }
});
nav.addEventListener('click', (event) => {
  if (mobile.matches && event.target.closest('a')) setMenu(false);
});
header.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
  setMenu(false);
  toggle.focus();
});
document.addEventListener('pointerdown', (event) => {
  if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
});
mobile.addEventListener('change', () => {
  const navFocused = nav.contains(document.activeElement);
  setMenu(false);
  if (mobile.matches && navFocused) toggle.focus();
});

setMenu(false);
