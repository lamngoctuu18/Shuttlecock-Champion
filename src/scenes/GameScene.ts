import Phaser from 'phaser';
import { COURT_CONFIG, GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import { Player } from '../entities/Player';
import { Shuttlecock } from '../entities/Shuttlecock';
import { AdService } from '../managers/AdService';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { StorageManager } from '../managers/StorageManager';
import { AchievementSystem } from '../systems/AchievementSystem';
import { ComboSystem } from '../systems/ComboSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { InputSystem } from '../systems/InputSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import {
  DifficultyParams,
  GameMode,
  KickAction,
  KickRating,
  PracticeStep
} from '../types';
import { HUD } from '../ui/HUD';
import { SchoolyardBackground } from '../ui/SchoolyardBackground';

interface PooledPopup {
  textObj: Phaser.GameObjects.Text;
  active: boolean;
  elapsed: number;
  duration: number;
  vy: number;
}

interface PooledParticle {
  sprite: Phaser.GameObjects.Image;
  active: boolean;
  vx: number;
  vy: number;
  elapsed: number;
  duration: number;
}

export class GameScene extends Phaser.Scene {
  private background!: SchoolyardBackground;
  private player!: Player;
  private shuttlecock!: Shuttlecock;
  private hud!: HUD;

  private physicsSystem!: PhysicsSystem;
  private inputSystem!: InputSystem;
  private comboSystem!: ComboSystem;
  private scoreSystem!: ScoreSystem;
  private difficultySystem!: DifficultySystem;

  private mode: GameMode = 'CLASSIC';
  private currentDifficulty!: DifficultyParams;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private playTimeSec: number = 0;
  private timeAttackRemainingSec: number = 60.0;
  private initialBestScore: number = 0;
  private challengeNotified: boolean = false;
  private reServeDelaySec: number = 0;

  // Practice Mode state
  private practiceStep: PracticeStep = 'MOVE_LEFT';
  private practiceStepCount: number = 0;
  private practiceSlowMo: boolean = true;
  private practiceAutoMove: boolean = false;
  private practiceTargetGraphics!: Phaser.GameObjects.Graphics;
  private practiceTargetLabel!: Phaser.GameObjects.Text;

  // Object pools for popups and particles (Section 11 optimization)
  private popupPool: PooledPopup[] = [];
  private particlePool: PooledParticle[] = [];
  private comboAuraGraphics!: Phaser.GameObjects.Graphics;
  private hintBannerText!: Phaser.GameObjects.Text;

  private visibilityListener?: () => void;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    const save = StorageManager.getInstance().getData();
    const stateMgr = GameStateManager.getInstance();
    this.mode = stateMgr.getMode();
    this.initialBestScore =
      this.mode === 'TIME_ATTACK' ? save.bestScoreTimeAttack : save.bestScore;

    this.isPaused = false;
    this.isGameOver = false;
    this.playTimeSec = 0;
    this.timeAttackRemainingSec = 60.0;
    this.challengeNotified = false;
    this.reServeDelaySec = 0;

    // Initialize Practice Mode configuration
    this.practiceStepCount = 0;
    this.practiceSlowMo = true;
    if (this.mode === 'PRACTICE') {
      if (stateMgr.isPracticeFreeMode()) {
        this.practiceStep = 'FREE_PRACTICE';
        this.practiceAutoMove = true;
      } else {
        this.practiceStep = 'MOVE_LEFT';
        this.practiceAutoMove = false; // Manual movement during movement tutorial
      }
    } else {
      this.practiceAutoMove = true;
    }

    AudioManager.getInstance().startMusic('GAME');
    AdService.getInstance().setInRally(true);

    // 1. Background environment
    this.background = new SchoolyardBackground(this);

    // 2. Core systems
    this.physicsSystem = new PhysicsSystem();
    this.comboSystem = new ComboSystem();
    this.scoreSystem = new ScoreSystem();
    this.difficultySystem = new DifficultySystem();
    this.currentDifficulty = this.difficultySystem.updateFromKicks(0, 0);

    // 3. Combo special aura & Practice Target Zone graphics
    this.comboAuraGraphics = this.add.graphics().setDepth(18);
    this.practiceTargetGraphics = this.add.graphics().setDepth(19);
    this.practiceTargetLabel = this.add
      .text(0, 0, '', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#0f172a',
        backgroundColor: '#4ade80',
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setVisible(false);

    // 4. Entities: Player & Shuttlecock
    this.player = new Player(
      this,
      COURT_CONFIG.COURT_CENTER_X,
      COURT_CONFIG.GROUND_Y,
      save.selectedCharacter,
      save.selectedCostume
    );

    this.shuttlecock = new Shuttlecock(
      this,
      COURT_CONFIG.COURT_CENTER_X - 24,
      COURT_CONFIG.GROUND_Y - 270,
      save.selectedShuttlecock
    );

    // 5. Object pools (zero runtime allocation during rally)
    this.initObjectPools();

    // 6. HUD & Controls
    this.inputSystem = new InputSystem(
      this,
      (action) => this.handlePlayerKick(action),
      () => this.togglePause()
    );

    this.hud = new HUD(
      this,
      this.mode,
      this.initialBestScore,
      (action) => this.inputSystem.requestKick(action),
      (dir) => this.inputSystem.setVirtualMoveDirection(dir),
      () => this.togglePause(),
      () => this.scene.restart(),
      () => {
        AdService.getInstance().setInRally(false);
        this.scene.start('MenuScene');
      },
      {
        onToggleSlowMo: () => {
          this.practiceSlowMo = !this.practiceSlowMo;
          return this.practiceSlowMo;
        },
        onToggleAutoMove: () => {
          this.practiceAutoMove = !this.practiceAutoMove;
          return this.practiceAutoMove;
        },
        onSkipToFreePractice: () => {
          this.setPracticeStep('FREE_PRACTICE');
        },
        onStartRealMatch: () => {
          GameStateManager.getInstance().setMode('CLASSIC');
          this.scene.restart();
        }
      }
    );

    // Helpful tactical / tutorial banner at top of court
    const bannerY = this.mode === 'PRACTICE' ? 142 : 102;
    this.hintBannerText = this.add
      .text(
        GAME_WIDTH / 2,
        bannerY,
        '💡 Giữ [◀/▶] hoặc [⬅/➡] để di chuyển. Canh cầu vào vòng tròn chân rồi nhấn [A] Trái, [D] Phải, [W] Cao, [S] Đỡ!',
        {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#fef08a',
          backgroundColor: '#0f172a',
          padding: { x: 16, y: 7 },
          align: 'center',
          wordWrap: { width: 1120 }
        }
      )
      .setOrigin(0.5)
      .setDepth(42);

    if (this.mode === 'PRACTICE') {
      this.hud.updatePracticeToolbarLabels(this.practiceSlowMo, this.practiceAutoMove);
      this.setPracticeStep(this.practiceStep);
    } else {
      this.serveShuttlecock();
    }

    // Also allow tapping directly on the court area (above bottom buttons, below top bar)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isPaused || this.isGameOver) return;
      const topLimit = this.mode === 'PRACTICE' ? 165 : 95;
      if (pointer.y > topLimit && pointer.y < GAME_HEIGHT - 105) {
        if (
          this.mode === 'PRACTICE' &&
          (this.practiceStep === 'MOVE_LEFT' || this.practiceStep === 'MOVE_RIGHT')
        ) {
          return;
        }
        const relX = this.shuttlecock.bodyState.x - this.player.x;
        if (pointer.y < 320) {
          this.inputSystem.requestKick('HIGH');
        } else if (relX < -10 || pointer.x < this.player.x) {
          this.inputSystem.requestKick('LEFT');
        } else {
          this.inputSystem.requestKick('RIGHT');
        }
      }
    });

    // Auto-pause when browser tab goes to background (Section 11)
    this.visibilityListener = () => {
      if (document.hidden && !this.isPaused && !this.isGameOver) {
        this.togglePause(true);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityListener);

    this.events.once('shutdown', () => {
      this.cleanupScene();
    });

    this.refreshHUD();
  }

  private setPracticeStep(step: PracticeStep): void {
    this.practiceStep = step;
    this.practiceStepCount = 0;
    this.practiceTargetGraphics.clear();
    this.practiceTargetLabel.setVisible(false);

    if (step === 'MOVE_LEFT') {
      this.practiceAutoMove = false;
      this.hud.updatePracticeToolbarLabels(this.practiceSlowMo, this.practiceAutoMove);
      this.shuttlecock.setVisible(false);
      this.hud.setHighlightedControl('MOVE_LEFT');
      this.hintBannerText.setText(
        '🎓 BƯỚC 1/6 (DI CHUYỂN TRÁI): Nhấn giữ nút [◀ BƯỚC TRÁI] ở góc dưới trái (hoặc phím [⬅] / [Q]) để di chuyển nhân vật tới Vòng Tròn Xanh!'
      );
    } else if (step === 'MOVE_RIGHT') {
      this.practiceAutoMove = false;
      this.hud.updatePracticeToolbarLabels(this.practiceSlowMo, this.practiceAutoMove);
      this.shuttlecock.setVisible(false);
      this.hud.setHighlightedControl('MOVE_RIGHT');
      this.hintBannerText.setText(
        '🎓 BƯỚC 2/6 (DI CHUYỂN PHẢI): Nhấn giữ nút [BƯỚC PHẢI ▶] ở góc dưới phải (hoặc phím [➡] / [E]) để di chuyển nhân vật sang Vòng Tròn Xanh bên phải!'
      );
    } else if (step === 'KICK_LEFT') {
      this.shuttlecock.setVisible(true);
      this.practiceAutoMove = true;
      this.hud.updatePracticeToolbarLabels(this.practiceSlowMo, this.practiceAutoMove);
      this.hud.setHighlightedControl('LEFT');
      this.hintBannerText.setText(
        '🎓 BƯỚC 3/6 (ĐÁ CHÂN TRÁI - 0/2): Đợi quả cầu rơi vào vòng tròn chân trái rồi nhấn [🦶 ĐÁ CHÂN TRÁI] hoặc phím [A]!'
      );
      this.serveShuttlecockForPractice('LEFT');
    } else if (step === 'KICK_RIGHT') {
      this.shuttlecock.setVisible(true);
      this.hud.setHighlightedControl('RIGHT');
      this.hintBannerText.setText(
        '🎓 BƯỚC 4/6 (ĐÁ CHÂN PHẢI - 0/2): Đợi quả cầu rơi vào vòng tròn chân phải rồi nhấn [🦶 ĐÁ CHÂN PHẢI] hoặc phím [D]!'
      );
      this.serveShuttlecockForPractice('RIGHT');
    } else if (step === 'RECEIVE') {
      this.shuttlecock.setVisible(true);
      this.hud.setHighlightedControl('RECEIVE');
      this.hintBannerText.setText(
        '🎓 BƯỚC 5/6 (ĐỠ CẦU HÃM LỰC - 0/2): Đợi cầu rơi gần người rồi nhấn [🛡️ ĐỠ CẦU] hoặc phím [S / ↓] để hãm cầu bay thẳng lên!'
      );
      this.serveShuttlecockForPractice('RECEIVE');
    } else if (step === 'KICK_HIGH') {
      this.shuttlecock.setVisible(true);
      this.hud.setHighlightedControl('HIGH');
      this.hintBannerText.setText(
        '🎓 BƯỚC 6/6 (ĐÁ CẦU CAO - 0/2): Nhấn [🚀 ĐÁ CẦU CAO] hoặc phím [W / Space] khi cầu vào tầm chân để sút cầu bay vút lên cao!'
      );
      this.serveShuttlecockForPractice('HIGH');
    } else if (step === 'FREE_PRACTICE') {
      this.shuttlecock.setVisible(true);
      this.practiceAutoMove = true;
      this.hud.updatePracticeToolbarLabels(this.practiceSlowMo, this.practiceAutoMove);
      this.hud.setHighlightedControl(null);
      this.hintBannerText.setText(
        '🌟 TẬP LUYỆN TỰ DO: Cầu chạm đất sẽ tự phát lại (Không sợ Game Over!). Hãy kết hợp di chuyển [⬅/➡] và 4 kỹ thuật đá [A/W/S/D]!'
      );
      this.serveShuttlecock();
    }

    this.refreshHUD();
  }

  private serveShuttlecockForPractice(targetAction: KickAction): void {
    let offset = 0;
    if (targetAction === 'LEFT') offset = -32;
    else if (targetAction === 'RIGHT') offset = 32;
    else if (targetAction === 'HIGH') offset = 24;
    else offset = 0;

    const serveX = Phaser.Math.Clamp(
      this.player.x + offset,
      COURT_CONFIG.COURT_LEFT + 80,
      COURT_CONFIG.COURT_RIGHT - 80
    );
    this.shuttlecock.resetToServe(serveX, COURT_CONFIG.GROUND_Y - 265);
  }

  private initObjectPools(): void {
    this.popupPool = [];
    for (let i = 0; i < 16; i++) {
      const txt = this.add
        .text(0, 0, '', {
          fontFamily: 'Segoe UI, Arial, sans-serif',
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#fde047',
          stroke: '#0f172a',
          strokeThickness: 5
        })
        .setOrigin(0.5)
        .setDepth(45)
        .setVisible(false);

      this.popupPool.push({
        textObj: txt,
        active: false,
        elapsed: 0,
        duration: 0.75,
        vy: -75
      });
    }

    this.particlePool = [];
    for (let i = 0; i < 42; i++) {
      const tex = i % 3 === 0 ? 'tex_star' : 'tex_spark';
      const spr = this.add.image(0, 0, tex).setDepth(35).setVisible(false);
      this.particlePool.push({
        sprite: spr,
        active: false,
        vx: 0,
        vy: 0,
        elapsed: 0,
        duration: 0.45
      });
    }
  }

  private spawnPopup(
    x: number,
    y: number,
    message: string,
    color: string,
    fontSize: number = 25
  ): void {
    const item = this.popupPool.find((p) => !p.active) || this.popupPool[0];
    item.active = true;
    item.elapsed = 0;
    item.duration = 0.85;
    item.vy = -78;
    item.textObj
      .setPosition(x, y)
      .setText(message)
      .setColor(color)
      .setFontSize(fontSize)
      .setAlpha(1)
      .setScale(0.75)
      .setVisible(true);

    this.tweens.add({
      targets: item.textObj,
      scale: 1.05,
      duration: 150,
      ease: 'Back.easeOut'
    });
  }

  private spawnImpactParticles(x: number, y: number, rating: KickRating, count: number = 12): void {
    const color =
      rating === 'PERFECT'
        ? 0xfde047
        : rating === 'GOOD'
        ? 0x38bdf8
        : rating === 'NORMAL'
        ? 0x4ade80
        : 0xef4444;

    let spawned = 0;
    for (const p of this.particlePool) {
      if (p.active) continue;
      p.active = true;
      p.elapsed = 0;
      p.duration = Phaser.Math.FloatBetween(0.32, 0.55);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(70, 230);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 60;
      p.sprite
        .setPosition(x, y)
        .setTint(color)
        .setAlpha(1)
        .setScale(rating === 'PERFECT' ? 0.95 : 0.7)
        .setVisible(true);

      spawned++;
      if (spawned >= count) break;
    }
  }

  private serveShuttlecock(): void {
    const offsetSide = Math.random() > 0.5 ? 24 : -24;
    const serveX = Phaser.Math.Clamp(
      this.player.x + offsetSide,
      COURT_CONFIG.COURT_LEFT + 60,
      COURT_CONFIG.COURT_RIGHT - 60
    );
    this.shuttlecock.resetToServe(serveX, COURT_CONFIG.GROUND_Y - 260);
  }

  private handlePlayerKick(action: KickAction): void {
    if (this.isPaused || this.isGameOver || this.reServeDelaySec > 0) return;

    this.hud.pulseButton(action);

    // If still in movement tutorial steps, remind player to finish moving first
    if (
      this.mode === 'PRACTICE' &&
      (this.practiceStep === 'MOVE_LEFT' || this.practiceStep === 'MOVE_RIGHT')
    ) {
      this.player.playActionAnim(action, false);
      AudioManager.getInstance().playClick();
      this.spawnPopup(
        this.player.x,
        this.player.y - 135,
        'Hãy di chuyển tới Vòng Tròn Xanh trước nhé!',
        '#38bdf8',
        20
      );
      return;
    }

    // In Practice Mode, widen the sweet spot slightly so beginners feel confident
    const evalDifficulty: DifficultyParams =
      this.mode === 'PRACTICE'
        ? { ...this.currentDifficulty, sweetSpotMultiplier: 1.32, horizontalDriftRange: 45 }
        : this.currentDifficulty;

    const evaluation = this.physicsSystem.evaluateKick(
      this.player.x,
      this.player.y,
      this.shuttlecock.bodyState,
      action,
      evalDifficulty
    );

    if (!evaluation.valid) {
      this.player.playActionAnim(action, true);
      AudioManager.getInstance().playMissSwing();

      if (this.comboSystem.getCurrentCombo() > 0) {
        this.comboSystem.resetComboOnly();
        this.spawnPopup(this.player.x, this.player.y - 135, 'MẤT COMBO! (Đá quá sớm)', '#f87171', 20);
      } else {
        this.spawnPopup(
          this.player.x,
          this.player.y - 135,
          this.mode === 'PRACTICE' ? 'Đợi cầu rơi vào vòng tròn chân nhé!' : `${evaluation.feedbackText}`,
          '#fb923c',
          20
        );
      }
      this.refreshHUD();
      return;
    }

    // Valid kick! Apply physics impulse & update animations
    this.player.playActionAnim(action, false);

    // If in structured practice step, keep shuttlecock trajectories neatly aligned for the next step
    let launchVx = evaluation.vx;
    if (this.mode === 'PRACTICE' && this.practiceStep !== 'FREE_PRACTICE') {
      launchVx = (COURT_CONFIG.COURT_CENTER_X - this.shuttlecock.bodyState.x) * 0.25;
    }
    this.shuttlecock.applyKickImpulse(launchVx, evaluation.vy, evaluation.spin);

    // Hide tutorial banner after 4 successful kicks in normal modes
    if (this.mode !== 'PRACTICE' && this.scoreSystem.getKicks() >= 3 && this.hintBannerText.visible) {
      this.tweens.add({
        targets: this.hintBannerText,
        alpha: 0,
        duration: 400,
        onComplete: () => this.hintBannerText.setVisible(false)
      });
    }

    // Update Combo & Score
    const comboRes = this.comboSystem.registerKick(evaluation.rating);
    const points = this.scoreSystem.addKickScore(
      evaluation.rating,
      action,
      comboRes.combo,
      this.currentDifficulty.level,
      comboRes.milestoneBonus
    );

    // Audio & Haptics
    AudioManager.getInstance().playKick(action === 'HIGH');
    if (evaluation.rating === 'PERFECT') {
      AudioManager.getInstance().playPerfect();
      this.cameras.main.shake(90, 0.0035);
    } else if (action === 'HIGH') {
      this.cameras.main.shake(70, 0.0025);
    }

    if (comboRes.combo >= 2) {
      AudioManager.getInstance().playCombo(comboRes.combo, comboRes.milestoneBonus > 0);
    }

    const settings = StorageManager.getInstance().getSettings();
    if (settings.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(evaluation.rating === 'PERFECT' ? 25 : 12);
    }

    // Visual impact particles & score popup
    this.spawnImpactParticles(
      this.shuttlecock.bodyState.x,
      this.shuttlecock.bodyState.y,
      evaluation.rating,
      evaluation.rating === 'PERFECT' ? 16 : 10
    );

    const popupColor =
      evaluation.rating === 'PERFECT'
        ? '#fde047'
        : evaluation.rating === 'GOOD'
        ? '#38bdf8'
        : '#4ade80';

    this.spawnPopup(
      this.shuttlecock.bodyState.x,
      this.shuttlecock.bodyState.y - 24,
      `${evaluation.feedbackText} +${points}`,
      popupColor,
      evaluation.rating === 'PERFECT' ? 28 : 23
    );

    // Handle Practice Mode step progression
    if (this.mode === 'PRACTICE') {
      this.advancePracticeKickStep(action);
    }

    // Milestone bonus popup & special effect (Combo 5, 10, 20, 30, 50, 100)
    if (comboRes.milestoneLabel) {
      this.spawnPopup(
        this.player.x,
        this.player.y - 165,
        `🔥 ${comboRes.milestoneLabel}`,
        '#f43f5e',
        30
      );
      if (comboRes.triggerSpecialEffect) {
        this.player.setAnimState('CELEBRATE', 0.35);
        this.cameras.main.shake(160, 0.006);
        this.spawnImpactParticles(this.player.x, this.player.y - 80, 'PERFECT', 22);
      }
    }

    // Check mid-game combo achievement
    const unlockedAch = AchievementSystem.checkMidGameComboUnlock(comboRes.combo);
    if (unlockedAch) {
      AudioManager.getInstance().playNewRecord();
      AdService.getInstance().notifyHappyTime();
      this.spawnPopup(
        GAME_WIDTH / 2,
        185,
        `🏆 THÀNH TỰU: ${unlockedAch.title}! (+${unlockedAch.rewardCoins} ⭐)`,
        '#fde047',
        26
      );
    }

    // Check Challenge Mode target completion live
    if (this.mode === 'CHALLENGE' && !this.challengeNotified) {
      const stateMgr = GameStateManager.getInstance();
      const mission = stateMgr.getActiveChallenge();
      const completed = stateMgr.evaluateMission(mission, {
        kicks: this.scoreSystem.getKicks(),
        maxCombo: this.comboSystem.getMaxCombo(),
        perfectCount: this.scoreSystem.getPerfectCount(),
        highKickCount: this.scoreSystem.getHighKickCount(),
        score: this.scoreSystem.getScore()
      });
      if (completed) {
        this.challengeNotified = true;
        AudioManager.getInstance().playNewRecord();
        this.spawnPopup(
          GAME_WIDTH / 2,
          190,
          `🎉 ĐẠT MỤC TIÊU: ${mission.title}! (${mission.rewardLabel})`,
          '#4ade80',
          28
        );
      }
    }

    this.refreshHUD();
  }

  private advancePracticeKickStep(action: KickAction): void {
    if (this.practiceStep === 'KICK_LEFT' && action === 'LEFT') {
      this.practiceStepCount++;
      this.hintBannerText.setText(
        `🎓 BƯỚC 3/6 (ĐÁ CHÂN TRÁI - ${this.practiceStepCount}/2): Rất chuẩn! Đá thêm ${2 - this.practiceStepCount} lần bằng chân trái [A]!`
      );
      if (this.practiceStepCount >= 2) {
        AudioManager.getInstance().playNewRecord();
        this.spawnPopup(this.player.x, this.player.y - 160, '✅ HOÀN THÀNH ĐÁ CHÂN TRÁI!', '#4ade80', 26);
        this.setPracticeStep('KICK_RIGHT');
      }
    } else if (this.practiceStep === 'KICK_RIGHT' && action === 'RIGHT') {
      this.practiceStepCount++;
      this.hintBannerText.setText(
        `🎓 BƯỚC 4/6 (ĐÁ CHÂN PHẢI - ${this.practiceStepCount}/2): Tuyệt vời! Đá thêm ${2 - this.practiceStepCount} lần bằng chân phải [D]!`
      );
      if (this.practiceStepCount >= 2) {
        AudioManager.getInstance().playNewRecord();
        this.spawnPopup(this.player.x, this.player.y - 160, '✅ HOÀN THÀNH ĐÁ CHÂN PHẢI!', '#4ade80', 26);
        this.setPracticeStep('RECEIVE');
      }
    } else if (this.practiceStep === 'RECEIVE' && action === 'RECEIVE') {
      this.practiceStepCount++;
      this.hintBannerText.setText(
        `🎓 BƯỚC 5/6 (ĐỠ CẦU HÃM LỰC - ${this.practiceStepCount}/2): Khéo lắm! Đỡ cầu thêm ${2 - this.practiceStepCount} lần bằng nút [S / ĐỠ CẦU]!`
      );
      if (this.practiceStepCount >= 2) {
        AudioManager.getInstance().playNewRecord();
        this.spawnPopup(this.player.x, this.player.y - 160, '✅ HOÀN THÀNH KỸ THUẬT ĐỠ CẦU!', '#4ade80', 26);
        this.setPracticeStep('KICK_HIGH');
      }
    } else if (this.practiceStep === 'KICK_HIGH' && action === 'HIGH') {
      this.practiceStepCount++;
      this.hintBannerText.setText(
        `🎓 BƯỚC 6/6 (ĐÁ CẦU CAO - ${this.practiceStepCount}/2): Cú sút cực mạnh! Thực hiện thêm ${2 - this.practiceStepCount} lần [W / Space]!`
      );
      if (this.practiceStepCount >= 2) {
        AudioManager.getInstance().playNewRecord();
        this.player.setAnimState('CELEBRATE', 0.6);
        this.spawnPopup(
          GAME_WIDTH / 2,
          230,
          '🎉 HOÀN THÀNH KHÓA TẬP LUYỆN! BẠN ĐÃ SẴN SÀNG THI ĐẤU!',
          '#fde047',
          28
        );
        this.setPracticeStep('FREE_PRACTICE');
      }
    }
  }

  private refreshHUD(): void {
    let modeText: string | undefined;
    if (this.mode === 'TIME_ATTACK') {
      modeText = `${Math.max(0, this.timeAttackRemainingSec).toFixed(1)}s`;
    } else if (this.mode === 'CHALLENGE') {
      const mission = GameStateManager.getInstance().getActiveChallenge();
      let cur = 0;
      if (mission.type === 'KICKS') cur = this.scoreSystem.getKicks();
      else if (mission.type === 'COMBO') cur = this.comboSystem.getMaxCombo();
      else if (mission.type === 'PERFECTS') cur = this.scoreSystem.getPerfectCount();
      else if (mission.type === 'HIGH_KICKS') cur = this.scoreSystem.getHighKickCount();
      else if (mission.type === 'SCORE') cur = this.scoreSystem.getScore();
      modeText = `${Math.min(cur, mission.target)} / ${mission.target}`;
    } else if (this.mode === 'PRACTICE') {
      const stepMap: Record<PracticeStep, string> = {
        MOVE_LEFT: 'Bước 1/6: Đi Trái',
        MOVE_RIGHT: 'Bước 2/6: Đi Phải',
        KICK_LEFT: `Bước 3/6: Đá Trái (${this.practiceStepCount}/2)`,
        KICK_RIGHT: `Bước 4/6: Đá Phải (${this.practiceStepCount}/2)`,
        RECEIVE: `Bước 5/6: Đỡ Cầu (${this.practiceStepCount}/2)`,
        KICK_HIGH: `Bước 6/6: Đá Cao (${this.practiceStepCount}/2)`,
        FREE_PRACTICE: 'Tập Tự Do ∞'
      };
      modeText = stepMap[this.practiceStep];
    } else {
      modeText = `${this.scoreSystem.getKicks()} lần`;
    }

    this.hud.updateStats(
      this.scoreSystem.getScore(),
      this.initialBestScore,
      this.comboSystem.getCurrentCombo(),
      this.currentDifficulty.level,
      modeText
    );
  }

  private togglePause(forceState?: boolean): void {
    if (this.isGameOver) return;
    this.isPaused = forceState !== undefined ? forceState : !this.isPaused;
    this.inputSystem.setEnabled(!this.isPaused);
    this.hud.setPauseModalVisible(this.isPaused);
    AdService.getInstance().setInRally(!this.isPaused);
  }

  public update(_time: number, deltaMs: number): void {
    if (this.isPaused || this.isGameOver) return;

    const rawDt = Math.min(deltaMs / 1000, 0.05);
    this.playTimeSec += rawDt;

    // 1. Background animation
    this.background.update(rawDt);

    // 2. Handle Practice Movement Steps (Steps 1 & 2 before shuttlecock rally)
    const manualDir = this.inputSystem.getManualMoveDirection();
    const settings = StorageManager.getInstance().getSettings();

    if (
      this.mode === 'PRACTICE' &&
      (this.practiceStep === 'MOVE_LEFT' || this.practiceStep === 'MOVE_RIGHT')
    ) {
      this.player.updatePlayer(
        rawDt,
        this.player.x + (this.practiceStep === 'MOVE_LEFT' ? -80 : 80),
        COURT_CONFIG.GROUND_Y - 120,
        0,
        manualDir,
        settings.showHitboxHelper,
        false
      );
      this.updatePracticeMoveZoneVisual();
      this.updatePoolsAndAura(rawDt);
      return;
    }

    // 3. Update Difficulty based on total kicks in this session (capped gently in Practice Mode)
    this.currentDifficulty =
      this.mode === 'PRACTICE'
        ? this.difficultySystem.updateFromKicks(0, rawDt)
        : this.difficultySystem.updateFromKicks(this.scoreSystem.getKicks(), rawDt);

    // 4. Time Attack countdown check
    if (this.mode === 'TIME_ATTACK') {
      this.timeAttackRemainingSec -= rawDt;
      if (this.timeAttackRemainingSec <= 0) {
        this.timeAttackRemainingSec = 0;
        this.refreshHUD();
        this.triggerGameOver();
        return;
      }
      this.refreshHUD();
    }

    // 5. Handle brief re-serve if shuttlecock dropped in Time Attack or Practice Mode
    if (this.reServeDelaySec > 0) {
      this.reServeDelaySec -= rawDt;
      this.player.updatePlayer(
        rawDt,
        this.shuttlecock.bodyState.x,
        this.shuttlecock.bodyState.y,
        0,
        manualDir,
        settings.showHitboxHelper,
        this.practiceAutoMove
      );
      if (this.reServeDelaySec <= 0) {
        if (this.mode === 'PRACTICE' && this.practiceStep !== 'FREE_PRACTICE') {
          const targetAct: KickAction =
            this.practiceStep === 'KICK_LEFT'
              ? 'LEFT'
              : this.practiceStep === 'KICK_RIGHT'
              ? 'RIGHT'
              : this.practiceStep === 'RECEIVE'
              ? 'RECEIVE'
              : 'HIGH';
          this.serveShuttlecockForPractice(targetAct);
        } else {
          this.serveShuttlecock();
        }
      }
      this.updatePoolsAndAura(rawDt);
      return;
    }

    // 6. Apply Slow-Motion assist when shuttlecock enters kick window in Practice Mode
    let physicsDt = rawDt;
    if (
      this.mode === 'PRACTICE' &&
      this.practiceSlowMo &&
      this.shuttlecock.bodyState.vy > 0 &&
      this.shuttlecock.bodyState.y > COURT_CONFIG.GROUND_Y - 125 &&
      this.shuttlecock.bodyState.y < COURT_CONFIG.GROUND_Y - 22
    ) {
      physicsDt = rawDt * 0.36;
    }

    //Keep shuttlecock positioned over the target foot during guided practice steps
    if (this.mode === 'PRACTICE' && this.practiceStep !== 'FREE_PRACTICE') {
      const desiredOffset =
        this.practiceStep === 'KICK_LEFT'
          ? -32
          : this.practiceStep === 'KICK_RIGHT'
          ? 32
          : this.practiceStep === 'KICK_HIGH'
          ? 24
          : 0;
      const targetX = this.player.x + desiredOffset;
      this.shuttlecock.bodyState.x = Phaser.Math.Linear(
        this.shuttlecock.bodyState.x,
        targetX,
        rawDt * 6
      );
    } else if (this.mode === 'PRACTICE' && this.practiceStep === 'FREE_PRACTICE') {
      // In Free Practice, dynamically highlight the recommended foot button as shuttle descends!
      if (this.shuttlecock.bodyState.vy > 0 && this.shuttlecock.bodyState.y > COURT_CONFIG.GROUND_Y - 220) {
        const relX = this.shuttlecock.bodyState.x - this.player.x;
        this.hud.setHighlightedControl(relX < 0 ? 'LEFT' : 'RIGHT');
      } else {
        this.hud.setHighlightedControl(null);
      }
    }

    // 7. Update Shuttlecock Physics
    const hitGround = this.physicsSystem.updateShuttlecock(
      this.shuttlecock.bodyState,
      physicsDt,
      this.currentDifficulty
    );

    this.shuttlecock.syncVisuals(rawDt, settings.showHitboxHelper || this.mode === 'PRACTICE');

    // 8. Update Player Footwork & Animation
    this.player.updatePlayer(
      rawDt,
      this.shuttlecock.bodyState.x,
      this.shuttlecock.bodyState.y,
      this.shuttlecock.bodyState.vy,
      manualDir,
      settings.showHitboxHelper || this.mode === 'PRACTICE',
      this.practiceAutoMove
    );

    // 9. Combo idle timeout check
    if (this.comboSystem.update(rawDt, true)) {
      this.refreshHUD();
    }

    // 10. Check if Shuttlecock hit the ground
    if (hitGround) {
      this.spawnImpactParticles(
        this.shuttlecock.bodyState.x,
        COURT_CONFIG.GROUND_Y,
        'MISS',
        14
      );

      if (this.mode === 'PRACTICE') {
        // In Practice Mode, never Game Over! Gently re-serve so the player can keep practicing
        AudioManager.getInstance().playMissSwing();
        this.comboSystem.resetComboOnly();
        this.player.setAnimState('MISS', 0.35);
        this.spawnPopup(
          this.shuttlecock.bodyState.x,
          COURT_CONFIG.GROUND_Y - 55,
          '🔄 TẬP TIẾP NÀO! ĐỢI CẦU VÀO VÒNG TRÒN CHÂN...',
          '#38bdf8',
          21
        );
        this.reServeDelaySec = 0.48;
        this.refreshHUD();
      } else if (this.mode === 'TIME_ATTACK' && this.timeAttackRemainingSec > 1.2) {
        AudioManager.getInstance().playMissSwing();
        this.comboSystem.resetComboOnly();
        this.player.setAnimState('MISS', 0.45);
        this.spawnPopup(
          this.shuttlecock.bodyState.x,
          COURT_CONFIG.GROUND_Y - 50,
          'RƠI CẦU! PHÁT CẦU MỚI...',
          '#f87171',
          22
        );
        this.reServeDelaySec = 0.55;
        this.refreshHUD();
      } else {
        this.triggerGameOver();
      }
    }

    this.updatePoolsAndAura(rawDt);
  }

  private updatePracticeMoveZoneVisual(): void {
    const targetX = this.practiceStep === 'MOVE_LEFT' ? 430 : 850;
    const targetY = COURT_CONFIG.GROUND_Y;
    const pulse = 1 + Math.sin(this.playTimeSec * 7) * 0.12;

    const g = this.practiceTargetGraphics;
    g.clear();
    g.fillStyle(0x22c55e, 0.28);
    g.lineStyle(4, 0x4ade80, 0.95);
    g.fillEllipse(targetX, targetY, 110 * pulse, 34 * pulse);
    g.strokeEllipse(targetX, targetY, 110 * pulse, 34 * pulse);

    // Vertical beacon beam
    g.fillStyle(0x4ade80, 0.14);
    g.fillRect(targetX - 38, targetY - 140, 76, 140);

    this.practiceTargetLabel
      .setPosition(targetX, targetY - 155)
      .setText(
        this.practiceStep === 'MOVE_LEFT'
          ? '🎯 BƯỚC TỚI ĐÂY (TRÁI)'
          : '🎯 BƯỚC TỚI ĐÂY (PHẢI)'
      )
      .setVisible(true);

    // Check if player reached target zone
    if (this.practiceStep === 'MOVE_LEFT' && this.player.x <= targetX + 28) {
      AudioManager.getInstance().playPerfect();
      this.spawnImpactParticles(this.player.x, this.player.y - 40, 'PERFECT', 16);
      this.spawnPopup(this.player.x, this.player.y - 150, '✅ DI CHUYỂN TRÁI THÀNH CÔNG!', '#4ade80', 25);
      this.setPracticeStep('MOVE_RIGHT');
    } else if (this.practiceStep === 'MOVE_RIGHT' && this.player.x >= targetX - 28) {
      AudioManager.getInstance().playPerfect();
      this.spawnImpactParticles(this.player.x, this.player.y - 40, 'PERFECT', 16);
      this.spawnPopup(this.player.x, this.player.y - 150, '✅ DI CHUYỂN PHẢI THÀNH CÔNG!', '#4ade80', 25);
      this.setPracticeStep('KICK_LEFT');
    }
  }

  private updatePoolsAndAura(dt: number): void {
    for (const p of this.popupPool) {
      if (!p.active) continue;
      p.elapsed += dt;
      if (p.elapsed >= p.duration) {
        p.active = false;
        p.textObj.setVisible(false);
      } else {
        p.textObj.y += p.vy * dt;
        const ratio = p.elapsed / p.duration;
        if (ratio > 0.55) {
          p.textObj.setAlpha(1 - (ratio - 0.55) / 0.45);
        }
      }
    }

    for (const pt of this.particlePool) {
      if (!pt.active) continue;
      pt.elapsed += dt;
      if (pt.elapsed >= pt.duration) {
        pt.active = false;
        pt.sprite.setVisible(false);
      } else {
        pt.vy += 320 * dt;
        pt.sprite.x += pt.vx * dt;
        pt.sprite.y += pt.vy * dt;
        pt.sprite.setAlpha(1 - pt.elapsed / pt.duration);
        pt.sprite.rotation += 5 * dt;
      }
    }

    this.comboAuraGraphics.clear();
    const combo = this.comboSystem.getCurrentCombo();
    if (combo >= 10 && !this.isGameOver) {
      const pulse = 1 + Math.sin(this.playTimeSec * 8) * 0.12;
      const auraColor = combo >= 50 ? 0xf43f5e : combo >= 20 ? 0xfacc15 : 0x38bdf8;
      this.comboAuraGraphics.lineStyle(3, auraColor, 0.45);
      this.comboAuraGraphics.strokeCircle(this.player.x, this.player.y - 60, 68 * pulse);
      if (combo >= 30) {
        this.comboAuraGraphics.fillStyle(auraColor, 0.12);
        this.comboAuraGraphics.fillCircle(this.player.x, this.player.y - 60, 64 * pulse);
      }
    }
  }

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.inputSystem.setEnabled(false);
    AdService.getInstance().setInRally(false);

    this.player.setAnimState('GAME_OVER', 3.0);
    this.cameras.main.shake(220, 0.008);

    const stateMgr = GameStateManager.getInstance();
    const activeMission = stateMgr.getActiveChallenge();

    const finalStats = stateMgr.finalizeSession({
      mode: this.mode,
      challengeId: this.mode === 'CHALLENGE' ? activeMission.id : undefined,
      score: this.scoreSystem.getScore(),
      kicks: this.scoreSystem.getKicks(),
      maxCombo: this.comboSystem.getMaxCombo(),
      currentCombo: this.comboSystem.getCurrentCombo(),
      perfectCount: this.scoreSystem.getPerfectCount(),
      goodCount: this.scoreSystem.getGoodCount(),
      normalCount: this.scoreSystem.getNormalCount(),
      highKickCount: this.scoreSystem.getHighKickCount(),
      level: this.currentDifficulty.level,
      playTimeSec: this.playTimeSec
    });

    if (finalStats.isNewBest || finalStats.challengeCompleted) {
      AudioManager.getInstance().playNewRecord();
      AdService.getInstance().notifyHappyTime();
    } else {
      AudioManager.getInstance().playGameOver();
    }

    this.spawnPopup(
      this.shuttlecock.bodyState.x,
      COURT_CONFIG.GROUND_Y - 40,
      this.mode === 'TIME_ATTACK' ? '⏱️ HẾT GIỜ!' : '💥 CẦU CHẠM ĐẤT!',
      '#f87171',
      28
    );

    this.time.delayedCall(750, () => {
      this.scene.start('GameOverScene');
    });
  }

  private cleanupScene(): void {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = undefined;
    }
    this.inputSystem?.destroy();
  }
}
