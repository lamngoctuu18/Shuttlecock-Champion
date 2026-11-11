import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { StorageManager } from '../managers/StorageManager';
import { SchoolyardBackground } from '../ui/SchoolyardBackground';

export class SettingsScene extends Phaser.Scene {
  private background!: SchoolyardBackground;
  private confirmResetVisible: boolean = false;
  private confirmModal?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  public create(): void {
    this.background = new SchoolyardBackground(this);
    this.confirmResetVisible = false;
    this.buildSettingsUI();
  }

  private buildSettingsUI(): void {
    const storage = StorageManager.getInstance();
    const settings = storage.getSettings();
    const save = storage.getData();

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const card = this.add.graphics().setDepth(20);
    card.fillStyle(0x0f172a, 0.92);
    card.lineStyle(4, 0xfacc15, 1);
    card.fillRoundedRect(cx - 360, cy - 270, 720, 540, 24);
    card.strokeRoundedRect(cx - 360, cy - 270, 720, 540, 24);

    this.add
      .text(cx, cy - 220, '⚙️ CÀI ĐẶT & DỮ LIỆU (SETTINGS)', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#fde047'
      })
      .setOrigin(0.5)
      .setDepth(25);

    const makeToggleRow = (
      y: number,
      label: string,
      currentValue: boolean,
      onToggle: (nextVal: boolean) => void
    ) => {
      const row = this.add.container(cx, y).setDepth(25);
      const rBg = this.add.graphics();
      rBg.fillStyle(0x1e293b, 0.9);
      rBg.fillRoundedRect(-290, -26, 580, 52, 12);

      const lbl = this.add
        .text(-265, 0, label, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#f8fafc'
        })
        .setOrigin(0, 0.5);

      const btnBg = this.add.graphics();
      const btnTxt = this.add
        .text(210, 0, '', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      let state = currentValue;
      const renderToggle = () => {
        btnBg.clear();
        btnBg.fillStyle(state ? 0x16a34a : 0x64748b, 1);
        btnBg.fillRoundedRect(145, -18, 130, 36, 10);
        btnTxt.setText(state ? 'BẬT (ON)' : 'TẮT (OFF)');
      };
      renderToggle();

      const hit = this.add
        .rectangle(210, 0, 135, 40, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        state = !state;
        renderToggle();
        onToggle(state);
        AudioManager.getInstance().playClick();
      });

      row.add([rBg, lbl, btnBg, btnTxt, hit]);
    };

    makeToggleRow(cy - 140, '🎵 Nhạc Nền Sân Trường (Background Music)', settings.musicEnabled, (val) => {
      storage.updateSettings({ musicEnabled: val });
      AudioManager.getInstance().refreshMusicState();
    });

    makeToggleRow(cy - 75, '🔊 Hiệu Ứng Âm Thanh (Sound Effects)', settings.sfxEnabled, (val) => {
      storage.updateSettings({ sfxEnabled: val });
    });

    makeToggleRow(
      cy - 10,
      '🎯 Hiển Thị Vòng Tròn Tầm Chân (Hitbox Helper)',
      settings.showHitboxHelper,
      (val) => {
        storage.updateSettings({ showHitboxHelper: val });
      }
    );

    makeToggleRow(
      cy + 55,
      '📳 Rung Phản Hồi Trên Điện Thoại (Vibration)',
      settings.vibrationEnabled,
      (val) => {
        storage.updateSettings({ vibrationEnabled: val });
      }
    );

    // Lifetime stats summary line
    this.add
      .text(
        cx,
        cy + 118,
        `Tổng lượt tâng cầu: ${save.totalKicks} lần  |  Tổng cú Perfect: ${save.totalPerfects}  |  Thời gian chơi: ${Math.floor(save.totalPlayTimeSec / 60)}p ${save.totalPlayTimeSec % 60}s`,
        {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          color: '#94a3b8'
        }
      )
      .setOrigin(0.5)
      .setDepth(25);

    // Reset Data Button (with confirmation dialog as required in Section 8)
    const resetBtn = this.add.container(cx - 150, cy + 195).setDepth(25);
    const rBg = this.add.graphics();
    rBg.fillStyle(0xdc2626, 1);
    rBg.lineStyle(2, 0xfca5a5, 1);
    rBg.fillRoundedRect(-130, -24, 260, 48, 14);
    rBg.strokeRoundedRect(-130, -24, 260, 48, 14);
    const rTxt = this.add
      .text(0, 0, '🗑️ XÓA DỮ LIỆU (RESET)', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    const rHit = this.add
      .rectangle(0, 0, 260, 48, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    rHit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.showResetConfirmDialog();
    });
    resetBtn.add([rBg, rTxt, rHit]);

    // Back to Main Menu Button
    const backBtn = this.add.container(cx + 150, cy + 195).setDepth(25);
    const bBg = this.add.graphics();
    bBg.fillStyle(0x0284c7, 1);
    bBg.lineStyle(2, 0x7dd3fc, 1);
    bBg.fillRoundedRect(-130, -24, 260, 48, 14);
    bBg.strokeRoundedRect(-130, -24, 260, 48, 14);
    const bTxt = this.add
      .text(0, 0, '🏠 VỀ MÀN HÌNH CHÍNH', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
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

  private showResetConfirmDialog(): void {
    if (this.confirmResetVisible) return;
    this.confirmResetVisible = true;

    const modal = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(80);
    const overlay = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0f172a, 0.78)
      .setInteractive();

    const box = this.add.graphics();
    box.fillStyle(0x1e293b, 1);
    box.lineStyle(3, 0xef4444, 1);
    box.fillRoundedRect(-240, -120, 480, 240, 20);
    box.strokeRoundedRect(-240, -120, 480, 240, 20);

    const warnTitle = this.add
      .text(0, -70, '⚠️ XÁC NHẬN XÓA DỮ LIỆU?', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#f87171'
      })
      .setOrigin(0.5);

    const warnDesc = this.add
      .text(
        0,
        -15,
        'Toàn bộ kỷ lục điểm số, Sao Vàng, Trang Phục\nvà Thành Tựu sẽ trở về mặc định ban đầu.',
        {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '15px',
          color: '#e2e8f0',
          align: 'center'
        }
      )
      .setOrigin(0.5);

    // Confirm Yes
    const yesBg = this.add.graphics();
    yesBg.fillStyle(0xdc2626, 1);
    yesBg.fillRoundedRect(-185, 45, 165, 46, 12);
    const yesTxt = this.add
      .text(-102, 68, 'XÓA NGAY', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    const yesHit = this.add
      .rectangle(-102, 68, 165, 46, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    yesHit.on('pointerdown', () => {
      StorageManager.getInstance().resetAllData();
      AudioManager.getInstance().playGameOver();
      this.scene.restart();
    });

    // Cancel No
    const noBg = this.add.graphics();
    noBg.fillStyle(0x475569, 1);
    noBg.fillRoundedRect(20, 45, 165, 46, 12);
    const noTxt = this.add
      .text(102, 68, 'HỦY BỎ', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    const noHit = this.add
      .rectangle(102, 68, 165, 46, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    noHit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      modal.destroy();
      this.confirmResetVisible = false;
    });

    modal.add([overlay, box, warnTitle, warnDesc, yesBg, yesTxt, yesHit, noBg, noTxt, noHit]);
    this.confirmModal = modal;
  }

  public update(_time: number, deltaMs: number): void {
    this.background.update(Math.min(deltaMs / 1000, 0.05));
  }
}

