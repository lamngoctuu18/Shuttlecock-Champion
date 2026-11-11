import Phaser from 'phaser';
import { COURT_CONFIG } from '../config/gameConfig';
import { KickAction } from '../types';

export type KickCallback = (action: KickAction) => void;
export type PauseCallback = () => void;

export class InputSystem {
  private scene: Phaser.Scene;
  private onKick: KickCallback;
  private onPause: PauseCallback;
  private lastKickTimestamp: number = 0;
  private enabled: boolean = true;
  private virtualMoveDir: number = 0;

  private keyArrowLeft?: Phaser.Input.Keyboard.Key;
  private keyArrowRight?: Phaser.Input.Keyboard.Key;
  private keyMoveQ?: Phaser.Input.Keyboard.Key;
  private keyMoveE?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, onKick: KickCallback, onPause: PauseCallback) {
    this.scene = scene;
    this.onKick = onKick;
    this.onPause = onPause;
    this.setupKeyboard();
  }

  private setupKeyboard(): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    this.keyArrowLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyArrowRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.keyMoveQ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyMoveE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Kick Left: [A] or [J]
    kb.on('keydown-A', () => this.requestKick('LEFT'));
    kb.on('keydown-J', () => this.requestKick('LEFT'));

    // Kick Right: [D] or [L]
    kb.on('keydown-D', () => this.requestKick('RIGHT'));
    kb.on('keydown-L', () => this.requestKick('RIGHT'));

    // Kick High: [W] or [UP] or [SPACE] or [I]
    kb.on('keydown-W', () => this.requestKick('HIGH'));
    kb.on('keydown-UP', () => this.requestKick('HIGH'));
    kb.on('keydown-SPACE', () => this.requestKick('HIGH'));
    kb.on('keydown-I', () => this.requestKick('HIGH'));

    // Receive / Cushion: [S] or [DOWN] or [K]
    kb.on('keydown-S', () => this.requestKick('RECEIVE'));
    kb.on('keydown-DOWN', () => this.requestKick('RECEIVE'));
    kb.on('keydown-K', () => this.requestKick('RECEIVE'));

    // Pause: [P] or [ESC]
    kb.on('keydown-P', () => this.onPause());
    kb.on('keydown-ESC', () => this.onPause());
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.virtualMoveDir = 0;
    }
  }

  public setVirtualMoveDirection(dir: number): void {
    this.virtualMoveDir = Phaser.Math.Clamp(dir, -1, 1);
  }

  /**
   * Processes a kick action with anti-spam cooldown protection (Section 13 Case 2).
   */
  public requestKick(action: KickAction): boolean {
    if (!this.enabled) return false;
    const now = performance.now();
    if (now - this.lastKickTimestamp < COURT_CONFIG.KICK_COOLDOWN_MS) {
      return false;
    }
    this.lastKickTimestamp = now;
    this.onKick(action);
    return true;
  }

  /**
   * Returns -1 (Move Left), +1 (Move Right), or 0 (No manual movement input).
   * Supports [⬅ / ➡] Arrow keys, [Q / E] keys, and On-Screen Touch/Mouse movement buttons.
   */
  public getManualMoveDirection(): number {
    if (!this.enabled) return 0;
    if (this.virtualMoveDir !== 0) {
      return this.virtualMoveDir;
    }
    let dir = 0;
    if (this.keyArrowLeft?.isDown || this.keyMoveQ?.isDown) dir -= 1;
    if (this.keyArrowRight?.isDown || this.keyMoveE?.isDown) dir += 1;
    return dir;
  }

  public destroy(): void {
    const kb = this.scene.input.keyboard;
    if (kb) {
      kb.removeAllListeners();
    }
  }
}
