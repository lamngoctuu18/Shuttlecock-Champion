import Phaser from 'phaser';
import { COURT_CONFIG, SHUTTLECOCK_SKINS } from '../config/gameConfig';
import { ShuttlePhysicsBody } from '../systems/PhysicsSystem';
import { ShuttlecockSkinConfig, ShuttlecockState } from '../types';

interface TrailDot {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  color: number;
}

export class Shuttlecock extends Phaser.GameObjects.Container {
  public bodyState: ShuttlePhysicsBody;
  public flightState: ShuttlecockState = 'READY';

  private skin: ShuttlecockSkinConfig;
  private shuttleGraphics: Phaser.GameObjects.Graphics;
  private glowCircle: Phaser.GameObjects.Arc;
  private groundShadow: Phaser.GameObjects.Ellipse;
  private trailGraphics: Phaser.GameObjects.Graphics;
  private targetRingGraphics: Phaser.GameObjects.Graphics;

  // Pooled trail array (zero GC allocation in update loop)
  private readonly trailPool: TrailDot[] = [];
  private readonly maxTrailLength: number = 14;
  private trailSpawnAccumulator: number = 0;
  private rainbowHue: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, skinId: string) {
    super(scene, x, y);

    this.skin =
      SHUTTLECOCK_SKINS.find((s) => s.id === skinId) || SHUTTLECOCK_SKINS[0];

    this.bodyState = {
      x,
      y,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0
    };

    // Pre-allocate trail pool
    for (let i = 0; i < this.maxTrailLength; i++) {
      this.trailPool.push({ x, y, alpha: 0, scale: 1, color: this.skin.trailColor });
    }

    // Ground shadow on court surface
    this.groundShadow = scene.add.ellipse(x, COURT_CONFIG.GROUND_Y + 6, 48, 14, 0x0f172a, 0.35);
    this.groundShadow.setDepth(12);

    // Motion trail graphics in world space
    this.trailGraphics = scene.add.graphics();
    this.trailGraphics.setDepth(24);

    // Timing sweet-spot ring around shuttlecock when descending into kick zone
    this.targetRingGraphics = scene.add.graphics();
    this.targetRingGraphics.setDepth(25);

    // Optional glow aura
    this.glowCircle = scene.add.circle(0, -6, 26, this.skin.trailColor, this.skin.glow ? 0.25 : 0);
    this.add(this.glowCircle);

    // Detailed vector shuttlecock drawing
    this.shuttleGraphics = scene.add.graphics();
    this.drawShuttlecockVisual();
    this.add(this.shuttleGraphics);

    this.setDepth(26);
    scene.add.existing(this);
  }

  public setSkin(skinId: string): void {
    this.skin =
      SHUTTLECOCK_SKINS.find((s) => s.id === skinId) || SHUTTLECOCK_SKINS[0];
    this.glowCircle.setFillStyle(this.skin.trailColor, this.skin.glow ? 0.25 : 0);
    this.drawShuttlecockVisual();
  }

  private drawShuttlecockVisual(): void {
    const g = this.shuttleGraphics;
    g.clear();

    const feathers = this.skin.featherColors;
    const f0 = feathers[0] ?? 0xffffff;
    const f1 = feathers[1] ?? f0;
    const f2 = feathers[2] ?? f0;

    // 5 fanned feathers pointing upward from the base (-Y is feathers, +Y is rubber base)
    const featherAngles = [-0.42, -0.21, 0, 0.21, 0.42];
    featherAngles.forEach((ang, idx) => {
      const col = idx % 3 === 0 ? f0 : idx % 3 === 1 ? f1 : f2;
      const tipX = Math.sin(ang) * 28;
      const tipY = -Math.cos(ang) * 32;
      const midX = Math.sin(ang) * 14;
      const midY = -Math.cos(ang) * 16;

      // Feather vane
      g.fillStyle(col, 0.96);
      g.lineStyle(1.5, 0x1e293b, 0.75);
      g.beginPath();
      g.moveTo(0, 2);
      g.lineTo(midX - 5, midY);
      g.lineTo(tipX - 4, tipY);
      g.lineTo(tipX + 4, tipY);
      g.lineTo(midX + 5, midY);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Feather center shaft (rachis)
      g.lineStyle(1.2, 0xffffff, 0.7);
      g.beginPath();
      g.moveTo(0, 2);
      g.lineTo(tipX, tipY);
      g.strokePath();
    });

    // Plastic collar holding feathers
    g.fillStyle(0xf8fafc, 1);
    g.lineStyle(1.5, 0x1e293b, 0.9);
    g.fillRoundedRect(-7, 0, 14, 6, 2);
    g.strokeRoundedRect(-7, 0, 14, 6, 2);

    // Stacked rubber/plastic washer discs (Characteristic Vietnamese đá cầu base)
    g.fillStyle(0xfacc15, 1);
    g.fillRoundedRect(-10, 5, 20, 4, 2);
    g.strokeRoundedRect(-10, 5, 20, 4, 2);

    g.fillStyle(this.skin.baseColor, 1);
    g.fillRoundedRect(-12, 8, 24, 5, 2.5);
    g.strokeRoundedRect(-12, 8, 24, 5, 2.5);

    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(-9, 12, 18, 4, 2);
  }

  public resetToServe(x: number, y: number): void {
    this.bodyState.x = x;
    this.bodyState.y = y;
    this.bodyState.vx = 0;
    this.bodyState.vy = -120;
    this.bodyState.angle = 0;
    this.bodyState.angularVelocity = 0;
    this.flightState = 'FLYING_DOWN';

    for (let i = 0; i < this.trailPool.length; i++) {
      this.trailPool[i].alpha = 0;
    }

    this.syncVisuals(0.016, false);
  }

  public applyKickImpulse(vx: number, vy: number, spin: number): void {
    this.bodyState.vx = vx;
    this.bodyState.vy = vy;
    this.bodyState.angularVelocity = spin;
    this.flightState = 'FLYING_UP';

    // Squash & stretch juice on kick impact
    this.scene.tweens.killTweensOf(this);
    this.setScale(1.28, 0.78);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 190,
      ease: 'Back.easeOut'
    });
  }

  public syncVisuals(deltaSec: number, showTimingHelper: boolean): void {
    this.setPosition(this.bodyState.x, this.bodyState.y);
    this.setAngle(this.bodyState.angle);

    // Update flight state classification
    if (this.bodyState.y >= COURT_CONFIG.GROUND_Y - 13) {
      this.flightState = 'GROUNDED';
    } else if (this.bodyState.vy < 0) {
      this.flightState = 'FLYING_UP';
    } else if (this.bodyState.y > COURT_CONFIG.GROUND_Y - 170) {
      this.flightState = 'DANGER_LOW';
    } else {
      this.flightState = 'FLYING_DOWN';
    }

    // Update ground shadow position & scale based on height above court
    const heightAboveGround = Math.max(0, COURT_CONFIG.GROUND_Y - this.bodyState.y);
    const heightRatio = Phaser.Math.Clamp(1 - heightAboveGround / 480, 0.25, 1);
    this.groundShadow.setPosition(this.bodyState.x, COURT_CONFIG.GROUND_Y + 6);
    this.groundShadow.setScale(heightRatio * 1.15, heightRatio);
    this.groundShadow.setAlpha(0.15 + heightRatio * 0.35);

    // Update trail pool
    this.trailSpawnAccumulator += deltaSec;
    if (this.trailSpawnAccumulator >= 0.022 && this.flightState !== 'GROUNDED') {
      this.trailSpawnAccumulator = 0;
      // Shift trail items in place (zero allocation)
      for (let i = this.trailPool.length - 1; i > 0; i--) {
        this.trailPool[i].x = this.trailPool[i - 1].x;
        this.trailPool[i].y = this.trailPool[i - 1].y;
        this.trailPool[i].alpha = this.trailPool[i - 1].alpha * 0.84;
        this.trailPool[i].scale = this.trailPool[i - 1].scale * 0.92;
        this.trailPool[i].color = this.trailPool[i - 1].color;
      }

      let dotColor = this.skin.trailColor;
      if (this.skin.rainbow) {
        this.rainbowHue = (this.rainbowHue + 0.07) % 1;
        dotColor = Phaser.Display.Color.HSLToColor(this.rainbowHue, 0.95, 0.6).color;
        this.glowCircle.setFillStyle(dotColor, 0.3);
      }

      this.trailPool[0].x = this.bodyState.x;
      this.trailPool[0].y = this.bodyState.y;
      this.trailPool[0].alpha = 0.62;
      this.trailPool[0].scale = 1.0;
      this.trailPool[0].color = dotColor;
    }

    // Render motion trail
    this.trailGraphics.clear();
    for (let i = this.trailPool.length - 1; i >= 1; i--) {
      const dot = this.trailPool[i];
      if (dot.alpha <= 0.03) continue;
      this.trailGraphics.fillStyle(dot.color, dot.alpha);
      this.trailGraphics.fillCircle(dot.x, dot.y, Math.max(2, 9 * dot.scale));
    }

    // Render subtle timing ring when falling into kick zone
    this.targetRingGraphics.clear();
    if (showTimingHelper && this.bodyState.vy > 0 && this.flightState !== 'GROUNDED') {
      const idealKickY = COURT_CONFIG.GROUND_Y - 58;
      const distToIdeal = Math.abs(this.bodyState.y - idealKickY);
      if (distToIdeal < 120) {
        const ringRatio = Phaser.Math.Clamp(distToIdeal / 120, 0.15, 1);
        const isSweetSpot = distToIdeal <= 42;
        const ringColor = isSweetSpot ? 0x22c55e : 0xfacc15;
        this.targetRingGraphics.lineStyle(isSweetSpot ? 3 : 2, ringColor, isSweetSpot ? 0.85 : 0.45);
        this.targetRingGraphics.strokeCircle(
          this.bodyState.x,
          this.bodyState.y,
          16 + ringRatio * 24
        );
      }
    }
  }

  public override destroy(fromScene?: boolean): void {
    this.groundShadow?.destroy();
    this.trailGraphics?.destroy();
    this.targetRingGraphics?.destroy();
    super.destroy(fromScene);
  }
}

