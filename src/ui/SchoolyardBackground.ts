import Phaser from 'phaser';
import { COURT_CONFIG, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';

interface CloudItem {
  graphic: Phaser.GameObjects.Container;
  speed: number;
}

interface PetalItem {
  dot: Phaser.GameObjects.Ellipse;
  vx: number;
  vy: number;
  phase: number;
}

export class SchoolyardBackground {
  private scene: Phaser.Scene;
  private clouds: CloudItem[] = [];
  private petals: PetalItem[] = [];
  private flagWaveGraphics: Phaser.GameObjects.Graphics;
  private flagTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createSkyAndSun();
    this.createClouds();
    this.createSchoolBuildingAndFence();
    this.createFlamboyantTreesAndBenches();
    this.createCourtSurface();
    this.flagWaveGraphics = scene.add.graphics().setDepth(5);
    this.createFallingPetalsPool();
  }

  private createSkyAndSun(): void {
    const g = this.scene.add.graphics().setDepth(0);
    // Warm nostalgic Vietnamese morning sky gradient
    g.fillGradientStyle(0x38bdf8, 0x38bdf8, 0xbae6fd, 0xe0f2fe, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Soft glowing sun
    g.fillStyle(0xfef08a, 0.28);
    g.fillCircle(1080, 110, 78);
    g.fillStyle(0xfde047, 0.65);
    g.fillCircle(1080, 110, 48);
  }

  private createClouds(): void {
    const cloudConfigs = [
      { x: 210, y: 95, scale: 1.0, speed: 12 },
      { x: 640, y: 72, scale: 0.85, speed: 9 },
      { x: 980, y: 125, scale: 1.15, speed: 15 }
    ];

    cloudConfigs.forEach((cfg) => {
      const container = this.scene.add.container(cfg.x, cfg.y).setDepth(1).setScale(cfg.scale);
      const cg = this.scene.add.graphics();
      cg.fillStyle(0xffffff, 0.88);
      cg.fillCircle(0, 0, 28);
      cg.fillCircle(-26, 6, 20);
      cg.fillCircle(26, 6, 22);
      cg.fillRoundedRect(-42, 4, 84, 22, 10);
      container.add(cg);
      this.clouds.push({ graphic: container, speed: cfg.speed });
    });
  }

  private createSchoolBuildingAndFence(): void {
    const g = this.scene.add.graphics().setDepth(2);

    // Distant greenery hills / trees behind fence
    g.fillStyle(0x4ade80, 0.45);
    g.fillCircle(180, 390, 110);
    g.fillCircle(360, 400, 95);
    g.fillCircle(940, 395, 105);
    g.fillCircle(1120, 385, 120);

    // Traditional Vietnamese yellow school building with red tile roof in background
    const bx = 370;
    const by = 225;
    const bw = 540;
    const bh = 195;

    // Building walls (nostalgic warm yellow)
    g.fillStyle(0xfef08a, 1);
    g.lineStyle(3, 0xd97706, 0.8);
    g.fillRect(bx, by, bw, bh);
    g.strokeRect(bx, by, bw, bh);

    // Red clay roof (Mái ngói đỏ)
    g.fillStyle(0xdc2626, 1);
    g.lineStyle(3, 0x991b1b, 1);
    g.beginPath();
    g.moveTo(bx - 28, by + 4);
    g.lineTo(bx + 35, by - 48);
    g.lineTo(bx + bw - 35, by - 48);
    g.lineTo(bx + bw + 28, by + 4);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Corridor pillars & green wooden windows
    g.fillStyle(0xfde047, 1);
    g.fillRect(bx, by + 92, bw, 10);

    for (let i = 0; i < 5; i++) {
      const wx = bx + 42 + i * 98;
      // Upper floor window
      g.fillStyle(0x15803d, 1);
      g.fillRoundedRect(wx, by + 22, 54, 52, 4);
      g.fillStyle(0x86efac, 0.65);
      g.fillRect(wx + 6, by + 28, 18, 40);
      g.fillRect(wx + 30, by + 28, 18, 40);

      // Lower floor classroom arch/window
      g.fillStyle(0x166534, 1);
      g.fillRoundedRect(wx, by + 116, 54, 58, 4);
      g.fillStyle(0xbbf7d0, 0.55);
      g.fillRect(wx + 6, by + 122, 42, 46);
    }

    // School Motto Banner ("TIÊN HỌC LỄ - HẬU HỌC VĂN")
    g.fillStyle(0xb91c1c, 1);
    g.lineStyle(2, 0xfacc15, 1);
    g.fillRoundedRect(505, by + 80, 270, 24, 4);
    g.strokeRoundedRect(505, by + 80, 270, 24, 4);

    const bannerText = this.scene.add
      .text(640, by + 92, 'TIÊN HỌC LỄ - HẬU HỌC VĂN', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fef08a'
      })
      .setOrigin(0.5)
      .setDepth(3);
    void bannerText;

    // Flagpole in schoolyard
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(637, 115, 6, 305);
    g.fillStyle(0x475569, 1);
    g.fillRoundedRect(615, 405, 50, 16, 4);

    // Schoolyard perimeter fence (Hàng rào sân trường)
    g.fillStyle(0xe2e8f0, 1);
    g.fillRect(0, 412, GAME_WIDTH, 16);
    g.lineStyle(2, 0x64748b, 0.7);
    for (let fx = 10; fx < GAME_WIDTH; fx += 28) {
      g.beginPath();
      g.moveTo(fx, 382);
      g.lineTo(fx, 414);
      g.strokePath();
    }
    g.lineStyle(3, 0x475569, 0.9);
    g.strokeLineShape(new Phaser.Geom.Line(0, 388, GAME_WIDTH, 388));
  }

  private createFlamboyantTreesAndBenches(): void {
    const g = this.scene.add.graphics().setDepth(4);

    // Left & Right Flamboyant Trees (Cây Phượng Vĩ đỏ rực)
    const drawPhuongTree = (tx: number, flip: number) => {
      // Trunk
      g.fillStyle(0x78350f, 1);
      g.lineStyle(3, 0x451a03, 0.9);
      g.beginPath();
      g.moveTo(tx - 24, 435);
      g.lineTo(tx - 14, 240);
      g.lineTo(tx + 16, 240);
      g.lineTo(tx + 28, 435);
      g.closePath();
      g.fillPath();
      g.strokePath();

      // Green foliage canopy
      const canopyCenters = [
        { dx: -45 * flip, dy: 225, r: 58 },
        { dx: 35 * flip, dy: 215, r: 64 },
        { dx: 0, dy: 185, r: 68 },
        { dx: -25 * flip, dy: 165, r: 54 },
        { dx: 55 * flip, dy: 180, r: 52 }
      ];
      canopyCenters.forEach((c) => {
        g.fillStyle(0x16a34a, 0.95);
        g.fillCircle(tx + c.dx, c.dy, c.r);
        g.fillStyle(0x22c55e, 0.85);
        g.fillCircle(tx + c.dx - 6, c.dy - 6, c.r * 0.82);
      });

      // Vibrant red-orange Flamboyant flower clusters (Hoa phượng đỏ)
      const flowerSpots = [
        { dx: -52 * flip, dy: 205, r: 26 },
        { dx: -10 * flip, dy: 155, r: 32 },
        { dx: 42 * flip, dy: 170, r: 28 },
        { dx: 20 * flip, dy: 205, r: 25 },
        { dx: -30 * flip, dy: 182, r: 22 },
        { dx: 62 * flip, dy: 195, r: 20 }
      ];
      flowerSpots.forEach((f) => {
        g.fillStyle(0xef4444, 0.95);
        g.fillCircle(tx + f.dx, f.dy, f.r);
        g.fillStyle(0xf97316, 0.85);
        g.fillCircle(tx + f.dx + 4, f.dy - 3, f.r * 0.65);
      });
    };

    drawPhuongTree(115, 1);
    drawPhuongTree(1165, -1);

    // Classic Vietnamese schoolyard stone benches (Ghế đá sân trường)
    const drawStoneBench = (bx: number, by: number) => {
      // Bench legs
      g.fillStyle(0x64748b, 1);
      g.fillRect(bx - 42, by + 8, 10, 16);
      g.fillRect(bx + 32, by + 8, 10, 16);
      // Backrest
      g.fillStyle(0xcbd5e1, 1);
      g.lineStyle(2, 0x475569, 0.9);
      g.fillRoundedRect(bx - 52, by - 14, 104, 14, 4);
      g.strokeRoundedRect(bx - 52, by - 14, 104, 14, 4);
      // Seat slab
      g.fillStyle(0x94a3b8, 1);
      g.fillRoundedRect(bx - 56, by, 112, 10, 3);
      g.strokeRoundedRect(bx - 56, by, 112, 10, 3);
    };

    drawStoneBench(245, 424);
    drawStoneBench(1035, 424);
  }

  private createCourtSurface(): void {
    const g = this.scene.add.graphics().setDepth(3);

    // Schoolyard ground area
    g.fillGradientStyle(0xd97706, 0xd97706, 0xb45309, 0x92400e, 1);
    g.fillRect(0, 428, GAME_WIDTH, GAME_HEIGHT - 428);

    // Inner athletic court surface (Green/Teal sport court with crisp white lines)
    const courtTopY = 456;
    const courtBottomY = 626;
    g.fillStyle(0x0d9488, 1);
    g.lineStyle(4, 0xffffff, 0.92);

    g.beginPath();
    g.moveTo(155, courtTopY);
    g.lineTo(1125, courtTopY);
    g.lineTo(1210, courtBottomY);
    g.lineTo(70, courtBottomY);
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Inner court boundary & center line markings (Vạch kẻ sân đá cầu)
    g.lineStyle(3, 0xffffff, 0.75);
    g.beginPath();
    g.moveTo(640, courtTopY);
    g.lineTo(640, courtBottomY);
    g.moveTo(118, (courtTopY + courtBottomY) / 2);
    g.lineTo(1162, (courtTopY + courtBottomY) / 2);
    g.strokePath();

    // Subtle ground line indicator at COURT_CONFIG.GROUND_Y
    g.lineStyle(2, 0xfef08a, 0.35);
    g.strokeLineShape(
      new Phaser.Geom.Line(
        COURT_CONFIG.COURT_LEFT - 20,
        COURT_CONFIG.GROUND_Y + 8,
        COURT_CONFIG.COURT_RIGHT + 20,
        COURT_CONFIG.GROUND_Y + 8
      )
    );
  }

  private createFallingPetalsPool(): void {
    for (let i = 0; i < 14; i++) {
      const startX = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const startY = Phaser.Math.Between(140, 560);
      const dot = this.scene.add
        .ellipse(startX, startY, 8, 5, i % 2 === 0 ? 0xef4444 : 0xf97316, 0.8)
        .setDepth(6);
      this.petals.push({
        dot,
        vx: Phaser.Math.FloatBetween(14, 34),
        vy: Phaser.Math.FloatBetween(22, 45),
        phase: Phaser.Math.FloatBetween(0, Math.PI * 2)
      });
    }
  }

  public update(deltaSec: number): void {
    this.flagTime += deltaSec;

    // Move clouds gently
    for (const c of this.clouds) {
      c.graphic.x += c.speed * deltaSec;
      if (c.graphic.x > GAME_WIDTH + 90) {
        c.graphic.x = -90;
      }
    }

    // Animate falling flamboyant petals (object pooled)
    for (const p of this.petals) {
      p.phase += deltaSec * 3;
      p.dot.x += (p.vx + Math.sin(p.phase) * 18) * deltaSec;
      p.dot.y += p.vy * deltaSec;
      p.dot.rotation = Math.sin(p.phase) * 0.6;

      if (p.dot.y > 590 || p.dot.x > GAME_WIDTH + 20) {
        p.dot.x = Math.random() > 0.5 ? Phaser.Math.Between(50, 240) : Phaser.Math.Between(1000, 1220);
        p.dot.y = Phaser.Math.Between(160, 230);
      }
    }

    // Animate waving Vietnamese Flag on the flagpole
    const fg = this.flagWaveGraphics;
    fg.clear();
    const poleX = 642;
    const poleY = 120;
    const wave = Math.sin(this.flagTime * 5) * 4;
    fg.fillStyle(0xef4444, 1);
    fg.beginPath();
    fg.moveTo(poleX, poleY);
    fg.lineTo(poleX + 46, poleY + wave);
    fg.lineTo(poleX + 46, poleY + 30 + wave);
    fg.lineTo(poleX, poleY + 30);
    fg.closePath();
    fg.fillPath();

    // Gold star on flag
    fg.fillStyle(0xfacc15, 1);
    fg.fillCircle(poleX + 23, poleY + 15 + wave * 0.5, 6);
  }
}

