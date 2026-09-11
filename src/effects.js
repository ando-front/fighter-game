// ============================================================
// effects.js — ヒットスパーク・斬撃・土けむり・画面ゆれ の係
// ============================================================
// つかいかた：spawnXxx() で エフェクトを 出す → まいコマ update() → draw(ctx)

import { COLORS } from './config.js';

const particles = [];   // いま 出ている エフェクトの リスト
let shake = 0;          // 画面ゆれの 大きさ（だんだん 小さくなる）
let shakeX = 0, shakeY = 0;

// 当たった しゅんかんの 火花。strength が 大きいほど はでに
export function spawnHitSpark(x, y, strength) {
  const n = 8 + Math.min(12, Math.floor(strength));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * (4 + strength * 0.4);
    particles.push({
      type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 14 + Math.random() * 8, max: 22, size: 2 + Math.random() * 2,
      color: Math.random() < 0.5 ? COLORS.SPARK : COLORS.SPARK_HOT,
    });
  }
  // ひろがる 輪
  particles.push({ type: 'ring', x, y, life: 12, max: 12, size: 6 + strength * 1.2 });
  // まんなかの 白い 星
  particles.push({ type: 'star', x, y, life: 6, max: 6, size: 14 + strength });
}

// 斬撃の 弧。dir は むき（1=右 -1=左）、size は 大きさ
export function spawnSlash(x, y, dir, size) {
  particles.push({ type: 'slash', x, y, dir, size, life: 7, max: 7 });
}

// 足もとの 土けむり（着地・走りだし）
export function spawnDust(x, y, dir, count = 4) {
  for (let i = 0; i < count; i++) {
    particles.push({
      type: 'dust', x: x + (Math.random() - 0.5) * 16, y,
      vx: (dir === 0 ? (Math.random() - 0.5) * 2 : -dir * (0.5 + Math.random() * 1.5)),
      vy: -(0.3 + Math.random() * 0.8),
      life: 16 + Math.random() * 8, max: 24, size: 3 + Math.random() * 3,
    });
  }
}

// 空中ジャンプの 白い 輪
export function spawnJumpPuff(x, y) {
  particles.push({ type: 'puff', x, y, life: 10, max: 10, size: 18 });
}

// 撃墜の 大きな ばくはつ
export function spawnKO(x, y, color) {
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 4 + Math.random() * 9;
    particles.push({
      type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 24 + Math.random() * 16, max: 40, size: 3 + Math.random() * 3, color,
    });
  }
  particles.push({ type: 'ring', x, y, life: 20, max: 20, size: 40 });
}

// 画面を ゆらす（大きいほうを のこす）
export function addShake(amount) {
  shake = Math.max(shake, amount);
}

// 1コマ すすめる
export function update() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life--;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    if (p.type === 'spark') { p.x += p.vx; p.y += p.vy; p.vx *= 0.9; p.vy = p.vy * 0.9 + 0.25; }
    if (p.type === 'dust') { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; }
  }
  // ゆれ：ランダムに ずらしつつ だんだん おさまる
  if (shake > 0.3) {
    shakeX = (Math.random() - 0.5) * 2 * shake;
    shakeY = (Math.random() - 0.5) * 2 * shake;
    shake *= 0.82;
  } else {
    shake = 0; shakeX = 0; shakeY = 0;
  }
}

// 画面ゆれの ぶんだけ ずらす（draw の さいしょに よぶ）。おわったら ctx.restore()
export function beginShake(ctx) {
  ctx.save();
  ctx.translate(Math.round(shakeX), Math.round(shakeY));
}

// ぜんぶの エフェクトを かく
export function draw(ctx) {
  for (const p of particles) {
    const t = p.life / p.max;          // 1 → 0 に へっていく（のこり ぐあい）
    ctx.globalAlpha = Math.min(1, t * 1.5);
    if (p.type === 'spark') {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else if (p.type === 'dust') {
      ctx.fillStyle = COLORS.DUST;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + (1 - t) * 0.6), 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'ring' || p.type === 'puff') {
      ctx.strokeStyle = COLORS.SLASH;
      ctx.lineWidth = p.type === 'ring' ? 3 : 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.2 - t), 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === 'star') {
      // 4ほうこうに のびる 白い 光
      ctx.strokeStyle = COLORS.FLASH; ctx.lineWidth = 3;
      const r = p.size * (1.3 - t);
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + Math.PI / 4;
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
      }
      ctx.stroke();
    } else if (p.type === 'slash') {
      // 前に むかって ふりぬく 弧。時間で 角度が すすむ
      ctx.strokeStyle = COLORS.SLASH; ctx.lineWidth = 4 * t + 1;
      const start = -Math.PI * 0.55 + (1 - t) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, p.dir > 0 ? start : Math.PI - start - 1.1, p.dir > 0 ? start + 1.1 : Math.PI - start, p.dir < 0);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
