// ============================================================
// stage.js — ステージ（背景・じめん・うきしま）の 係
// ============================================================

import { SCREEN, STAGE, COLORS } from './config.js';

// ぜんぶの足場を 1つの リストに。isGround が true なのは じめん だけ（すりぬけ不可）
const platforms = [
  { ...STAGE.GROUND, isGround: true },
  ...STAGE.PLATFORMS.map((p) => ({ ...p, isGround: false })),
];
export function getPlatforms() { return platforms; }

// 星の 場所は さいしょに 1回だけ きめて おぼえておく（毎コマ ランダムだと チカチカする）
const stars = [];
for (let i = 0; i < 70; i++) {
  stars.push({ x: Math.random() * SCREEN.WIDTH, y: Math.random() * STAGE.HORIZON_Y * 0.8, r: Math.random() * 1.4 + 0.4 });
}

// 遠くの 山なみ（三角を ならべる）
const farMountains = [0, 140, 300, 470, 640, 800, 930].map((x, i) => ({ x, h: 60 + (i % 3) * 30, w: 220 }));
const nearMountains = [-60, 180, 420, 700, 880].map((x, i) => ({ x, h: 40 + (i % 2) * 25, w: 300 }));

// 背景（空・太陽・星・山・地平線）
export function drawBackground(ctx, frame) {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE.HORIZON_Y);
  g.addColorStop(0, COLORS.SKY_TOP);
  g.addColorStop(0.55, COLORS.SKY_MID);
  g.addColorStop(1, COLORS.SKY_HORIZON);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN.WIDTH, STAGE.HORIZON_Y);

  // 星（ゆっくり またたく）
  ctx.fillStyle = COLORS.STAR;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const tw = 0.6 + 0.4 * Math.sin(frame * 0.03 + i);
    ctx.globalAlpha = tw;
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // 太陽（地平線に しずみかけ）
  ctx.fillStyle = COLORS.SUN;
  ctx.beginPath(); ctx.arc(720, STAGE.HORIZON_Y - 30, 38, 0, Math.PI * 2); ctx.fill();

  // 山（遠い → 近い）
  drawMountains(ctx, farMountains, COLORS.MOUNTAIN_FAR, STAGE.HORIZON_Y);
  drawMountains(ctx, nearMountains, COLORS.MOUNTAIN_NEAR, STAGE.HORIZON_Y + 10);

  // 地平線から 下は くらい 地面色
  const g2 = ctx.createLinearGradient(0, STAGE.HORIZON_Y, 0, SCREEN.HEIGHT);
  g2.addColorStop(0, COLORS.MOUNTAIN_NEAR);
  g2.addColorStop(1, COLORS.SKY_TOP);
  ctx.fillStyle = g2;
  ctx.fillRect(0, STAGE.HORIZON_Y, SCREEN.WIDTH, SCREEN.HEIGHT - STAGE.HORIZON_Y);
}

function drawMountains(ctx, list, color, baseY) {
  ctx.fillStyle = color;
  for (const m of list) {
    ctx.beginPath();
    ctx.moveTo(m.x - m.w / 2, baseY);
    ctx.lineTo(m.x, baseY - m.h);
    ctx.lineTo(m.x + m.w / 2, baseY);
    ctx.closePath();
    ctx.fill();
  }
}

// 足場（じめんは 下に 島が ぶらさがる）
export function drawStage(ctx) {
  const gnd = STAGE.GROUND;
  // 島の 土（台形）
  ctx.fillStyle = COLORS.ISLAND;
  ctx.beginPath();
  ctx.moveTo(gnd.x1, gnd.y + STAGE.GROUND_THICKNESS);
  ctx.lineTo(gnd.x2, gnd.y + STAGE.GROUND_THICKNESS);
  ctx.lineTo(gnd.x2 - 90, gnd.y + STAGE.ISLAND_DEPTH);
  ctx.lineTo(gnd.x1 + 90, gnd.y + STAGE.ISLAND_DEPTH);
  ctx.closePath();
  ctx.fill();
  // 土の かげ（右がわ）
  ctx.fillStyle = COLORS.ISLAND_DARK;
  ctx.beginPath();
  ctx.moveTo(gnd.x2, gnd.y + STAGE.GROUND_THICKNESS);
  ctx.lineTo(gnd.x2 - 90, gnd.y + STAGE.ISLAND_DEPTH);
  ctx.lineTo(gnd.x2 - 130, gnd.y + STAGE.ISLAND_DEPTH);
  ctx.lineTo(gnd.x2 - 30, gnd.y + STAGE.GROUND_THICKNESS);
  ctx.closePath();
  ctx.fill();
  // じめん：草の 上ふち ＋ 側面
  ctx.fillStyle = COLORS.GROUND_SIDE;
  ctx.fillRect(gnd.x1, gnd.y + 5, gnd.x2 - gnd.x1, STAGE.GROUND_THICKNESS - 5);
  ctx.fillStyle = COLORS.GROUND_TOP;
  ctx.fillRect(gnd.x1, gnd.y, gnd.x2 - gnd.x1, 5);

  // うきしま
  for (const p of STAGE.PLATFORMS) {
    ctx.fillStyle = COLORS.PLATFORM_SIDE;
    ctx.fillRect(p.x1, p.y + 4, p.x2 - p.x1, STAGE.PLATFORM_THICKNESS - 4);
    ctx.fillStyle = COLORS.PLATFORM_TOP;
    ctx.fillRect(p.x1, p.y, p.x2 - p.x1, 4);
  }
}
