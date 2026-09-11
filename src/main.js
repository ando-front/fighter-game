// ============================================================
// main.js — ゲームの いりぐち。試合の ながれを まとめて うごかす
// ============================================================

import { SCREEN, FRAME_MS, KEYS, COLORS, KNOCKBACK, MATCH } from './config.js';
import * as input from './input.js';
import * as effects from './effects.js';
import { rectsOverlap, overlapCenter, isOutOfBounds } from './physics.js';
import { getPlatforms, drawBackground, drawStage } from './stage.js';
import { drawFighter } from './render.js';
import { drawHUD, drawAnnounce, drawResult } from './hud.js';
import { Fighter } from './fighter.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const platforms = getPlatforms();

let fighters = [];
let hitstop = 0;         // ヒットストップの のこりコマ数
let phase = 'intro';     // 'intro'（READY/GO）→ 'play' → 'end'（GAME! → けっか）
let phaseFrame = 0;      // いまの phase に 入ってからの コマ数
let koText = 0;          // 「KO!」を 出す のこりコマ数
let winner = null;       // かった人の ばんごう
let frame = 0;           // ゲーム全体の コマ数（背景アニメ用）

function newGame() {
  fighters = [new Fighter(0, KEYS.P1, COLORS.P1), new Fighter(1, KEYS.P2, COLORS.P2)];
  hitstop = 0; phase = 'intro'; phaseFrame = 0; koText = 0; winner = null;
}

// ------------------------------------------------------------
// 1コマぶん すすめる
// ------------------------------------------------------------
function update() {
  frame++;
  phaseFrame++;
  effects.update();
  if (koText > 0) koText--;

  if (phase === 'end') {
    if (phaseFrame > MATCH.END_FRAMES && input.wasPressed(KEYS.RESTART)) newGame();
    for (const f of fighters) f.update(platforms, false);   // 重力だけ はたらく
    input.endFrame();
    return;
  }

  // ヒットストップ中は だれも うごかない（キー入力は のこして あとで つかう）
  if (hitstop > 0) { hitstop--; return; }

  const canAct = phase === 'play';
  for (const f of fighters) f.update(platforms, canAct);
  if (canAct) { checkHits(); checkKO(); }
  if (phase === 'intro' && phaseFrame >= MATCH.INTRO_FRAMES) { phase = 'play'; phaseFrame = 0; }
  input.endFrame();
}

// こうげきが あたったか
function checkHits() {
  for (let i = 0; i < 2; i++) {
    const attacker = fighters[i], target = fighters[1 - i];
    if (attacker.attack === null || attacker.attack.hasHit || target.invincible > 0) continue;
    const hitbox = attacker.getHitbox();
    if (hitbox === null || !rectsOverlap(hitbox, target.getHurtbox())) continue;

    const move = attacker.attack.move;
    const speed = target.takeHit(move, attacker.facing);
    attacker.attack.hasHit = true;

    // ヒットストップ・火花・画面ゆれ は 技の 強さで かわる
    hitstop = Math.min(KNOCKBACK.HITSTOP_MAX, Math.round(KNOCKBACK.HITSTOP_BASE + move.damage * KNOCKBACK.HITSTOP_PER_DAMAGE));
    const c = overlapCenter(hitbox, target.getHurtbox());
    effects.spawnHitSpark(c.x, c.y, speed);
    effects.addShake(Math.min(KNOCKBACK.SHAKE_MAX, speed * KNOCKBACK.SHAKE_PER_KB));
  }
}

// 画面の外に 出た人が いないか
function checkKO() {
  for (let i = 0; i < 2; i++) {
    const f = fighters[i];
    if (!isOutOfBounds(f.getHurtbox())) continue;
    // 画面の はしで ばくはつ
    const ex = Math.max(20, Math.min(SCREEN.WIDTH - 20, f.x + f.w / 2));
    const ey = Math.max(20, Math.min(SCREEN.HEIGHT - 20, f.y + f.h / 2));
    effects.spawnKO(ex, ey, f.colors.main);
    effects.addShake(KNOCKBACK.KO_SHAKE);
    koText = MATCH.KO_TEXT_FRAMES;

    f.stocks--;
    if (f.stocks <= 0) {
      winner = 1 - i; phase = 'end'; phaseFrame = 0;
      f.x = -9999;                      // 画面外に かたづけておく
    } else {
      f.respawn();
    }
  }
}

// ------------------------------------------------------------
// 絵を かく
// ------------------------------------------------------------
function draw() {
  drawBackground(ctx, frame);
  effects.beginShake(ctx);            // ここから 画面ゆれ
  drawStage(ctx);
  for (const f of fighters) if (f.x > -5000) drawFighter(ctx, f);
  effects.draw(ctx);
  ctx.restore();                      // 画面ゆれ おわり
  drawHUD(ctx, fighters);

  if (phase === 'intro') {
    if (phaseFrame < MATCH.GO_AT) drawAnnounce(ctx, 'READY', '', phaseFrame / MATCH.GO_AT * 0.8);
    else drawAnnounce(ctx, 'GO!', '', (phaseFrame - MATCH.GO_AT) / (MATCH.INTRO_FRAMES - MATCH.GO_AT), COLORS.DAMAGE_MID);
  } else if (koText > 0 && phase === 'play') {
    drawAnnounce(ctx, 'KO!', '', 1 - koText / MATCH.KO_TEXT_FRAMES, COLORS.DAMAGE_MAX);
  } else if (phase === 'end') {
    if (phaseFrame <= MATCH.END_FRAMES) drawAnnounce(ctx, 'GAME!', '', phaseFrame / MATCH.END_FRAMES);
    else drawResult(ctx, fighters[winner]);
  }
}

// ------------------------------------------------------------
// ゲームループ（固定タイムステップ 60fps）
// ------------------------------------------------------------
let lastTime = performance.now();
let accumulator = 0;
function loop(now) {
  accumulator += now - lastTime;
  lastTime = now;
  if (accumulator > FRAME_MS * 5) accumulator = FRAME_MS * 5;   // タブを はなれたあと 進みすぎない
  while (accumulator >= FRAME_MS) { update(); accumulator -= FRAME_MS; }
  draw();
  requestAnimationFrame(loop);
}

newGame();
requestAnimationFrame(loop);
console.log('main.js を よみこみました。画面サイズ:', SCREEN.WIDTH, 'x', SCREEN.HEIGHT);
