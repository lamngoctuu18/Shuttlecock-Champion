import Phaser from 'phaser';
import {
  CHARACTERS,
  COSTUMES,
  GAME_HEIGHT,
  GAME_WIDTH,
  SHUTTLECOCK_SKINS
} from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { StorageManager } from '../managers/StorageManager';
import { AchievementSystem } from '../systems/AchievementSystem';

export interface MainMenuCallbacks {
  onStartClassic: () => void;
  onOpenChallenges: () => void;
  onStartTimeAttack: () => void;
  onStartPractice: (freeMode: boolean) => void;
  onOpenSettings: () => void;
  onAppearanceChanged: () => void;
}

export class MainMenu {
  private scene: Phaser.Scene;
  private callbacks: MainMenuCallbacks;
  private activeModal: Phaser.GameObjects.Container | null = null;
  private coinsBadgeText!: Phaser.GameObjects.Text;
  private recordBadgeText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, callbacks: MainMenuCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    this.createHeaderAndLogo();
    this.createMenuButtons();
  }

  private createHeaderAndLogo(): void {
    const save = StorageManager.getInstance().getData();

    // Top-left Personal Record pill
    const recordPill = this.scene.add.container(210, 42).setDepth(30);
    const rBg = this.scene.add.graphics();
    rBg.fillStyle(0x0f172a, 0.85);
    rBg.lineStyle(2, 0x38bdf8, 0.9);
    rBg.fillRoundedRect(-175, -24, 350, 48, 24);
    rBg.strokeRoundedRect(-175, -24, 350, 48, 24);

    this.recordBadgeText = this.scene.add
      .text(
        0,
        0,
        `🏆 Kỷ lục: ${save.bestScore}   |   🔥 Combo: x${save.bestCombo}`,
        {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#fef08a'
        }
      )
      .setOrigin(0.5);
    recordPill.add([rBg, this.recordBadgeText]);

    // Top-right Star Coins pill
    const coinPill = this.scene.add.container(GAME_WIDTH - 145, 42).setDepth(30);
    const cBg = this.scene.add.graphics();
    cBg.fillStyle(0x0f172a, 0.85);
    cBg.lineStyle(2, 0xfacc15, 0.9);
    cBg.fillRoundedRect(-110, -24, 220, 48, 24);
    cBg.strokeRoundedRect(-110, -24, 220, 48, 24);

    this.coinsBadgeText = this.scene.add
      .text(0, 0, `⭐ ${save.coins} Sao Vàng`, {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#fde047'
      })
      .setOrigin(0.5);
    coinPill.add([cBg, this.coinsBadgeText]);

    // Main Logo Container
    const logoContainer = this.scene.add.container(355, 165).setDepth(30);

    const logoPlate = this.scene.add.graphics();
    logoPlate.fillStyle(0x0f172a, 0.78);
    logoPlate.lineStyle(4, 0xf59e0b, 1);
    logoPlate.fillRoundedRect(-305, -78, 610, 152, 26);
    logoPlate.strokeRoundedRect(-305, -78, 610, 152, 26);

    const mainTitle = this.scene.add
      .text(0, -22, 'SHUTTLECOCK CHAMPION', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#fde047',
        stroke: '#78350f',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    const subTitle = this.scene.add
      .text(0, 30, '✨ ĐÁ CẦU TUỔI THƠ – SÂN TRƯỜNG VIỆT NAM ✨', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#38bdf8'
      })
      .setOrigin(0.5);

    logoContainer.add([logoPlate, mainTitle, subTitle]);

    this.scene.tweens.add({
      targets: logoContainer,
      y: 171,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createMenuButtons(): void {
    const panelX = 355;
    const startY = 315;

    // Primary PLAY button
    const playBtn = this.createStyledButton(
      panelX,
      startY,
      380,
      68,
      '▶   PLAY (CHƠI NGAY)',
      0x16a34a,
      0x86efac,
      26,
      () => this.openModeSelectModal()
    );

    this.scene.tweens.add({
      targets: playBtn,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 750,
      yoyo: true,
      repeat: -1
    });

    // Secondary buttons in 2x2 grid below PLAY
    this.createStyledButton(
      panelX - 100,
      startY + 86,
      182,
      54,
      '📖 HOW TO PLAY',
      0x0284c7,
      0x7dd3fc,
      16,
      () => this.openHowToPlayModal()
    );

    this.createStyledButton(
      panelX + 100,
      startY + 86,
      182,
      54,
      '👕 CHARACTER',
      0x9333ea,
      0xd8b4fe,
      16,
      () => this.openCharacterModal()
    );

    this.createStyledButton(
      panelX - 100,
      startY + 154,
      182,
      54,
      '🏆 ACHIEVEMENTS',
      0xd97706,
      0xfde047,
      16,
      () => this.openAchievementsModal()
    );

    this.createStyledButton(
      panelX + 100,
      startY + 154,
      182,
      54,
      '⚙️ SETTINGS',
      0x475569,
      0xcbd5e1,
      16,
      () => this.callbacks.onOpenSettings()
    );
  }

  private createStyledButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgColor: number,
    borderColor: number,
    fontSize: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y).setDepth(30);
    const bg = this.scene.add.graphics();
    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? Phaser.Display.Color.ValueToColor(bgColor).brighten(12).color : bgColor, 0.96);
      bg.lineStyle(3, borderColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    };
    draw(false);

    const txt = this.scene.add
      .text(0, 0, label, {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const hit = this.scene.add
      .rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      onClick();
    });

    c.add([bg, txt, hit]);
    return c;
  }

  private closeActiveModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }
  }

  private refreshHeaderBadges(): void {
    const save = StorageManager.getInstance().getData();
    this.coinsBadgeText.setText(`⭐ ${save.coins} Sao Vàng`);
    this.recordBadgeText.setText(
      `🏆 Kỷ lục: ${save.bestScore}   |   🔥 Combo: x${save.bestCombo}`
    );
  }

  private createModalFrame(title: string, width: number = 820, height: number = 540): Phaser.GameObjects.Container {
    this.closeActiveModal();
    const modal = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(90);

    const backdrop = this.scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0f172a, 0.76)
      .setInteractive();

    const card = this.scene.add.graphics();
    card.fillStyle(0x1e293b, 0.98);
    card.lineStyle(4, 0xfacc15, 1);
    card.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
    card.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);

    const headerTxt = this.scene.add
      .text(0, -height / 2 + 38, title, {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#fde047'
      })
      .setOrigin(0.5);

    // Close button
    const closeBtn = this.scene.add.container(width / 2 - 38, -height / 2 + 38);
    const cBg = this.scene.add.graphics();
    cBg.fillStyle(0xef4444, 1);
    cBg.fillCircle(0, 0, 20);
    const cTxt = this.scene.add
      .text(0, 0, '✕', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5);
    const cHit = this.scene.add
      .circle(0, 0, 22, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    cHit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.closeActiveModal();
    });
    closeBtn.add([cBg, cTxt, cHit]);

    modal.add([backdrop, card, headerTxt, closeBtn]);
    this.activeModal = modal;
    return modal;
  }

  private openModeSelectModal(): void {
    const modal = this.createModalFrame('CHỌN CHẾ ĐỘ CHƠI (SELECT GAME MODE)', 860, 470);
    const save = StorageManager.getInstance().getData();

    const modes = [
      {
        title: '🏅 CLASSIC MODE',
        subtitle: 'Tâng cầu tự do không giới hạn thời gian',
        desc: `Giữ cầu không chạm đất càng lâu càng tốt.\nKỷ lục hiện tại: ${save.bestScore} điểm`,
        color: 0x16a34a,
        x: -265,
        action: () => {
          this.closeActiveModal();
          GameStateManager.getInstance().setMode('CLASSIC');
          this.callbacks.onStartClassic();
        }
      },
      {
        title: '🎯 CHALLENGE MODE',
        subtitle: 'Chinh phục 6 nhiệm vụ sân trường',
        desc: `Hoàn thành các thử thách tâng cầu & Perfect.\nĐã hoàn thành: ${save.completedChallenges.length} / 6`,
        color: 0x0284c7,
        x: 0,
        action: () => {
          this.closeActiveModal();
          this.callbacks.onOpenChallenges();
        }
      },
      {
        title: '⏱️ TIME ATTACK (60s)',
        subtitle: 'Đua điểm số trong 60 giây nghẹt thở',
        desc: `Cầu rơi vẫn tiếp tục phát cầu mới cho đến hết giờ!\nKỷ lục 60s: ${save.bestScoreTimeAttack} điểm`,
        color: 0xd97706,
        x: 265,
        action: () => {
          this.closeActiveModal();
          GameStateManager.getInstance().setMode('TIME_ATTACK');
          this.callbacks.onStartTimeAttack();
        }
      }
    ];

    modes.forEach((m) => {
      const card = this.scene.add.container(m.x, 18);
      const cw = 242;
      const ch = 310;
      const g = this.scene.add.graphics();
      g.fillStyle(0x0f172a, 0.9);
      g.lineStyle(3, m.color, 1);
      g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
      g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);

      const t1 = this.scene.add
        .text(0, -110, m.title, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#fde047'
        })
        .setOrigin(0.5);

      const t2 = this.scene.add
        .text(0, -65, m.subtitle, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#38bdf8',
          wordWrap: { width: cw - 24 },
          align: 'center'
        })
        .setOrigin(0.5);

      const t3 = this.scene.add
        .text(0, 10, m.desc, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          color: '#cbd5e1',
          wordWrap: { width: cw - 28 },
          align: 'center',
          lineSpacing: 6
        })
        .setOrigin(0.5);

      // Start button inside card
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(m.color, 1);
      btnBg.fillRoundedRect(-90, 92, 180, 44, 12);
      const btnTxt = this.scene.add
        .text(0, 114, 'CHỌN CHẾ ĐỘ ▶', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, cw, ch, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        m.action();
      });

      card.add([g, t1, t2, t3, btnBg, btnTxt, hit]);
      modal.add(card);
    });

    // Quick Practice banner button at bottom of Mode Select
    const practiceBar = this.scene.add.container(0, 202);
    const pBg = this.scene.add.graphics();
    pBg.fillStyle(0x0f766e, 0.95);
    pBg.lineStyle(2.5, 0x5eead4, 1);
    pBg.fillRoundedRect(-280, -21, 560, 42, 12);
    pBg.strokeRoundedRect(-280, -21, 560, 42, 12);
    const pTxt = this.scene.add
      .text(0, 0, '🎓 Mới chơi? Bấm vào đây để vào CHẾ ĐỘ TẬP LUYỆN LÀM QUEN PHÍM ▶', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fef08a'
      })
      .setOrigin(0.5);
    const pHit = this.scene.add
      .rectangle(0, 0, 560, 42, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    pHit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.closeActiveModal();
      this.callbacks.onStartPractice(false);
    });
    practiceBar.add([pBg, pTxt, pHit]);
    modal.add(practiceBar);
  }

  private openHowToPlayModal(): void {
    const modal = this.createModalFrame(
      'HƯỚNG DẪN & CHẾ ĐỘ TẬP LUYỆN (HOW TO PLAY & PRACTICE)',
      900,
      565
    );

    const instructions = [
      '1. LÀM QUEN PHÍM & NÚT DI CHUYỂN (MOVEMENT CONTROLS):',
      '   • ◀ BƯỚC TRÁI: Nhấn giữ nút [◀ BƯỚC TRÁI] ở góc dưới trái hoặc phím [⬅] / [Q] để di chuyển sang trái.',
      '   • BƯỚC PHẢI ▶: Nhấn giữ nút [BƯỚC PHẢI ▶] ở góc dưới phải hoặc phím [➡] / [E] để di chuyển sang phải.',
      '',
      '2. BỐN KỸ THUẬT ĐÁ CẦU (KICK ACTIONS - ĐỢI CẦU VÀO VÒNG TRÒN CHÂN):',
      '   • 🦶 ĐÁ CHÂN TRÁI [Phím A / J]: Đá quả cầu rơi ở bên trái nhân vật.',
      '   • 🦶 ĐÁ CHÂN PHẢI [Phím D / L]: Đá quả cầu rơi ở bên phải nhân vật.',
      '   • 🛡️ ĐỠ CẦU HÃM LỰC [Phím S / ↓]: Đỡ nhẹ giúp cầu bay thẳng đứng, giảm độ lệch ngang khi cầu quá nhanh.',
      '   • 🚀 ĐÁ CẦU CAO [Phím W / Space / ↑]: Sút mạnh đưa cầu bay vút lên cao (+5 điểm thưởng kỹ thuật).',
      '',
      '3. QUY TẮC CĂN NHỊP & CHẾ ĐỘ TẬP LUYỆN:',
      '   • Tuyệt đối không bấm đá khi cầu còn ở quá cao (sẽ bị HỤT CẦU và mất Combo).',
      '   • Hãy bấm nút BẮT ĐẦU TẬP LUYỆN bên dưới để thực hành từng phím với chế độ Cầu Chậm (Slow-Mo) & Không sợ rơi cầu!'
    ].join('\n');

    const bodyTxt = this.scene.add
      .text(-410, -205, instructions, {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '15px',
        color: '#f8fafc',
        lineSpacing: 6,
        wordWrap: { width: 820 }
      })
      .setOrigin(0, 0);

    modal.add(bodyTxt);

    // Interactive Practice Launch Buttons inside HOW TO PLAY modal
    const makePracticeBtn = (
      x: number,
      y: number,
      w: number,
      h: number,
      label: string,
      subLabel: string,
      bgColor: number,
      borderColor: number,
      onClick: () => void
    ) => {
      const c = this.scene.add.container(x, y);
      const g = this.scene.add.graphics();
      g.fillStyle(bgColor, 1);
      g.lineStyle(3, borderColor, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);

      const t1 = this.scene.add
        .text(0, -10, label, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const t2 = this.scene.add
        .text(0, 14, subLabel, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '12px',
          color: '#fef08a'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        onClick();
      });

      c.add([g, t1, t2, hit]);
      return c;
    };

    const guidedBtn = makePracticeBtn(
      -205,
      208,
      385,
      68,
      '🎓 TẬP LUYỆN TỪNG BƯỚC (6 BƯỚC)',
      'Tập Di Chuyển Trái/Phải → Đá Trái/Phải/Đỡ/Đá Cao',
      0x16a34a,
      0x86efac,
      () => {
        this.closeActiveModal();
        this.callbacks.onStartPractice(false);
      }
    );

    this.scene.tweens.add({
      targets: guidedBtn,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 650,
      yoyo: true,
      repeat: -1
    });

    const freePracticeBtn = makePracticeBtn(
      205,
      208,
      385,
      68,
      '⚡ VÀO SÂN TẬP TỰ DO NGAY',
      'Tâng cầu tự do không giới hạn, rơi cầu tự phát lại',
      0x0284c7,
      0x7dd3fc,
      () => {
        this.closeActiveModal();
        this.callbacks.onStartPractice(true);
      }
    );

    modal.add([guidedBtn, freePracticeBtn]);
  }

  private openCharacterModal(): void {
    const modal = this.createModalFrame('NHÂN VẬT, TRANG PHỤC & QUẢ CẦU', 920, 560);
    const storage = StorageManager.getInstance();
    const save = storage.getData();

    // Section 1: 3 Characters
    modal.add(
      this.scene.add
        .text(-420, -210, '1. CHỌN NHÂN VẬT (CHARACTERS):', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#38bdf8'
        })
        .setOrigin(0, 0.5)
    );

    CHARACTERS.forEach((ch, idx) => {
      const isSelected = save.selectedCharacter === ch.id;
      const x = -280 + idx * 280;
      const y = -150;
      const c = this.scene.add.container(x, y);
      const bg = this.scene.add.graphics();
      bg.fillStyle(isSelected ? 0x065f46 : 0x0f172a, 0.95);
      bg.lineStyle(2.5, isSelected ? 0x4ade80 : 0x475569, 1);
      bg.fillRoundedRect(-125, -36, 250, 72, 12);
      bg.strokeRoundedRect(-125, -36, 250, 72, 12);

      const t1 = this.scene.add
        .text(0, -10, `${ch.name} (${ch.title})`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const t2 = this.scene.add
        .text(0, 14, isSelected ? '✓ ĐANG CHỌN' : 'Nhấn để chọn', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '13px',
          color: isSelected ? '#4ade80' : '#94a3b8'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, 250, 72, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        storage.selectCharacter(ch.id);
        this.callbacks.onAppearanceChanged();
        this.openCharacterModal();
      });

      c.add([bg, t1, t2, hit]);
      modal.add(c);
    });

    // Section 2: 5 Costumes
    modal.add(
      this.scene.add
        .text(-420, -78, '2. TRANG PHỤC (COSTUMES):', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#38bdf8'
        })
        .setOrigin(0, 0.5)
    );

    COSTUMES.forEach((cos, idx) => {
      const unlocked = save.unlockedCostumes.includes(cos.id);
      const selected = save.selectedCostume === cos.id;
      const x = -336 + idx * 168;
      const y = -15;
      const c = this.scene.add.container(x, y);
      const bg = this.scene.add.graphics();
      bg.fillStyle(selected ? 0x065f46 : 0x0f172a, 0.95);
      bg.lineStyle(2, selected ? 0x4ade80 : unlocked ? 0x38bdf8 : 0x64748b, 1);
      bg.fillRoundedRect(-78, -42, 156, 84, 12);
      bg.strokeRoundedRect(-78, -42, 156, 84, 12);

      // Color swatch
      bg.fillStyle(cos.shirtColor, 1);
      bg.fillCircle(-50, -12, 10);
      bg.fillStyle(cos.pantsColor, 1);
      bg.fillCircle(-26, -12, 10);

      const nameTxt = this.scene.add
        .text(0, 8, cos.name, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffffff',
          wordWrap: { width: 142 },
          align: 'center'
        })
        .setOrigin(0.5);

      const statusTxt = this.scene.add
        .text(
          0,
          28,
          selected ? '✓ Đang mặc' : unlocked ? 'Chọn mặc' : `🔒 ${cos.unlockCost} ⭐`,
          {
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: selected ? '#4ade80' : unlocked ? '#38bdf8' : '#fde047'
          }
        )
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, 156, 84, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (storage.unlockAndSelectCostume(cos.id, cos.unlockCost)) {
          AudioManager.getInstance().playPerfect();
          this.refreshHeaderBadges();
          this.callbacks.onAppearanceChanged();
          this.openCharacterModal();
        } else {
          AudioManager.getInstance().playMissSwing();
        }
      });

      c.add([bg, nameTxt, statusTxt, hit]);
      modal.add(c);
    });

    // Section 3: 5 Shuttlecock Skins
    modal.add(
      this.scene.add
        .text(-420, 62, '3. LOẠI CẦU ĐÁ (SHUTTLECOCK SKINS):', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#38bdf8'
        })
        .setOrigin(0, 0.5)
    );

    SHUTTLECOCK_SKINS.forEach((sk, idx) => {
      const unlocked = save.unlockedShuttlecocks.includes(sk.id);
      const selected = save.selectedShuttlecock === sk.id;
      const x = -336 + idx * 168;
      const y = 132;
      const c = this.scene.add.container(x, y);
      const bg = this.scene.add.graphics();
      bg.fillStyle(selected ? 0x065f46 : 0x0f172a, 0.95);
      bg.lineStyle(2, selected ? 0x4ade80 : unlocked ? 0x38bdf8 : 0x64748b, 1);
      bg.fillRoundedRect(-78, -46, 156, 92, 12);
      bg.strokeRoundedRect(-78, -46, 156, 92, 12);

      // Feather color preview dots
      sk.featherColors.slice(0, 3).forEach((col, fIdx) => {
        bg.fillStyle(col, 1);
        bg.fillCircle(-30 + fIdx * 24, -18, 8);
      });

      const nameTxt = this.scene.add
        .text(0, 8, sk.name, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#ffffff',
          wordWrap: { width: 142 },
          align: 'center'
        })
        .setOrigin(0.5);

      const statusTxt = this.scene.add
        .text(
          0,
          30,
          selected ? '✓ Đang dùng' : unlocked ? 'Chọn cầu' : `🔒 ${sk.unlockCost} ⭐`,
          {
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: selected ? '#4ade80' : unlocked ? '#38bdf8' : '#fde047'
          }
        )
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, 156, 92, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (storage.unlockAndSelectShuttlecock(sk.id, sk.unlockCost)) {
          AudioManager.getInstance().playPerfect();
          this.refreshHeaderBadges();
          this.callbacks.onAppearanceChanged();
          this.openCharacterModal();
        } else {
          AudioManager.getInstance().playMissSwing();
        }
      });

      c.add([bg, nameTxt, statusTxt, hit]);
      modal.add(c);
    });

    // Current balance footer
    modal.add(
      this.scene.add
        .text(0, 228, `Số dư hiện tại: ⭐ ${save.coins} Sao Vàng (Chơi các chế độ để nhận thêm Sao Vàng!)`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#fde047'
        })
        .setOrigin(0.5)
    );
  }

  private openAchievementsModal(): void {
    const modal = this.createModalFrame('THÀNH TỰU CÁ NHÂN (ACHIEVEMENTS)', 880, 550);
    const list = AchievementSystem.getAllAchievements();

    list.forEach((item, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = -275 + col * 275;
      const y = -135 + row * 135;

      const card = this.scene.add.container(x, y);
      const w = 258;
      const h = 118;
      const g = this.scene.add.graphics();
      g.fillStyle(item.unlocked ? 0x064e3b : 0x0f172a, 0.94);
      g.lineStyle(2, item.unlocked ? 0x4ade80 : 0x475569, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

      const title = this.scene.add
        .text(-w / 2 + 14, -40, `${item.def.icon} ${item.def.title}`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: item.unlocked ? '#4ade80' : '#fde047'
        })
        .setOrigin(0, 0.5);

      const desc = this.scene.add
        .text(-w / 2 + 14, -8, item.def.description, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '12px',
          color: '#cbd5e1',
          wordWrap: { width: w - 28 }
        })
        .setOrigin(0, 0.5);

      // Progress bar
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(-w / 2 + 14, 24, w - 28, 10, 5);
      g.fillStyle(item.unlocked ? 0x22c55e : 0x38bdf8, 1);
      g.fillRoundedRect(-w / 2 + 14, 24, Math.max(8, (w - 28) * item.progressRatio), 10, 5);

      const progTxt = this.scene.add
        .text(
          0,
          44,
          item.unlocked
            ? `✓ Đã đạt (+${item.def.rewardCoins} ⭐)`
            : `${item.currentValue}/${item.def.target} (+${item.def.rewardCoins} ⭐)`,
          {
            fontFamily: 'Segoe UI, Arial, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: item.unlocked ? '#86efac' : '#94a3b8'
          }
        )
        .setOrigin(0.5);

      card.add([g, title, desc, progTxt]);
      modal.add(card);
    });
  }
}

