// ============================================================
// render.js — キャラクターを 人型シルエットで かく係
// ============================================================
// からだ＝頭・胴・うで2本・あし2本（もも＋すね）＋手足の丸。
// ぜんぶ ふちどり（line色）を 先に ふとく かいてから 本体を かさねる。
// 1P は 首まき、2P は とがった かみ が なびく。

import { BODY, COLORS, FIGHTER } from './config.js';

// 1本の 手足。(x,y) から angle の むきに len のばす。さきっぽの座標を かえす
function limb(ctx, x, y, angle, len) {
  const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  return [ex, ey];
}
function dot(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ポーズごとの 手足の角度（右むき基準。0=右 PI/2=下 -PI/2=上）
function pose(f) {
  const t = f.animTime;
  const P = { lean: 0, bob: 0, armF: 1.25, armB: 1.35, thighF: 1.5, shinF: 0.1, thighB: 1.6, shinB: 0.05, headTilt: 0 };
  switch (f.getPose()) {
    case 'idle': {
      P.bob = Math.sin(t * 0.08) * 1.2;
      P.armF = 1.25 + Math.sin(t * 0.08) * 0.06; P.armB = 1.35 - Math.sin(t * 0.08) * 0.06;
      P.headTilt = Math.sin(t * 0.08) * 0.03;
      break;
    }
    case 'run': {
      const s = Math.sin(t * 0.34), c = Math.cos(t * 0.34);
      P.lean = 0.2; P.bob = Math.abs(c) * 2.2;
      P.thighF = 1.5 - s * 0.85; P.shinF = 0.35 + Math.max(0, -s) * 0.95;
      P.thighB = 1.5 + s * 0.85; P.shinB = 0.35 + Math.max(0, s) * 0.95;
      P.armF = 1.2 + s * 1.0; P.armB = 1.2 - s * 1.0;
      break;
    }
    case 'jump':
      P.armF = -0.5; P.armB = 2.7; P.lean = 0.12;
      P.thighF = 0.65; P.shinF = 1.45; P.thighB = 1.35; P.shinB = 0.65;
      break;
    case 'fall':
      P.armF = 0.1; P.armB = 3.0; P.lean = -0.06;
      P.thighF = 1.15; P.shinF = 0.65; P.thighB = 1.75; P.shinB = 0.15;
      break;
    case 'crouch':
      P.armF = 1.05; P.armB = 1.35;
      P.thighF = 0.15; P.shinF = 1.65; P.thighB = 2.95; P.shinB = -1.45;
      break;
    case 'windup':
      P.lean = -0.2; P.armF = 2.4; P.armB = 0.95; P.headTilt = -0.08;
      P.thighF = 1.75; P.thighB = 1.35;
      break;
    case 'attack': {
      const big = f.attack.move.startup >= 4;
      P.lean = big ? 0.38 : 0.22; P.armF = big ? -0.08 : 0.04; P.armB = 1.7;
      P.thighF = big ? 1.05 : 1.3; P.shinF = 0.35; P.thighB = 2.05; P.shinB = 0.1;
      break;
    }
    case 'recover':
      P.lean = 0.12; P.armF = 0.7; P.armB = 1.5; P.thighF = 1.4; P.thighB = 1.8;
      break;
    case 'hit':
      P.lean = -0.7 - Math.sin(t * 0.5) * 0.3; P.headTilt = 0.45;
      P.armF = -1.0 + Math.sin(t * 0.65) * 0.6; P.armB = 3.5 + Math.cos(t * 0.65) * 0.6;
      P.thighF = 0.55; P.shinF = 1.25; P.thighB = 2.25; P.shinB = -0.85;
      break;
  }
  return P;
}

// 足もとの かげ（足場の 上に うつる）
export function drawShadow(ctx, f, platforms) {
  const cx = f.x + f.w / 2, feet = f.y + f.h;
  let best = null;
  for (const p of platforms) {
    if (cx < p.x1 || cx > p.x2 || p.y < feet - 2) continue;
    if (best === null || p.y < best.y) best = p;
  }
  if (best === null) return;
  const dist = best.y - feet;                       // 足場から どれだけ うかんでいるか
  if (dist > 220) return;
  const k = 1 - dist / 220;                         // 近いほど こく 大きく
  ctx.save();
  ctx.globalAlpha = 0.45 * k;
  ctx.fillStyle = COLORS.SHADOW;
  ctx.beginPath();
  ctx.ellipse(cx, best.y + 2, (f.w * 0.52) * (0.5 + k * 0.5), 4.5 * (0.5 + k * 0.5), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 首まき／かみ（世界の座標で もっているので そのまま かく）
function drawCloth(ctx, f) {
  const pts = f.cloth;
  if (!pts || pts.length < 2) return;
  const crest = f.colors.style === 'crest';
  ctx.strokeStyle = f.colors.line; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // ふちどり → 本体 の 2回 かく
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass === 0 ? f.colors.line : f.colors.cloth;
    for (let i = 0; i < pts.length - 1; i++) {
      const w = (crest ? 9 : 8) * (1 - i / pts.length) + 2;
      ctx.lineWidth = pass === 0 ? w + BODY.OUTLINE : w;
      ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i + 1].x, pts[i + 1].y); ctx.stroke();
    }
  }
}

// キャラクターを かく
export function drawFighter(ctx, f) {
  const P = pose(f);
  const cx = f.x + f.w / 2, feet = f.y + f.h, standing = f.h;
  const crest = f.colors.style === 'crest';

  // かみ／首まきは からだの うしろ に かく
  if (!crest) drawCloth(ctx, f);

  ctx.save();
  ctx.translate(cx, feet);

  // むきの ゆっくり はんてん（-1〜1 の あいだを なめらかに）
  const sx = f.facingVisual === undefined ? f.facing : f.facingVisual;
  ctx.scale(sx, 1);

  // 着地の ぐにゃっ ＋ たて速度での のびちぢみ
  let sqx = 1, sqy = 1;
  if (f.landTimer > 0) {
    const k = f.landTimer / FIGHTER.LAND_SQUASH_FRAMES;
    sqx += 0.2 * k; sqy -= 0.2 * k;
  } else if (!f.onGround) {
    const st = Math.max(-BODY.STRETCH_MAX, Math.min(BODY.STRETCH_MAX, -f.vy * BODY.STRETCH));
    sqy += st; sqx -= st * 0.6;
  }
  ctx.scale(sqx, sqy);
  ctx.rotate(P.lean);

  if (f.invincible > 0 && Math.floor(f.invincible / 4) % 2 === 0) ctx.globalAlpha = 0.4;
  const white = f.flashTimer > 0 && Math.floor(f.flashTimer / 2) % 2 === 0;
  const main = white ? COLORS.FLASH : f.colors.main;
  const dark = white ? COLORS.FLASH : f.colors.dark;
  const line = white ? COLORS.FLASH : f.colors.line;

  const hipY = -standing * 0.36 + P.bob;
  const shoulderY = -standing * 0.72 + P.bob;
  const headY = -standing + BODY.HEAD_R + 1 + P.bob;
  const thighLen = standing * 0.2, shinLen = standing * 0.18, armLen = standing * 0.27;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // ---- ふちどり（ぜんぶ 太い line色 で 1回 かく）----
  ctx.strokeStyle = line; ctx.fillStyle = line;
  ctx.lineWidth = BODY.LIMB_W + BODY.OUTLINE * 2;
  let [bkx, bky] = limb(ctx, -3, hipY, P.thighB, thighLen);
  limb(ctx, bkx, bky, P.thighB + P.shinB, shinLen);
  limb(ctx, -2, shoulderY + 2, P.armB, armLen);
  let [fkx, fky] = limb(ctx, 3, hipY, P.thighF, thighLen);
  limb(ctx, fkx, fky, P.thighF + P.shinF, shinLen);
  limb(ctx, 2, shoulderY, P.armF, armLen);
  roundRect(ctx, -9 - BODY.OUTLINE, shoulderY - 2 - BODY.OUTLINE,
            18 + BODY.OUTLINE * 2, hipY - shoulderY + 6 + BODY.OUTLINE * 2, 6); ctx.fill();
  ctx.save(); ctx.translate(0, headY); ctx.rotate(P.headTilt);
  dot(ctx, 0, 0, BODY.HEAD_R + BODY.OUTLINE); ctx.restore();

  // ---- うしろの うで・あし（くらい色）----
  ctx.lineWidth = BODY.LIMB_W;
  ctx.strokeStyle = dark; ctx.fillStyle = dark;
  [bkx, bky] = limb(ctx, -3, hipY, P.thighB, thighLen);
  const [bfx, bfy] = limb(ctx, bkx, bky, P.thighB + P.shinB, shinLen);
  dot(ctx, bfx, bfy, BODY.HAND_R);
  const [bhx, bhy] = limb(ctx, -2, shoulderY + 2, P.armB, armLen);
  dot(ctx, bhx, bhy, BODY.HAND_R);

  // ---- 胴（下は くらく、上は 明るく）----
  ctx.fillStyle = main;
  roundRect(ctx, -9, shoulderY - 2, 18, hipY - shoulderY + 6, 5); ctx.fill();
  ctx.fillStyle = white ? COLORS.FLASH : f.colors.light;
  roundRect(ctx, -9, shoulderY - 2, 18, (hipY - shoulderY + 6) * 0.42, 5); ctx.fill();

  // ---- 前の あし ----
  ctx.strokeStyle = main; ctx.fillStyle = main;
  [fkx, fky] = limb(ctx, 3, hipY, P.thighF, thighLen);
  const [ffx, ffy] = limb(ctx, fkx, fky, P.thighF + P.shinF, shinLen);
  dot(ctx, ffx, ffy, BODY.HAND_R);

  // ---- 頭 ----
  ctx.save(); ctx.translate(0, headY); ctx.rotate(P.headTilt);
  ctx.fillStyle = main; dot(ctx, 0, 0, BODY.HEAD_R);
  ctx.fillStyle = white ? COLORS.FLASH : f.colors.light;   // 顔の 明るい ぶぶん
  ctx.beginPath(); ctx.arc(1.5, -1.5, BODY.HEAD_R * 0.72, -1.2, 1.4); ctx.fill();
  if (f.blink > 0) {                                        // まばたき
    ctx.strokeStyle = line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(2.5, -1); ctx.lineTo(7, -1); ctx.stroke();
  } else {
    ctx.fillStyle = line; ctx.fillRect(3, -3.5, 4, 4.5);    // 目
  }
  ctx.restore();

  // ---- 前の うで（いちばん 手前）----
  ctx.strokeStyle = main; ctx.fillStyle = main;
  ctx.lineWidth = BODY.LIMB_W;
  const [fhx, fhy] = limb(ctx, 2, shoulderY, P.armF, armLen);
  dot(ctx, fhx, fhy, BODY.HAND_R + 0.4);

  ctx.restore();
  if (crest) drawCloth(ctx, f);      // とがった かみ は 手前に
}

// ざんぞう（はやく ふっとんでいるとき うしろに のこる かげ）
export function drawGhost(ctx, g) {
  ctx.save();
  ctx.globalAlpha = COLORS.GHOST * (g.life / g.max);
  ctx.fillStyle = g.color;
  ctx.translate(g.x + g.w / 2, g.y + g.h);
  roundRect(ctx, -9, -g.h * 0.74, 18, g.h * 0.42, 5); ctx.fill();
  dot(ctx, 0, -g.h + BODY.HEAD_R + 1, BODY.HEAD_R);
  ctx.restore();
}

// ストックアイコン用の ちいさな 人型（HUD）
export function drawMiniFighter(ctx, x, y, size, color, line) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const pass of [0, 1]) {
    ctx.fillStyle = pass === 0 ? line : color;
    ctx.strokeStyle = pass === 0 ? line : color;
    const grow = pass === 0 ? 1.8 : 0;
    dot(ctx, x, y - size * 0.62, size * 0.28 + grow);
    roundRect(ctx, x - size * 0.22 - grow, y - size * 0.36 - grow,
              size * 0.44 + grow * 2, size * 0.36 + grow * 2, size * 0.12); ctx.fill();
    ctx.lineWidth = size * 0.17 + grow;
    limb(ctx, x - size * 0.1, y, 1.75, size * 0.28);
    limb(ctx, x + size * 0.1, y, 1.35, size * 0.28);
  }
}
