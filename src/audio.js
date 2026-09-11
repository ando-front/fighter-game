// ============================================================
// audio.js — 音を その場で つくって鳴らす係（WebAudio）
// ============================================================
// 音のファイルは いっさい つかわない。ぜんぶ サイン波・ノイズから じぶんで つくる。
// ブラウザの きまりで、はじめて キーを おすまで 音は 出せない。

import { AUDIO } from './config.js';

let ctxA = null;
let master = null;
let enabled = AUDIO.ENABLED;

// はじめて よばれたとき AudioContext を つくる
function ensure() {
  if (ctxA === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctxA = new AC();
    master = ctxA.createGain();
    master.gain.value = AUDIO.VOLUME;
    master.connect(ctxA.destination);
  }
  if (ctxA.state === 'suspended') ctxA.resume();
  return ctxA;
}

// キーを おしたら 音を つかえるようにする
window.addEventListener('keydown', ensure, { once: false });
window.addEventListener('pointerdown', ensure, { once: false });

export function isEnabled() { return enabled; }
export function toggle() {
  enabled = !enabled;
  if (master) master.gain.value = enabled ? AUDIO.VOLUME : 0;
  return enabled;
}

// サイン波などの 音を1つ 鳴らす
// type: 'sine'|'square'|'triangle'|'sawtooth'、f1→f2 に 高さが 変わる
function tone(type, f1, f2, dur, vol = 1, delay = 0) {
  const a = ensure(); if (a === null || !enabled) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator(), g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f1, t);
  if (f2 !== f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);          // すぐ 大きく
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);    // だんだん 小さく
  osc.connect(g); g.connect(master);
  osc.start(t); osc.stop(t + dur + 0.02);
}

// ザーッというノイズ（ぶつかった音・ばくはつ に つかう）
function noise(dur, vol = 1, f1 = 2400, f2 = 300, delay = 0) {
  const a = ensure(); if (a === null || !enabled) return;
  const t = a.currentTime + delay;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);  // だんだん 小さく
  const src = a.createBufferSource(); src.buffer = buf;
  const flt = a.createBiquadFilter(); flt.type = 'lowpass';
  flt.frequency.setValueAtTime(f1, t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(60, f2), t + dur);
  const g = a.createGain(); g.gain.value = vol;
  src.connect(flt); flt.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.02);
}

// --- ゲームの できごとごとの 音 ---
export function jump()      { tone('sine', 300, 700, 0.13, 0.5); }
export function airJump()   { tone('triangle', 500, 950, 0.16, 0.45); }
export function land()      { tone('sine', 150, 60, 0.1, 0.5); noise(0.07, 0.25, 800, 200); }
export function hitLight()  { noise(0.09, 0.7, 3000, 600); tone('square', 420, 260, 0.09, 0.35); }
export function hitHeavy()  { noise(0.2, 0.95, 2200, 180); tone('square', 260, 90, 0.18, 0.5); tone('sine', 130, 50, 0.24, 0.5); }
export function swing()     { noise(0.08, 0.22, 1400, 2600); }
export function ko()        { noise(0.55, 1.0, 1800, 80); tone('sawtooth', 320, 40, 0.5, 0.4); }
export function ready()     { tone('square', 520, 520, 0.12, 0.4); }
export function go()        { tone('square', 780, 780, 0.1, 0.5); tone('square', 1040, 1040, 0.22, 0.45, 0.1); }
export function gameEnd()   { [0, 0.14, 0.28].forEach((d, i) => tone('triangle', [520, 660, 880][i], [520, 660, 880][i], 0.3, 0.4, d)); }
export function pause()     { tone('square', 600, 300, 0.09, 0.35); }
