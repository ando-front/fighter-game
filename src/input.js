// ============================================================
// input.js — キーボードの おしたキーを おぼえておく係
// ============================================================
// つかいかた：
//   isDown(['KeyA'])     … いま おしっぱなし か？（走る・しゃがむ に つかう）
//   wasPressed(['KeyW']) … このコマで おしはじめた か？（ジャンプ・こうげき に つかう）
//   endFrame()           … 1コマの さいごに かならず よぶ

// いま おされている キーの 名前を 入れておく箱
const downKeys = new Set();

// 「このコマで おしはじめた」キーの 名前を 入れておく箱
const pressedKeys = new Set();

// ブラウザが かってに 画面を スクロールしないように とめる キー
const PREVENT = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
]);

// キーが おされた とき
window.addEventListener('keydown', (e) => {
  // おしっぱなしにすると keydown が なんども 来るので、さいしょの1回だけ 記録する
  if (!downKeys.has(e.code)) {
    pressedKeys.add(e.code);
  }
  downKeys.add(e.code);
  if (PREVENT.has(e.code)) e.preventDefault();
});

// キーが はなされた とき
window.addEventListener('keyup', (e) => {
  downKeys.delete(e.code);
});

// ウィンドウから 目をはなした とき（べつのアプリを見た とき）は ぜんぶ はなしたことにする
window.addEventListener('blur', () => {
  downKeys.clear();
  pressedKeys.clear();
});

// codes（キー名の リスト）の どれかが おしっぱなし なら true
export function isDown(codes) {
  return codes.some((c) => downKeys.has(c));
}

// codes の どれかを このコマで おしはじめた なら true
export function wasPressed(codes) {
  return codes.some((c) => pressedKeys.has(c));
}

// ============================================================
// マウス
// ============================================================
// マウスの ボタンは 0=左 2=右。カンバンの中の 座標に なおして おぼえる
const downMouse = new Set();
const pressedMouse = new Set();
let mouseX = 0, mouseY = 0;
let canvasEl = null;

// どの canvas の 中を 見るか 教える（main.js から よぶ）
export function attachMouse(canvas) {
  canvasEl = canvas;
  canvas.addEventListener('mousedown', (e) => {
    if (!downMouse.has(e.button)) pressedMouse.add(e.button);
    downMouse.add(e.button);
    updateMousePos(e);
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => downMouse.delete(e.button));
  canvas.addEventListener('mousemove', updateMousePos);
  // 右クリックの メニューが 出ないようにする（右クリックを 技に つかうため）
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('blur', () => { downMouse.clear(); pressedMouse.clear(); });
}

// 画面の 大きさが かわっても ずれないように、canvas の 中の 座標に なおす
function updateMousePos(e) {
  if (canvasEl === null) return;
  const r = canvasEl.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return;
  mouseX = (e.clientX - r.left) * (canvasEl.width / r.width);
  mouseY = (e.clientY - r.top) * (canvasEl.height / r.height);
}

export function isMouseDown(button) { return downMouse.has(button); }
export function wasMousePressed(button) { return pressedMouse.has(button); }
export function getMouse() { return { x: mouseX, y: mouseY }; }

// 1コマの おわりに よぶ。「おしはじめた」の 記録を からにする
export function endFrame() {
  pressedKeys.clear();
  pressedMouse.clear();
}
