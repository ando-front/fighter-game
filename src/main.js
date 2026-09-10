// ============================================================
// main.js — ゲームの いりぐち。ぜんぶの 係を まとめて うごかす
// ============================================================

import { SCREEN, FRAME_MS, KEYS, COLORS, KNOCKBACK, HUD } from './config.js';
import * as input from './input.js';
import { rectsOverlap, isOutOfBounds } from './physics.js';
import { getPlatforms, drawStage } from './stage.js';
import { Fighter } from './fighter.js';

// HTML の <canvas id="game"> を つかまえる。「ctx」は 絵をかく ふで
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const platforms = getPlatforms();

let fighters = [];   // [1P, 2P]
let hitstop = 0;     // ヒットストップの のこりコマ数（2人とも とまる）
let winner = null;   // かった人の ばんごう（0 か 1）。null なら まだ たたかい中

// あたらしい たたかいを はじめる
function newGame() {
  fighters = [
    new Fighter(0, KEYS.P1, COLORS.P1),
    new Fighter(1, KEYS.P2, COLORS.P2),
  ];
  hitstop = 0;
  winner = null;
}

// ------------------------------------------------------------
// 1コマぶん ゲームを すすめる
// ------------------------------------------------------------
function update() {
  // たたかいが おわっていたら Enter で もういちど
  if (winner !== null) {
    if (input.wasPressed(KEYS.RESTART)) newGame();
    input.endFrame();
    return;
  }

  // ヒットストップ中は だれも うごかない
  // （このあいだの キー入力は のこしておいて、あとで つかう）
  if (hitstop > 0) {
    hitstop--;
    return;
  }

  for (const f of fighters) f.update(platforms);
  checkHits();
  checkKO();
  input.endFrame();
}

// こうげきが あたったか しらべる
function checkHits() {
  for (let i = 0; i < 2; i++) {
    const attacker = fighters[i];
    const target = fighters[1 - i];

    if (attacker.attack === null || attacker.attack.hasHit) continue; // 1回の技で 1回だけ あたる
    if (target.invincible > 0) continue;                              // むてき中は あたらない

    const hitbox = attacker.getHitbox();
    if (rectsOverlap(hitbox, target.getHurtbox())) {
      target.takeHit(attacker.attack.move, attacker.facing);
      attacker.attack.hasHit = true;
      hitstop = KNOCKBACK.HITSTOP_FRAMES;
    }
  }
}

// 画面の外に 出た人が いないか しらべる
function checkKO() {
  for (let i = 0; i < 2; i++) {
    const f = fighters[i];
    if (!isOutOfBounds(f.getHurtbox())) continue;

    f.stocks--;
    if (f.stocks <= 0) {
      winner = 1 - i;        // あいての かち
    } else {
      f.respawn();
    }
  }
}

// ------------------------------------------------------------
// 絵を かく
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = COLORS.BACKGROUND;
  ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

  drawStage(ctx);
  for (const f of fighters) f.draw(ctx);
  drawHUD();
  if (winner !== null) drawWinner();
}

// 画面の下に ダメージ％ と のこり機数 を出す
function drawHUD() {
  const m = HUD.MARGIN;
  const bottom = SCREEN.HEIGHT - m;

  for (let i = 0; i < 2; i++) {
    const f = fighters[i];
    const right = i === 1;                       // 2P は 右よせ
    ctx.textAlign = right ? 'right' : 'left';
    const tx = right ? SCREEN.WIDTH - m : m;

    // 「1P  12%」
    ctx.fillStyle = f.color;
    ctx.font = HUD.FONT_BIG;
    ctx.fillText(`${i + 1}P  ${f.damage}%`, tx, bottom);

    // のこり機数を 小さい四角で
    const s = HUD.STOCK_SIZE;
    for (let n = 0; n < f.stocks; n++) {
      const sx = right ? SCREEN.WIDTH - m - s - n * (s + 6) : m + n * (s + 6);
      ctx.fillRect(sx, bottom - 34 - s, s, s);
    }
  }

  // そうさの せつめい（上に 小さく）
  ctx.fillStyle = COLORS.TEXT_DIM;
  ctx.font = HUD.FONT_SMALL;
  ctx.textAlign = 'left';
  ctx.fillText('1P: A/D 移動  W ジャンプ  S しゃがみ  F 弱  G 横強', m, m);
  ctx.textAlign = 'right';
  ctx.fillText('2P: ←/→ 移動  ↑ ジャンプ  ↓ しゃがみ  Shift 弱  Ctrl 横強', SCREEN.WIDTH - m, m);
}

// かった人を 大きく 出す
function drawWinner() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = fighters[winner].color;
  ctx.font = HUD.FONT_WIN;
  ctx.fillText(`${winner + 1}P の かち！`, SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2);

  ctx.fillStyle = COLORS.TEXT;
  ctx.font = HUD.FONT_BIG;
  ctx.fillText('Enter で もういちど', SCREEN.WIDTH / 2, SCREEN.HEIGHT / 2 + 50);
}

// ------------------------------------------------------------
// ゲームループ（固定タイムステップ 60fps）
// 画面の かきかえは ブラウザまかせだが、ゲームの中身は
// かならず 1/60びょう ずつ すすめる。そうすると どのパソコンでも 同じ うごきになる
// ------------------------------------------------------------
let lastTime = performance.now();
let accumulator = 0;          // まだ しょりしていない 時間の たまり

function loop(now) {
  accumulator += now - lastTime;
  lastTime = now;

  // タブを はなれて 長い時間 たったときに、いっきに 進みすぎないように 上げんを つける
  if (accumulator > FRAME_MS * 5) accumulator = FRAME_MS * 5;

  while (accumulator >= FRAME_MS) {
    update();
    accumulator -= FRAME_MS;
  }
  draw();
  requestAnimationFrame(loop);
}

newGame();
requestAnimationFrame(loop);
console.log('main.js を よみこみました。画面サイズ:', SCREEN.WIDTH, 'x', SCREEN.HEIGHT);
