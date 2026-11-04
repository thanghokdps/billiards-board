import {
  BALL_RADIUS,
  CUE_SPOT,
  firstContact,
  isSettled,
  MAX_BALL_SPEED,
  onTable,
  rackNine,
  stepTable,
  TABLE_HEIGHT,
  TABLE_WIDTH,
  type Ball,
  type Point,
} from "./pool-physics";

/** `hand` is a scratched cue ball waiting to be put back; `cleared` is an empty table. */
export type PoolPhase = "aim" | "moving" | "hand" | "cleared";

export interface PoolHud {
  phase: PoolPhase;
  shots: number;
  sunk: number[];
}

export interface PoolAim {
  /** Unit vector the shot will travel along. */
  direction: Point;
  /** 0 to 1. */
  power: number;
  contact: Point;
}

const MAX_PULL = 220;
const MIN_PULL = 26;
const MIN_SHOT_SPEED = 2;
const BREAK_SPEED = MAX_BALL_SPEED;
const BREAK_AIM_JITTER = 2.5;
const CUE_RETURN_LINE = [100, 400, 175, 325, CUE_SPOT.y];

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** One game on the table, free of the DOM: pointer moves go in, balls and the HUD come out. */
export class PoolRound {
  balls: Ball[] = rackNine();
  aim: PoolAim | null = null;
  phase: PoolPhase = "aim";
  private shots = 0;
  private sunk: number[] = [];

  constructor(private readonly onHud: (hud: PoolHud) => void) {}

  get cue() {
    return this.balls.find((ball) => ball.id === 0) as Ball; // rackNine always includes id 0.
  }

  private publish() {
    this.onHud({ phase: this.phase, shots: this.shots, sunk: [...this.sunk] });
  }

  rerack() {
    this.balls = rackNine();
    this.aim = null;
    this.phase = "aim";
    this.shots = 0;
    this.sunk = [];
    this.publish();
  }

  /** The opening shot, played by the table: straight at the apex with a touch of spread. */
  breakShot() {
    const apex = this.balls.find((ball) => ball.id === 1) as Ball; // rackNine always includes id 1.
    const dx = apex.x - this.cue.x;
    const dy = apex.y - this.cue.y + (Math.random() - 0.5) * BREAK_AIM_JITTER;
    const length = Math.hypot(dx, dy);
    this.shoot({ x: dx / length, y: dy / length }, BREAK_SPEED);
  }

  /** The pointer dragged to `at`: a slingshot, so the shot goes away from the pointer. */
  pullTo(at: Point) {
    const { cue } = this;
    const dx = cue.x - at.x;
    const dy = cue.y - at.y;
    const pull = Math.hypot(dx, dy);
    if (pull < MIN_PULL) {
      this.aim = null;
      return;
    }
    const direction = { x: dx / pull, y: dy / pull };
    this.aim = {
      direction,
      power: Math.min(pull, MAX_PULL) / MAX_PULL,
      contact: firstContact(this.balls, cue, direction),
    };
  }

  /** Letting go fires the aim; a drag back onto the ball left no aim, so it cancels. */
  release() {
    if (!this.aim) return;
    const { direction, power } = this.aim;
    this.aim = null;
    this.shoot(direction, MIN_SHOT_SPEED + power * (MAX_BALL_SPEED - MIN_SHOT_SPEED));
  }

  cancel() {
    this.aim = null;
  }

  /** Puts the cue ball where the pointer is, unless another ball is already there. */
  placeCue(at: Point) {
    const x = clamp(at.x, BALL_RADIUS, TABLE_WIDTH - BALL_RADIUS);
    const y = clamp(at.y, BALL_RADIUS, TABLE_HEIGHT - BALL_RADIUS);
    const blocked = this.balls.some(
      (ball) => ball !== this.cue && onTable(ball) && Math.hypot(ball.x - x, ball.y - y) < BALL_RADIUS * 2,
    );
    if (blocked) return;
    this.cue.x = x;
    this.cue.y = y;
  }

  /** The cue ball is down, so the next drag aims. */
  placed() {
    if (this.phase !== "hand") return;
    this.phase = "aim";
    this.publish();
  }

  private shoot(direction: Point, speed: number) {
    this.cue.vx = direction.x * speed;
    this.cue.vy = direction.y * speed;
    this.phase = "moving";
    this.shots += 1;
    this.publish();
  }

  private endTurn() {
    const objectBallsLeft = this.balls.some((ball) => ball.id !== 0 && onTable(ball));
    if (!objectBallsLeft) this.phase = "cleared";
    else if (onTable(this.cue)) this.phase = "aim";
    else this.returnCue();
    this.publish();
  }

  private returnCue() {
    Object.assign(this.cue, { pocket: null, sinking: 0, vx: 0, vy: 0 });
    this.phase = "hand";
    // Walks down the head line from the spot, so a ball resting there cannot leave the cue ball in the pocket's mouth.
    for (const y of CUE_RETURN_LINE) this.placeCue({ x: CUE_SPOT.x, y });
  }

  /** Advances one fixed step while balls are moving. */
  step() {
    if (this.phase !== "moving") return;
    const dropped = stepTable(this.balls).filter((ball) => ball.id !== 0);
    if (dropped.length > 0) {
      this.sunk.push(...dropped.map((ball) => ball.id));
      this.publish();
    }
    if (isSettled(this.balls)) this.endTurn();
  }
}
