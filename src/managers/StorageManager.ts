import { GameSettings, SaveData, TimeAttackEntry } from '../types';

const STORAGE_KEY = 'shuttlecock_champion_save_v1';

const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.6,
  sfxVolume: 0.85,
  showHitboxHelper: true,
  vibrationEnabled: true
};

const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  bestScore: 0,
  bestScoreTimeAttack: 0,
  bestCombo: 0,
  totalKicks: 0,
  totalPerfects: 0,
  totalPlayTimeSec: 0,
  coins: 100, // Starting bonus coins so player can try unlocking items or earn more
  unlockedCharacters: ['nam_sinh', 'nu_sinh', 'the_thao'],
  selectedCharacter: 'nam_sinh',
  unlockedCostumes: ['dong_phuc'],
  selectedCostume: 'dong_phuc',
  unlockedShuttlecocks: ['truyen_thong'],
  selectedShuttlecock: 'truyen_thong',
  completedChallenges: [],
  unlockedAchievements: [],
  timeAttackLeaderboard: [],
  settings: { ...DEFAULT_SETTINGS }
};

export class StorageManager {
  private static instance: StorageManager;
  private data: SaveData;

  private constructor() {
    this.data = this.loadFromDisk();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private loadFromDisk(): SaveData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.cloneDefaults();
      }
      const parsed = JSON.parse(raw);
      return this.sanitize(parsed);
    } catch (err) {
      console.warn('[StorageManager] Failed to parse localStorage, resetting to default:', err);
      return this.cloneDefaults();
    }
  }

  private cloneDefaults(): SaveData {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
  }

  private sanitize(input: unknown): SaveData {
    const def = this.cloneDefaults();
    if (!input || typeof input !== 'object') {
      return def;
    }
    const obj = input as Partial<SaveData>;

    const num = (val: unknown, fallback: number): number =>
      typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : fallback;

    const strArr = (val: unknown, fallback: string[]): string[] =>
      Array.isArray(val) && val.every((x) => typeof x === 'string') && val.length > 0
        ? Array.from(new Set([...fallback, ...val]))
        : fallback;

    const rawSettings = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Partial<GameSettings>;

    const settings: GameSettings = {
      musicEnabled: typeof rawSettings.musicEnabled === 'boolean' ? rawSettings.musicEnabled : def.settings.musicEnabled,
      sfxEnabled: typeof rawSettings.sfxEnabled === 'boolean' ? rawSettings.sfxEnabled : def.settings.sfxEnabled,
      musicVolume: Math.min(1, Math.max(0, num(rawSettings.musicVolume, def.settings.musicVolume))),
      sfxVolume: Math.min(1, Math.max(0, num(rawSettings.sfxVolume, def.settings.sfxVolume))),
      showHitboxHelper:
        typeof rawSettings.showHitboxHelper === 'boolean'
          ? rawSettings.showHitboxHelper
          : def.settings.showHitboxHelper,
      vibrationEnabled:
        typeof rawSettings.vibrationEnabled === 'boolean'
          ? rawSettings.vibrationEnabled
          : def.settings.vibrationEnabled
    };

    const leaderboard: TimeAttackEntry[] = Array.isArray(obj.timeAttackLeaderboard)
      ? obj.timeAttackLeaderboard
          .filter(
            (e): e is TimeAttackEntry =>
              Boolean(e) &&
              typeof e.score === 'number' &&
              typeof e.kicks === 'number' &&
              typeof e.maxCombo === 'number' &&
              typeof e.date === 'string'
          )
          .slice(0, 10)
      : [];

    const unlockedCharacters = strArr(obj.unlockedCharacters, def.unlockedCharacters);
    const unlockedCostumes = strArr(obj.unlockedCostumes, def.unlockedCostumes);
    const unlockedShuttlecocks = strArr(obj.unlockedShuttlecocks, def.unlockedShuttlecocks);

    return {
      version: 1,
      bestScore: num(obj.bestScore, def.bestScore),
      bestScoreTimeAttack: num(obj.bestScoreTimeAttack, def.bestScoreTimeAttack),
      bestCombo: num(obj.bestCombo, def.bestCombo),
      totalKicks: num(obj.totalKicks, def.totalKicks),
      totalPerfects: num(obj.totalPerfects, def.totalPerfects),
      totalPlayTimeSec: num(obj.totalPlayTimeSec, def.totalPlayTimeSec),
      coins: num(obj.coins, def.coins),
      unlockedCharacters,
      selectedCharacter:
        typeof obj.selectedCharacter === 'string' && unlockedCharacters.includes(obj.selectedCharacter)
          ? obj.selectedCharacter
          : def.selectedCharacter,
      unlockedCostumes,
      selectedCostume:
        typeof obj.selectedCostume === 'string' && unlockedCostumes.includes(obj.selectedCostume)
          ? obj.selectedCostume
          : def.selectedCostume,
      unlockedShuttlecocks,
      selectedShuttlecock:
        typeof obj.selectedShuttlecock === 'string' && unlockedShuttlecocks.includes(obj.selectedShuttlecock)
          ? obj.selectedShuttlecock
          : def.selectedShuttlecock,
      completedChallenges: Array.isArray(obj.completedChallenges)
        ? obj.completedChallenges.filter((x): x is string => typeof x === 'string')
        : [],
      unlockedAchievements: Array.isArray(obj.unlockedAchievements)
        ? obj.unlockedAchievements.filter((x): x is string => typeof x === 'string')
        : [],
      timeAttackLeaderboard: leaderboard,
      settings
    };
  }

  public save(): void {
    const serialized = JSON.stringify(this.data);
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
      console.warn('[StorageManager] Failed to save to localStorage:', err);
    }
    try {
      if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.data) {
        window.CrazyGames.SDK.data.setItem(STORAGE_KEY, serialized);
      }
    } catch {
      // Ignore if CrazyGames SDK is not initialized yet
    }
  }

  /**
   * Called after CrazyGames.SDK.init() resolves to load/merge cloud-saved data.
   */
  public syncWithCrazyGamesData(): void {
    try {
      const cgData = window.CrazyGames?.SDK?.data;
      if (!cgData) return;
      const raw = cgData.getItem(STORAGE_KEY);
      if (!raw) {
        // Push local data to CrazyGames cloud storage
        cgData.setItem(STORAGE_KEY, JSON.stringify(this.data));
        return;
      }
      const cloudSave = this.sanitize(JSON.parse(raw));
      // Keep whichever record has higher progress
      if (
        cloudSave.bestScore > this.data.bestScore ||
        cloudSave.totalKicks > this.data.totalKicks ||
        cloudSave.coins > this.data.coins
      ) {
        this.data = {
          ...this.data,
          bestScore: Math.max(this.data.bestScore, cloudSave.bestScore),
          bestScoreTimeAttack: Math.max(this.data.bestScoreTimeAttack, cloudSave.bestScoreTimeAttack),
          bestCombo: Math.max(this.data.bestCombo, cloudSave.bestCombo),
          totalKicks: Math.max(this.data.totalKicks, cloudSave.totalKicks),
          totalPerfects: Math.max(this.data.totalPerfects, cloudSave.totalPerfects),
          totalPlayTimeSec: Math.max(this.data.totalPlayTimeSec, cloudSave.totalPlayTimeSec),
          coins: Math.max(this.data.coins, cloudSave.coins),
          unlockedCostumes: Array.from(new Set([...this.data.unlockedCostumes, ...cloudSave.unlockedCostumes])),
          unlockedShuttlecocks: Array.from(new Set([...this.data.unlockedShuttlecocks, ...cloudSave.unlockedShuttlecocks])),
          completedChallenges: Array.from(new Set([...this.data.completedChallenges, ...cloudSave.completedChallenges])),
          unlockedAchievements: Array.from(new Set([...this.data.unlockedAchievements, ...cloudSave.unlockedAchievements]))
        };
        this.save();
      }
    } catch (err) {
      console.warn('[StorageManager] CrazyGames data sync skipped:', err);
    }
  }

  public getData(): SaveData {
    return this.data;
  }

  public getSettings(): GameSettings {
    return this.data.settings;
  }

  public updateSettings(partial: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
  }

  public addCoins(amount: number): void {
    if (amount > 0) {
      this.data.coins += Math.floor(amount);
      this.save();
    }
  }

  public spendCoins(amount: number): boolean {
    if (this.data.coins >= amount) {
      this.data.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  public selectCharacter(id: string): void {
    if (this.data.unlockedCharacters.includes(id)) {
      this.data.selectedCharacter = id;
      this.save();
    }
  }

  public unlockAndSelectCostume(id: string, cost: number): boolean {
    if (this.data.unlockedCostumes.includes(id)) {
      this.data.selectedCostume = id;
      this.save();
      return true;
    }
    if (this.spendCoins(cost)) {
      this.data.unlockedCostumes.push(id);
      this.data.selectedCostume = id;
      this.save();
      return true;
    }
    return false;
  }

  public unlockAndSelectShuttlecock(id: string, cost: number): boolean {
    if (this.data.unlockedShuttlecocks.includes(id)) {
      this.data.selectedShuttlecock = id;
      this.save();
      return true;
    }
    if (this.spendCoins(cost)) {
      this.data.unlockedShuttlecocks.push(id);
      this.data.selectedShuttlecock = id;
      this.save();
      return true;
    }
    return false;
  }

  public addTimeAttackRecord(entry: TimeAttackEntry): void {
    this.data.timeAttackLeaderboard.push(entry);
    this.data.timeAttackLeaderboard.sort((a, b) => b.score - a.score);
    this.data.timeAttackLeaderboard = this.data.timeAttackLeaderboard.slice(0, 8);
    if (entry.score > this.data.bestScoreTimeAttack) {
      this.data.bestScoreTimeAttack = entry.score;
    }
    this.save();
  }

  public resetAllData(): void {
    this.data = this.cloneDefaults();
    this.save();
  }
}

