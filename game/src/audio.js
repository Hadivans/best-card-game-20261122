// audio.js — tiny WebAudio tones only. No audio files, no network.
let ctx = null;

export function ensureAudio() {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch (e) { ctx = null; }
  return ctx;
}

export function playTone(freq, dur, type, vol, delay) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + (delay || 0);
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  } catch (e) { /* headless / no audio device: stay silent */ }
}

export const sfx = {
  click() { playTone(660, 0.07, 'triangle', 0.08); },
  play() { playTone(520, 0.1, 'triangle', 0.12); playTone(780, 0.12, 'sine', 0.1, 0.06); },
  hit() { playTone(180, 0.16, 'sawtooth', 0.12); playTone(90, 0.2, 'square', 0.08, 0.02); },
  heal() { playTone(520, 0.14, 'sine', 0.1); playTone(660, 0.16, 'sine', 0.1, 0.09); },
  shield() { playTone(340, 0.14, 'triangle', 0.1); },
  draw() { playTone(880, 0.06, 'sine', 0.07); },
  turn() { playTone(440, 0.1, 'triangle', 0.09); playTone(587, 0.12, 'triangle', 0.09, 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.22, 'triangle', 0.12, i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => playTone(f, 0.25, 'sine', 0.1, i * 0.14)); },
};
