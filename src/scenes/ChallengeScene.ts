import Phaser from 'phaser';
import { CHALLENGE_MISSIONS, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { StorageManager } from '../managers/StorageManager';
import { SchoolyardBackground } from '../ui/SchoolyardBackground';

export class ChallengeScene extends Phaser.Scene {
  private background!: SchoolyardBackground;

  constructor() {
    super({ key: 'ChallengeScene' });
  }

  public create(): void {
    this.background = new SchoolyardBackground(this);
    const save = StorageManager.getInstance().getData();

    // Backdrop panel
    const panel = this.add.graphics().setDepth(20);
    panel.fillStyle(0x0f172a, 0.88);
    panel.lineStyle(4, 0xfacc15, 1);
    panel.fillRoundedRect(70, 36, GAME_WIDTH - 140, GAME_HEIGHT - 72, 24);
    panel.strokeRoundedRect(70, 36, GAME_WIDTH - 140, GAME_HEIGHT - 72, 24);

    this.add
      .text(GAME_WIDTH / 2, 82, '🎯 CHẾ ĐỘ THỬ THÁCH (CHALLENGE MODE)', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#fde047'
      })
      .setOrigin(0.5)
      .setDepth(25);

    this.add
      .text(
        GAME_WIDTH / 2,
        118,
        `Hoàn thành nhiệm vụ để nhận Sao Vàng mở khóa Trang Phục & Cầu! (Đã đạt: ${save.completedChallenges.length}/${CHALLENGE_MISSIONS.length})`,
        {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '15px',
          color: '#38bdf8'
        }
      )
      .setOrigin(0.5)
      .setDepth(25);

    // 6 Challenge Cards in 3x2 grid
    CHALLENGE_MISSIONS.forEach((mission, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = 290 + col * 350;
      const y = 248 + row * 205;
      const completed = save.completedChallenges.includes(mission.id);

      const card = this.add.container(x, y).setDepth(25);
      const w = 324;
      const h = 180;

      const bg = this.add.graphics();
      bg.fillStyle(completed ? 0x064e3b : 0x1e293b, 0.96);
      bg.lineStyle(3, completed ? 0x4ade80 : 0x38bdf8, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);

      const title = this.add
        .text(0, -56, `${completed ? '✅ ' : '🎯 '}${mission.title}`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: completed ? '#4ade80' : '#fde047'
        })
        .setOrigin(0.5);

      const desc = this.add
        .text(0, -14, mission.description, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          color: '#e2e8f0',
          wordWrap: { width: w - 32 },
          align: 'center'
        })
        .setOrigin(0.5);

      const reward = this.add
        .text(0, 26, `Phần thưởng: ${mission.rewardLabel}`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#facc15'
        })
        .setOrigin(0.5);

      const playBtnBg = this.add.graphics();
      playBtnBg.fillStyle(completed ? 0x059669 : 0x0284c7, 1);
      playBtnBg.fillRoundedRect(-95, 46, 190, 34, 10);

      const playBtnTxt = this.add
        .text(0, 63, completed ? 'CHƠI LẠI ▶' : 'BẮT ĐẦU ▶', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const hit = this.add
        .rectangle(0, 0, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        GameStateManager.getInstance().setMode('CHALLENGE', mission.id);
        this.scene.start('GameScene');
      });

      card.add([bg, title, desc, reward, playBtnBg, playBtnTxt, hit]);
    });

    // Back to Main Menu button
    const backBtn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 74).setDepth(25);
    const bBg = this.add.graphics();
    bBg.fillStyle(0xd97706, 1);
    bBg.lineStyle(2, 0xfde047, 1);
    bBg.fillRoundedRect(-130, -24, 260, 48, 14);
    bBg.strokeRoundedRect(-130, -24, 260, 48, 14);

    const bTxt = this.add
      .text(0, 0, '⬅  VỀ MÀN HÌNH CHÍNH', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const bHit = this.add
      .rectangle(0, 0, 260, 48, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    bHit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.scene.start('MenuScene');
    });

    backBtn.add([bBg, bTxt, bHit]);
  }

  public update(_time: number, deltaMs: number): void {
    this.background.update(Math.min(deltaMs / 1000, 0.05));
  }
}

