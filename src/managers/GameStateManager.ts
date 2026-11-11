import { ACHIEVEMENTS, CHALLENGE_MISSIONS } from '../config/gameConfig';
import { AchievementDef, ChallengeMission, GameMode, SessionStats } from '../types';
import { StorageManager } from './StorageManager';

export class GameStateManager {
  private static instance: GameStateManager;
  private currentMode: GameMode = 'CLASSIC';
  private activeChallengeId: string = CHALLENGE_MISSIONS[0].id;
  private practiceFreeMode: boolean = false;
  private lastSessionStats: SessionStats | null = null;

  private constructor() {}

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  public setMode(mode: GameMode, challengeId?: string): void {
    this.currentMode = mode;
    if (challengeId) {
      this.activeChallengeId = challengeId;
    }
  }

  public setPracticeMode(freeMode: boolean = false): void {
    this.currentMode = 'PRACTICE';
    this.practiceFreeMode = freeMode;
  }

  public isPracticeFreeMode(): boolean {
    return this.practiceFreeMode;
  }

  public getMode(): GameMode {
    return this.currentMode;
  }

  public getActiveChallenge(): ChallengeMission {
    return (
      CHALLENGE_MISSIONS.find((c) => c.id === this.activeChallengeId) || CHALLENGE_MISSIONS[0]
    );
  }

  public setLastSessionStats(stats: SessionStats): void {
    this.lastSessionStats = stats;
  }

  public getLastSessionStats(): SessionStats | null {
    return this.lastSessionStats;
  }

  public finalizeSession(
    rawStats: Omit<
      SessionStats,
      'isNewBest' | 'challengeCompleted' | 'coinsEarned' | 'newlyUnlockedAchievements'
    >
  ): SessionStats {
    const storage = StorageManager.getInstance();
    const save = storage.getData();

    let isNewBest = false;
    if (rawStats.mode === 'TIME_ATTACK') {
      if (rawStats.score > save.bestScoreTimeAttack && rawStats.score > 0) {
        isNewBest = true;
      }
      storage.addTimeAttackRecord({
        score: rawStats.score,
        kicks: rawStats.kicks,
        maxCombo: rawStats.maxCombo,
        date: new Date().toLocaleDateString('vi-VN')
      });
    } else {
      if (rawStats.score > save.bestScore && rawStats.score > 0) {
        isNewBest = true;
        save.bestScore = rawStats.score;
      }
    }

    if (rawStats.maxCombo > save.bestCombo) {
      save.bestCombo = rawStats.maxCombo;
    }

    save.totalKicks += rawStats.kicks;
    save.totalPerfects += rawStats.perfectCount;
    save.totalPlayTimeSec += Math.round(rawStats.playTimeSec);

    // Base coins earned from kicks + score
    let coinsEarned = Math.max(1, Math.floor(rawStats.kicks * 1.2 + rawStats.perfectCount * 2));

    // Check challenge completion
    let challengeCompleted = false;
    if (rawStats.mode === 'CHALLENGE' && rawStats.challengeId) {
      const mission = CHALLENGE_MISSIONS.find((m) => m.id === rawStats.challengeId);
      if (mission) {
        const passed = this.evaluateMission(mission, rawStats);
        if (passed) {
          challengeCompleted = true;
          if (!save.completedChallenges.includes(mission.id)) {
            save.completedChallenges.push(mission.id);
            coinsEarned += mission.rewardCoins;
          } else {
            coinsEarned += Math.floor(mission.rewardCoins * 0.25);
          }
        }
      }
    }

    // Check newly unlocked achievements
    const newlyUnlockedAchievements: AchievementDef[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (save.unlockedAchievements.includes(ach.id)) continue;

      let metricVal = 0;
      switch (ach.metric) {
        case 'totalKicks':
          metricVal = save.totalKicks;
          break;
        case 'bestCombo':
          metricVal = save.bestCombo;
          break;
        case 'bestScore':
          metricVal = Math.max(save.bestScore, save.bestScoreTimeAttack);
          break;
        case 'totalPerfects':
          metricVal = save.totalPerfects;
          break;
        case 'completedChallenges':
          metricVal = save.completedChallenges.length;
          break;
      }

      if (metricVal >= ach.target) {
        save.unlockedAchievements.push(ach.id);
        coinsEarned += ach.rewardCoins;
        newlyUnlockedAchievements.push(ach);
      }
    }

    save.coins += coinsEarned;
    storage.save();

    const fullStats: SessionStats = {
      ...rawStats,
      isNewBest,
      challengeCompleted,
      coinsEarned,
      newlyUnlockedAchievements
    };

    this.lastSessionStats = fullStats;
    return fullStats;
  }

  public evaluateMission(
    mission: ChallengeMission,
    stats: { kicks: number; maxCombo: number; perfectCount: number; highKickCount: number; score: number }
  ): boolean {
    switch (mission.type) {
      case 'KICKS':
        return stats.kicks >= mission.target;
      case 'COMBO':
        return stats.maxCombo >= mission.target;
      case 'PERFECTS':
        return stats.perfectCount >= mission.target;
      case 'HIGH_KICKS':
        return stats.highKickCount >= mission.target;
      case 'SCORE':
        return stats.score >= mission.target;
      default:
        return false;
    }
  }
}

