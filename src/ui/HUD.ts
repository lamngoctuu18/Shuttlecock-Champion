import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameMode, HighlightTarget, KickAction } from '../types';

export interface PracticeCallbacks {
  onToggleSlowMo?: () => boolean;
  onToggleAutoMove?: () => boolean;
  onSkipToFreePractice?: () => void;
  onStartRealMatch?: () => void;
}

export class HUD {
  private scene: Phaser.Scene;
  private onKickAction: (action: KickAction) => void;
  private onMoveDirection: (dir: number) => void;
  private onTogglePause: () => void;
  private onRestart: () => void;
  private onMainMenu: () => void;
  private practiceCallbacks?: PracticeCallbacks;

  private scoreText!: Phaser.GameObjects.Text;
  private bestScoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private modeInfoText!: Phaser.GameObjects.Text;

  private controlButtons: Map<string, Phaser.GameObjects.Container> = new Map();
  private highlightIndicator!: Phaser.GameObjects.Container;
  private pauseModalContainer!: Phaser.GameObjects.Container;

  // Practice toolbar elements
  private slowMoBtnText?: Phaser.GameObjects.Text;
  private autoMoveBtnText?: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    mode: GameMode,
    initialBest: number,
    onKickAction: (action: KickAction) => void,
    onMoveDirection: (dir: number) => void,
    onTogglePause: () => void,
    onRestart: () => void,
    onMainMenu: () => void,
    practiceCallbacks?: PracticeCallbacks
  ) {
    this.scene = scene;
    this.onKickAction = onKickAction;
    this.onMoveDirection = onMoveDirection;
    this.onTogglePause = onTogglePause;
    this.onRestart = onRestart;
    this.onMainMenu = onMainMenu;
    this.practiceCallbacks = practiceCallbacks;

    this.createTopBar(mode, initialBest);
    this.createBottomControlBar();
    this.createHighlightIndicator();
    if (mode === 'PRACTICE') {
      this.createPracticeToolbar();
    }
    this.createPauseModal();
  }

  private createTopBar(mode: GameMode, initialBest: number): void {
    const topContainer = this.scene.add.container(0, 0).setDepth(50);

    const barBg = this.scene.add.graphics();
    barBg.fillStyle(0x0f172a, 0.82);
    barBg.fillRoundedRect(24, 12, GAME_WIDTH - 48, 64, 16);
    barBg.lineStyle(2, mode === 'PRACTICE' ? 0x4ade80 : 0x38bdf8, 0.65);
    barBg.strokeRoundedRect(24, 12, GAME_WIDTH - 48, 64, 16);
    topContainer.add(barBg);

    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#94a3b8'
    };

    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#ffffff'
    };

    // 1. SCORE
    topContainer.add(this.scene.add.text(52, 20, 'ĐIỂM SỐ (SCORE)', labelStyle));
    this.scoreText = this.scene.add.text(52, 38, '0', {
      ...valueStyle,
      color: '#fde047'
    });
    topContainer.add(this.scoreText);

    // 2. BEST SCORE
    topContainer.add(this.scene.add.text(235, 20, 'KỶ LỤC (BEST)', labelStyle));
    this.bestScoreText = this.scene.add.text(235, 38, `${initialBest}`, {
      ...valueStyle,
      color: '#38bdf8'
    });
    topContainer.add(this.bestScoreText);

    // 3. COMBO
    topContainer.add(this.scene.add.text(420, 20, 'CHUỖI (COMBO)', labelStyle));
    this.comboText = this.scene.add.text(420, 38, 'x0', {
      ...valueStyle,
      color: '#fb923c'
    });
    topContainer.add(this.comboText);

    // 4. LEVEL
    topContainer.add(this.scene.add.text(605, 20, 'CẤP ĐỘ (LEVEL)', labelStyle));
    this.levelText = this.scene.add.text(605, 38, 'Lv.1', {
      ...valueStyle,
      color: '#4ade80'
    });
    topContainer.add(this.levelText);

    // 5. MODE / PROGRESS
    const modeHeader =
      mode === 'TIME_ATTACK'
        ? 'THỜI GIAN (TIME)'
        : mode === 'CHALLENGE'
        ? 'NHIỆM VỤ (GOAL)'
        : mode === 'PRACTICE'
        ? 'BÀI TẬP (TRAINING)'
        : 'CHẾ ĐỘ (MODE)';
    topContainer.add(this.scene.add.text(790, 20, modeHeader, labelStyle));
    this.modeInfoText = this.scene.add.text(
      790,
      38,
      mode === 'TIME_ATTACK'
        ? '60.0s'
        : mode === 'CHALLENGE'
        ? '0 / 10'
        : mode === 'PRACTICE'
        ? 'Bước 1/6'
        : 'CỔ ĐIỂN',
      {
        ...valueStyle,
        fontSize: '20px',
        color: mode === 'PRACTICE' ? '#4ade80' : '#f472b6'
      }
    );
    topContainer.add(this.modeInfoText);

    // 6. PAUSE BUTTON
    const pauseBtn = this.scene.add.container(1192, 44);
    const pBg = this.scene.add.graphics();
    pBg.fillStyle(0x1e293b, 0.95);
    pBg.lineStyle(2, 0xfacc15, 0.9);
    pBg.fillRoundedRect(-44, -21, 88, 42, 12);
    pBg.strokeRoundedRect(-44, -21, 88, 42, 12);

    const pTxt = this.scene.add
      .text(0, 0, '⏸ PAUSE', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fef08a'
      })
      .setOrigin(0.5);

    const pHit = this.scene.add
      .rectangle(0, 0, 88, 42, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    pHit.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      this.onTogglePause();
    });

    pauseBtn.add([pBg, pTxt, pHit]);
    topContainer.add(pauseBtn);
  }

  private createPracticeToolbar(): void {
    const barY = 98;
    const container = this.scene.add.container(0, 0).setDepth(48);

    const makeSmallBtn = (
      x: number,
      w: number,
      label: string,
      bgColor: number,
      borderColor: number,
      onClick: () => void
    ): Phaser.GameObjects.Text => {
      const c = this.scene.add.container(x, barY);
      const h = 34;
      const g = this.scene.add.graphics();
      g.fillStyle(bgColor, 0.92);
      g.lineStyle(2, borderColor, 0.95);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      const txt = this.scene.add
        .text(0, 0, label, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        onClick();
      });

      c.add([g, txt, hit]);
      container.add(c);
      return txt;
    };

    this.slowMoBtnText = makeSmallBtn(
      210,
      215,
      '🐢 Cầu Chậm (Slow-Mo): BẬT',
      0x0369a1,
      0x38bdf8,
      () => {
        if (this.practiceCallbacks?.onToggleSlowMo) {
          const active = this.practiceCallbacks.onToggleSlowMo();
          this.slowMoBtnText?.setText(`🐢 Cầu Chậm (Slow-Mo): ${active ? 'BẬT' : 'TẮT'}`);
        }
      }
    );

    this.autoMoveBtnText = makeSmallBtn(
      455,
      235,
      '🤖 Tự Bước Chân: TẮT (Tự di chuyển)',
      0x4f46e5,
      0xa5b4fc,
      () => {
        if (this.practiceCallbacks?.onToggleAutoMove) {
          const active = this.practiceCallbacks.onToggleAutoMove();
          this.autoMoveBtnText?.setText(
            `🤖 Tự Bước Chân: ${active ? 'BẬT (Hỗ trợ)' : 'TẮT (Tự di chuyển)'}`
          );
        }
      }
    );

    makeSmallBtn(695, 195, '⏭️ Bỏ Qua → Tập Tự Do', 0xd97706, 0xfde047, () => {
      this.practiceCallbacks?.onSkipToFreePractice?.();
    });

    makeSmallBtn(915, 205, '🏆 Thi Đấu Chính Thức ▶', 0x16a34a, 0x86efac, () => {
      this.practiceCallbacks?.onStartRealMatch?.();
    });

    makeSmallBtn(1135, 185, '🏠 Về Menu Chính', 0x475569, 0xcbd5e1, () => {
      this.onMainMenu();
    });
  }

  public updatePracticeToolbarLabels(slowMo: boolean, autoMove: boolean): void {
    this.slowMoBtnText?.setText(`🐢 Cầu Chậm (Slow-Mo): ${slowMo ? 'BẬT' : 'TẮT'}`);
    this.autoMoveBtnText?.setText(
      `🤖 Tự Bước Chân: ${autoMove ? 'BẬT (Hỗ trợ)' : 'TẮT (Tự di chuyển)'}`
    );
  }

  private createBottomControlBar(): void {
    const bottomY = GAME_HEIGHT - 52;

    // 1. Left & Right Movement Buttons (Hold to walk/run on the court)
    const moveDefs: Array<{
      key: 'MOVE_LEFT' | 'MOVE_RIGHT';
      dir: number;
      title: string;
      subtitle: string;
      x: number;
      w: number;
    }> = [
      {
        key: 'MOVE_LEFT',
        dir: -1,
        title: '◀ BƯỚC TRÁI',
        subtitle: 'Giữ [⬅] / [Q]',
        x: 112,
        w: 174
      },
      {
        key: 'MOVE_RIGHT',
        dir: 1,
        title: 'BƯỚC PHẢI ▶',
        subtitle: 'Giữ [➡] / [E]',
        x: 1168,
        w: 174
      }
    ];

    moveDefs.forEach((m) => {
      const btn = this.scene.add.container(m.x, bottomY).setDepth(50);
      const h = 76;
      const bg = this.scene.add.graphics();
      const drawBg = (pressed: boolean) => {
        bg.clear();
        bg.fillStyle(pressed ? 0x3b82f6 : 0x1e293b, 0.94);
        bg.lineStyle(3, pressed ? 0xfef08a : 0x94a3b8, 1);
        bg.fillRoundedRect(-m.w / 2, -h / 2, m.w, h, 16);
        bg.strokeRoundedRect(-m.w / 2, -h / 2, m.w, h, 16);
      };
      drawBg(false);

      const titleTxt = this.scene.add
        .text(0, -10, m.title, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#f8fafc'
        })
        .setOrigin(0.5);

      const subTxt = this.scene.add
        .text(0, 16, m.subtitle, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '12px',
          color: '#cbd5e1'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, m.w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        drawBg(true);
        this.pulseButtonByKey(m.key);
        this.onMoveDirection(m.dir);
      });

      const releaseMove = () => {
        drawBg(false);
        this.onMoveDirection(0);
      };

      hit.on('pointerup', releaseMove);
      hit.on('pointerout', releaseMove);

      btn.add([bg, titleTxt, subTxt, hit]);
      this.controlButtons.set(m.key, btn);
    });

    // 2. Four Kick Action Buttons in the Center
    const buttonDefs: Array<{
      action: KickAction;
      title: string;
      subtitle: string;
      x: number;
      w: number;
      color: number;
      borderColor: number;
      icon: string;
    }> = [
      {
        action: 'LEFT',
        title: 'ĐÁ CHÂN TRÁI',
        subtitle: 'Phím [A] / [J]',
        x: 312,
        w: 202,
        color: 0x0284c7,
        borderColor: 0x7dd3fc,
        icon: '🦶⬅️'
      },
      {
        action: 'HIGH',
        title: 'ĐÁ CẦU CAO',
        subtitle: 'Phím [W] / [Space]',
        x: 530,
        w: 202,
        color: 0xdc2626,
        borderColor: 0xfca5a5,
        icon: '🚀⬆️'
      },
      {
        action: 'RECEIVE',
        title: 'ĐỠ CẦU (HÃM)',
        subtitle: 'Phím [S] / [↓]',
        x: 748,
        w: 202,
        color: 0x059669,
        borderColor: 0x6ee7b7,
        icon: '🛡️✨'
      },
      {
        action: 'RIGHT',
        title: 'ĐÁ CHÂN PHẢI',
        subtitle: 'Phím [D] / [L]',
        x: 966,
        w: 202,
        color: 0xd97706,
        borderColor: 0xfde047,
        icon: '➡️🦶'
      }
    ];

    buttonDefs.forEach((def) => {
      const btn = this.scene.add.container(def.x, bottomY).setDepth(50);
      const w = def.w;
      const h = 76;

      const bg = this.scene.add.graphics();
      const drawBg = (pressed: boolean) => {
        bg.clear();
        bg.fillStyle(pressed ? 0x1e293b : def.color, pressed ? 0.98 : 0.92);
        bg.lineStyle(3, def.borderColor, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
      };
      drawBg(false);

      const titleTxt = this.scene.add
        .text(0, -10, `${def.icon} ${def.title}`, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const subTxt = this.scene.add
        .text(0, 16, def.subtitle, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '12px',
          color: '#e2e8f0'
        })
        .setOrigin(0.5);

      const hitArea = this.scene.add
        .rectangle(0, 0, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerdown', () => {
        drawBg(true);
        this.pulseButton(def.action);
        this.onKickAction(def.action);
      });

      hitArea.on('pointerup', () => drawBg(false));
      hitArea.on('pointerout', () => drawBg(false));

      btn.add([bg, titleTxt, subTxt, hitArea]);
      this.controlButtons.set(def.action, btn);
    });
  }

  private createHighlightIndicator(): void {
    this.highlightIndicator = this.scene.add.container(0, 0).setDepth(65).setVisible(false);

    const glowRing = this.scene.add.graphics();
    glowRing.lineStyle(4, 0xfde047, 1);
    glowRing.strokeRoundedRect(-104, -42, 208, 84, 18);

    const pointerPill = this.scene.add
      .text(0, -64, '⬇ NHẤN NÚT NÀY ⬇', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#0f172a',
        backgroundColor: '#fde047',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5);

    this.highlightIndicator.add([glowRing, pointerPill]);

    this.scene.tweens.add({
      targets: pointerPill,
      y: -56,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public setHighlightedControl(target: HighlightTarget): void {
    if (!target) {
      this.highlightIndicator.setVisible(false);
      return;
    }
    const btn = this.controlButtons.get(target);
    if (!btn) {
      this.highlightIndicator.setVisible(false);
      return;
    }
    this.highlightIndicator.setPosition(btn.x, btn.y);
    this.highlightIndicator.setVisible(true);
  }

  public pulseButton(action: KickAction): void {
    this.pulseButtonByKey(action);
  }

  public pulseButtonByKey(key: string): void {
    const btn = this.controlButtons.get(key);
    if (!btn) return;
    this.scene.tweens.killTweensOf(btn);
    btn.setScale(0.92);
    this.scene.tweens.add({
      targets: btn,
      scaleX: 1,
      scaleY: 1,
      duration: 140,
      ease: 'Back.easeOut'
    });
  }

  public updateStats(
    score: number,
    bestScore: number,
    combo: number,
    level: number,
    modeText?: string
  ): void {
    this.scoreText.setText(`${score}`);
    this.bestScoreText.setText(`${Math.max(bestScore, score)}`);
    this.comboText.setText(`x${combo}`);
    this.levelText.setText(`Lv.${level}`);

    if (combo >= 20) {
      this.comboText.setColor('#f43f5e');
    } else if (combo >= 5) {
      this.comboText.setColor('#facc15');
    } else {
      this.comboText.setColor('#fb923c');
    }

    if (modeText !== undefined) {
      this.modeInfoText.setText(modeText);
    }
  }

  private createPauseModal(): void {
    this.pauseModalContainer = this.scene.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
      .setDepth(100)
      .setVisible(false);

    const overlay = this.scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0f172a, 0.74)
      .setInteractive();

    const card = this.scene.add.graphics();
    card.fillStyle(0x1e293b, 0.98);
    card.lineStyle(4, 0xfacc15, 1);
    card.fillRoundedRect(-230, -185, 460, 370, 22);
    card.strokeRoundedRect(-230, -185, 460, 370, 22);

    const title = this.scene.add
      .text(0, -130, 'TẠM DỪNG TRÒ CHƠI', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#fde047'
      })
      .setOrigin(0.5);

    const makeMenuBtn = (y: number, label: string, color: number, cb: () => void) => {
      const c = this.scene.add.container(0, y);
      const b = this.scene.add.graphics();
      b.fillStyle(color, 1);
      b.lineStyle(2, 0xffffff, 0.8);
      b.fillRoundedRect(-150, -26, 300, 52, 14);
      b.strokeRoundedRect(-150, -26, 300, 52, 14);

      const t = this.scene.add
        .text(0, 0, label, {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          color: '#ffffff'
        })
        .setOrigin(0.5);

      const hit = this.scene.add
        .rectangle(0, 0, 300, 52, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        cb();
      });

      c.add([b, t, hit]);
      return c;
    };

    const resumeBtn = makeMenuBtn(-45, '▶  TIẾP TỤC CHƠI', 0x16a34a, () => this.onTogglePause());
    const restartBtn = makeMenuBtn(28, '🔄  CHƠI LẠI TỪ ĐẦU', 0x0284c7, () => this.onRestart());
    const menuBtn = makeMenuBtn(101, '🏠  VỀ MÀN HÌNH CHÍNH', 0xd97706, () => this.onMainMenu());

    this.pauseModalContainer.add([overlay, card, title, resumeBtn, restartBtn, menuBtn]);
  }

  public setPauseModalVisible(visible: boolean): void {
    this.pauseModalContainer.setVisible(visible);
  }
}
