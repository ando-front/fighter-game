// ============================================================
// cloth.js — 首まき（1P）と 逆立った かみ（2P）を なびかせる係
// ============================================================
// やりかたは「ベルレ法」：いまのいち と 1コマ前のいち の さで うごきを あらわす。
// ① いきおいで すすめる ② 重力と 風を たす ③ ふしの あいだを かならず同じ長さに そろえる

import { BODY } from './config.js';

// 首まき／かみ が くっつく 場所（首 or 頭のてっぺん）
export function clothAnchor(f) {
  const crest = f.colors.style === 'crest';
  return {
    // うしろがわに ずらす。そうしないと からだの 真うしろに たれて 見えなくなる
    x: f.x + f.w / 2 - f.facing * (crest ? 5 : 9),
    y: f.y + f.h * (crest ? 0.13 : 0.3),
  };
}

// ふしを 上から 下へ ならべる
export function initCloth(f) {
  const a = clothAnchor(f);
  const segs = f.colors.style === 'crest' ? BODY.CREST_SEGS : BODY.CLOTH_SEGS;
  f.cloth = [];
  for (let i = 1; i <= segs; i++) {
    // px, py は「1コマ前の いち」。いまと 同じにしておくと 止まった じょうたいで はじまる
    f.cloth.push({ x: a.x, y: a.y + i * BODY.CLOTH_LEN, px: a.x, py: a.y + i * BODY.CLOTH_LEN });
  }
}

// 首まき／かみ を なびかせる
// やりかたは「ベルレ法」：いまのいち と 1コマ前のいち の さで うごきを あらわす。
// ① いきおいで すすめる ② 重力と 風を たす ③ ふしの あいだを かならず同じ長さに そろえる
export function updateCloth(f) {
  const a = clothAnchor(f);
  const crest = f.colors.style === 'crest';
  // かみ は ほとんど 下に たれない（ツンと 後ろへ）、首まき は 下に たれる
  const grav = crest ? BODY.CREST_GRAVITY : BODY.CLOTH_GRAVITY;
  // つねに うしろへ ひっぱる。これが ないと からだに かさなって 見えない
  const bias = -f.facing * (crest ? BODY.CREST_BIAS : BODY.CLOTH_BIAS);
  const windX = -f.vx * BODY.CLOTH_WIND + bias;   // 走ると さらに なびく
  const windY = -f.vy * BODY.CLOTH_WIND * 0.5;
  let px = a.x, py = a.y;
  for (const c of f.cloth) {
    const nx = c.x + (c.x - c.px) * BODY.CLOTH_DAMP + windX;
    const ny = c.y + (c.y - c.py) * BODY.CLOTH_DAMP + grav + windY;
    c.px = c.x; c.py = c.y;
    c.x = nx; c.y = ny;

    // 前の ふしから かならず CLOTH_LEN だけ はなす
    let dx = c.x - px, dy = c.y - py, d = Math.hypot(dx, dy);
    if (d < 0.0001) { dx = 0; dy = 1; d = 1; }
    c.x = px + (dx / d) * BODY.CLOTH_LEN;
    c.y = py + (dy / d) * BODY.CLOTH_LEN;
    px = c.x; py = c.y;
  }
}
