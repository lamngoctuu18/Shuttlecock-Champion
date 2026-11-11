import { DifficultyParams } from '../types';

export class DifficultySystem {
  private currentLevel: number = 1;
  private windPhase: number = 0;

  public reset(): void {
    this.currentLevel = 1;
    this.windPhase = 0;
  }

  public updateFromKicks(totalKicksInSession: number, deltaSec: number): DifficultyParams {
    // Smooth level progression: every 8 kicks increases level, capped at 10
    const computedLevel = Math.min(10, 1 + Math.floor(totalKicksInSession / 8));
    this.currentLevel = computedLevel;
    this.windPhase += deltaSec * (0.8 + this.currentLevel * 0.12);

    if (this.currentLevel === 1) {
      return {
        level: 1,
        gravityScale: 0.86,
        horizontalDriftRange: 55,
        windAcceleration: 0,
        sweetSpotMultiplier: 1.18,
        speedMultiplier: 0.92,
        levelName: 'Khởi Động Sân Trường'
      };
    }

    if (this.currentLevel <= 5) {
      const progress = (this.currentLevel - 1) / 4; // 0.25 .. 1.0
      return {
        level: this.currentLevel,
        gravityScale: 0.9 + progress * 0.22,
        horizontalDriftRange: 75 + progress * 65,
        windAcceleration: Math.sin(this.windPhase) * (12 * progress),
        sweetSpotMultiplier: 1.12 - progress * 0.12,
        speedMultiplier: 0.96 + progress * 0.16,
        levelName: `Nhịp Độ Tăng Dần (Lv.${this.currentLevel})`
      };
    }

    // Level 6 - 10
    const highProgress = (this.currentLevel - 5) / 5; // 0.2 .. 1.0
    return {
      level: this.currentLevel,
      gravityScale: 1.12 + highProgress * 0.28,
      horizontalDriftRange: 140 + highProgress * 85,
      windAcceleration: Math.sin(this.windPhase * 1.3) * (18 + highProgress * 26),
      sweetSpotMultiplier: Math.max(0.82, 1.0 - highProgress * 0.16),
      speedMultiplier: 1.12 + highProgress * 0.22,
      levelName: `Thử Thách Cao Thủ (Lv.${this.currentLevel})`
    };
  }

  public getLevel(): number {
    return this.currentLevel;
  }
}

