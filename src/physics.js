// ============================================================
// physics.js — 重力・移動・四角どうしの あたり判定の 計算をする係
// ============================================================

import { FIGHTER, BLASTZONE } from './config.js';

// 重力で 下むきの はやさを ふやす。落ちすぎないように 上げんも きめる
export function applyGravity(body) {
  body.vy += FIGHTER.GRAVITY;
  if (body.vy > FIGHTER.MAX_FALL_SPEED) {
    body.vy = FIGHTER.MAX_FALL_SPEED;
  }
}

// はやさのぶんだけ うごかして、足場に のったか しらべる
// body      : { x, y, w, h, vx, vy }  x,y は 左上のかど
// platforms : [{ x1, x2, y, isGround }] の リスト
// ignoreFloating : true なら うきしま には のらない（すりぬけ中）
// もどりち : のった足場。のっていなければ null
export function moveAndLand(body, platforms, ignoreFloating) {
  const prevBottom = body.y + body.h;   // うごく前の 足のいち

  body.x += body.vx;
  body.y += body.vy;

  // 上に とんでいる ときは 足場に のらない（下から すりぬける）
  if (body.vy < 0) return null;

  const newBottom = body.y + body.h;    // うごいた後の 足のいち

  for (const p of platforms) {
    if (ignoreFloating && !p.isGround) continue;

    // 足が 板の高さを 上から 下へ またいだ？
    const crossed = prevBottom <= p.y && newBottom >= p.y;
    // よこの いちが 板の はばの 中に ある？
    const inside = body.x + body.w > p.x1 && body.x < p.x2;

    if (crossed && inside) {
      body.y = p.y - body.h;   // 足を 板の上に ぴったり のせる
      body.vy = 0;
      return p;
    }
  }
  return null;
}

// 2つの 四角が かさなっているか？
// a, b : { x, y, w, h }
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// 四角が 画面の外（撃墜ライン）に 出てしまったか？
export function isOutOfBounds(rect) {
  return (
    rect.x + rect.w < BLASTZONE.LEFT ||
    rect.x > BLASTZONE.RIGHT ||
    rect.y > BLASTZONE.BOTTOM
  );
}
