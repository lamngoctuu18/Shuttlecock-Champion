import { COURT_CONFIG } from '../config/gameConfig';
import { DifficultyParams, KickAction, KickEvaluation, KickRating } from '../types';

export interface ShuttlePhysicsBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
}

export class PhysicsSystem {
  /**
   * Advances shuttlecock position and velocity by deltaSec using custom aerodynamic + gravity physics.
   * Returns true if the shuttlecock touched the ground on this frame.
   */
  public updateShuttlecock(
    body: ShuttlePhysicsBody,
    deltaSec: number,
    difficulty: DifficultyParams
  ): boolean {
    const dt = Math.min(deltaSec, 0.05); // Clamp dt to prevent huge jumps on tab switch

    // Apply gravity scaled by current level difficulty
    const gravity = COURT_CONFIG.BASE_GRAVITY * difficulty.gravityScale;
    body.vy += gravity * dt;
    if (body.vy > COURT_CONFIG.MAX_FALL_SPEED) {
      body.vy = COURT_CONFIG.MAX_FALL_SPEED;
    }

    // Apply subtle aerodynamic drag + wind acceleration at higher levels
    const airDrag = 0.992;
    body.vx = body.vx * Math.pow(airDrag, dt * 60) + difficulty.windAcceleration * dt;

    // Integrate position
    body.x += body.vx * dt;
    body.y += body.vy * dt;

    // Keep within court left/right boundaries with natural bounce back into court
    if (body.x < COURT_CONFIG.COURT_LEFT) {
      body.x = COURT_CONFIG.COURT_LEFT;
      body.vx = Math.abs(body.vx) * 0.72 + 35;
    } else if (body.x > COURT_CONFIG.COURT_RIGHT) {
      body.x = COURT_CONFIG.COURT_RIGHT;
      body.vx = -Math.abs(body.vx) * 0.72 - 35;
    }

    // Calculate realistic shuttlecock orientation:
    // A real Vietnamese shuttlecock (đá cầu) has a heavy rubber base and light feathers,
    // so it rotates in flight to align its base with its velocity vector, plus spin on kick.
    const targetAngleDeg = Phaser.Math.RadToDeg(Math.atan2(body.vy, body.vx)) - 90;
    body.angle = Phaser.Math.Angle.RotateTo(
      Phaser.Math.DegToRad(body.angle),
      Phaser.Math.DegToRad(targetAngleDeg),
      dt * 9.5
    );
    body.angle = Phaser.Math.RadToDeg(body.angle) + body.angularVelocity * dt;
    body.angularVelocity *= Math.pow(0.94, dt * 60);

    // Check ground impact
    const groundHitY = COURT_CONFIG.GROUND_Y - 12;
    if (body.y >= groundHitY) {
      body.y = groundHitY;
      body.vy = 0;
      body.vx = 0;
      body.angularVelocity = 0;
      return true;
    }

    return false;
  }

  /**
   * Computes the target foot/body hitbox center for a given kick action and player position.
   */
  public getKickAnchorPoint(
    playerX: number,
    playerY: number,
    action: KickAction,
    shuttleX: number
  ): { x: number; y: number } {
    switch (action) {
      case 'LEFT':
        return { x: playerX - 34, y: playerY - 22 };
      case 'RIGHT':
        return { x: playerX + 34, y: playerY - 22 };
      case 'HIGH': {
        const sideOffset = shuttleX >= playerX ? 28 : -28;
        return { x: playerX + sideOffset, y: playerY - 46 };
      }
      case 'RECEIVE':
      default:
        return { x: playerX, y: playerY - 32 };
    }
  }

  /**
   * Evaluates a player's kick attempt against the shuttlecock's live position and velocity.
   * Strictly enforces Section 4.3:
   * - Never awards points if the shuttlecock is too far from the foot hitbox.
   * - Checks foot choice vs shuttlecock side.
   * - Computes PERFECT / GOOD / NORMAL / MISS and new launch trajectory.
   */
  public evaluateKick(
    playerX: number,
    playerY: number,
    shuttle: ShuttlePhysicsBody,
    action: KickAction,
    difficulty: DifficultyParams
  ): KickEvaluation {
    const anchor = this.getKickAnchorPoint(playerX, playerY, action, shuttle.x);
    const dx = shuttle.x - anchor.x;
    const dy = shuttle.y - anchor.y;
    const distance = Math.hypot(dx, dy);

    // Also compute distance to the ideal sweet-spot height (just above foot level)
    const sweetSpotRadius = COURT_CONFIG.PERFECT_RADIUS * difficulty.sweetSpotMultiplier;
    const goodRadius = COURT_CONFIG.GOOD_RADIUS * difficulty.sweetSpotMultiplier;
    const normalRadius = COURT_CONFIG.NORMAL_RADIUS * Math.max(1.0, difficulty.sweetSpotMultiplier);

    // Prevent kicking when shuttlecock is still rising very fast right after a kick
    if (shuttle.vy < -180 || distance > normalRadius) {
      return {
        valid: false,
        rating: 'MISS',
        action,
        distance,
        pointsAwarded: 0,
        comboBonus: 0,
        vx: shuttle.vx,
        vy: shuttle.vy,
        spin: 0,
        feedbackText: 'HỤT CẦU!'
      };
    }

    // Foot side match check:
    // If shuttle is clearly on the right (+28px) and player kicks LEFT, or vice versa,
    // penalize effective distance so wrong-foot kicks downgrade rating or miss if too far.
    let footPenalty = 0;
    const relativeX = shuttle.x - playerX;
    if (action === 'LEFT' && relativeX > 32) {
      footPenalty = 30;
    } else if (action === 'RIGHT' && relativeX < -32) {
      footPenalty = 30;
    }

    const effectiveDistance = distance + footPenalty;
    if (effectiveDistance > normalRadius + 12) {
      return {
        valid: false,
        rating: 'MISS',
        action,
        distance: effectiveDistance,
        pointsAwarded: 0,
        comboBonus: 0,
        vx: shuttle.vx,
        vy: shuttle.vy,
        spin: 0,
        feedbackText: 'TRÁI CHÂN!'
      };
    }

    let rating: KickRating = 'NORMAL';
    let feedbackText = 'NORMAL';
    if (effectiveDistance <= sweetSpotRadius) {
      rating = 'PERFECT';
      feedbackText = 'PERFECT!';
    } else if (effectiveDistance <= goodRadius) {
      rating = 'GOOD';
      feedbackText = 'GOOD!';
    }

    // Calculate new launch velocity based on action, rating, and difficulty
    const speedMult = difficulty.speedMultiplier;
    const driftRange = difficulty.horizontalDriftRange;

    let newVy = -580 * speedMult;
    let newVx = 0;
    let spin = 0;

    // Keep shuttlecock naturally biased toward court bounds so rallies stay dynamic
    const centerPull = (COURT_CONFIG.COURT_CENTER_X - shuttle.x) * 0.28;

    if (action === 'LEFT') {
      // Kicking with left foot sends shuttlecock slightly right or center-right
      newVy = (rating === 'PERFECT' ? -615 : rating === 'GOOD' ? -575 : -525) * speedMult;
      newVx = Phaser.Math.FloatBetween(-25, driftRange * 0.85) + centerPull;
      spin = 260;
    } else if (action === 'RIGHT') {
      // Kicking with right foot sends shuttlecock slightly left or center-left
      newVy = (rating === 'PERFECT' ? -615 : rating === 'GOOD' ? -575 : -525) * speedMult;
      newVx = Phaser.Math.FloatBetween(-driftRange * 0.85, 25) + centerPull;
      spin = -260;
    } else if (action === 'HIGH') {
      // Powerful high kick launches shuttlecock high into the sky
      newVy = (rating === 'PERFECT' ? -745 : rating === 'GOOD' ? -700 : -650) * speedMult;
      newVx = Phaser.Math.FloatBetween(-driftRange * 1.1, driftRange * 1.1) + centerPull * 1.1;
      spin = ( relativeX >= 0 ? 1 : -1 ) * 420;
      if (rating === 'PERFECT') {
        feedbackText = 'SIÊU CẦU CAO!';
      }
    } else if (action === 'RECEIVE') {
      // Controlled cushion / stall touch: moderate height, stabilizes horizontal drift
      newVy = (rating === 'PERFECT' ? -505 : -475) * Math.min(1.08, speedMult);
      newVx = Phaser.Math.FloatBetween(-32, 32) + centerPull * 0.45;
      spin = 90;
      if (rating === 'PERFECT') {
        feedbackText = 'ĐỠ CẦU CHUẨN!';
      }
    }

    // Clamp horizontal velocity so shuttlecock stays reachable by the player
    newVx = Phaser.Math.Clamp(newVx, -250, 250);

    return {
      valid: true,
      rating,
      action,
      distance: effectiveDistance,
      pointsAwarded: 0, // Populated by ScoreSystem
      comboBonus: 0,
      vx: newVx,
      vy: newVy,
      spin,
      feedbackText
    };
  }
}

