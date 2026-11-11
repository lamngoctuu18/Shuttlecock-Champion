import { KickAction, KickRating } from '../types';

export class ScoreSystem {
  private score: number = 0;
  private kicks: number = 0;
  private perfectCount: number = 0;
  private goodCount: number = 0;
  private normalCount: number = 0;
  private highKickCount: number = 0;

  public reset(): void {
    this.score = 0;
    this.kicks = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.normalCount = 0;
    this.highKickCount = 0;
  }

  public addKickScore(
    rating: KickRating,
    action: KickAction,
    currentCombo: number,
    level: number,
    milestoneBonus: number
  ): number {
    if (rating === 'MISS') return 0;

    this.kicks += 1;
    if (action === 'HIGH') {
      this.highKickCount += 1;
    }

    let basePoints = 10;
    if (rating === 'PERFECT') {
      basePoints = 25;
      this.perfectCount += 1;
    } else if (rating === 'GOOD') {
      basePoints = 15;
      this.goodCount += 1;
    } else {
      basePoints = 10;
      this.normalCount += 1;
    }

    // High kick style bonus
    const actionBonus = action === 'HIGH' ? 5 : 0;

    // Combo multiplier & level scaling
    const comboMultiplier = 1 + Math.min(2.5, Math.floor(currentCombo / 5) * 0.15);
    const levelBonus = (level - 1) * 2;

    const totalAwarded =
      Math.round((basePoints + actionBonus + levelBonus) * comboMultiplier) + milestoneBonus;

    this.score += totalAwarded;
    return totalAwarded;
  }

  public getScore(): number {
    return this.score;
  }

  public getKicks(): number {
    return this.kicks;
  }

  public getPerfectCount(): number {
    return this.perfectCount;
  }

  public getGoodCount(): number {
    return this.goodCount;
  }

  public getNormalCount(): number {
    return this.normalCount;
  }

  public getHighKickCount(): number {
    return this.highKickCount;
  }
}

