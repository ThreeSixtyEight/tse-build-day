// Site-wide sound switch. Sound stays off until the visitor opts in.
// Anything that makes sound checks isSoundOn() and listens for the 'sound:change' event on document.
// Audio and video elements on the page are muted while sound is off; ones marked muted stay muted.
// Wires up the hero's "Start The Music" / "Stop The Music" button ([data-sound-start]) and the corner toggle
// ([data-sound-toggle]), which stays hidden while the hero is on screen, since the hero has its own button.

const STORAGE_KEY = 'sound';

let soundOn = false;
let chosen = false;
// True while the hero (the section holding the hero's button) fills most of the screen.
let inHero = false;
const hero = document.querySelector('[data-sound-start]')?.closest('section');

export const isSoundOn = () => soundOn;

// True once the visitor has picked sound on or off themselves.
export const soundChoiceMade = () => chosen;

// The choice from earlier in this browser tab, if any, so a reload doesn't ask again.
function savedChoice(): boolean | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved === null ? null : saved === 'on';
  } catch {
    return null;
  }
}

function render() {
  // Each label says what a click does.
  const label = (button: HTMLElement, text: string) =>
    button.querySelectorAll('.roll__label').forEach((el) => (el.textContent = text));
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((button) => {
    label(button, soundOn ? 'Sound Off' : 'Sound On');
    button.classList.toggle('is-shown', !inHero);
    button.inert = inHero;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-sound-start]').forEach((button) => {
    label(button, soundOn ? 'Stop The Music' : 'Start The Music');
  });
  // Media marked muted in the page (like the hero's sky video) is decorative and stays silent.
  document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((media) => {
    media.muted = !soundOn || media.defaultMuted;
  });
}

export function setSound(on: boolean) {
  const changed = on !== soundOn || !chosen;
  chosen = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {}
  if (!changed) return;
  soundOn = on;
  render();
  document.dispatchEvent(new CustomEvent('sound:change', { detail: { on } }));
}

document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((button) => {
  button.addEventListener('click', () => setSound(!soundOn));
});
document.querySelectorAll<HTMLButtonElement>('[data-sound-start]').forEach((button) => {
  button.addEventListener('click', () => setSound(!soundOn));
});

// The corner toggle comes back once the hero is more than half off the screen.
function checkHero() {
  const now = !!hero && hero.getBoundingClientRect().bottom > innerHeight / 2;
  if (now === inHero) return;
  inHero = now;
  render();
}
addEventListener('scroll', checkHero, { passive: true });
addEventListener('resize', checkHero);
inHero = !!hero && hero.getBoundingClientRect().bottom > innerHeight / 2;

// Keep the choice from earlier in this tab across reloads.
const saved = savedChoice();
if (saved !== null) setSound(saved);

render();
