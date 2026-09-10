// ============================================================
// fighter.js — キャラクター1人ぶんの データと うごきの 係
// ============================================================

import { FIGHTER, KNOCKBACK, MOVES, COLORS } from './config.js';
import { isDown, wasPressed } from './input.js';
import { applyGravity, moveAndLand } from './physics.js';

export class Fighter {
  // index : 0 なら 1P、1 なら 2P
  // keys  : config.js の KEYS.P1 か KEYS.P2
  // color : からだの色
  constructor(index, keys, color) {
    this.index = index;
    this.keys = keys;
    this.color = color;
    this.w = FIGHTER.WIDTH;
    this.h = FIGHTER.HEIGHT;
    this.stocks = FIGHTER.STOCKS;          // のこり機数
    this.spawn = FIGHTER.SPAWN[index];     // ふっかつする場所
    this.reset();
  }

  // ふっかつの場所に もどして、ダメージなどを ぜんぶ 0 にする
  reset() {
    this.x = this.spawn.x - this.w / 2;    // x,y は からだの 左上のかど
    this.y = this.spawn.y - this.h;
    this.vx = 0;                           // よこの はやさ
    this.vy = 0;                           // たての はやさ（下が プラス）
    this.facing = this.spawn.facing;       // むき（1=右、-1=左）
    this.onGround = false;                 // 足場に のっている？
    this.standingOn = null;                // のっている 足場
    this.jumpsLeft = FIGHTER.MAX_JUMPS;    // あと なんかい とべる？
    this.damage = 0;                       // ためた ダメージ（%）
    this.knockback = 0;                    // ふっとび中の はやさ（0なら ふっとんでいない）
    this.crouching = false;                // しゃがんでいる？
    this.attack = null;                    // こうげき中なら { move, frame, hasHit }
    this.endlag = 0;                       // 技のあと うごけない のこりコマ数
    this.dropTimer = 0;                    // うきしまを すりぬけ中の のこりコマ数
    this.invincible = 0;                   // むてきの のこりコマ数
  }

  // ミスしたあと ふっかつする
  respawn() {
    this.reset();
    this.invincible = FIGHTER.RESPAWN_INVINCIBLE_FRAMES;
  }

  // いま そうさ できる？（ふっとび中・こうげき中・後隙中 は できない）
  canControl() {
    return this.knockback === 0 && this.attack === null && this.endlag === 0;
  }

  // 1コマぶん すすめる（まいコマ よばれる）
  update(platforms) {
    if (this.invincible > 0) this.invincible--;
    if (this.dropTimer > 0) this.dropTimer--;

    this.updateAttack();
    if (this.canControl()) this.handleInput();
    this.updateKnockback();

    // しゃがみで たかさが かわる。足のいちは かえない
    const bottom = this.y + this.h;
    this.h = this.crouching ? FIGHTER.CROUCH_HEIGHT : FIGHTER.HEIGHT;
    this.y = bottom - this.h;

    // 重力で 落ちて、足場に のったか しらべる
    applyGravity(this);
    const landed = moveAndLand(this, platforms, this.dropTimer > 0);
    this.onGround = landed !== null;
    this.standingOn = landed;
    if (this.onGround) {
      this.jumpsLeft = FIGHTER.MAX_JUMPS;  // 着地したら ジャンプ回数 ふっかつ
    } else {
      this.crouching = false;              // 空中では しゃがめない
    }
  }

  // こうげきの コマを すすめる
  updateAttack() {
    if (this.attack !== null) {
      this.attack.frame++;
      if (this.attack.frame >= this.attack.move.active) {
        // 当たり判定が おわった → 後隙に 入る
        this.endlag = this.attack.move.endlag;
        this.attack = null;
      }
    } else if (this.endlag > 0) {
      this.endlag--;
    }
  }

  // キーを 見て うごきを きめる
  handleInput() {
    const k = this.keys;
    const left = isDown(k.LEFT);
    const right = isDown(k.RIGHT);
    const crouch = isDown(k.CROUCH);

    // --- しゃがみ ---
    this.crouching = false;
    if (this.onGround && crouch) {
      const onFloating = this.standingOn && !this.standingOn.isGround;
      if (onFloating && wasPressed(k.CROUCH)) {
        // うきしまの上で しゃがみを おしたら すりぬけて 落ちる
        this.dropTimer = FIGHTER.DROP_THROUGH_FRAMES;
        this.y += 1;
        this.onGround = false;
      } else {
        this.crouching = true;
      }
    }

    // --- よこ移動 ---
    const speed = this.onGround ? FIGHTER.GROUND_SPEED : FIGHTER.AIR_SPEED;
    if (this.crouching) {
      this.vx = 0;                         // しゃがみ中は うごけない
    } else if (left && !right) {
      this.vx = -speed;
      this.facing = -1;
    } else if (right && !left) {
      this.vx = speed;
      this.facing = 1;
    } else if (this.onGround) {
      this.vx = 0;                         // 地上で 何も おしてなければ とまる
    }
    // 空中で 何も おしてなければ そのまま すべる（vx を かえない）

    // --- ジャンプ ---
    if (wasPressed(k.JUMP) && this.jumpsLeft > 0 && !this.crouching) {
      this.vy = FIGHTER.JUMP_SPEED;
      this.jumpsLeft--;
      this.onGround = false;
    }

    // --- こうげき ---
    if (wasPressed(k.LIGHT)) {
      this.startAttack(MOVES.LIGHT);
    } else if (wasPressed(k.TILT)) {
      this.startAttack(MOVES.TILT);
    }
  }

  // こうげきを はじめる
  startAttack(move) {
    this.attack = { move, frame: 0, hasHit: false };
    this.crouching = false;
    if (this.onGround) this.vx = 0;        // 地上では その場で こうげき
  }

  // ふっとび中の しょり
  updateKnockback() {
    if (this.knockback === 0) return;
    this.knockback *= KNOCKBACK.DECAY;     // だんだん おそくなる
    this.vx *= KNOCKBACK.DECAY;
    if (this.knockback <= KNOCKBACK.CONTROL_SPEED) {
      this.knockback = 0;                  // おそくなったら そうさ ふっかつ
    }
  }

  // こうげきを くらった
  // move : くらった技、dir : こうげきした人の むき（ふっとぶ方向）
  takeHit(move, dir) {
    this.damage = Math.min(KNOCKBACK.MAX_DAMAGE, this.damage + move.damage);

    // ふっとびのはやさ ＝ (基礎ふっとび ＋ ためたダメージ × 0.12) × 技の倍率
    const speed = (move.baseKB + this.damage * KNOCKBACK.DAMAGE_SCALE) * move.kbScale;
    const rad = (KNOCKBACK.ANGLE_DEG * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed * dir;
    this.vy = -Math.sin(rad) * speed;      // 上むきなので マイナス
    this.knockback = speed;

    // くらったら こうげきも しゃがみも とりけし
    this.attack = null;
    this.endlag = 0;
    this.crouching = false;
    this.onGround = false;
  }

  // からだの 当たり判定（くらう ほう）
  getHurtbox() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // こうげきの 当たり判定（あてる ほう）。こうげき中でなければ null
  getHitbox() {
    if (this.attack === null) return null;
    const hb = this.attack.move.hitbox;
    return {
      x: this.facing > 0 ? this.x + this.w : this.x - hb.width,  // 前がわに 出す
      y: this.y + (this.h - hb.height) / 2,                       // たてまんなか
      w: hb.width,
      h: hb.height,
    };
  }

  // 絵を かく
  draw(ctx) {
    // むてき中は チカチカ 点めつ させる
    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // からだ
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // 目（むいている ほうに つける）
    ctx.fillStyle = COLORS.EYE;
    const eyeX = this.facing > 0 ? this.x + this.w - 12 : this.x + 4;
    ctx.fillRect(eyeX, this.y + 8, 8, 8);

    ctx.globalAlpha = 1;

    // こうげきの 四角
    const hb = this.getHitbox();
    if (hb !== null) {
      ctx.fillStyle = COLORS.HITBOX;
      ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
    }
  }
}
