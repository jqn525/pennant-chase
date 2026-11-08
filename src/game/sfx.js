// ── Sound: low wooden metronome ticks, synthesized with Web Audio — no files ──
// The context is created lazily on the first user gesture (iOS requirement).
// Every effect is a soft "tock": a low sine that drops a little in pitch with
// a fast decay, plus a tiny filtered click for the wooden edge.

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
    master.gain.value = 0.12;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

// One metronome tock at `pitch` Hz, `t0` seconds from now
const tick = (t0 = 0, pitch = 380, vol = 1) => {
  const c = ensure();
  if (!c) return;
  const at = c.currentTime + t0;

  // the body: a low sine that sags ~15% as it rings out
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(pitch, at);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.85, at + 0.025);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.065);
  o.connect(g); g.connect(master);
  o.start(at);
  o.stop(at + 0.08);

  // the edge: an 8 ms band-passed click, like wood on wood
  const len = Math.max(1, Math.floor(c.sampleRate * 0.008));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1600;
  f.Q.value = 1.2;
  const ng = c.createGain();
  ng.gain.value = vol * 0.25;
  src.connect(f); f.connect(ng); ng.connect(master);
  src.start(at);
};

export const play = {
  click: () => tick(0, 520, 0.5),
  cash: () => tick(0, 380, 0.9),
  crack: () => tick(0, 420, 0.8),
  thud: () => tick(0, 300, 0.7),
  homer: () => { tick(0, 380, 0.9); tick(0.3, 380, 0.7); },
  // the Cup: a four-beat count-in, accent on one
  fanfare: () => [330, 380, 380, 380].forEach((p, i) => tick(i * 0.45, p, i === 0 ? 1 : 0.7)),
};
