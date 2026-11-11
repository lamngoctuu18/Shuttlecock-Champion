import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { AdService } from '../managers/AdService';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  public create(): void {
    AdService.getInstance().loadingStart();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e3a8a, 0x1e3a8a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(cx, cy - 85, 'SHUTTLECOCK CHAMPION', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
        color: '#fde047'
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 38, 'ĐÁ CẦU TUỔI THƠ – ĐANG KHỞI TẠO SÂN TRƯỜNG...', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '18px',
        color: '#38bdf8'
      })
      .setOrigin(0.5);

    const barBox = this.add.graphics();
    barBox.fillStyle(0x1e293b, 1);
    barBox.lineStyle(3, 0xfacc15, 1);
    barBox.fillRoundedRect(cx - 220, cy + 10, 440, 28, 14);
    barBox.strokeRoundedRect(cx - 220, cy + 10, 440, 28, 14);

    const progressBar = this.add.graphics();
    const progressState = { value: 0.1 };

    this.tweens.add({
      targets: progressState,
      value: 1,
      duration: 260,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        progressBar.clear();
        progressBar.fillStyle(0x22c55e, 1);
        progressBar.fillRoundedRect(
          cx - 214,
          cy + 15,
          Math.max(16, 428 * progressState.value),
          18,
          9
        );
      },
      onComplete: () => {
        AdService.getInstance().loadingStop();
        this.scene.start('MenuScene');
      }
    });
  }
}
