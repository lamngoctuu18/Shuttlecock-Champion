export type GameMode = 'CLASSIC' | 'CHALLENGE' | 'TIME_ATTACK' | 'PRACTICE';

export type PracticeStep =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'KICK_LEFT'
  | 'KICK_RIGHT'
  | 'RECEIVE'
  | 'KICK_HIGH'
  | 'FREE_PRACTICE';

export type HighlightTarget = 'MOVE_LEFT' | 'MOVE_RIGHT' | KickAction | null;

export type KickAction = 'LEFT' | 'RIGHT' | 'HIGH' | 'RECEIVE';

export type KickRating = 'PERFECT' | 'GOOD' | 'NORMAL' | 'MISS';

export type PlayerAnimState =
  | 'IDLE'
  | 'PREPARE'
  | 'KICK_LEFT'
  | 'KICK_RIGHT'
  | 'KICK_HIGH'
  | 'RECEIVE'
  | 'MISS'
  | 'CELEBRATE'
  | 'GAME_OVER';

export type ShuttlecockState =
  | 'READY'
  | 'FLYING_UP'
  | 'FLYING_DOWN'
  | 'DANGER_LOW'
  | 'GROUNDED';

export interface KickEvaluation {
  valid: boolean;
  rating: KickRating;
  action: KickAction;
  distance: number;
  pointsAwarded: number;
  comboBonus: number;
  vx: number;
  vy: number;
  spin: number;
  feedbackText: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  unlockCondition: string;
  unlockCost: number;
  primaryColor: number;
  secondaryColor: number;
  hairColor: number;
  skinColor: number;
  gender: 'male' | 'female' | 'sport';
}

export interface CostumeConfig {
  id: string;
  name: string;
  description: string;
  unlockCost: number;
  shirtColor: number;
  pantsColor: number;
  accentColor: number;
  shoeColor: number;
}

export interface ShuttlecockSkinConfig {
  id: string;
  name: string;
  description: string;
  unlockCost: number;
  baseColor: number;
  featherColors: number[];
  trailColor: number;
  glow: boolean;
  rainbow: boolean;
}

export interface ChallengeMission {
  id: string;
  title: string;
  description: string;
  type: 'KICKS' | 'COMBO' | 'PERFECTS' | 'HIGH_KICKS' | 'SCORE';
  target: number;
  rewardCoins: number;
  rewardLabel: string;
  timeLimitSec?: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  metric: 'totalKicks' | 'bestCombo' | 'bestScore' | 'totalPerfects' | 'completedChallenges';
  rewardCoins: number;
}

export interface TimeAttackEntry {
  score: number;
  kicks: number;
  maxCombo: number;
  date: string;
}

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  showHitboxHelper: boolean;
  vibrationEnabled: boolean;
}

export interface SaveData {
  version: number;
  bestScore: number;
  bestScoreTimeAttack: number;
  bestCombo: number;
  totalKicks: number;
  totalPerfects: number;
  totalPlayTimeSec: number;
  coins: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
  unlockedCostumes: string[];
  selectedCostume: string;
  unlockedShuttlecocks: string[];
  selectedShuttlecock: string;
  completedChallenges: string[];
  unlockedAchievements: string[];
  timeAttackLeaderboard: TimeAttackEntry[];
  settings: GameSettings;
}

export interface SessionStats {
  mode: GameMode;
  challengeId?: string;
  score: number;
  kicks: number;
  maxCombo: number;
  currentCombo: number;
  perfectCount: number;
  goodCount: number;
  normalCount: number;
  highKickCount: number;
  level: number;
  playTimeSec: number;
  isNewBest: boolean;
  challengeCompleted: boolean;
  coinsEarned: number;
  newlyUnlockedAchievements: AchievementDef[];
}

export interface DifficultyParams {
  level: number;
  gravityScale: number;
  horizontalDriftRange: number;
  windAcceleration: number;
  sweetSpotMultiplier: number;
  speedMultiplier: number;
  levelName: string;
}

