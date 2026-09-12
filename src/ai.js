// ============================================================
// ai.js — CPU（コンピューターの あいて）の あたま
// ============================================================
// 人と おなじ down()/pressed() で こたえるので、Fighter からは 人と 区別がつかない。
// まいコマ ぜんぶ 考えなおすと 人間ばなれするので、think コマごとに 決めなおす。

import { CPU, STAGE, MOVES } from './config.js';

const ACTIONS = ['LEFT', 'RIGHT', 'JUMP', 'CROUCH', 'LIGHT', 'TILT'];

export class CpuController {
  constructor(levelKey) {
    this.level = CPU.LEVELS[levelKey] || CPU.LEVELS.NORMAL;
    this.kind = 'cpu';
    this.now = {};      // いま おしている ボタン
    this.prev = {};     // 1コマ前に おしていた ボタン
    this.timer = 0;     // つぎに 考えなおすまでの コマ数
    for (const a of ACTIONS) { this.now[a] = false; this.prev[a] = false; }
  }

  down(action) { return this.now[action] === true; }
  pressed(action) { return this.now[action] === true && this.prev[action] !== true; }
  aim() { return null; }

  // まいコマ よばれる。self＝じぶん、foe＝あいて
  think(self, foe) {
    this.prev = { ...this.now };

    // ふっとび中や こうげき中は 考えても むだなので 手を はなす
    if (!self.canControl()) { this.clear(); return; }

    if (this.timer > 0) { this.timer--; return; }   // まだ 考えなおす じかんでは ない
    this.timer = this.level.think;
    this.clear();

    const L = this.level;
    const myX = self.x + self.w / 2, myY = self.y + self.h / 2;
    const foeX = foe.x + foe.w / 2, foeY = foe.y + foe.h / 2;
    const dx = foeX - myX, dy = foeY - myY;
    const gnd = STAGE.GROUND;

    // ---- ① ステージの 外に いる？ → まず もどる（いちばん だいじ）----
    const offStage = myX < gnd.x1 || myX > gnd.x2;
    const belowStage = self.y + self.h > gnd.y + 20;
    if ((offStage || belowStage) && !self.onGround) {
      if (Math.random() < L.recoverSkill) {
        // ステージの まんなかへ むかう
        const center = (gnd.x1 + gnd.x2) / 2;
        this.now[center > myX ? 'RIGHT' : 'LEFT'] = true;
        // 落ちはじめたら ジャンプで もどる（空中ジャンプを のこしてある はず）
        if (self.vy > 0 && self.jumpsLeft > 0) this.now.JUMP = true;
      }
      return;
    }

    // ---- ② こうげきが とどく？ ----
    const inRange = Math.abs(dx) < L.range && Math.abs(dy) < CPU.VERTICAL_REACH;
    if (inRange && Math.random() < L.attackChance) {
      // あいてが たまっていたら 吹っ飛ばせる 横強を ねらう
      const wantTilt = foe.damage >= CPU.TILT_AT_DAMAGE ? L.tiltChance + 0.25 : L.tiltChance;
      this.now[Math.random() < wantTilt ? 'TILT' : 'LIGHT'] = true;
      // むきが あっていなければ そちらを むく
      if (Math.sign(dx) !== self.facing && dx !== 0) this.now[dx > 0 ? 'RIGHT' : 'LEFT'] = true;
      return;
    }

    // ---- ③ 近づく（ただし 足場から はみ出さない）----
    if (Math.abs(dx) > L.range * 0.6 && Math.random() < L.chase) {
      const dir = dx > 0 ? 1 : -1;
      const nextX = myX + dir * 12;
      const safe = nextX > gnd.x1 + CPU.SAFE_MARGIN && nextX < gnd.x2 - CPU.SAFE_MARGIN;
      if (safe || !self.onGround) this.now[dir > 0 ? 'RIGHT' : 'LEFT'] = true;
      else this.now[dir > 0 ? 'LEFT' : 'RIGHT'] = true;   // はしに 来たら もどる
    }

    // ---- ④ あいてが 上に いる／ときどき ジャンプ ----
    if (dy < -50 && Math.abs(dx) < 120 && self.onGround) this.now.JUMP = true;
    else if (Math.random() < L.jumpChance * 0.3 && self.onGround) this.now.JUMP = true;
  }

  clear() { for (const a of ACTIONS) this.now[a] = false; }
}

// 技の つよさを 見たいとき（いまは つかっていないが 調整の めやす）
export const STRONGEST = MOVES.TILT;
