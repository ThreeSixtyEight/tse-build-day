// One short synth phrase per instrument (trumpet, tambourine, melodica, sousaphone), shared by the /instrument page
// and End of the line. Tone.js loads on first use. Nothing plays unless the site's sound switch is on.
import type * as ToneNS from 'tone';
import { isSoundOn } from './sound';

type Players = Record<string, (t: number) => void>;
let players: Promise<{ Tone: typeof ToneNS; play: Players }> | undefined;

export const loadInstrumentSounds = () =>
  (players ??= import('tone').then((Tone) => {
    const out = new Tone.Volume(-8).toDestination();
    const room = new Tone.Reverb({ decay: 2, wet: 0.2 }).connect(out);
    const trumpet = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', Q: 2 },
      filterEnvelope: { attack: 0.03, decay: 0.2, sustain: 0.6, baseFrequency: 600, octaves: 2.5 },
      envelope: { attack: 0.03, decay: 0.1, sustain: 0.7, release: 0.2 },
      volume: -6,
    }).connect(room);
    const jingle = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.18, release: 0.05 }, harmonicity: 8, resonance: 5000, volume: -22 }).connect(room);
    const skin = new Tone.MembraneSynth({ pitchDecay: 0.02, octaves: 2, volume: -10 }).connect(room);
    const melodica = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.04, decay: 0.2, sustain: 0.6, release: 0.3 },
      volume: -20,
    }).connect(new Tone.Filter(1800, 'lowpass').connect(room));
    const tuba = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { type: 'lowpass', Q: 1 },
      filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.4, baseFrequency: 110, octaves: 2.2 },
      envelope: { attack: 0.03, decay: 0.2, sustain: 0.6, release: 0.3 },
    }).connect(room);

    const play: Players = {
      trumpet: (t) => ['G4', 'C5', 'E5', 'G5'].forEach((n, i) => trumpet.triggerAttackRelease(n, i === 3 ? '8n' : '16n', t + i * 0.12)),
      tambourine: (t) => {
        skin.triggerAttackRelease('A2', '16n', t);
        [0, 0.1, 0.2, 0.35].forEach((d) => jingle.triggerAttackRelease('C6', '32n', t + d));
      },
      melodica: (t) => melodica.triggerAttackRelease(['C4', 'E4', 'G4', 'B4'], '4n', t),
      sousaphone: (t) => {
        tuba.triggerAttackRelease('F1', '8n', t);
        tuba.triggerAttackRelease('A1', '8n', t + 0.22);
        tuba.triggerAttackRelease('C2', '4n', t + 0.44);
      },
    };
    return { Tone, play };
  }));

// Play one instrument's phrase, if sound is on.
export async function playInstrument(id: string) {
  if (!isSoundOn()) return;
  const { Tone, play } = await loadInstrumentSounds();
  Tone.start();
  play[id]?.(Tone.now() + 0.02);
}
