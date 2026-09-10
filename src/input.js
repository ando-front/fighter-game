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

// 1コマの おわりに よぶ。「おしはじめた」の 記録を からにする
export function endFrame() {
  pressedKeys.clear();
}
