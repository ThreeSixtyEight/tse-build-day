// Site-wide sound switch. Sound stays off until the visitor opts in.
// Anything that makes sound checks isSoundOn() and listens for the 'sound:change' event on document.
// Audio and video elements on the page are muted while sound is off; ones marked muted stay muted.
// Wires up the corner toggle ([data-sound-toggle]), which stays hidden until a choice is made, and the hero's
// "Start The Music" button ([data-sound-start]), which turns sound on and then goes away.

const STORAGE_KEY = 'sound';

let soundOn = false;
let chosen = false;

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
  // The label says what a click does.
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((button) => {
    button.querySelectorAll('.roll__label').forEach((label) => (label.textContent = soundOn ? 'Sound Off' : 'Sound On'));
    button.classList.toggle('is-shown', chosen);
    button.inert = !chosen;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-sound-start]').forEach((button) => {
    button.classList.toggle('is-gone', chosen);
    button.inert = chosen;
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
  button.addEventListener('click', () => setSound(true));
});

// Keep the choice from earlier in this tab across reloads.
const saved = savedChoice();
if (saved !== null) setSound(saved);

render();
