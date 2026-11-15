import { showcases } from './projects.mjs';

const narrow = matchMedia('(max-width: 767px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const easing = 'cubic-bezier(0.24, 0.7, 0.22, 1)';

function frameAt(position, drag = 0) {
  return {
    transform: `translate(-50%, -50%) translateX(calc(var(--step) * ${position} + ${drag}px)) scale(${position === 0 ? 1 : 'var(--side-scale)'})`,
    opacity: Math.abs(position) < 2 ? 1 : 0,
  };
}

function connectShowcase(section) {
  const { projects } = showcases[section.dataset.showcase];
  const stage = section.querySelector('.stage');
  const controls = section.querySelector('.showcase-controls');
  const status = section.querySelector('[data-status]');
  const slides = projects.map((_, index) => section.querySelector(`[data-slide="${index}"]`));
  const captions = [...section.querySelectorAll('[data-project]')];
  const pending = [];
  let active = 0;
  let running = false;
  let animations = [];
  let dragReturn = [];

  function updateFocusableSlides() {
    const focused = document.activeElement;
    if (narrow.matches && slides.includes(focused) && focused !== slides[active]) {
      slides[active].inert = false;
      slides[active].focus({ preventScroll: true });
    }
    slides.forEach((slide, index) => { slide.inert = narrow.matches && index !== active; });
  }

  async function move(direction, duration, drag) {
    const previous = slides.map((slide) => Number(slide.dataset.position));
    const wrapped = previous.indexOf(-direction);
    const wrappedLink = slides[wrapped];
    const focusedWrappedLink = document.activeElement === wrappedLink;
    const previousCaption = captions[active];
    const focusedCaption = previousCaption.contains(document.activeElement);
    let departing;

    if (duration) {
      // Keep the outgoing edge visible while its real link enters from the opposite side.
      departing = wrappedLink.cloneNode(true);
      departing.style.translate = getComputedStyle(wrappedLink).translate;
      departing.removeAttribute('data-slide');
      departing.removeAttribute('href');
      departing.setAttribute('aria-hidden', 'true');
      departing.inert = true;
      stage.append(departing);
    }

    active = (active + direction + projects.length) % projects.length;
    slides[active].querySelector('img').loading = 'eager';
    captions[active].inert = false;
    captions[active].setAttribute('data-current', '');
    if (focusedCaption) captions[active].querySelector('a').focus({ preventScroll: true });
    captions.forEach((caption, index) => {
      if (index !== active) {
        caption.inert = true;
        caption.removeAttribute('data-current');
      }
    });

    slides.forEach((slide, index) => {
      slide.dataset.position = index === wrapped ? direction : previous[index] - direction;
    });
    if (direction === 1) stage.append(wrappedLink);
    else stage.prepend(wrappedLink);
    if (focusedWrappedLink) wrappedLink.focus({ preventScroll: true });
    updateFocusableSlides();
    status.textContent = `${projects[active].name}, ${active + 1} из ${projects.length}`;

    if (!departing) return;
    const timing = { duration, easing };
    animations = slides.map((slide, index) => slide.animate([
      frameAt(index === wrapped ? 2 * direction : previous[index], drag),
      frameAt(Number(slide.dataset.position)),
    ], timing));
    animations.push(departing.animate([frameAt(-direction, drag), frameAt(-2 * direction)], {
      ...timing,
      fill: 'forwards',
    }));
    if (!focusedCaption) {
      animations.push(previousCaption.animate([
        { visibility: 'visible', opacity: 1 }, { visibility: 'visible', opacity: 0 },
      ], { duration: duration * .23, easing: 'ease-out' }));
      animations.push(captions[active].animate([
        { opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' },
      ], { delay: duration * .19, duration: duration * .69, easing, fill: 'backwards' }));
    }
    await Promise.allSettled(animations.map((animation) => animation.finished));
    departing.remove();
    animations = [];
  }

  async function step(direction, drag = 0) {
    pending.push({ direction, drag });
    if (running) return;
    dragReturn.forEach((animation) => animation.cancel());
    dragReturn = [];
    running = true;
    section.setAttribute('data-stepping', '');
    while (pending.length) {
      const next = pending.shift();
      const duration = reducedMotion.matches ? 0 : 510 - Math.min(pending.length, 3) * 55;
      await move(next.direction, duration, next.drag);
    }
    running = false;
    section.removeAttribute('data-stepping');
  }

  section.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  });
  controls.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => step(Number(button.dataset.step)));
  });
  narrow.addEventListener('change', updateFocusableSlides);
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    [...animations, ...dragReturn].forEach((animation) => animation.finish());
    stage.style.removeProperty('--drag');
  });

  let touch;
  let swipedAt = -Infinity;
  function releaseDrag() {
    stage.style.removeProperty('--drag');
    if (!touch.offset || running || reducedMotion.matches) return;
    dragReturn = slides.map((slide) => {
      const position = Number(slide.dataset.position);
      return slide.animate([frameAt(position, touch.offset), frameAt(position)], { duration: 310, easing });
    });
  }

  stage.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return;
    swipedAt = -Infinity;
    touch = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, horizontal: false };
  });
  stage.addEventListener('pointermove', (event) => {
    if (event.pointerId !== touch?.id || running || reducedMotion.matches) return;
    const x = event.clientX - touch.x;
    const y = event.clientY - touch.y;
    if (!touch.horizontal) {
      if (Math.abs(x) < 12 || Math.abs(x) < Math.abs(y) * 1.35) return;
      touch.horizontal = true;
      section.setAttribute('data-dragging', '');
      dragReturn.forEach((animation) => animation.cancel());
      dragReturn = [];
    }
    touch.offset = x * .8 / (1 + Math.abs(x) / stage.clientWidth);
    stage.style.setProperty('--drag', `${touch.offset}px`);
  });
  stage.addEventListener('pointercancel', (event) => {
    if (event.pointerId !== touch?.id) return;
    releaseDrag();
    section.removeAttribute('data-dragging');
    touch = undefined;
  });
  stage.addEventListener('pointerup', (event) => {
    if (event.pointerId !== touch?.id) return;
    const x = event.clientX - touch.x;
    const y = event.clientY - touch.y;
    section.removeAttribute('data-dragging');
    if (Math.abs(x) >= 38 && (touch.horizontal || Math.abs(x) >= Math.abs(y) * 1.35)) {
      swipedAt = performance.now();
      stage.style.removeProperty('--drag');
      step(x < 0 ? 1 : -1, touch.offset);
    } else {
      if (touch.horizontal) swipedAt = performance.now();
      releaseDrag();
    }
    touch = undefined;
  });
  stage.addEventListener('click', (event) => {
    if (event.detail && performance.now() - swipedAt < 450) {
      event.preventDefault();
    }
  }, { capture: true });

  updateFocusableSlides();
  section.setAttribute('data-enhanced', '');
  section.setAttribute('aria-roledescription', 'карусель');
  controls.hidden = false;
}

document.querySelectorAll('[data-showcase]').forEach(connectShowcase);
