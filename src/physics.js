// ============================================================
// physics.js — 重力・移動・四角どうしの あたり判定の 計算をする係
// ============================================================

import { FIGHTER, BLASTZONE } from './config.js';

// 重力で 下むきの はやさを ふやす。scale で 重力を よわめられる（ジャンプ中の ふわっと感）
export function applyGravity(body, scale = 1) {
  body.vy += FIGHTER.GRAVITY * scale;
  if (body.vy > FIGHTER.MAX_FALL_SPEED) body.vy = FIGHTER.MAX_FALL_SPEED;
}

// はやさのぶんだけ うごかして、足場に のったか しらべる
// body : { x, y, w, h, vx, vy }   platforms : [{ x1, x2, y, isGround }]
// ignoreFloating : true なら うきしまには のらない（すりぬけ中）
// もどりち : のった足場。のっていなければ null
export function moveAndLand(body, platforms, ignoreFloating) {
  const prevBottom = body.y + body.h;
  body.x += body.vx;
  body.y += body.vy;
  if (body.vy < 0) return null;                 // 上に とんでいる ときは のらない

  const newBottom = body.y + body.h;
  for (const p of platforms) {
    if (ignoreFloating && !p.isGround) continue;
    const crossed = prevBottom <= p.y && newBottom >= p.y;   // 板の高さを 上から またいだ？
    const inside = body.x + body.w > p.x1 && body.x < p.x2;  // よこが 板の はばの 中？
    if (crossed && inside) {
      body.y = p.y - body.h;
      body.vy = 0;
      return p;
    }
  }
  return null;
}

// 2つの 四角が かさなっているか？
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// 2つの 四角が かさなっている ぶぶんの まんなか（エフェクトを 出す場所）
export function overlapCenter(a, b) {
  const x1 = Math.max(a.x, b.x), x2 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.max(a.y, b.y), y2 = Math.min(a.y + a.h, b.y + b.h);
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

// 四角が 画面の外（撃墜ライン）に 出てしまったか？
export function isOutOfBounds(rect) {
  return rect.x + rect.w < BLASTZONE.LEFT || rect.x > BLASTZONE.RIGHT || rect.y > BLASTZONE.BOTTOM;
}
