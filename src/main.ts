import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { ChallengeScene } from './scenes/ChallengeScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { PreloadScene } from './scenes/PreloadScene';
import { SettingsScene } from './scenes/SettingsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance'
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    ChallengeScene,
    GameOverScene,
    SettingsScene
  ]
};

window.addEventListener('DOMContentLoaded', () => {
  // Mandatory CrazyGames QA requirement:
  // Prevent Arrow keys and Spacebar from scrolling the parent page/iframe
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent unwanted touch scrolling/zooming & right-click context menu during gameplay
  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.target instanceof HTMLCanvasElement) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  window.addEventListener('contextmenu', (e) => e.preventDefault());

  const game = new Phaser.Game(config);

  window.addEventListener('resize', () => {
    game.scale.refresh();
  });
});
