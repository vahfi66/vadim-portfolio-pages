const header = document.querySelector('.site-header');
const toggle = header.querySelector('.menu-toggle');
const nav = header.querySelector('.site-nav');
const mobile = matchMedia('(max-width: 980px)');

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
