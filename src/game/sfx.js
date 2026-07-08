// ── Retro sound effects, synthesized with Web Audio — no audio files ──
// The context is created lazily on the first user gesture (iOS requirement).
// All effects are short chiptune-style blips at a modest master volume.

let ctx = null;
let master = null;

export const sfx = { enabled: true };

const ensure = () => {
  if (!sfx.enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// One oscillator note
const tone = (freq, t0, dur, type = "square", vol = 1) => {
  const c = ensure();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + dur);
  o.connect(g); g.connect(master);
  o.start(c.currentTime + t0);
  o.stop(c.currentTime + t0 + dur + 0.02);
};

// White-noise burst (bat crack, crowd)
const noise = (t0, dur, filterFreq = 2000, vol = 1) => {
  const c = ensure();
  if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(c.currentTime + t0);
};

export const play = {
  click: () => tone(880, 0, 0.03, "square", 0.5),
  crack: () => { noise(0, 0.08, 3200, 1.2); },
  homer: () => {
    noise(0, 0.08, 3200, 1.2);          // the crack
    noise(0.1, 0.9, 900, 0.5);          // crowd swell
    tone(523, 0.15, 0.12, "square", 0.7);
    tone(659, 0.28, 0.12, "square", 0.7);
    tone(784, 0.41, 0.22, "square", 0.8);
  },
  thud: () => { tone(110, 0, 0.12, "sawtooth", 0.8); noise(0, 0.06, 500, 0.6); },
  cash: () => { tone(988, 0, 0.06, "square", 0.6); tone(1319, 0.07, 0.1, "square", 0.6); },
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.18, "square", 0.8));
    tone(1047, 0.62, 0.5, "square", 0.9);
    noise(0.2, 1.2, 800, 0.4);
  },
};
