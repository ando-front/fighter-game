// ============================================================
// fighter.js — キャラクター1人ぶんの データと うごきの 係（絵は render.js）
// ============================================================

import { FIGHTER, KNOCKBACK, MOVES } from './config.js';
import { isDown, wasPressed } from './input.js';
import { applyGravity, moveAndLand } from './physics.js';
import * as effects from './effects.js';

export class Fighter {
  // index : 0=1P 1=2P   keys : KEYS.P1/P2   colors : COLORS.P1/P2
  constructor(index, keys, colors) {
    this.index = index;
    this.keys = keys;
    this.colors = colors;
    this.w = FIGHTER.WIDTH;
    this.h = FIGHTER.HEIGHT;
    this.stocks = FIGHTER.STOCKS;
    this.spawn = FIGHTER.SPAWN[index];
    this.animTime = 0;           // アニメ用の 時間（ずっと ふえる）
    this.reset();
  }

  // ふっかつの場所に もどして、状態を ぜんぶ 0 に
  reset() {
    this.x = this.spawn.x - this.w / 2;
    this.y = this.spawn.y - this.h;
    this.vx = 0; this.vy = 0;
    this.facing = this.spawn.facing;
    this.onGround = false; this.standingOn = null; this.wasOnGround = false;
    this.jumpsLeft = FIGHTER.MAX_JUMPS;
    this.damage = 0;
    this.knockback = 0;          // ふっとび中の はやさ（0なら ふっとんでいない）
    this.hitstun = 0;            // くらって うごけない のこりコマ数
    this.crouching = false;
    this.attack = null;          // こうげき中なら { move, frame, hasHit }
    this.endlag = 0;
    this.dropTimer = 0;
    this.invincible = 0;
    this.flashTimer = 0;         // 白く 点めつ する のこりコマ数
    this.landTimer = 0;          // 着地の ぐにゃっ の のこりコマ数
    this.damageBump = 0;         // HUD の ％が どんっと なる のこりコマ数
    this.jumpHeld = false;       // ジャンプキーを おしっぱなし か
  }

  respawn() {
    this.reset();
    this.invincible = FIGHTER.RESPAWN_INVINCIBLE_FRAMES;
  }

  // いま そうさ できる？
  canControl() {
    return this.knockback === 0 && this.attack === null && this.endlag === 0;
  }

  // 1コマ すすめる。allowInput が false のときは キーを 見ない（READY 中など）
  update(platforms, allowInput = true) {
    this.animTime++;
    if (this.invincible > 0) this.invincible--;
    if (this.dropTimer > 0) this.dropTimer--;
    if (this.flashTimer > 0) this.flashTimer--;
    if (this.landTimer > 0) this.landTimer--;
    if (this.damageBump > 0) this.damageBump--;

    this.updateAttack();
    if (allowInput && this.canControl()) this.handleInput();
    else if (this.onGround && this.knockback === 0) this.slowDown(FIGHTER.GROUND_DECEL);
    this.updateKnockback();

    // しゃがみで たかさが かわる。足のいちは かえない
    const bottom = this.y + this.h;
    this.h = this.crouching ? FIGHTER.CROUCH_HEIGHT : FIGHTER.HEIGHT;
    this.y = bottom - this.h;

    // 重力：ジャンプキーを おしたまま 上がっている あいだは よわめる（ふわっと）
    const floaty = this.vy < 0 && this.jumpHeld && isDown(this.keys.JUMP) && this.knockback === 0;
    applyGravity(this, floaty ? FIGHTER.JUMP_HOLD_GRAVITY : 1);
    if (!isDown(this.keys.JUMP)) this.jumpHeld = false;

    const fallSpeed = this.vy;
    const landed = moveAndLand(this, platforms, this.dropTimer > 0);
    this.wasOnGround = this.onGround;
    this.onGround = landed !== null;
    this.standingOn = landed;

    if (this.onGround) {
      this.jumpsLeft = FIGHTER.MAX_JUMPS;
      if (!this.wasOnGround) this.onLand(fallSpeed);
    } else {
      this.crouching = false;
    }
  }

  // 着地した しゅんかん
  onLand(fallSpeed) {
    this.landTimer = FIGHTER.LAND_SQUASH_FRAMES;
    if (fallSpeed > 6) effects.spawnDust(this.x + this.w / 2, this.y + this.h, 0, 5);
    // ふっとびの おわりかけ なら 着地で そうさ ふっかつ
    if (this.knockback > 0 && this.hitstun <= 0) { this.knockback = 0; this.vx = 0; }
  }

  // こうげきの コマを すすめる
  updateAttack() {
    if (this.attack !== null) {
      const m = this.attack.move;
      this.attack.frame++;
      if (this.attack.frame === m.startup) {
        // 当たり判定が 出る しゅんかんに 斬撃を 出す
        const hb = this.getHitbox();
        effects.spawnSlash(hb.x + hb.w / 2, hb.y + hb.h / 2, this.facing, m.slashSize);
      }
      if (this.attack.frame >= m.startup + m.active) {
        this.endlag = m.endlag;
        this.attack = null;
      }
    } else if (this.endlag > 0) {
      this.endlag--;
    }
  }

  // キーを 見て うごきを きめる
  handleInput() {
    const k = this.keys;
    const dir = (isDown(k.RIGHT) ? 1 : 0) - (isDown(k.LEFT) ? 1 : 0);
    const crouchKey = isDown(k.CROUCH);

    // --- しゃがみ／すりぬけ／急降下 ---
    this.crouching = false;
    if (this.onGround && crouchKey) {
      const onFloating = this.standingOn && !this.standingOn.isGround;
      if (onFloating && wasPressed(k.CROUCH)) {
        this.dropTimer = FIGHTER.DROP_THROUGH_FRAMES;
        this.y += 1; this.onGround = false;
      } else {
        this.crouching = true;
      }
    } else if (!this.onGround && crouchKey && this.vy > 0) {
      this.vy = Math.max(this.vy, FIGHTER.FAST_FALL_SPEED);   // 空中で ↓ ＝ 急降下
    }

    // --- よこ移動（加速と減速で なめらかに）---
    if (this.crouching) this.slowDown(FIGHTER.GROUND_DECEL);
    else this.applyMovement(dir);

    // --- ジャンプ（地上1回 ＋ 空中1回）---
    if (wasPressed(k.JUMP) && this.jumpsLeft > 0 && !this.crouching) {
      const airJump = !this.onGround;
      this.vy = FIGHTER.JUMP_SPEED;
      this.jumpsLeft--;
      this.jumpHeld = true;
      this.onGround = false;
      if (airJump) effects.spawnJumpPuff(this.x + this.w / 2, this.y + this.h);
      else effects.spawnDust(this.x + this.w / 2, this.y + this.h, 0, 3);
    }

    // --- こうげき ---
    if (wasPressed(k.LIGHT)) this.startAttack(MOVES.LIGHT);
    else if (wasPressed(k.TILT)) this.startAttack(MOVES.TILT);
  }

  // dir（-1/0/1）の むきに 加速する
  applyMovement(dir) {
    if (this.onGround) {
      if (dir === 0) { this.slowDown(FIGHTER.GROUND_DECEL); return; }
      if (dir !== this.facing && Math.abs(this.vx) > 2) effects.spawnDust(this.x + this.w / 2, this.y + this.h, dir, 2);
      this.facing = dir;
      this.vx += dir * FIGHTER.GROUND_ACCEL;
      if (dir * this.vx > FIGHTER.GROUND_SPEED) this.vx = dir * FIGHTER.GROUND_SPEED;
    } else {
      if (dir === 0) { this.vx *= FIGHTER.AIR_DRAG; return; }
      this.facing = dir;
      // 空中は ゆっくり 加速。走ってきた いきおい（AIR_SPEED より はやい）は そのまま のこす
      if (dir * this.vx < FIGHTER.AIR_SPEED) {
        this.vx += dir * FIGHTER.AIR_ACCEL;
        if (dir * this.vx > FIGHTER.AIR_SPEED) this.vx = dir * FIGHTER.AIR_SPEED;
      }
    }
  }

  // よこの はやさを 0 に ちかづける
  slowDown(amount) {
    if (Math.abs(this.vx) <= amount) this.vx = 0;
    else this.vx -= Math.sign(this.vx) * amount;
  }

  startAttack(move) {
    this.attack = { move, frame: 0, hasHit: false };
    this.crouching = false;
    if (this.onGround) this.vx = 0;
  }

  // ふっとび中の しょり
  updateKnockback() {
    if (this.knockback === 0) return;
    if (this.hitstun > 0) this.hitstun--;
    this.knockback *= KNOCKBACK.DECAY;
    if (this.onGround) this.slowDown(0.6); else this.vx *= KNOCKBACK.DECAY;
    if (this.hitstun <= 0 && this.knockback <= KNOCKBACK.CONTROL_SPEED) this.knockback = 0;
  }

  // こうげきを くらった。move : くらった技、dir : こうげきした人の むき
  // もどりち : ふっとびの はやさ（エフェクトの 大きさに つかう）
  takeHit(move, dir) {
    this.damage = Math.min(KNOCKBACK.MAX_DAMAGE, this.damage + move.damage);
    const speed = (move.baseKB + this.damage * KNOCKBACK.DAMAGE_SCALE) * move.kbScale;
    const rad = (move.angle * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed * dir;
    this.vy = -Math.sin(rad) * speed;
    this.knockback = speed;
    this.hitstun = Math.round(speed * KNOCKBACK.HITSTUN_PER_KB);
    this.flashTimer = KNOCKBACK.FLASH_FRAMES;
    this.damageBump = 12;
    this.facing = -dir;                    // こうげきした人の ほうを むく
    this.attack = null; this.endlag = 0; this.crouching = false;
    this.onGround = false; this.jumpHeld = false;
    if (FIGHTER.REFRESH_AIR_JUMP_ON_HIT) this.jumpsLeft = Math.max(this.jumpsLeft, 1);
    return speed;
  }

  getHurtbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  // こうげきの 当たり判定。ふりかぶり中・こうげき中でなければ null
  getHitbox() {
    if (this.attack === null || this.attack.frame < this.attack.move.startup) return null;
    const hb = this.attack.move.hitbox;
    return {
      x: this.facing > 0 ? this.x + this.w : this.x - hb.width,
      y: this.y + (this.h - hb.height) / 2,
      w: hb.width, h: hb.height,
    };
  }

  // いまの ポーズの 名前（render.js が つかう）
  getPose() {
    if (this.knockback > 0) return 'hit';
    if (this.attack !== null) return this.attack.frame < this.attack.move.startup ? 'windup' : 'attack';
    if (this.endlag > 0) return 'recover';
    if (!this.onGround) return this.vy < 0 ? 'jump' : 'fall';
    if (this.crouching) return 'crouch';
    if (Math.abs(this.vx) > 0.5) return 'run';
    return 'idle';
  }
}
