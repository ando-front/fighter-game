// ============================================================
// config.js — ゲームで使う「数字」を ぜんぶ ここに集めるファイル
// 数字を直したいときは、かならず このファイルだけを直す。
// ============================================================

// --- 画面のこと ---
export const SCREEN = {
  WIDTH: 960,
  HEIGHT: 540,
  FPS: 60,            // 1びょうかんに 60かい すすめる
};
export const FRAME_MS = 1000 / SCREEN.FPS;

// --- 画面の外に出たら ミス（撃墜）になる線 ---
export const BLASTZONE = { LEFT: -100, RIGHT: 1060, BOTTOM: 700 };

// --- ステージ（足場）の場所。x1〜x2 が よこはば、y が 板の上のふち ---
export const STAGE = {
  GROUND: { x1: 180, x2: 780, y: 420 },
  PLATFORMS: [
    { x1: 250, x2: 380, y: 300 },
    { x1: 580, x2: 710, y: 300 },
  ],
  PLATFORM_THICKNESS: 10,   // うきしまの あつさ
  GROUND_THICKNESS: 16,     // じめんの あつさ
  ISLAND_DEPTH: 110,        // じめんの下に ぶらさがる 島の ふかさ
  HORIZON_Y: 380,           // 空と 地平線の さかいめ
};

// --- キャラクターのこと ---
export const FIGHTER = {
  WIDTH: 40,
  HEIGHT: 60,
  CROUCH_HEIGHT: 30,

  GRAVITY: 0.8,
  MAX_FALL_SPEED: 16,
  JUMP_HOLD_GRAVITY: 0.5,   // ジャンプキーを おしたまま 上がっている あいだの 重力の わりあい（ふわっと）
  FAST_FALL_SPEED: 13,      // 空中で ↓ を おすと この はやさで すぐ 落ちる

  GROUND_SPEED: 5,          // 走る はやさの 上げん
  GROUND_ACCEL: 0.9,        // 走りはじめの 加速（1コマごと）
  GROUND_DECEL: 1.2,        // キーを はなしたときの 減速（1コマごと）
  AIR_SPEED: 4,             // 空中の よこはやさの 上げん
  AIR_ACCEL: 0.35,          // 空中の 加速（ゆっくり）
  AIR_DRAG: 0.985,          // 空中で 何も おしていないとき 1コマごとに かける数（ほぼ すべる）

  JUMP_SPEED: -14,
  MAX_JUMPS: 2,             // 地上1回 ＋ 空中1回（復帰ジャンプ）
  REFRESH_AIR_JUMP_ON_HIT: true,  // くらったら 空中ジャンプを 1回 もどす（復帰できるように）

  STOCKS: 3,
  DROP_THROUGH_FRAMES: 6,
  RESPAWN_INVINCIBLE_FRAMES: 90,
  LAND_SQUASH_FRAMES: 6,    // 着地したとき ぐにゃっと つぶれる コマ数

  SPAWN: [
    { x: 300, y: 300, facing: 1 },
    { x: 620, y: 300, facing: -1 },
  ],
};

// --- ダメージと ふっとび（スマブラ式：ダメージが たまるほど とぶ）---
export const KNOCKBACK = {
  MAX_DAMAGE: 999,
  DAMAGE_SCALE: 0.12,       // ためたダメージ 1% ごとに ふっとびが ふえる
  CONTROL_SPEED: 3,         // ふっとびが これいか で そうさ ふっかつ
  DECAY: 0.95,              // ふっとびの はやさが 1コマごとに かける数
  HITSTUN_PER_KB: 1.5,      // ふっとびの はやさ × これ ＝ うごけない コマ数
  HITSTOP_BASE: 3,          // ヒットストップ（当たった しゅんかん とまる）の きほん コマ数
  HITSTOP_PER_DAMAGE: 0.5,  // 技のダメージ 1 ごとに ふえる コマ数
  HITSTOP_MAX: 12,
  FLASH_FRAMES: 10,         // くらったとき 白く 点めつ する コマ数
  SHAKE_PER_KB: 0.35,       // 画面ゆれの 大きさ ＝ ふっとび × これ
  SHAKE_MAX: 9,
  KO_SHAKE: 12,             // 撃墜した ときの 画面ゆれ
};
// ふっとびのはやさ ＝ (基礎ふっとび ＋ ためたダメージ × DAMAGE_SCALE) × 技の倍率

// --- 技（こうげき）のデータ ---
// startup : 出るまでの コマ数（ふりかぶり）   active : 当たり判定が ある コマ数
// endlag  : 技のあと うごけない コマ数        angle  : ふっとぶ 角度（0=まよこ 90=まうえ）
export const MOVES = {
  LIGHT: {
    name: '弱', damage: 3, baseKB: 2, kbScale: 0.8, angle: 35,
    hitbox: { width: 30, height: 40 }, startup: 2, active: 3, endlag: 8,
    slashSize: 26,
  },
  TILT: {
    name: '横強', damage: 10, baseKB: 5, kbScale: 1.4, angle: 40,
    hitbox: { width: 50, height: 50 }, startup: 5, active: 5, endlag: 20,
    slashSize: 44,
  },
};

// --- キーの わりあて（event.code の名前。1つの うごきに キーが 2つ以上 あってもよい）---
export const KEYS = {
  P1: { LEFT: ['KeyA'], RIGHT: ['KeyD'], JUMP: ['KeyW'], CROUCH: ['KeyS'], LIGHT: ['KeyF'], TILT: ['KeyG'] },
  P2: {
    LEFT: ['ArrowLeft'], RIGHT: ['ArrowRight'], JUMP: ['ArrowUp'], CROUCH: ['ArrowDown'],
    LIGHT: ['ShiftLeft', 'ShiftRight'], TILT: ['ControlLeft', 'ControlRight'],
  },
  RESTART: ['Enter'],
  PAUSE: ['Escape', 'KeyP'],
  MUTE: ['KeyM'],
};

// --- 試合の ながれ（コマ数）---
export const MATCH = {
  INTRO_FRAMES: 130,        // 「READY」→「GO!」まで
  GO_AT: 80,                // この コマで「GO!」に かわる
  KO_TEXT_FRAMES: 50,       // 撃墜したとき「KO!」を 出す 長さ
  END_FRAMES: 110,          // 「GAME!」を 出してから けっか画面まで
};

// --- 色（画像はつかわない。四角と線と色だけ）---
export const COLORS = {
  SKY_TOP: '#0a0f2e',
  SKY_MID: '#3b2a6b',
  SKY_HORIZON: '#f08a4b',
  SUN: '#ffd68a',
  STAR: 'rgba(255,255,255,0.8)',
  MOUNTAIN_FAR: '#2a1f4d',
  MOUNTAIN_NEAR: '#1a1435',
  GROUND_TOP: '#7ccf5a',    // じめんの 草
  GROUND_SIDE: '#4a7a35',
  ISLAND: '#3a2a22',        // 島の 土
  ISLAND_DARK: '#241a15',
  PLATFORM_TOP: '#9ae07a',
  PLATFORM_SIDE: '#5a8a45',

  // style … 'scarf'（首まき）か 'crest'（とがった かみ）で 見た目を 変える
  P1: { main: '#4b9bff', dark: '#1c4a9e', light: '#bcdcff', line: '#0b1c3d', cloth: '#ffd24a', name: '1P', style: 'scarf' },
  P2: { main: '#ff5757', dark: '#a31c1c', light: '#ffc2c2', line: '#3d0b0b', cloth: '#7ef0c8', name: '2P', style: 'crest' },
  EYE: '#ffffff',
  FLASH: '#ffffff',         // くらったときの 点めつ色
  SLASH: 'rgba(255,255,255,0.9)',
  SPARK: '#fff2a0',
  SPARK_HOT: '#ff8040',
  DUST: 'rgba(220,210,190,0.7)',
  SHADOW: 'rgba(0,0,0,0.35)',
  GHOST: 0.28,                 // ざんぞう（うすさ）
  COMBO: '#ffe066',

  HUD_PANEL: 'rgba(0,0,0,0.45)',
  TEXT: '#ffffff',
  TEXT_DIM: 'rgba(255,255,255,0.45)',
  DAMAGE_LOW: '#ffffff',    // ダメージ％の 色。たまるほど あかくなる
  DAMAGE_MID: '#ffe066',
  DAMAGE_HIGH: '#ff9a3c',
  DAMAGE_MAX: '#ff3c3c',
};

// --- HUD（画面に 出す じょうほう）---
export const HUD = {
  MARGIN: 24,
  PANEL_W: 230,
  PANEL_H: 96,
  FONT_DAMAGE: 'bold 52px "Arial Black", Impact, sans-serif',
  FONT_NAME: 'bold 18px sans-serif',
  FONT_SMALL: '13px sans-serif',
  FONT_ANNOUNCE: 'bold 84px "Arial Black", Impact, sans-serif',
  FONT_ANNOUNCE_SUB: 'bold 26px sans-serif',
  DAMAGE_MID_AT: 50,        // この％から 黄色
  DAMAGE_HIGH_AT: 100,      // この％から オレンジ
  DAMAGE_MAX_AT: 150,       // この％から 赤
  DAMAGE_BUMP_FRAMES: 12,   // ダメージが ふえたとき 数字が どんっと 大きくなる コマ数
  STOCK_ICON: 18,
};

// --- キャラクターの 見た目（人型シルエット）---
export const BODY = {
  LIMB_W: 8,            // 手足の ふとさ
  OUTLINE: 3,           // ふちどりの ふとさ
  HEAD_R: 9.5,          // 頭の 大きさ
  HAND_R: 3.6,          // 手と 足さきの 大きさ
  TURN_SPEED: 0.28,     // むきを かえるとき くるっと まわる はやさ（0〜1）
  BLINK_EVERY: 90,      // まばたきの あいだ（コマ）
  BLINK_LEN: 5,         // まばたきの ながさ（コマ）
  STRETCH: 0.012,       // たて速度で のびちぢみする わりあい
  STRETCH_MAX: 0.22,
  CLOTH_SEGS: 6,        // 首まき／かみ の ふしの数
  CLOTH_LEN: 8,         // ふし1つの ながさ（つねに この間かくに そろえる）
  CLOTH_GRAVITY: 0.5,
  CLOTH_FOLLOW: 0.3,
  CLOTH_DAMP: 0.84,
  CLOTH_WIND: 0.22,     // はしると なびく つよさ
  CLOTH_BIAS: 0.5,      // 首まきが いつも うしろへ ひっぱられる つよさ
  CREST_SEGS: 4,        // かみ の ふしの数（首まきより みじかい）
  CREST_GRAVITY: 0.1,   // かみ は ほとんど たれない
  CREST_BIAS: 0.75,     // かみ が うしろへ ツンと のびる つよさ
};

// --- カメラ（撃墜のとき ぐっと よる）---
export const CAMERA = {
  KO_ZOOM: 1.5,         // 撃墜した しゅんかんの 大きさ
  ZOOM_IN: 0.35,        // よる はやさ
  ZOOM_OUT: 0.06,       // もどる はやさ
  HOLD_FRAMES: 24,      // よったまま とまる コマ数
};

// --- 画面の外に いる人を しめす やじるし ---
export const ARROW = {
  MARGIN: 46,           // 画面の はしから やじるしまで
  SIZE: 20,
  PULSE: 0.12,          // ドキドキ する はやさ
};

// --- れんぞくヒット（コンボ）---
export const COMBO = {
  SHOW_FRAMES: 70,      // 「3 HIT!」を 出しておく コマ数
  MIN_SHOW: 2,          // 2かい 以上 つづいたら 出す
};

// --- ざんぞう（はやく ふっとんだとき うしろに のこる かげ）---
export const GHOST = {
  MIN_SPEED: 9,         // この はやさ より 上で のこる
  EVERY: 2,             // 何コマおきに のこすか
  LIFE: 12,
};

// --- ダメージの 数字が ぽんっと 出る ---
export const POPUP = { LIFE: 46, RISE: 0.9, FONT: 'bold 26px "Arial Black", Impact, sans-serif' };

// --- 音（WebAudio で その場で つくる。音のファイルは つかわない）---
export const AUDIO = {
  ENABLED: true,        // M キーで 切りかえられる
  VOLUME: 0.22,
};
