// ============================================================
// main.js — ゲームの いりぐち。試合の ながれを まとめて うごかす
// ============================================================

import { SCREEN, FRAME_MS, KEYS, COLORS, KNOCKBACK, MATCH, CAMERA, MOVES, MENU } from './config.js';
import * as input from './input.js';
import * as effects from './effects.js';
import * as audio from './audio.js';
import { rectsOverlap, overlapCenter, isOutOfBounds } from './physics.js';
import { getPlatforms, drawBackground, drawStage } from './stage.js';
import { drawFighter, drawShadow } from './render.js';
import { drawHUD, drawAnnounce, drawResult, drawPause, drawOffscreenArrows, drawCombo, drawMenu } from './hud.js';
import { KeyboardController, MouseController } from './controller.js';
import { CpuController } from './ai.js';
import { Fighter } from './fighter.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const platforms = getPlatforms();
input.attachMouse(canvas);   // マウスを つかえるようにする

let fighters = [];
let hitstop = 0;
let phase = 'menu';      // 'menu' → 'intro' → 'play' → 'end'
let phaseFrame = 0;
let koText = 0;
let winner = null;
let frame = 0;
let paused = false;
// カメラ（撃墜のとき ぐっと よる）
let cam = { zoom: 1, target: 1, x: SCREEN.WIDTH / 2, y: SCREEN.HEIGHT / 2, hold: 0 };
let announced = { ready: false, go: false, end: false };
// さいしょの えらぶ画面の じょうたい
const sel = { row: 0, opponent: 1, scheme: 0 };   // opponent 0=2P 1〜3=CPU、scheme 0=キーボード 1=マウス

// えらんだ 内容から「うごかす人」を つくる
function makeControllers() {
  const p1 = sel.scheme === 1 ? new MouseController(KEYS.P1) : new KeyboardController(KEYS.P1);
  const levels = [null, 'EASY', 'NORMAL', 'HARD'];
  const lv = levels[sel.opponent];
  const p2 = lv === null ? new KeyboardController(KEYS.P2) : new CpuController(lv);
  return [p1, p2];
}

function newGame() {
  const [c1, c2] = makeControllers();
  fighters = [new Fighter(0, c1, COLORS.P1), new Fighter(1, c2, COLORS.P2)];
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

  // さいしょの えらぶ画面
  if (phase === 'menu') { updateMenu(); input.endFrame(); return; }

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
    if (phaseFrame > MATCH.END_FRAMES && input.wasPressed(KEYS.RESTART)) { phase = 'menu'; phaseFrame = 0; }
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
  // CPU は うごく前に 考える（人の ばあいは 何も しない）
  for (let i = 0; i < 2; i++) fighters[i].ctrl.think(fighters[i], fighters[1 - i]);
  for (const f of fighters) f.update(platforms, canAct);
  if (canAct) { checkHits(); checkKO(); }
  if (phase === 'intro' && phaseFrame >= MATCH.INTRO_FRAMES) { phase = 'play'; phaseFrame = 0; }
  input.endFrame();
}

// えらぶ画面の そうさ（↑↓で ぎょう、←→で ないよう、Enter か クリックで スタート）
function updateMenu() {
  const up = input.wasPressed(KEYS.P2.JUMP) || input.wasPressed(KEYS.P1.JUMP);
  const down = input.wasPressed(KEYS.P2.CROUCH) || input.wasPressed(KEYS.P1.CROUCH);
  const left = input.wasPressed(KEYS.P2.LEFT) || input.wasPressed(KEYS.P1.LEFT);
  const right = input.wasPressed(KEYS.P2.RIGHT) || input.wasPressed(KEYS.P1.RIGHT);

  if (up) { sel.row = (sel.row + MENU.ROWS - 1) % MENU.ROWS; audio.ready(); }
  if (down) { sel.row = (sel.row + 1) % MENU.ROWS; audio.ready(); }

  const list = sel.row === 0 ? MENU.OPPONENTS : MENU.SCHEMES;
  const key = sel.row === 0 ? 'opponent' : 'scheme';
  if (left) { sel[key] = (sel[key] + list.length - 1) % list.length; audio.pause(); }
  if (right) { sel[key] = (sel[key] + 1) % list.length; audio.pause(); }

  if (input.wasPressed(KEYS.RESTART) || input.wasMousePressed(0)) { audio.go(); newGame(); }
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
  if (phase === 'menu') { drawStage(ctx); drawMenu(ctx, sel, frame); return; }

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

// さいしょに キャラを つくっておいてから、えらぶ画面を 出す
// （newGame() は phase を 'intro' に するので、そのあと 'menu' に もどす）
newGame();
phase = 'menu';
requestAnimationFrame(loop);
console.log('main.js を よみこみました。画面サイズ:', SCREEN.WIDTH, 'x', SCREEN.HEIGHT);
