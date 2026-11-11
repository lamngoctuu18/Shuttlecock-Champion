import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { AdService } from '../managers/AdService';
import { AudioManager } from '../managers/AudioManager';
import { StorageManager } from '../managers/StorageManager';
import { SessionStats } from '../types';

export class GameOverPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    stats: SessionStats,
    onPlayAgain: () => void,
    onMainMenu: () => void
  ) {
    this.scene = scene;
    this.container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(60);

    this.buildPanel(stats, onPlayAgain, onMainMenu);
  }

  private buildPanel(
    stats: SessionStats,
    onPlayAgain: () => void,
    onMainMenu: () => void
  ): void {
    const save = StorageManager.getInstance().getData();
    const bestRecord =
      stats.mode === 'TIME_ATTACK' ? save.bestScoreTimeAttack : save.bestScore;

    // Card background
    const card = this.scene.add.graphics();
    card.fillStyle(0x0f172a, 0.92);
    card.lineStyle(4, stats.isNewBest ? 0xfacc15 : 0x38bdf8, 1);
    card.fillRoundedRect(-330, -255, 660, 510, 26);
    card.strokeRoundedRect(-330, -255, 660, 510, 26);
    this.container.add(card);

    // Header banner
    const headerTitle =
      stats.mode === 'CHALLENGE' && stats.challengeCompleted
        ? '🎉 HOÀN THÀNH THỬ THÁCH!'
        : stats.mode === 'TIME_ATTACK'
        ? '⏱️ HẾT GIỜ THI ĐẤU!'
        : 'KẾT THÚC LƯỢT CHƠI';

    const titleTxt = this.scene.add
      .text(0, -205, headerTitle, {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: stats.isNewBest || stats.challengeCompleted ? '#fde047' : '#ffffff'
      })
      .setOrigin(0.5);
    this.container.add(titleTxt);

    // New Personal Best badge with pulse animation
    if (stats.isNewBest) {
      const badge = this.scene.add
        .text(0, -162, '🏆 KỶ LỤC CÁ NHÂN MỚI! 🏆', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#fbbf24',
          backgroundColor: '#78350f',
          padding: { x: 16, y: 5 }
        })
        .setOrigin(0.5);
      this.container.add(badge);

      this.scene.tweens.add({
        targets: badge,
        scale: 1.1,
        duration: 450,
        yoyo: true,
        repeat: -1
      });
    }

    // Stats grid
    const rows: Array<{ label: string; value: string; color: string }> = [
      { label: 'Tổng Điểm (Total Score)', value: `${stats.score}`, color: '#fde047' },
      { label: 'Kỷ Lục Cá Nhân (Best Score)', value: `${bestRecord}`, color: '#38bdf8' },
      { label: 'Số Lần Tâng Cầu (Total Kicks)', value: `${stats.kicks} lần`, color: '#4ade80' },
      {
        label: 'Combo Cao Nhất (Max Combo)',
        value: `x${stats.maxCombo} (${stats.perfectCount} Perfect)`,
        color: '#fb923c'
      },
      {
        label: 'Thời Gian Chơi (Play Time)',
        value: `${stats.playTimeSec.toFixed(1)} giây`,
        color: '#e2e8f0'
      },
      {
        label: 'Phần Thưởng Nhận Được',
        value: `+${stats.coinsEarned} ⭐ Sao Vàng`,
        color: '#facc15'
      }
    ];

    rows.forEach((row, i) => {
      const y = -112 + i * 42;
      const rowBg = this.scene.add.graphics();
      rowBg.fillStyle(0x1e293b, i % 2 === 0 ? 0.85 : 0.55);
      rowBg.fillRoundedRect(-275, y - 16, 550, 34, 8);
      this.container.add(rowBg);

      const lbl = this.scene.add
        .text(-255, y, row.label, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '17px',
          color: '#cbd5e1'
        })
        .setOrigin(0, 0.5);

      const val = this.scene.add
        .text(255, y, row.value, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '19px',
          fontStyle: 'bold',
          color: row.color
        })
        .setOrigin(1, 0.5);

      this.container.add([lbl, val]);
    });

    // Newly unlocked achievements notice
    if (stats.newlyUnlockedAchievements.length > 0) {
      const achNames = stats.newlyUnlockedAchievements
        .map((a) => `${a.icon} ${a.title}`)
        .join('  •  ');
      const achTxt = this.scene.add
        .text(0, 142, `Mở khóa thành tựu: ${achNames}`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#4ade80'
        })
        .setOrigin(0.5);
      this.container.add(achTxt);
    }

    // Action Buttons: PLAY AGAIN, REWARDED AD (+80 STARS), & MAIN MENU
    let adProcessing = false;
    let rewardedClaimed = false;

    const makeActionBtn = (
      x: number,
      y: number,
      w: number,
      label: string,
      bgColor: number,
      borderColor: number,
      onClick: () => void
    ) => {
      const btn = this.scene.add.container(x, y);
      const h = 54;
      const g = this.scene.add.graphics();
      g.fillStyle(bgColor, 1);
      g.lineStyle(3, borderColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

      const t = this.scene.add
        .text(0, 0, label, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        if (adProcessing) return;
        AudioManager.getInstance().playClick();
        onClick();
      });

      btn.add([g, t, hit]);
      return { btn, textObj: t };
    };

    const playAgainBtn = makeActionBtn(
      -195,
      202,
      180,
      '🔄 PLAY AGAIN',
      0x16a34a,
      0x86efac,
      async () => {
        adProcessing = true;
        await AdService.getInstance().requestInterstitialBetweenMatches();
        adProcessing = false;
        onPlayAgain();
      }
    );

    const rewardedBtn = makeActionBtn(
      0,
      202,
      190,
      '🎬 +80 ⭐ (XEM ADS)',
      0xd97706,
      0xfde047,
      async () => {
        if (rewardedClaimed) return;
        adProcessing = true;
        const rewarded = await AdService.getInstance().requestRewardedAd();
        adProcessing = false;
        if (rewarded) {
          rewardedClaimed = true;
          StorageManager.getInstance().addCoins(80);
          AudioManager.getInstance().playNewRecord();
          rewardedBtn.textObj.setText('✓ ĐÃ NHẬN +80 ⭐');
        } else {
          rewardedBtn.textObj.setText('ADS CHƯA SẴN SÀNG');
        }
      }
    );

    const mainMenuBtn = makeActionBtn(
      195,
      202,
      180,
      '🏠 MAIN MENU',
      0x0284c7,
      0x7dd3fc,
      async () => {
        adProcessing = true;
        await AdService.getInstance().requestInterstitialBetweenMatches();
        adProcessing = false;
        onMainMenu();
      }
    );

    this.container.add([playAgainBtn.btn, rewardedBtn.btn, mainMenuBtn.btn]);

    // Entrance pop animation
    this.container.setScale(0.88);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 280,
      ease: 'Back.easeOut'
    });
  }
}

