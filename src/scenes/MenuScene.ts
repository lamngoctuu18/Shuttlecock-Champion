import Phaser from 'phaser';
import { COURT_CONFIG } from '../config/gameConfig';
import { Player } from '../entities/Player';
import { Shuttlecock } from '../entities/Shuttlecock';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { StorageManager } from '../managers/StorageManager';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { DifficultyParams } from '../types';
import { MainMenu } from '../ui/MainMenu';
import { SchoolyardBackground } from '../ui/SchoolyardBackground';

export class MenuScene extends Phaser.Scene {
  private background!: SchoolyardBackground;
  private demoPlayer!: Player;
  private demoShuttle!: Shuttlecock;
  private physicsSystem!: PhysicsSystem;
  private demoDifficulty: DifficultyParams = {
    level: 1,
    gravityScale: 0.85,
    horizontalDriftRange: 45,
    windAcceleration: 0,
    sweetSpotMultiplier: 1.2,
    speedMultiplier: 0.92,
    levelName: 'Demo'
  };

  constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    const save = StorageManager.getInstance().getData();
    AudioManager.getInstance().startMusic('MENU');

    this.background = new SchoolyardBackground(this);
    this.physicsSystem = new PhysicsSystem();

    // Live animated character juggling the shuttlecock on the right half of the court
    const demoX = 910;
    this.demoPlayer = new Player(
      this,
      demoX,
      COURT_CONFIG.GROUND_Y,
      save.selectedCharacter,
      save.selectedCostume
    );

    this.demoShuttle = new Shuttlecock(
      this,
      demoX,
      COURT_CONFIG.GROUND_Y - 210,
      save.selectedShuttlecock
    );
    this.demoShuttle.resetToServe(demoX, COURT_CONFIG.GROUND_Y - 210);

    // Character showcase pedestal label
    this.add
      .text(demoX, COURT_CONFIG.GROUND_Y + 34, '✨ Nhân Vật Đang Chọn ✨', {
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fef08a',
        backgroundColor: '#0f172a',
        padding: { x: 12, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(25);

    // Initialize MainMenu UI
    new MainMenu(this, {
      onStartClassic: () => {
        this.scene.start('GameScene');
      },
      onOpenChallenges: () => {
        this.scene.start('ChallengeScene');
      },
      onStartTimeAttack: () => {
        this.scene.start('GameScene');
      },
      onStartPractice: (freeMode: boolean) => {
        GameStateManager.getInstance().setPracticeMode(freeMode);
        this.scene.start('GameScene');
      },
      onOpenSettings: () => {
        this.scene.start('SettingsScene');
      },
      onAppearanceChanged: () => {
        const updated = StorageManager.getInstance().getData();
        this.demoPlayer.setAppearance(updated.selectedCharacter, updated.selectedCostume);
        this.demoShuttle.setSkin(updated.selectedShuttlecock);
      }
    });
  }

  public update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.background.update(dt);

    // Update demo shuttlecock physics
    this.physicsSystem.updateShuttlecock(this.demoShuttle.bodyState, dt, this.demoDifficulty);

    // Keep demo shuttlecock within the right showcase area (x: 760..1080)
    if (this.demoShuttle.bodyState.x < 760) {
      this.demoShuttle.bodyState.x = 760;
      this.demoShuttle.bodyState.vx = Math.abs(this.demoShuttle.bodyState.vx);
    } else if (this.demoShuttle.bodyState.x > 1060) {
      this.demoShuttle.bodyState.x = 1060;
      this.demoShuttle.bodyState.vx = -Math.abs(this.demoShuttle.bodyState.vx);
    }

    // Auto-kick when descending near demoPlayer's feet
    if (
      this.demoShuttle.bodyState.vy > 0 &&
      this.demoShuttle.bodyState.y >= COURT_CONFIG.GROUND_Y - 58
    ) {
      const relX = this.demoShuttle.bodyState.x - this.demoPlayer.x;
      const action = Math.random() > 0.78 ? 'HIGH' : relX < 0 ? 'LEFT' : 'RIGHT';
      this.demoPlayer.playActionAnim(action, false);
      const vx = Phaser.Math.FloatBetween(-65, 65) + (910 - this.demoShuttle.bodyState.x) * 0.4;
      const vy = action === 'HIGH' ? -620 : -530;
      this.demoShuttle.applyKickImpulse(vx, vy, relX >= 0 ? -240 : 240);
    }

    this.demoShuttle.syncVisuals(dt, false);
    this.demoPlayer.updatePlayer(
      dt,
      this.demoShuttle.bodyState.x,
      this.demoShuttle.bodyState.y,
      this.demoShuttle.bodyState.vy,
      0,
      false
    );
  }
}

