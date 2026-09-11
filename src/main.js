// ============================================================
// main.js — ゲームの いりぐち。試合の ながれを まとめて うごかす
// ============================================================

import { SCREEN, FRAME_MS, KEYS, COLORS, KNOCKBACK, MATCH, CAMERA, MOVES } from './config.js';
import * as input from './input.js';
import * as effects from './effects.js';
import * as audio from './audio.js';
import { rectsOverlap, overlapCenter, isOutOfBounds } from './physics.js';
import { getPlatforms, drawBackground, drawStage } from './stage.js';
import { drawFighter, drawShadow } from './render.js';
import { drawHUD, drawAnnounce, drawResult, drawPause, drawOffscreenArrows, drawCombo } from './hud.js';
import { Fighter } from './fighter.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const platforms = getPlatforms();

let fighters = [];
let hitstop = 0;
let phase = 'intro';     // 'intro' → 'play' → 'end'
let phaseFrame = 0;
let koText = 0;
let winner = null;
let frame = 0;
let paused = false;
// カメラ（撃墜のとき ぐっと よる）
let cam = { zoom: 1, target: 1, x: SCREEN.WIDTH / 2, y: SCREEN.HEIGHT / 2, hold: 0 };
let announced = { ready: false, go: false, end: false };

function newGame() {
  fighters = [new Fighter(0, KEYS.P1, COLORS.P1), new Fighter(1, KEYS.P2, COLORS.P2)];
  hitstop = 0; phase = 'intro'; phaseFrame = 0; koText = 0; winner = null; paused = false;
  cam = { zoom: 1, target: 1, x: SCREEN.WIDTH / 2, y: SCREEN.HEIGHT / 2, hold: 0 };
  announced = { ready: false, go: false, end: false };
}

// ------------------------------------------------------------
// 1コマぶん すすめる
// ------------------------------------------------------------
function update() {
  frame++;

  // 音の 入り／切り は いつでも できる
  if (input.wasPressed(KEYS.MUTE)) audio.toggle();

  // 一時停止
  if (input.wasPressed(KEYS.PAUSE) && phase !== 'end') {
    paused = !paused; audio.pause();
  }
  if (paused) { input.endFrame(); return; }

  phaseFrame++;
  effects.update();
  updateCamera();
  if (koText > 0) koText--;

  if (phase === 'end') {
    if (!announced.end) { announced.end = true; audio.gameEnd(); }
    if (phaseFrame > MATCH.END_FRAMES && input.wasPressed(KEYS.RESTART)) newGame();
    for (const f of fighters) f.update(platforms, false);
    input.endFrame();
    return;
  }

  // ヒットストップ中は だれも うごかない（キー入力は のこす）
  if (hitstop > 0) { hitstop--; return; }

  if (phase === 'intro') {
    if (!announced.ready) { announced.ready = true; audio.ready(); }
    if (!announced.go && phaseFrame >= MATCH.GO_AT) { announced.go = true; audio.go(); }
  }

  const canAct = phase === 'play';
  for (const f of fighters) f.update(platforms, canAct);
  if (canAct) { checkHits(); checkKO(); }
  if (phase === 'intro' && phaseFrame >= MATCH.INTRO_FRAMES) { phase = 'play'; phaseFrame = 0; }
  input.endFrame();
}

// カメラを なめらかに 動かす
function updateCamera() {
  if (cam.hold > 0) { cam.hold--; }
  else cam.target = 1;
  const speed = cam.zoom < cam.target ? CAMERA.ZOOM_IN : CAMERA.ZOOM_OUT;
  cam.zoom += (cam.target - cam.zoom) * speed;
  if (Math.abs(cam.zoom - 1) < 0.004) cam.zoom = 1;
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

    hitstop = Math.min(KNOCKBACK.HITSTOP_MAX,
      Math.round(KNOCKBACK.HITSTOP_BASE + move.damage * KNOCKBACK.HITSTOP_PER_DAMAGE));
    const c = overlapCenter(hitbox, target.getHurtbox());
    effects.spawnHitSpark(c.x, c.y, speed);
    effects.spawnPopup(c.x, c.y - 18, move.damage, target.colors.light);
    effects.addShake(Math.min(KNOCKBACK.SHAKE_MAX, speed * KNOCKBACK.SHAKE_PER_KB));
    if (move === MOVES.TILT) audio.hitHeavy(); else audio.hitLight();
  }
}

// 画面の外に 出た人が いないか
function checkKO() {
  for (let i = 0; i < 2; i++) {
    const f = fighters[i];
    if (!isOutOfBounds(f.getHurtbox())) continue;

    const ex = Math.max(20, Math.min(SCREEN.WIDTH - 20, f.x + f.w / 2));
    const ey = Math.max(20, Math.min(SCREEN.HEIGHT - 20, f.y + f.h / 2));
    effects.spawnKO(ex, ey, f.colors.main);
    effects.addShake(KNOCKBACK.KO_SHAKE);
    audio.ko();
    koText = MATCH.KO_TEXT_FRAMES;
    // カメラが 撃墜の 場所に ぐっと よる
    cam.target = CAMERA.KO_ZOOM; cam.x = ex; cam.y = ey; cam.hold = CAMERA.HOLD_FRAMES;

    f.stocks--;
    if (f.stocks <= 0) {
      winner = 1 - i; phase = 'end'; phaseFrame = 0;
      f.x = -9999;
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

  ctx.save();
  // カメラの ズーム（撃墜の 場所を 中心に よる）
  if (cam.zoom !== 1) {
    ctx.translate(SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
  }
  effects.beginShake(ctx);
  drawStage(ctx);
  for (const f of fighters) if (f.x > -5000) drawShadow(ctx, f, platforms);
  for (const f of fighters) if (f.x > -5000) drawFighter(ctx, f);
  effects.draw(ctx);
  ctx.restore();    // shake
  ctx.restore();    // camera

  drawCombo(ctx, fighters);
  drawOffscreenArrows(ctx, fighters, frame);
  drawHUD(ctx, fighters, !audio.isEnabled());

  if (paused) { drawPause(ctx); return; }

  if (phase === 'intro') {
    if (phaseFrame < MATCH.GO_AT) drawAnnounce(ctx, 'READY', '', (phaseFrame / MATCH.GO_AT) * 0.8);
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
  if (accumulator > FRAME_MS * 5) accumulator = FRAME_MS * 5;
  while (accumulator >= FRAME_MS) { update(); accumulator -= FRAME_MS; }
  draw();
  requestAnimationFrame(loop);
}

newGame();
requestAnimationFrame(loop);
console.log('main.js を よみこみました。画面サイズ:', SCREEN.WIDTH, 'x', SCREEN.HEIGHT);
