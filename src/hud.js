// ============================================================
// hud.js — ダメージ％・のこり機数・「READY / GO! / KO! / GAME!」の 文字を かく係
// ============================================================

import { SCREEN, HUD, COLORS } from './config.js';
import { drawMiniFighter } from './render.js';

// ダメージの 大きさで 色を かえる（スマブラ風：白 → 黄 → だいだい → 赤）
function damageColor(d) {
  if (d >= HUD.DAMAGE_MAX_AT) return COLORS.DAMAGE_MAX;
  if (d >= HUD.DAMAGE_HIGH_AT) return COLORS.DAMAGE_HIGH;
  if (d >= HUD.DAMAGE_MID_AT) return COLORS.DAMAGE_MID;
  return COLORS.DAMAGE_LOW;
}

// 画面の下に 2人ぶんの パネルを かく
export function drawHUD(ctx, fighters) {
  const m = HUD.MARGIN;
  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    const px = i === 0 ? m : SCREEN.WIDTH - m - HUD.PANEL_W;   // 1P 左、2P 右
    const py = SCREEN.HEIGHT - m - HUD.PANEL_H;

    // 半とうめいの パネル ＋ プレイヤー色の ふち
    ctx.fillStyle = COLORS.HUD_PANEL;
    ctx.fillRect(px, py, HUD.PANEL_W, HUD.PANEL_H);
    ctx.fillStyle = f.colors.main;
    ctx.fillRect(px, py, 6, HUD.PANEL_H);

    // なまえ
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = HUD.FONT_NAME;
    ctx.fillStyle = f.colors.light;
    ctx.fillText(f.colors.name, px + 18, py + 24);

    // のこり機数（ちいさな 人型アイコン）
    for (let n = 0; n < f.stocks; n++) {
      drawMiniFighter(ctx, px + 100 + n * (HUD.STOCK_ICON + 8), py + 26, HUD.STOCK_ICON, f.colors.main);
    }

    // ダメージ％（大きく。ふえた しゅんかん どんっと 大きくなる）
    const bump = f.damageBump > 0 ? 1 + 0.35 * (f.damageBump / HUD.DAMAGE_BUMP_FRAMES) : 1;
    ctx.save();
    ctx.translate(px + 18, py + HUD.PANEL_H - 14);
    ctx.scale(bump, bump);
    ctx.font = HUD.FONT_DAMAGE;
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineJoin = 'round';
    ctx.strokeText(`${f.damage}%`, 0, 0);
    ctx.fillStyle = damageColor(f.damage);
    ctx.fillText(`${f.damage}%`, 0, 0);
    ctx.restore();
  }

  // そうさの せつめい（上に 小さく）
  ctx.fillStyle = COLORS.TEXT_DIM; ctx.font = HUD.FONT_SMALL;
  ctx.textAlign = 'left';
  ctx.fillText('1P: A/D 移動  W ジャンプ  S しゃがみ  F 弱  G 横強', m, m);
  ctx.textAlign = 'right';
  ctx.fillText('2P: ←/→ 移動  ↑ ジャンプ  ↓ しゃがみ  Shift 弱  Ctrl 横強', SCREEN.WIDTH - m, m);
}

// 画面まんなかに 大きな 文字。t は 0→1（出てから きえるまでの すすみぐあい）
export function drawAnnounce(ctx, text, sub, t, color = COLORS.TEXT) {
  // 出はじめは 大きく → すぐ ふつうの大きさ、おわりは うすく きえる
  const pop = t < 0.15 ? 1.6 - (t / 0.15) * 0.6 : 1;
  const alpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 - 20);
  ctx.scale(pop, pop);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = HUD.FONT_ANNOUNCE;
  ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineJoin = 'round';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  if (sub) {
    ctx.font = HUD.FONT_ANNOUNCE_SUB;
    ctx.lineWidth = 5;
    ctx.strokeText(sub, 0, 62);
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText(sub, 0, 62);
  }
  ctx.restore();
}

// けっか画面（くらく して かった人を 出す）
export function drawResult(ctx, winnerFighter) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);
  drawAnnounce(ctx, `${winnerFighter.colors.name} WINS!`, 'Enter で もういちど', 0.5, winnerFighter.colors.main);
}
