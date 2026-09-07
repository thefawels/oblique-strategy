import cards from './cards.js';

const deckElement = document.querySelector('.deck');
const button = document.querySelector('.draw-button');
const hapticSwitch = document.querySelector('.haptic-switch');
const announcement = document.querySelector('#announcement');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = document.querySelector('.card--current');
let waiting = document.querySelector('.card--waiting');
let currentLabel = document.querySelector('.button__label--current');
let waitingLabel = document.querySelector('.button__label--next');
let pile = [];
let previousText = '';
let busy = false;
let activeAnimations = [];
let resizePending = false;
const buttonLabels = [
  'получить решение', 'новая идея', 'помоги..', 'ещё одну',
  'другой взгляд', 'дай подсказку', 'что, если…', 'куда дальше?',
  'сдвинуть с места', 'нужен импульс', 'подкинь мысль', 'попробуем иначе',
  'найти зацепку', 'с чего начать?', 'разбудить идею', 'удиви меня',
  'а можно иначе?', 'найти выход'
];
let remainingLabels = buttonLabels.filter(label => label !== currentLabel.textContent);

// Safari generates its own switch haptic from a real touch. Keep the native
// appearance and route the tap through this transparent control: synthetic
// clicks on a hidden switch are unreliable on newer iOS releases.
// The real button remains the only keyboard and screen-reader action.
hapticSwitch.hidden = !('switch' in hapticSwitch && navigator.maxTouchPoints > 0);

function takeButtonLabel() {
  if (!remainingLabels.length) remainingLabels = buttonLabels.slice();
  const choices = remainingLabels.filter(label => label !== currentLabel.textContent);
  const next = choices[randomBelow(choices.length)];
  remainingLabels.splice(remainingLabels.indexOf(next), 1);
  return next;
}

function hapticClick(nativeHaptic) {
  if (!nativeHaptic && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(8); } catch { /* The action is independent of haptics. */ }
  }
}

function randomBelow(max) {
  const limit = Math.floor(4294967296 / max) * max;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}

function takeCard() {
  if (!pile.length) {
    pile = cards.map((_, index) => index);
    for (let index = pile.length - 1; index > 0; index--) {
      const other = randomBelow(index + 1);
      [pile[index], pile[other]] = [pile[other], pile[index]];
    }
  }
  // Preserve every source line, including the duplicate, while avoiding
  // identical adjacent cards whenever another card remains in this pile.
  if (cards[pile[pile.length - 1]] === previousText) {
    const other = pile.findIndex(index => cards[index] !== previousText);
    if (other !== -1) {
      [pile[other], pile[pile.length - 1]] = [pile[pile.length - 1], pile[other]];
    }
  }
  const index = pile.pop();
  previousText = cards[index];
  return { text: previousText, number: index + 1 };
}

function writeCard(element, { text, number }) {
  const paragraph = element.querySelector('.card__text');
  paragraph.textContent = text;
  paragraph.classList.toggle('card__text--long', text.length > 95);
  element.querySelector('.card__number').textContent = `#${number}`;
  element.dataset.cardNumber = String(number);
  if (element.getAttribute('aria-hidden') !== 'true') {
    element.setAttribute('aria-label', `Карточка ${number}`);
  }
}

function createDeckSizer() {
  // Overlap all source texts in one hidden grid so its height is the height
  // of the longest rendered card at this width and font size. Reserve that
  // space once, rather than resizing the deck for each random draw.
  const sizer = document.createElement('div');
  sizer.className = 'card card--sizer';
  sizer.setAttribute('aria-hidden', 'true');
  const content = document.createDocumentFragment();
  for (const text of cards) {
    const paragraph = document.createElement('p');
    paragraph.className = `card__text${text.length > 95 ? ' card__text--long' : ''}`;
    paragraph.textContent = text;
    content.append(paragraph);
  }
  const number = document.createElement('span');
  number.className = 'card__number';
  number.textContent = `#${cards.length}`;
  content.append(number);
  sizer.append(content);
  deckElement.append(sizer);
  return sizer;
}

const deckSizer = createDeckSizer();

function fitDeck() {
  if (busy) {
    resizePending = true;
    return;
  }
  resizePending = false;
  const minHeight = `${Math.ceil(deckSizer.offsetHeight)}px`;
  if (deckElement.style.minHeight !== minHeight) deckElement.style.minHeight = minHeight;
}

async function drawCard(nativeHaptic = false) {
  if (busy) return;
  busy = true;
  button.setAttribute('aria-disabled', 'true');
  hapticSwitch.disabled = true;
  hapticClick(nativeHaptic);

  const outgoing = current;
  const incoming = waiting;
  const oldLabel = currentLabel;
  const newLabel = waitingLabel;
  const nextLabelText = takeButtonLabel();
  newLabel.textContent = nextLabelText;
  // The replacement is fully formed and exactly aligned under the opaque
  // top card. None of the stack edges move or get recycled on screen.
  incoming.classList.add('card--revealed');
  const shouldAnimate = !document.hidden && !reducedMotion.matches && typeof outgoing.animate === 'function';

  try {
    if (shouldAnimate) {
      outgoing.style.willChange = 'transform';
      oldLabel.style.willChange = 'transform, opacity';
      newLabel.style.willChange = 'transform, opacity';
      activeAnimations = [
        outgoing.animate([
          { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          { transform: 'translate3d(calc(50vw + 70%), -12%, 0) rotate(12deg)' }
        ], { duration: 700, easing: 'cubic-bezier(0.32, 0.02, 0.2, 1)', fill: 'forwards' }),
        oldLabel.animate([
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          { opacity: 0, transform: 'translate3d(0, -4px, 0)' }
        ], { duration: 220, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }),
        newLabel.animate([
          { opacity: 0, transform: 'translate3d(0, 4px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], { duration: 380, delay: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' })
      ];
      await Promise.allSettled(activeAnimations.map(animation => animation.finished));
    }
  } finally {
    // Hide the departing card before cancelling its off-screen transform.
    // It stays hidden until the next tap, covered by the next opaque card.
    outgoing.className = 'card card--waiting';
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.removeAttribute('aria-label');
    incoming.className = 'card card--current';
    incoming.removeAttribute('aria-hidden');
    incoming.setAttribute('aria-label', `Карточка ${incoming.dataset.cardNumber}`);
    oldLabel.className = 'button__label button__label--next';
    newLabel.className = 'button__label button__label--current';
    button.setAttribute('aria-label', nextLabelText);
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations = [];
    outgoing.style.willChange = '';
    oldLabel.style.willChange = '';
    newLabel.style.willChange = '';
    current = incoming;
    waiting = outgoing;
    currentLabel = newLabel;
    waitingLabel = oldLabel;
    announcement.textContent = current.querySelector('.card__text').textContent;
    writeCard(waiting, takeCard());
    button.removeAttribute('aria-disabled');
    hapticSwitch.disabled = false;
    busy = false;
    if (resizePending) fitDeck();
  }
}

writeCard(current, takeCard());
writeCard(waiting, takeCard());
fitDeck();
button.addEventListener('click', () => drawCard(false));
hapticSwitch.addEventListener('change', () => drawCard(true));
window.addEventListener('resize', fitDeck, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(fitDeck).observe(deckSizer);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) activeAnimations.forEach(animation => animation.finish());
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) activeAnimations.forEach(animation => animation.finish());
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {
      // Drawing cards still works if this browser does not allow offline storage.
    });
  });
}
