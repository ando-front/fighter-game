// ============================================================
// hud.js — ダメージ％・のこり機数・やじるし・コンボ・演出テキストの係
// ============================================================

import { SCREEN, HUD, COLORS, ARROW, COMBO } from './config.js';
import { drawMiniFighter } from './render.js';

// ダメージの 大きさで 色を かえる（白 → 黄 → だいだい → 赤）
function damageColor(d) {
  if (d >= HUD.DAMAGE_MAX_AT) return COLORS.DAMAGE_MAX;
  if (d >= HUD.DAMAGE_HIGH_AT) return COLORS.DAMAGE_HIGH;
  if (d >= HUD.DAMAGE_MID_AT) return COLORS.DAMAGE_MID;
  return COLORS.DAMAGE_LOW;
}

// ふちどりつきの 文字
function outlined(ctx, text, x, y, font, fill, lw = 6) {
  ctx.font = font; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

// 画面の下に 2人ぶんの パネル
export function drawHUD(ctx, fighters, muted) {
  const m = HUD.MARGIN;
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    const px = i === 0 ? m : SCREEN.WIDTH - m - HUD.PANEL_W;
    const py = SCREEN.HEIGHT - m - HUD.PANEL_H;

    ctx.fillStyle = COLORS.HUD_PANEL; ctx.fillRect(px, py, HUD.PANEL_W, HUD.PANEL_H);
    ctx.fillStyle = f.colors.main; ctx.fillRect(px, py, 6, HUD.PANEL_H);

    ctx.textAlign = 'left';
    ctx.font = HUD.FONT_NAME; ctx.fillStyle = f.colors.light;
    ctx.fillText(f.colors.name, px + 18, py + 26);

    for (let n = 0; n < f.stocks; n++) {
      drawMiniFighter(ctx, px + 102 + n * (HUD.STOCK_ICON + 10), py + 22, HUD.STOCK_ICON, f.colors.main, f.colors.line);
    }

    // ダメージ％（ふえた しゅんかん どんっと 大きくなる）
    const bump = f.damageBump > 0 ? 1 + 0.35 * (f.damageBump / HUD.DAMAGE_BUMP_FRAMES) : 1;
    ctx.save();
    ctx.translate(px + 18, py + HUD.PANEL_H - 14);
    ctx.scale(bump, bump);
    outlined(ctx, `${f.damage}%`, 0, 0, HUD.FONT_DAMAGE, damageColor(f.damage), 6);
    ctx.restore();
  }

  ctx.fillStyle = COLORS.TEXT_DIM; ctx.font = HUD.FONT_SMALL;
  ctx.textAlign = 'left';
  ctx.fillText('1P: A/D 移動  W ジャンプ  S しゃがみ  F 弱  G 横強', m, m);
  ctx.textAlign = 'right';
  ctx.fillText('2P: ←/→ 移動  ↑ ジャンプ  ↓ しゃがみ  Shift 弱  Ctrl 横強', SCREEN.WIDTH - m, m);
  ctx.textAlign = 'center';
  ctx.fillText(`P 一時停止   M 音 ${muted ? 'OFF' : 'ON'}`, SCREEN.WIDTH / 2, m);
}

// 画面の外に 出た人を しめす やじるし（どこに とんだか わかるように）
export function drawOffscreenArrows(ctx, fighters, frame) {
  for (const f of fighters) {
    if (f.stocks <= 0) continue;
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    if (cx > 0 && cx < SCREEN.WIDTH && cy > 0 && cy < SCREEN.HEIGHT) continue;

    const M = ARROW.MARGIN;
    const ax = Math.max(M, Math.min(SCREEN.WIDTH - M, cx));
    const ay = Math.max(M, Math.min(SCREEN.HEIGHT - M, cy));
    const angle = Math.atan2(cy - ay, cx - ax);
    const pulse = 1 + Math.sin(frame * ARROW.PULSE) * 0.15;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.scale(pulse, pulse);
    const s = ARROW.SIZE;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s * 0.7); ctx.lineTo(-s * 0.6, s * 0.7); ctx.closePath();
    ctx.fillStyle = f.colors.main;
    ctx.strokeStyle = f.colors.line; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // やじるしの そばに なまえと ダメージ
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlined(ctx, `${f.colors.name} ${f.damage}%`, ax, ay + (cy < 0 ? 30 : -30), 'bold 15px sans-serif', f.colors.light, 4);
    ctx.textBaseline = 'alphabetic';
  }
}

// れんぞくヒット（2かい 以上 つづいたら 出す）
export function drawCombo(ctx, fighters) {
  for (const f of fighters) {
    if (f.combo < COMBO.MIN_SHOW || f.comboTimer <= 0) continue;
    const t = f.comboTimer / COMBO.SHOW_FRAMES;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t * 3);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const pop = t > 0.9 ? 1 + (t - 0.9) * 4 : 1;
    ctx.translate(f.x + f.w / 2, f.y - 26);
    ctx.scale(pop, pop);
    outlined(ctx, `${f.combo} HIT`, 0, 0, 'bold 22px "Arial Black", Impact, sans-serif', COLORS.COMBO, 5);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}

// 画面まんなかの 大きな 文字。t は 0→1（出てから きえるまで）
export function drawAnnounce(ctx, text, sub, t, color = COLORS.TEXT) {
  const pop = t < 0.15 ? 1.6 - (t / 0.15) * 0.6 : 1;
  const alpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.translate(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 - 20);
  ctx.scale(pop, pop);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  outlined(ctx, text, 0, 0, HUD.FONT_ANNOUNCE, color, 10);
  if (sub) outlined(ctx, sub, 0, 62, HUD.FONT_ANNOUNCE_SUB, COLORS.TEXT, 5);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

// けっか画面
export function drawResult(ctx, winnerFighter) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);
  drawAnnounce(ctx, `${winnerFighter.colors.name} WINS!`, 'Enter で もういちど', 0.5, winnerFighter.colors.main);
}

// 一時停止の 画面
export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);
  drawAnnounce(ctx, 'PAUSE', 'P か Esc で つづける', 0.5, COLORS.TEXT);
}
