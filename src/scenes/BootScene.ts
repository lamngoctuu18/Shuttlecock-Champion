import Phaser from 'phaser';
import { AdService } from '../managers/AdService';
import { StorageManager } from '../managers/StorageManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public async create(): Promise<void> {
    // Ensure StorageManager is initialized and sanitized on boot
    StorageManager.getInstance();

    // Initialize CrazyGames HTML5 SDK v3 if running on CrazyGames
    await AdService.getInstance().initialize();

    // Generate crisp procedural particle textures for high-FPS object pooling
    this.generateParticleTextures();

    this.scene.start('PreloadScene');
  }

  private generateParticleTextures(): void {
    // 1. Circle spark texture
    const gCircle = this.make.graphics({ x: 0, y: 0 });
    gCircle.fillStyle(0xffffff, 1);
    gCircle.fillCircle(8, 8, 8);
    gCircle.generateTexture('tex_spark', 16, 16);
    gCircle.destroy();

    // 2. Star particle texture
    const gStar = this.make.graphics({ x: 0, y: 0 });
    gStar.fillStyle(0xfde047, 1);
    gStar.lineStyle(1.5, 0xf59e0b, 1);
    const cx = 12;
    const cy = 12;
    const spikes = 5;
    const outerR = 11;
    const innerR = 5;
    gStar.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) gStar.moveTo(px, py);
      else gStar.lineTo(px, py);
    }
    gStar.closePath();
    gStar.fillPath();
    gStar.strokePath();
    gStar.generateTexture('tex_star', 24, 24);
    gStar.destroy();
  }
}

