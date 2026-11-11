import { ACHIEVEMENTS } from '../config/gameConfig';
import { StorageManager } from '../managers/StorageManager';
import { AchievementDef } from '../types';

export class AchievementSystem {
  public static getAllAchievements(): Array<{
    def: AchievementDef;
    unlocked: boolean;
    currentValue: number;
    progressRatio: number;
  }> {
    const save = StorageManager.getInstance().getData();
    return ACHIEVEMENTS.map((def) => {
      const unlocked = save.unlockedAchievements.includes(def.id);
      let currentValue = 0;
      switch (def.metric) {
        case 'totalKicks':
          currentValue = save.totalKicks;
          break;
        case 'bestCombo':
          currentValue = save.bestCombo;
          break;
        case 'bestScore':
          currentValue = Math.max(save.bestScore, save.bestScoreTimeAttack);
          break;
        case 'totalPerfects':
          currentValue = save.totalPerfects;
          break;
        case 'completedChallenges':
          currentValue = save.completedChallenges.length;
          break;
      }
      const progressRatio = Math.min(1, currentValue / Math.max(1, def.target));
      return { def, unlocked, currentValue, progressRatio };
    });
  }

  public static checkMidGameComboUnlock(combo: number): AchievementDef | null {
    const storage = StorageManager.getInstance();
    const save = storage.getData();

    for (const ach of ACHIEVEMENTS) {
      if (ach.metric === 'bestCombo' && combo >= ach.target && !save.unlockedAchievements.includes(ach.id)) {
        save.unlockedAchievements.push(ach.id);
        save.coins += ach.rewardCoins;
        if (combo > save.bestCombo) {
          save.bestCombo = combo;
        }
        storage.save();
        return ach;
      }
    }
    return null;
  }
}

