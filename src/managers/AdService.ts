import { AudioManager } from './AudioManager';
import { StorageManager } from './StorageManager';

/**
 * TypeScript declarations for CrazyGames HTML5 SDK v3
 * Docs: https://docs.crazygames.com/sdk/html5-v3/
 */
export interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown, errorData?: unknown) => void;
}

export interface CrazyGamesSDKv3 {
  init: () => Promise<void>;
  environment?: 'local' | 'crazygames' | 'disabled';
  game: {
    loadingStart: () => void;
    loadingStop: () => void;
    gameplayStart: () => void;
    gameplayStop: () => void;
    happytime: () => void;
  };
  ad: {
    requestAd: (type: 'midgame' | 'rewarded', callbacks: CrazyGamesAdCallbacks) => void;
    hasAdblock?: () => Promise<boolean>;
  };
  data: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDKv3;
    };
  }
}

export interface AdProviderAdapter {
  initialize(): Promise<void>;
  loadingStart(): void;
  loadingStop(): void;
  showInterstitial(): Promise<boolean>;
  showRewarded(): Promise<boolean>;
  gameplayStart(): void;
  gameplayStop(): void;
  happyTime(): void;
  isAvailable(): boolean;
}

/**
 * Official CrazyGames HTML5 SDK v3 Adapter with safe fallback when offline or local.
 */
class CrazyGamesV3Adapter implements AdProviderAdapter {
  private initialized: boolean = false;
  private gameplayActive: boolean = false;

  private get sdk(): CrazyGamesSDKv3 | undefined {
    if (typeof window !== 'undefined' && window.CrazyGames?.SDK) {
      return window.CrazyGames.SDK;
    }
    return undefined;
  }

  public isAvailable(): boolean {
    return this.initialized && Boolean(this.sdk) && this.sdk?.environment !== 'disabled';
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    const sdk = this.sdk;
    if (!sdk || typeof sdk.init !== 'function') {
      return;
    }
    try {
      await sdk.init();
      this.initialized = true;
      // Sync cloud save data from CrazyGames Data Module after SDK initialization
      StorageManager.getInstance().syncWithCrazyGamesData();
    } catch (err) {
      console.warn('[CrazyGamesSDK] Init skipped or running standalone:', err);
    }
  }

  public loadingStart(): void {
    if (!this.isAvailable()) return;
    try {
      this.sdk?.game.loadingStart();
    } catch {
      // Ignore
    }
  }

  public loadingStop(): void {
    if (!this.isAvailable()) return;
    try {
      this.sdk?.game.loadingStop();
    } catch {
      // Ignore
    }
  }

  public gameplayStart(): void {
    if (!this.isAvailable() || this.gameplayActive) return;
    try {
      this.gameplayActive = true;
      this.sdk?.game.gameplayStart();
    } catch {
      // Ignore
    }
  }

  public gameplayStop(): void {
    if (!this.isAvailable() || !this.gameplayActive) return;
    try {
      this.gameplayActive = false;
      this.sdk?.game.gameplayStop();
    } catch {
      // Ignore
    }
  }

  public happyTime(): void {
    if (!this.isAvailable()) return;
    try {
      this.sdk?.game.happytime();
    } catch {
      // Ignore
    }
  }

  public showInterstitial(): Promise<boolean> {
    if (!this.isAvailable() || !this.sdk?.ad) {
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      try {
        this.sdk!.ad.requestAd('midgame', {
          adStarted: () => {
            AudioManager.getInstance().setAdMuted(true);
          },
          adFinished: () => {
            AudioManager.getInstance().setAdMuted(false);
            resolve(true);
          },
          adError: () => {
            AudioManager.getInstance().setAdMuted(false);
            resolve(false);
          }
        });
      } catch {
        AudioManager.getInstance().setAdMuted(false);
        resolve(false);
      }
    });
  }

  public showRewarded(): Promise<boolean> {
    if (!this.isAvailable() || !this.sdk?.ad) {
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      try {
        this.sdk!.ad.requestAd('rewarded', {
          adStarted: () => {
            AudioManager.getInstance().setAdMuted(true);
          },
          adFinished: () => {
            AudioManager.getInstance().setAdMuted(false);
            resolve(true);
          },
          adError: () => {
            AudioManager.getInstance().setAdMuted(false);
            resolve(false);
          }
        });
      } catch {
        AudioManager.getInstance().setAdMuted(false);
        resolve(false);
      }
    });
  }
}

export class AdService {
  private static instance: AdService;
  private provider: AdProviderAdapter = new CrazyGamesV3Adapter();
  private inRally: boolean = false;
  private matchesSinceLastAd: number = 0;

  private constructor() {}

  public static getInstance(): AdService {
    if (!AdService.instance) {
      AdService.instance = new AdService();
    }
    return AdService.instance;
  }

  public setProvider(adapter: AdProviderAdapter): void {
    this.provider = adapter;
  }

  public async initialize(): Promise<void> {
    await this.provider.initialize();
  }

  public isSDKAvailable(): boolean {
    return this.provider.isAvailable();
  }

  public loadingStart(): void {
    this.provider.loadingStart();
  }

  public loadingStop(): void {
    this.provider.loadingStop();
  }

  public setInRally(active: boolean): void {
    this.inRally = active;
    if (active) {
      this.provider.gameplayStart();
    } else {
      this.provider.gameplayStop();
    }
  }

  /**
   * Requests a midgame ad between matches (every 2 matches) and never during an active rally.
   */
  public async requestInterstitialBetweenMatches(): Promise<boolean> {
    if (this.inRally) {
      return false;
    }
    this.matchesSinceLastAd++;
    if (this.matchesSinceLastAd < 2) {
      return false;
    }
    this.matchesSinceLastAd = 0;
    return this.provider.showInterstitial();
  }

  /**
   * Requests a rewarded video ad (e.g., for +100 Star Coins or Second Chance revive).
   */
  public async requestRewardedAd(): Promise<boolean> {
    if (this.inRally) {
      return false;
    }
    return this.provider.showRewarded();
  }

  public notifyHappyTime(): void {
    this.provider.happyTime();
  }
}
