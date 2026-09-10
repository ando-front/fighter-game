// ============================================================
// config.js — ゲームで使う「数字」を ぜんぶ ここに集めるファイル
// 数字を直したいときは、かならず このファイルだけを直す。
// （ほかのファイルに数字を じかに書かないこと）
// ============================================================

// --- 画面のこと ---
export const SCREEN = {
  WIDTH: 960,   // よこはば
  HEIGHT: 540,  // たてはば
  FPS: 60,      // 1びょうかんに 60かい 絵をかきかえる
};

// 1コマ（1フレーム）にかかる時間。ミリびょう（1000ぶんの1びょう）で書く
export const FRAME_MS = 1000 / SCREEN.FPS;

// --- 画面の外に出たら ミス（撃墜）になる線 ---
export const BLASTZONE = {
  LEFT: -100,
  RIGHT: 1060,
  BOTTOM: 700,
};

// --- ステージ（足場）の場所 ---
// x1〜x2 が よこのはば、y が 板の高さ
export const STAGE = {
  GROUND: { x1: 180, x2: 780, y: 420 },        // じめん
  PLATFORMS: [
    { x1: 250, x2: 380, y: 300 },              // 左のうきしま
    { x1: 580, x2: 710, y: 300 },              // 右のうきしま
  ],
  THICKNESS: 8,          // 板の あつさ（見た目だけ）
};

// --- キャラクターのこと ---
export const FIGHTER = {
  WIDTH: 40,             // からだの よこはば（当たり判定は四角だけ）
  HEIGHT: 60,            // からだの たかさ
  CROUCH_HEIGHT: 30,     // しゃがんだときの たかさ

  GRAVITY: 0.8,          // 1コマごとに 下へ ひっぱられる力
  MAX_FALL_SPEED: 16,    // どんなに落ちても これより速くならない

  GROUND_SPEED: 5,       // じめんの上を 走るはやさ
  AIR_SPEED: 4,          // 空中で よこに動くはやさ

  JUMP_SPEED: -14,       // ジャンプした しゅんかんの はやさ（上むきなのでマイナス）
  MAX_JUMPS: 2,          // 地上1回 ＋ 空中1回 ＝ ぜんぶで2回とべる

  STOCKS: 3,             // もちき（のこり人数）

  DROP_THROUGH_FRAMES: 6,        // うきしまで しゃがんだとき すりぬける コマ数
  RESPAWN_INVINCIBLE_FRAMES: 90, // ふっかつ直後 むてきの コマ数（1.5びょう）

  // ふっかつ（さいしょ）の場所。y は 足のいち
  SPAWN: [
    { x: 300, y: 300, facing: 1 },    // 1P：左のうきしまの上、右むき
    { x: 620, y: 300, facing: -1 },   // 2P：右のうきしまの上、左むき
  ],
};

// --- ダメージと ふっとび ---
export const KNOCKBACK = {
  MAX_DAMAGE: 999,        // ダメージの上げんは 999%
  DAMAGE_SCALE: 0.12,     // ためたダメージ 1% ごとに ふっとびが ふえる りょう
  CONTROL_SPEED: 3,       // ふっとびの はやさが これいか に なったら また うごかせる
  HITSTOP_FRAMES: 6,      // 当たったとき 2人とも 6コマ とまる
  ANGLE_DEG: 45,          // ふっとぶ 方向（0=まよこ、90=まうえ）
  DECAY: 0.94,            // ふっとびの はやさが 1コマごとに かける数（だんだん おそくなる）
};
// ふっとびのはやさ ＝ (基礎ふっとび ＋ ためたダメージ × DAMAGE_SCALE) × 技の倍率

// --- 技（こうげき）のデータ ---
// damage    : あたえるダメージ
// baseKB    : 基礎ふっとび
// kbScale   : 技の倍率
// hitbox    : 当たり判定の四角（前がわに 出す）
// active    : 当たり判定が 出ている コマ数
// endlag    : 技のあと うごけない コマ数（後隙）
export const MOVES = {
  // 弱攻撃（よわこうげき）
  LIGHT: {
    name: '弱',
    damage: 3,
    baseKB: 2,
    kbScale: 0.8,
    hitbox: { width: 30, height: 40 },
    active: 3,
    endlag: 8,
  },
  // 横強攻撃（よこつよこうげき）
  TILT: {
    name: '横強',
    damage: 10,
    baseKB: 5,
    kbScale: 1.4,
    hitbox: { width: 50, height: 50 },
    active: 5,
    endlag: 20,
  },
};

// --- キーの わりあて ---
// event.code の名前で かく（キーボードの ばしょ で きまる名前）
// 1つの うごきに キーが 2つ以上 あってもよい（どれを おしても同じ）
export const KEYS = {
  P1: {
    LEFT:  ['KeyA'],
    RIGHT: ['KeyD'],
    JUMP:  ['KeyW'],
    CROUCH:['KeyS'],
    LIGHT: ['KeyF'],
    TILT:  ['KeyG'],
  },
  P2: {
    LEFT:  ['ArrowLeft'],
    RIGHT: ['ArrowRight'],
    JUMP:  ['ArrowUp'],
    CROUCH:['ArrowDown'],
    LIGHT: ['ShiftLeft', 'ShiftRight'],
    TILT:  ['ControlLeft', 'ControlRight'],
  },
  RESTART: ['Enter'],   // ゲームが おわったあと もういちど あそぶ
};

// --- 色（画像はつかわない。四角と色だけで あらわす）---
export const COLORS = {
  BACKGROUND: '#000000',  // はいけい：くろ
  STAGE:      '#666666',  // 足場：グレー
  P1:         '#3388ff',  // 1P：あお
  P2:         '#ff3333',  // 2P：あか
  EYE:        '#ffffff',  // 目（むいている方向が わかるように）
  HITBOX:     'rgba(255, 255, 80, 0.7)',  // こうげきの 四角：きいろ（すけている）
  TEXT:       '#ffffff',  // 文字：しろ
  TEXT_DIM:   '#888888',  // うすい文字：グレー
};

// --- 文字（HUD = 画面に出す じょうほう）---
export const HUD = {
  FONT_BIG:   'bold 28px sans-serif',
  FONT_SMALL: '14px sans-serif',
  FONT_WIN:   'bold 48px sans-serif',
  MARGIN: 20,             // 画面のはしから 文字までの すきま
  STOCK_SIZE: 14,         // のこり機数の 四角の 大きさ
};
