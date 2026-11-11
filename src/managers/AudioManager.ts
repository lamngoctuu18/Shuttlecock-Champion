import { StorageManager } from './StorageManager';

export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private isPlayingBgm: boolean = false;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private bgmTheme: 'MENU' | 'GAME' = 'MENU';
  private adMuted: boolean = false;

  private constructor() {
    this.setupVisibilityHandler();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public setAdMuted(muted: boolean): void {
    this.adMuted = muted;
    if (muted) {
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      const settings = StorageManager.getInstance().getSettings();
      if (this.ctx && this.ctx.state === 'suspended' && (settings.musicEnabled || settings.sfxEnabled)) {
        this.ctx.resume().catch(() => {});
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private setupVisibilityHandler(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      } else {
        const settings = StorageManager.getInstance().getSettings();
        if (this.ctx && this.ctx.state === 'suspended' && (settings.musicEnabled || settings.sfxEnabled)) {
          this.ctx.resume().catch(() => {});
        }
      }
    });
  }

  public startMusic(theme: 'MENU' | 'GAME' = 'MENU'): void {
    this.bgmTheme = theme;
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.musicEnabled) {
      this.stopMusic();
      return;
    }
    if (this.isPlayingBgm) return;
    this.isPlayingBgm = true;
    this.bgmStep = 0;

    // Cheerful Vietnamese pentatonic schoolyard melody (C - D - E - G - A)
    const menuNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];
    const gameNotes = [659.25, 783.99, 880.0, 1046.5, 880.0, 783.99, 659.25, 523.25];

    const tick = () => {
      if (!this.isPlayingBgm) return;
      const curSettings = StorageManager.getInstance().getSettings();
      if (!curSettings.musicEnabled || document.hidden || this.adMuted) {
        this.bgmTimer = window.setTimeout(tick, 350);
        return;
      }

      const ctx = this.getContext();
      if (ctx) {
        const notes = this.bgmTheme === 'MENU' ? menuNotes : gameNotes;
        const freq = notes[this.bgmStep % notes.length];
        const bassFreq = freq * 0.5;
        this.playNoteInternal(ctx, freq, 0.16, curSettings.musicVolume * 0.12, 'triangle');
        if (this.bgmStep % 2 === 0) {
          this.playNoteInternal(ctx, bassFreq, 0.24, curSettings.musicVolume * 0.08, 'sine');
        }
        this.bgmStep++;
      }

      const interval = this.bgmTheme === 'MENU' ? 320 : 250;
      this.bgmTimer = window.setTimeout(tick, interval);
    };

    tick();
  }

  public stopMusic(): void {
    this.isPlayingBgm = false;
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public refreshMusicState(): void {
    const settings = StorageManager.getInstance().getSettings();
    if (settings.musicEnabled) {
      if (!this.isPlayingBgm) {
        this.startMusic(this.bgmTheme);
      }
    } else {
      this.stopMusic();
    }
  }

  private playNoteInternal(
    ctx: AudioContext,
    freq: number,
    duration: number,
    gainVal: number,
    type: OscillatorType
  ): void {
    if (this.adMuted) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(Math.max(0.001, gainVal), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore audio context state errors before user gesture
    }
  }

  /**
   * Characteristic shuttlecock rubber-base kick sound ("tách! phạch!")
   */
  public playKick(isHigh: boolean = false): void {
    if (this.adMuted) return;
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const vol = settings.sfxVolume;

    // Crisp rubber pop oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startFreq = isHigh ? 340 : 260;
    const peakFreq = isHigh ? 680 : 520;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.035);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);

    gain.gain.setValueAtTime(vol * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // Feather whoosh noise burst
    this.playNoiseBurst(ctx, 0.06, vol * 0.22, 1800);
  }

  /**
   * Sparkling chime when achieving a PERFECT timing kick
   */
  public playPerfect(): void {
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const vol = settings.sfxVolume * 0.3;
    this.playNoteInternal(ctx, 880, 0.18, vol, 'sine');
    setTimeout(() => this.playNoteInternal(ctx, 1174.66, 0.22, vol, 'sine'), 55);
    setTimeout(() => this.playNoteInternal(ctx, 1760, 0.3, vol * 0.9, 'triangle'), 110);
  }

  /**
   * Rising pitch chime on combo increment / milestone
   */
  public playCombo(comboCount: number, isMilestone: boolean = false): void {
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const vol = settings.sfxVolume * (isMilestone ? 0.35 : 0.2);
    const baseFreq = 440 + Math.min(comboCount, 30) * 22;
    this.playNoteInternal(ctx, baseFreq, 0.14, vol, 'sine');

    if (isMilestone) {
      setTimeout(() => this.playNoteInternal(ctx, baseFreq * 1.25, 0.18, vol, 'triangle'), 70);
      setTimeout(() => this.playNoteInternal(ctx, baseFreq * 1.5, 0.28, vol, 'triangle'), 140);
    }
  }

  /**
   * Victory fanfare when setting a new high score or completing a challenge
   */
  public playNewRecord(): void {
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const vol = settings.sfxVolume * 0.32;
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((f, idx) => {
      setTimeout(() => {
        this.playNoteInternal(ctx, f, idx === 3 ? 0.45 : 0.16, vol, 'triangle');
      }, idx * 95);
    });
  }

  /**
   * Game Over sound when the shuttlecock hits the ground
   */
  public playGameOver(): void {
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const vol = settings.sfxVolume * 0.3;
    const notes = [392.0, 349.23, 329.63, 261.63];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playNoteInternal(ctx, f, idx === 3 ? 0.4 : 0.18, vol, 'sawtooth');
      }, idx * 120);
    });
  }

  /**
   * UI click / screen transition sound
   */
  public playClick(): void {
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.playNoteInternal(ctx, 660, 0.07, settings.sfxVolume * 0.22, 'sine');
  }

  /**
   * Miss swing sound (whoosh without shuttlecock contact)
   */
  public playMissSwing(): void {
    const settings = StorageManager.getInstance().getSettings();
    if (!settings.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.playNoiseBurst(ctx, 0.09, settings.sfxVolume * 0.18, 900);
  }

  private playNoiseBurst(ctx: AudioContext, duration: number, gainVal: number, filterFreq: number): void {
    if (this.adMuted) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // Ignore
    }
  }
}

