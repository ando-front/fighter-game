// ============================================================
// render.js — キャラクターを 人型シルエットで かく係
// ============================================================
// からだは 頭・胴・うで2本・あし2本（ももとすね）で できている。
// ポーズ（走る・とぶ・こうげき…）ごとに 手足の角度を かえる。

import { FIGHTER, COLORS } from './config.js';

const LIMB_W = 7;          // 手足の ふとさ
const HEAD_R = 9;          // 頭の 大きさ

// 1本の 手足を かく。(x, y) から angle の むきに len だけ のばす。さきっぽの座標を かえす
function limb(ctx, x, y, angle, len) {
  const ex = x + Math.cos(angle) * len;
  const ey = y + Math.sin(angle) * len;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  return [ex, ey];
}

// ポーズごとの 手足の角度（ラジアン）。むきは 右むきで きめて、左むきは あとで はんてんする
// 角度は 0=右、PI/2=下、-PI/2=上
function pose(f) {
  const t = f.animTime;
  const P = { lean: 0, bob: 0, armF: 0.9, armB: 1.1, thighF: 1.5, shinF: 0.1, thighB: 1.6, shinB: 0.05, headTilt: 0 };
  const kind = f.getPose();
  if (kind === 'idle') {
    P.bob = Math.sin(t * 0.08) * 1.2;
    P.armF = 1.25 + Math.sin(t * 0.08) * 0.05; P.armB = 1.35;
  } else if (kind === 'run') {
    const s = Math.sin(t * 0.32), c = Math.cos(t * 0.32);
    P.lean = 0.18; P.bob = Math.abs(c) * 2;
    P.thighF = 1.5 - s * 0.8; P.shinF = 0.4 + Math.max(0, -s) * 0.9;
    P.thighB = 1.5 + s * 0.8; P.shinB = 0.4 + Math.max(0, s) * 0.9;
    P.armF = 1.2 + s * 0.9; P.armB = 1.2 - s * 0.9;
  } else if (kind === 'jump') {
    P.armF = -0.4; P.armB = 2.6;
    P.thighF = 0.7; P.shinF = 1.4; P.thighB = 1.4; P.shinB = 0.6; P.lean = 0.1;
  } else if (kind === 'fall') {
    P.armF = 0.2; P.armB = 2.9;
    P.thighF = 1.2; P.shinF = 0.6; P.thighB = 1.7; P.shinB = 0.2; P.lean = -0.05;
  } else if (kind === 'crouch') {
    P.armF = 1.1; P.armB = 1.3;
    P.thighF = 0.2; P.shinF = 1.6; P.thighB = 2.9; P.shinB = -1.4;
  } else if (kind === 'windup') {
    P.lean = -0.15; P.armF = 2.3; P.armB = 1.0;          // うでを うしろに ひく
    P.thighF = 1.7; P.thighB = 1.4;
  } else if (kind === 'attack') {
    const big = f.attack.move.startup >= 4;
    P.lean = big ? 0.35 : 0.2; P.armF = big ? -0.05 : 0.05; P.armB = 1.6;   // うでを 前に つきだす
    P.thighF = big ? 1.1 : 1.35; P.shinF = 0.3; P.thighB = 2.0; P.shinB = 0.1;
  } else if (kind === 'recover') {
    P.lean = 0.1; P.armF = 0.6; P.armB = 1.5;
  } else if (kind === 'hit') {
    // ふっとび：からだが かたむき、手足が ばたつく
    P.lean = -0.6 - Math.sin(t * 0.5) * 0.25; P.headTilt = 0.4;
    P.armF = -0.9 + Math.sin(t * 0.6) * 0.5; P.armB = 3.4 + Math.cos(t * 0.6) * 0.5;
    P.thighF = 0.6; P.shinF = 1.2; P.thighB = 2.2; P.shinB = -0.8;
  }
  return P;
}

// キャラクターを かく
export function drawFighter(ctx, f) {
  const P = pose(f);
  const cx = f.x + f.w / 2;          // からだの まんなか
  const feet = f.y + f.h;            // 足の いち
  const standing = f.h;              // いまの たかさ（しゃがみで かわる）

  ctx.save();
  ctx.translate(cx, feet);
  ctx.scale(f.facing, 1);            // 左むきなら はんてん

  // 着地の ぐにゃっ（つぶれて ひろがる）
  if (f.landTimer > 0) {
    const k = f.landTimer / FIGHTER.LAND_SQUASH_FRAMES;
    ctx.scale(1 + 0.18 * k, 1 - 0.18 * k);
  }
  ctx.rotate(P.lean);

  // むてき中は 半とうめい、くらった直後は 白く 点めつ
  if (f.invincible > 0 && Math.floor(f.invincible / 4) % 2 === 0) ctx.globalAlpha = 0.4;
  const white = f.flashTimer > 0 && Math.floor(f.flashTimer / 2) % 2 === 0;
  const main = white ? COLORS.FLASH : f.colors.main;
  const dark = white ? COLORS.FLASH : f.colors.dark;

  // からだの 各部の 位置（足もと基準、上が マイナス）
  const hipY = -standing * 0.36 + P.bob;
  const shoulderY = -standing * 0.72 + P.bob;
  const headY = -standing + HEAD_R + 1 + P.bob;
  const thighLen = standing * 0.2, shinLen = standing * 0.18, armLen = standing * 0.27;

  ctx.lineCap = 'round';
  ctx.lineWidth = LIMB_W;

  // うしろの うで・あし（少し くらい色で おくゆき）
  ctx.strokeStyle = dark;
  limb(ctx, -2, shoulderY + 2, P.armB, armLen);
  let [kx, ky] = limb(ctx, -3, hipY, P.thighB, thighLen);
  limb(ctx, kx, ky, P.thighB + P.shinB, shinLen);

  // 胴
  ctx.fillStyle = main;
  roundRect(ctx, -9, shoulderY - 2, 18, hipY - shoulderY + 6, 5);

  // 前の あし
  ctx.strokeStyle = main;
  [kx, ky] = limb(ctx, 3, hipY, P.thighF, thighLen);
  limb(ctx, kx, ky, P.thighF + P.shinF, shinLen);

  // 頭
  ctx.save();
  ctx.translate(0, headY);
  ctx.rotate(P.headTilt);
  ctx.fillStyle = main;
  ctx.beginPath(); ctx.arc(0, 0, HEAD_R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = white ? COLORS.FLASH : COLORS.EYE;      // 目（前がわ）
  ctx.fillRect(3, -3, 4, 4);
  ctx.restore();

  // 前の うで（いちばん 手前）
  ctx.strokeStyle = main;
  limb(ctx, 2, shoulderY, P.armF, armLen);

  ctx.restore();
}

// かどが まるい 四角
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// ストックアイコン用の ちいさな 人型（HUD で つかう）
export function drawMiniFighter(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - size * 0.62, size * 0.28, 0, Math.PI * 2); ctx.fill();
  roundRect(ctx, x - size * 0.22, y - size * 0.34, size * 0.44, size * 0.34, size * 0.1);
  ctx.strokeStyle = color; ctx.lineWidth = size * 0.16; ctx.lineCap = 'round';
  limb(ctx, x - size * 0.1, y - size * 0.04, 1.75, size * 0.3);
  limb(ctx, x + size * 0.1, y - size * 0.04, 1.35, size * 0.3);
}
