// ============================================================
// stage.js — ステージ（じめんと うきしま）の 係
// ============================================================

import { STAGE, COLORS } from './config.js';

// ぜんぶの足場を 1つの リストに まとめる
// isGround が true なのは じめん だけ（しゃがんでも すりぬけない）
const platforms = [
  { ...STAGE.GROUND, isGround: true },
  ...STAGE.PLATFORMS.map((p) => ({ ...p, isGround: false })),
];

// 足場の リストを わたす
export function getPlatforms() {
  return platforms;
}

// ステージを かく
export function drawStage(ctx) {
  ctx.fillStyle = COLORS.STAGE;
  for (const p of platforms) {
    // 板は 上のふちが p.y。そこから 下に THICKNESS ぶん ぬる
    ctx.fillRect(p.x1, p.y, p.x2 - p.x1, STAGE.THICKNESS);
  }
}
