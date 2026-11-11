import Phaser from 'phaser';
import { GameStateManager } from '../managers/GameStateManager';
import { SessionStats } from '../types';
import { GameOverPanel } from '../ui/GameOverPanel';
import { SchoolyardBackground } from '../ui/SchoolyardBackground';

export class GameOverScene extends Phaser.Scene {
  private background!: SchoolyardBackground;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  public create(): void {
    this.background = new SchoolyardBackground(this);

    const stateMgr = GameStateManager.getInstance();
    const stats: SessionStats = stateMgr.getLastSessionStats() || {
      mode: stateMgr.getMode(),
      score: 0,
      kicks: 0,
      maxCombo: 0,
      currentCombo: 0,
      perfectCount: 0,
      goodCount: 0,
      normalCount: 0,
      highKickCount: 0,
      level: 1,
      playTimeSec: 0,
      isNewBest: false,
      challengeCompleted: false,
      coinsEarned: 0,
      newlyUnlockedAchievements: []
    };

    new GameOverPanel(
      this,
      stats,
      () => {
        this.scene.start('GameScene');
      },
      () => {
        this.scene.start('MenuScene');
      }
    );
  }

  public update(_time: number, deltaMs: number): void {
    this.background.update(Math.min(deltaMs / 1000, 0.05));
  }
}

