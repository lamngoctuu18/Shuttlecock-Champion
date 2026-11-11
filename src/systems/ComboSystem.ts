import { COMBO_MILESTONES } from '../config/gameConfig';
import { KickRating } from '../types';

export interface ComboResult {
  combo: number;
  maxCombo: number;
  milestoneBonus: number;
  milestoneLabel: string | null;
  triggerSpecialEffect: boolean;
}

export class ComboSystem {
  private currentCombo: number = 0;
  private maxCombo: number = 0;
  private timeSinceLastKickSec: number = 0;
  private readonly maxAllowedIdleSec: number = 4.8;

  public reset(): void {
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.timeSinceLastKickSec = 0;
  }

  public update(deltaSec: number, isRallyActive: boolean): boolean {
    if (!isRallyActive || this.currentCombo === 0) return false;
    this.timeSinceLastKickSec += deltaSec;
    if (this.timeSinceLastKickSec > this.maxAllowedIdleSec) {
      this.resetComboOnly();
      return true; // Combo timed out
    }
    return false;
  }

  public registerKick(rating: KickRating): ComboResult {
    if (rating === 'MISS') {
      this.resetComboOnly();
      return {
        combo: 0,
        maxCombo: this.maxCombo,
        milestoneBonus: 0,
        milestoneLabel: null,
        triggerSpecialEffect: false
      };
    }

    this.currentCombo += 1;
    this.timeSinceLastKickSec = 0;
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }

    const milestone = COMBO_MILESTONES[this.currentCombo];
    if (milestone) {
      return {
        combo: this.currentCombo,
        maxCombo: this.maxCombo,
        milestoneBonus: milestone.bonus,
        milestoneLabel: milestone.label,
        triggerSpecialEffect: Boolean(milestone.specialEffect)
      };
    }

    // For combos beyond 100 every 25 kicks
    if (this.currentCombo > 100 && this.currentCombo % 25 === 0) {
      return {
        combo: this.currentCombo,
        maxCombo: this.maxCombo,
        milestoneBonus: 200,
        milestoneLabel: `SIÊU CẤP x${this.currentCombo}! +200`,
        triggerSpecialEffect: true
      };
    }

    return {
      combo: this.currentCombo,
      maxCombo: this.maxCombo,
      milestoneBonus: 0,
      milestoneLabel: null,
      triggerSpecialEffect: false
    };
  }

  public resetComboOnly(): void {
    this.currentCombo = 0;
    this.timeSinceLastKickSec = 0;
  }

  public getCurrentCombo(): number {
    return this.currentCombo;
  }

  public getMaxCombo(): number {
    return this.maxCombo;
  }
}

