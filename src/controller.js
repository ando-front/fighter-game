// ============================================================
// controller.js — 「だれが うごかすか」を まとめる係
// ============================================================
// キーボードの人・マウスの人・CPU のどれでも、
// down('LEFT') / pressed('JUMP') という 同じ聞きかたで こたえられるようにする。
// こうしておくと Fighter は 相手が 人か CPU か 気にしなくてよい。

import { isDown, wasPressed, isMouseDown, wasMousePressed, getMouse } from './input.js';
import { MOUSE } from './config.js';

// --- キーボードだけで あそぶ人 ---
export class KeyboardController {
  constructor(keys) { this.keys = keys; this.kind = 'keyboard'; }
  think() {}                                   // 考えることは ない
  down(action) { return isDown(this.keys[action]); }
  pressed(action) { return wasPressed(this.keys[action]); }
  aim() { return null; }                       // むきは 移動キーに まかせる
}

// --- キーボード（移動）＋ マウス（こうげき）で あそぶ人 ---
// 左クリック＝弱、右クリック＝横強。マウスの ある ほうを むいて 出す。
export class MouseController {
  constructor(keys) { this.keys = keys; this.kind = 'mouse'; }
  think() {}
  down(action) {
    if (action === 'LIGHT') return isMouseDown(MOUSE.LIGHT_BUTTON);
    if (action === 'TILT') return isMouseDown(MOUSE.TILT_BUTTON);
    return isDown(this.keys[action]);
  }
  pressed(action) {
    if (action === 'LIGHT') return wasMousePressed(MOUSE.LIGHT_BUTTON);
    if (action === 'TILT') return wasMousePressed(MOUSE.TILT_BUTTON);
    return wasPressed(this.keys[action]);
  }
  // マウスが キャラの どちらがわに あるか（1=右 -1=左）。近すぎるときは むきを かえない
  aim(self) {
    const m = getMouse();
    const dx = m.x - (self.x + self.w / 2);
    if (Math.abs(dx) < MOUSE.DEADZONE) return null;
    return dx > 0 ? 1 : -1;
  }
}
