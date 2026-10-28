// Site-wide sound switch. Sound stays off until the visitor opts in.
// Anything that makes sound checks isSoundOn() and listens for the 'sound:change' event on document.
// Audio and video elements on the page are muted while sound is off.
// Wires up the corner toggle ([data-sound-toggle]) and the entry gate buttons ([data-join]).

const STORAGE_KEY = 'sound';

let soundOn = false;
let chosen = false;

export const isSoundOn = () => soundOn;

// True once the visitor has picked sound on or off themselves.
export const soundChoiceMade = () => chosen;

// The choice from earlier in this browser tab, if any, so a reload doesn't ask again.
export function savedChoice(): boolean | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved === null ? null : saved === 'on';
  } catch {
    return null;
  }
}

function render() {
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(soundOn));
    button.title = soundOn ? 'Turn sound off' : 'Turn sound on';
  });
  document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((media) => {
    media.muted = !soundOn;
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

document.querySelectorAll<HTMLElement>('[data-join]').forEach((button) => {
  button.addEventListener('click', () => setSound(button.dataset.join === 'sound'));
});

render();
