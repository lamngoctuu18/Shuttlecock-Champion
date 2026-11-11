import Phaser from 'phaser';
import { CHARACTERS, COSTUMES, COURT_CONFIG } from '../config/gameConfig';
import { CharacterConfig, CostumeConfig, KickAction, PlayerAnimState } from '../types';

export class Player extends Phaser.GameObjects.Container {
  public animState: PlayerAnimState = 'IDLE';

  private charConfig: CharacterConfig;
  private costumeConfig: CostumeConfig;
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private hitboxGraphics: Phaser.GameObjects.Graphics;
  private shadowEllipse: Phaser.GameObjects.Ellipse;

  private animTimer: number = 0;
  private stateRemainingSec: number = 0;
  private lookAtX: number = 0;
  private lookAtY: number = -120;
  private preferredFootSide: number = -1; // -1 means position so shuttle falls on left foot, +1 on right foot

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    characterId: string,
    costumeId: string
  ) {
    super(scene, x, y);

    this.charConfig =
      CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];
    this.costumeConfig =
      COSTUMES.find((c) => c.id === costumeId) || COSTUMES[0];

    this.shadowEllipse = scene.add.ellipse(0, 4, 76, 20, 0x0f172a, 0.32);
    this.add(this.shadowEllipse);

    this.hitboxGraphics = scene.add.graphics();
    this.add(this.hitboxGraphics);

    this.bodyGraphics = scene.add.graphics();
    this.add(this.bodyGraphics);

    this.setDepth(20);
    scene.add.existing(this);

    this.renderCharacter(0);
  }

  public setAppearance(characterId: string, costumeId: string): void {
    this.charConfig =
      CHARACTERS.find((c) => c.id === characterId) || CHARACTERS[0];
    this.costumeConfig =
      COSTUMES.find((c) => c.id === costumeId) || COSTUMES[0];
    this.renderCharacter(this.animTimer);
  }

  public setAnimState(state: PlayerAnimState, durationSec: number = 0.34): void {
    this.animState = state;
    this.stateRemainingSec = durationSec;

    if (state === 'KICK_LEFT' || state === 'KICK_RIGHT' || state === 'KICK_HIGH' || state === 'RECEIVE') {
      // Alternate next foot side target slightly so player alternates left/right kicks naturally
      this.preferredFootSide = Math.random() > 0.5 ? 1 : -1;

      this.scene.tweens.killTweensOf(this);
      this.setScale(1.06, 0.94);
      this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 210,
        ease: 'Back.easeOut'
      });
    }
  }

  public playActionAnim(action: KickAction, isMiss: boolean): void {
    if (isMiss) {
      this.setAnimState('MISS', 0.32);
      return;
    }
    switch (action) {
      case 'LEFT':
        this.setAnimState('KICK_LEFT', 0.32);
        break;
      case 'RIGHT':
        this.setAnimState('KICK_RIGHT', 0.32);
        break;
      case 'HIGH':
        this.setAnimState('KICK_HIGH', 0.42);
        break;
      case 'RECEIVE':
        this.setAnimState('RECEIVE', 0.34);
        break;
    }
  }

  private isMovingHorizontally: boolean = false;
  private moveDirSign: number = 0;

  public updatePlayer(
    deltaSec: number,
    shuttleX: number,
    shuttleY: number,
    shuttleVy: number,
    manualDir: number,
    showHitbox: boolean,
    autoFootworkEnabled: boolean = true
  ): void {
    this.animTimer += deltaSec;
    this.lookAtX = shuttleX - this.x;
    this.lookAtY = shuttleY - (this.y - 95);

    if (this.stateRemainingSec > 0) {
      this.stateRemainingSec -= deltaSec;
      if (this.stateRemainingSec <= 0 && this.animState !== 'GAME_OVER') {
        this.animState = 'IDLE';
      }
    }

    // Automatic transition between IDLE and PREPARE when shuttlecock is descending toward player
    if (this.animState === 'IDLE' || this.animState === 'PREPARE') {
      if (shuttleVy > 60 && shuttleY > COURT_CONFIG.GROUND_Y - 290) {
        this.animState = 'PREPARE';
      } else {
        this.animState = 'IDLE';
      }
    }

    // Agile footwork movement along the court:
    // Manual movement (◀/▶ buttons or ArrowLeft/ArrowRight or Q/E) always takes priority.
    // When autoFootworkEnabled is true, character also assists with footwork tracking.
    let moveVx = 0;
    if (this.animState !== 'GAME_OVER') {
      const footOffset = this.preferredFootSide * 26;
      const desiredX = shuttleX - footOffset;
      const diffX = desiredX - this.x;

      if (Math.abs(manualDir) > 0.1) {
        moveVx = manualDir * (COURT_CONFIG.PLAYER_SPEED * 1.08);
      } else if (autoFootworkEnabled && Math.abs(diffX) > 6) {
        const trackSpeed = COURT_CONFIG.PLAYER_SPEED * 0.92;
        moveVx = Phaser.Math.Clamp(diffX * 5.2, -trackSpeed, trackSpeed);
      }

      this.x = Phaser.Math.Clamp(
        this.x + moveVx * deltaSec,
        COURT_CONFIG.COURT_LEFT + 45,
        COURT_CONFIG.COURT_RIGHT - 45
      );
    }

    this.isMovingHorizontally = Math.abs(moveVx) > 25;
    this.moveDirSign = Math.sign(moveVx);

    this.renderHitboxZones(showHitbox, shuttleY, shuttleVy);
    this.renderCharacter(this.animTimer);
  }

  private renderHitboxZones(show: boolean, shuttleY: number, shuttleVy: number): void {
    const g = this.hitboxGraphics;
    g.clear();
    if (!show || this.animState === 'GAME_OVER') return;

    const isDescendingLow = shuttleVy > 0 && shuttleY > COURT_CONFIG.GROUND_Y - 220;
    const baseAlpha = isDescendingLow ? 0.38 : 0.16;

    // Left foot kick zone indicator
    g.lineStyle(2, 0x38bdf8, baseAlpha + 0.18);
    g.fillStyle(0x38bdf8, baseAlpha * 0.35);
    g.fillCircle(-34, -22, 30);
    g.strokeCircle(-34, -22, 30);

    // Right foot kick zone indicator
    g.lineStyle(2, 0xf59e0b, baseAlpha + 0.18);
    g.fillStyle(0xf59e0b, baseAlpha * 0.35);
    g.fillCircle(34, -22, 30);
    g.strokeCircle(34, -22, 30);
  }

  private renderCharacter(t: number): void {
    const g = this.bodyGraphics;
    g.clear();

    const skin = this.charConfig.skinColor;
    const hair = this.charConfig.hairColor;
    const shirt = this.costumeConfig.shirtColor;
    const pants = this.costumeConfig.pantsColor;
    const accent = this.costumeConfig.accentColor;
    const shoe = this.costumeConfig.shoeColor;

    // Subtle idle breathing / preparation crouch
    let bodyBobY = Math.sin(t * 5.5) * 2.5;
    let torsoTilt = 0;

    // Leg & foot coordinates relative to ground (0, 0)
    let leftFootX = -18;
    let leftFootY = -6;
    let leftKneeX = -19;
    let leftKneeY = -28;

    let rightFootX = 18;
    let rightFootY = -6;
    let rightKneeX = 19;
    let rightKneeY = -28;

    let leftHandX = -32;
    let leftHandY = -58 + Math.sin(t * 5.5) * 3;
    let rightHandX = 32;
    let rightHandY = -58 - Math.sin(t * 5.5) * 3;

    if (this.isMovingHorizontally && (this.animState === 'IDLE' || this.animState === 'PREPARE')) {
      const stride = Math.sin(t * 20);
      bodyBobY = Math.abs(stride) * 4;
      torsoTilt = this.moveDirSign * 4;
      leftFootX = -18 + stride * 12;
      leftFootY = -6 - Math.max(0, stride) * 8;
      rightFootX = 18 - stride * 12;
      rightFootY = -6 - Math.max(0, -stride) * 8;
    }

    if (this.animState === 'PREPARE') {
      bodyBobY = 6;
      leftKneeX = -24;
      rightKneeX = 24;
      leftHandX = -38;
      leftHandY = -54;
      rightHandX = 38;
      rightHandY = -54;
    } else if (this.animState === 'KICK_LEFT') {
      bodyBobY = -4;
      torsoTilt = 6;
      leftKneeX = -32;
      leftKneeY = -44;
      leftFootX = -46;
      leftFootY = -36;
      leftHandX = -42;
      leftHandY = -78;
      rightHandX = 38;
      rightHandY = -52;
    } else if (this.animState === 'KICK_RIGHT') {
      bodyBobY = -4;
      torsoTilt = -6;
      rightKneeX = 32;
      rightKneeY = -44;
      rightFootX = 46;
      rightFootY = -36;
      rightHandX = 42;
      rightHandY = -78;
      leftHandX = -38;
      leftHandY = -52;
    } else if (this.animState === 'KICK_HIGH') {
      bodyBobY = -14;
      const kickRightSide = this.lookAtX >= 0;
      if (kickRightSide) {
        torsoTilt = -12;
        rightKneeX = 34;
        rightKneeY = -58;
        rightFootX = 52;
        rightFootY = -68;
      } else {
        torsoTilt = 12;
        leftKneeX = -34;
        leftKneeY = -58;
        leftFootX = -52;
        leftFootY = -68;
      }
      leftHandX = -44;
      leftHandY = -88;
      rightHandX = 44;
      rightHandY = -88;
    } else if (this.animState === 'RECEIVE') {
      bodyBobY = 3;
      leftKneeX = -14;
      leftKneeY = -42;
      leftFootX = -12;
      leftFootY = -28;
      leftHandX = -36;
      leftHandY = -68;
      rightHandX = 36;
      rightHandY = -68;
    } else if (this.animState === 'MISS') {
      bodyBobY = 8;
      torsoTilt = 10;
      leftFootX = -30;
      rightFootX = 26;
      leftHandX = -35;
      leftHandY = -42;
      rightHandX = 35;
      rightHandY = -42;
    } else if (this.animState === 'CELEBRATE') {
      bodyBobY = -Math.abs(Math.sin(t * 12)) * 12;
      leftHandX = -38;
      leftHandY = -98;
      rightHandX = 38;
      rightHandY = -98;
    } else if (this.animState === 'GAME_OVER') {
      bodyBobY = 10;
      leftHandX = -24;
      leftHandY = -40;
      rightHandX = 24;
      rightHandY = -40;
    }

    const hipY = -46 + bodyBobY;
    const shoulderY = -82 + bodyBobY;
    const headY = -114 + bodyBobY;
    const headX = torsoTilt * 0.5;

    // --- LEGS ---
    g.lineStyle(11, skin, 1);
    // Left leg
    g.beginPath();
    g.moveTo(-12, hipY);
    g.lineTo(leftKneeX, leftKneeY);
    g.lineTo(leftFootX, leftFootY);
    g.strokePath();
    // Right leg
    g.beginPath();
    g.moveTo(12, hipY);
    g.lineTo(rightKneeX, rightKneeY);
    g.lineTo(rightFootX, rightFootY);
    g.strokePath();

    // --- PANTS / SHORTS / SKIRT ---
    g.fillStyle(pants, 1);
    g.lineStyle(2.5, 0x0f172a, 0.85);
    if (this.charConfig.gender === 'female' && this.costumeConfig.id === 'dong_phuc') {
      // Pleated school skirt
      g.beginPath();
      g.moveTo(-19, hipY - 4);
      g.lineTo(19, hipY - 4);
      g.lineTo(25, hipY + 16);
      g.lineTo(-25, hipY + 16);
      g.closePath();
      g.fillPath();
      g.strokePath();
    } else {
      // Shorts / Pants top
      g.fillRoundedRect(-19, hipY - 4, 38, 17, 6);
      g.strokeRoundedRect(-19, hipY - 4, 38, 17, 6);
    }

    // --- SHOES (with white socks) ---
    const drawShoe = (fx: number, fy: number, dir: number) => {
      // Sock
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(fx - 6, fy - 10, 12, 9, 3);
      // Sneaker
      g.fillStyle(shoe, 1);
      g.lineStyle(2, 0x0f172a, 0.9);
      g.fillRoundedRect(fx - 10 + dir * 3, fy - 5, 22, 10, 5);
      g.strokeRoundedRect(fx - 10 + dir * 3, fy - 5, 22, 10, 5);
      // White sole stripe
      g.fillStyle(0xffffff, 1);
      g.fillRect(fx - 9 + dir * 3, fy + 2, 20, 3);
    };
    drawShoe(leftFootX, leftFootY, -1);
    drawShoe(rightFootX, rightFootY, 1);

    // --- ARMS ---
    g.lineStyle(9, skin, 1);
    g.beginPath();
    g.moveTo(-18 + torsoTilt * 0.3, shoulderY + 4);
    g.lineTo(leftHandX, leftHandY);
    g.strokePath();

    g.beginPath();
    g.moveTo(18 + torsoTilt * 0.3, shoulderY + 4);
    g.lineTo(rightHandX, rightHandY);
    g.strokePath();

    // Hands
    g.fillStyle(skin, 1);
    g.lineStyle(2, 0x0f172a, 0.8);
    g.fillCircle(leftHandX, leftHandY, 6);
    g.strokeCircle(leftHandX, leftHandY, 6);
    g.fillCircle(rightHandX, rightHandY, 6);
    g.strokeCircle(rightHandX, rightHandY, 6);

    // --- TORSO / SHIRT ---
    g.fillStyle(shirt, 1);
    g.lineStyle(2.5, 0x0f172a, 0.9);
    g.fillRoundedRect(-20 + torsoTilt * 0.3, shoulderY, 40, 38, 10);
    g.strokeRoundedRect(-20 + torsoTilt * 0.3, shoulderY, 40, 38, 10);

    // Short sleeves
    g.fillRoundedRect(-26 + torsoTilt * 0.3, shoulderY + 1, 10, 15, 4);
    g.strokeRoundedRect(-26 + torsoTilt * 0.3, shoulderY + 1, 10, 15, 4);
    g.fillRoundedRect(16 + torsoTilt * 0.3, shoulderY + 1, 10, 15, 4);
    g.strokeRoundedRect(16 + torsoTilt * 0.3, shoulderY + 1, 10, 15, 4);

    // Vietnamese Red Scarf (Khăn Quàng Đỏ) or Sport Accent Stripe
    if (this.costumeConfig.id === 'dong_phuc') {
      g.fillStyle(0xef4444, 1);
      g.lineStyle(1.8, 0x991b1b, 0.9);
      g.beginPath();
      g.moveTo(-15 + torsoTilt * 0.3, shoulderY + 2);
      g.lineTo(15 + torsoTilt * 0.3, shoulderY + 2);
      g.lineTo(4 + torsoTilt * 0.3, shoulderY + 24);
      g.lineTo(-4 + torsoTilt * 0.3, shoulderY + 22);
      g.closePath();
      g.fillPath();
      g.strokePath();
    } else {
      // Sporty chest stripe / badge
      g.fillStyle(accent, 1);
      g.fillRoundedRect(-14 + torsoTilt * 0.3, shoulderY + 10, 28, 7, 3);
    }

    // --- HEAD & FACE ---
    // Ponytail behind head for female character
    if (this.charConfig.gender === 'female') {
      const ponyBob = Math.sin(t * 8) * 3;
      g.fillStyle(hair, 1);
      g.lineStyle(2, 0x0f172a, 0.9);
      g.fillEllipse(headX + 22, headY - 4 + ponyBob, 18, 12);
      g.strokeEllipse(headX + 22, headY - 4 + ponyBob, 18, 12);
      // Hair ribbon
      g.fillStyle(0xf43f5e, 1);
      g.fillCircle(headX + 16, headY - 6, 4.5);
    }

    // Head circle
    g.fillStyle(skin, 1);
    g.lineStyle(2.5, 0x0f172a, 0.9);
    g.fillCircle(headX, headY, 22);
    g.strokeCircle(headX, headY, 22);

    // Rosy cheeks
    g.fillStyle(0xfb7185, 0.45);
    g.fillEllipse(headX - 12, headY + 4, 7, 4);
    g.fillEllipse(headX + 12, headY + 4, 7, 4);

    // Eyes tracking shuttlecock
    const eyeOffsetX = Phaser.Math.Clamp(this.lookAtX * 0.015, -3.2, 3.2);
    const eyeOffsetY = Phaser.Math.Clamp(this.lookAtY * 0.015, -3.2, 2.0);

    if (this.animState === 'GAME_OVER' || this.animState === 'MISS') {
      // > < squinting eyes
      g.lineStyle(2.4, 0x0f172a, 1);
      g.beginPath();
      g.moveTo(headX - 11, headY - 4);
      g.lineTo(headX - 6, headY - 1);
      g.lineTo(headX - 11, headY + 2);
      g.moveTo(headX + 11, headY - 4);
      g.lineTo(headX + 6, headY - 1);
      g.lineTo(headX + 11, headY + 2);
      g.strokePath();
    } else {
      // Expressive cartoon eyes
      g.fillStyle(0xffffff, 1);
      g.fillCircle(headX - 8, headY - 2, 4.8);
      g.fillCircle(headX + 8, headY - 2, 4.8);

      g.fillStyle(0x0f172a, 1);
      g.fillCircle(headX - 8 + eyeOffsetX, headY - 2 + eyeOffsetY, 2.8);
      g.fillCircle(headX + 8 + eyeOffsetX, headY - 2 + eyeOffsetY, 2.8);

      // Eye highlight sparkle
      g.fillStyle(0xffffff, 1);
      g.fillCircle(headX - 9 + eyeOffsetX, headY - 3.5 + eyeOffsetY, 1.1);
      g.fillCircle(headX + 7 + eyeOffsetX, headY - 3.5 + eyeOffsetY, 1.1);
    }

    // Mouth expression
    g.lineStyle(2.2, 0x0f172a, 0.9);
    if (this.animState === 'KICK_HIGH' || this.animState === 'CELEBRATE') {
      // Excited open smile
      g.fillStyle(0xef4444, 1);
      g.fillEllipse(headX, headY + 8, 9, 6);
      g.strokeEllipse(headX, headY + 8, 9, 6);
    } else if (this.animState === 'GAME_OVER' || this.animState === 'MISS') {
      // Wavy sad mouth
      g.beginPath();
      g.arc(headX, headY + 11, 5, Math.PI * 1.15, Math.PI * 1.85, false);
      g.strokePath();
    } else {
      // Confident happy smile
      g.beginPath();
      g.arc(headX, headY + 5, 5.5, 0.15 * Math.PI, 0.85 * Math.PI, false);
      g.strokePath();
    }

    // --- HAIR TOP ---
    g.fillStyle(hair, 1);
    g.lineStyle(2, 0x0f172a, 0.9);
    g.beginPath();
    g.arc(headX, headY - 3, 22.5, Math.PI * 0.95, Math.PI * 2.05, false);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Sport headband for 'the_thao' character
    if (this.charConfig.gender === 'sport') {
      g.fillStyle(0xef4444, 1);
      g.fillRoundedRect(headX - 21, headY - 12, 42, 6, 2);
      g.fillStyle(0xfacc15, 1);
      g.fillRect(headX - 21, headY - 10, 42, 2);
    }
  }
}

