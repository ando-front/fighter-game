// ============================================================
// main.js — ゲームの いりぐち（さいしょに うごくファイル）
// いまは まだ「まっ黒な画面を出すだけ」。
// ============================================================

import { SCREEN, COLORS } from './config.js';

// HTML の <canvas id="game"> を つかまえる
const canvas = document.getElementById('game');

// 「ctx」は 絵をかくための ふで のようなもの
const ctx = canvas.getContext('2d');

// 画面ぜんたいを まっ黒に ぬりつぶす
ctx.fillStyle = COLORS.BACKGROUND;
ctx.fillRect(0, 0, SCREEN.WIDTH, SCREEN.HEIGHT);

// うまく よみこめたか かくにん するための メッセージ
console.log('main.js を よみこみました。画面サイズ:', SCREEN.WIDTH, 'x', SCREEN.HEIGHT);
