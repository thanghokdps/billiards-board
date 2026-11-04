import type { PetBubble, PetFace, PetFeet } from "./pet-sprites";

type PetMode = "sit" | "run" | "leap" | "tumble" | "cheer" | "dizzy" | "alert" | "sleep";

export interface PetPose {
  x: number;
  y: number;
  /** Height above the ground, in px. */
  lift: number;
  flip: boolean;
  face: PetFace;
  feet: PetFeet;
  bubble: PetBubble | null;
  bob: boolean;
  rotate: number;
  squash: number;
  asleep: boolean;
}

export interface PetBounds {
  width: number;
  top: number;
  bottom: number;
}

const RUN_SPEED = 110;
const STEP_MS = 110;
const LEAP_MS = 480;
const LEAP_MIN_HEIGHT = 56;
const LEAP_HEIGHT_PER_PX = 0.22;
const SQUASH_MS = 170;
const SIDE_MARGIN = 28;
const SIT_MS = [1800, 4500] as const;
const SLEEP_AFTER_MS = 25_000;
const BLINK_MS = 500;
const CHEER_MS = 950;
const CHEER_HOP_PX = 16;
const DIZZY_MS = 1400;
const ALERT_MS = 650;
const TUMBLE_HOLD_MS = 260;
const TUMBLE_DEGREES_PER_PX = 1.4;
const COMBO_WINDOW_MS = 1400;
const COMBO_CLICKS = 4;

const between = (low: number, high: number) => low + Math.random() * (high - low);
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** What the pet is doing, free of the DOM: page events go in, one pose per frame comes out. */
export class PetBrain {
  private x: number;
  private y: number;
  private targetX: number;
  private targetY: number;
  private fromX = 0;
  private fromY = 0;
  private leapHeight = 0;
  private flip = false;
  private mode: PetMode = "sit";
  private modeStart = 0;
  private modeEnd = 0;
  private landedAt = -Infinity;
  private rotate = 0;
  private lastActionAt: number;
  private afterLanding: PetMode = "sit";
  private clicks: number[] = [];

  constructor(
    private bounds: PetBounds,
    private readonly onLand: (x: number, y: number) => void,
    now: number,
  ) {
    this.x = this.targetX = between(SIDE_MARGIN, bounds.width - SIDE_MARGIN);
    this.y = this.targetY = bounds.bottom;
    this.lastActionAt = now;
  }

  get asleep() {
    return this.mode === "sleep";
  }

  resize(bounds: PetBounds) {
    this.bounds = bounds;
    this.x = clamp(this.x, SIDE_MARGIN, bounds.width - SIDE_MARGIN);
    this.y = clamp(this.y, bounds.top, bounds.bottom);
  }

  /** Jumps to the click. Landing on a control cheers it; a burst of clicks leaves the pet dizzy. */
  click(x: number, y: number, onControl: boolean, now: number) {
    this.lastActionAt = now;
    this.clicks = [...this.clicks.filter((at) => now - at < COMBO_WINDOW_MS), now];
    const dizzy = this.clicks.length >= COMBO_CLICKS;
    if (dizzy) this.clicks = [];
    this.afterLanding = dizzy ? "dizzy" : onControl ? "cheer" : "sit";

    this.fromX = this.x;
    this.fromY = this.y;
    this.targetX = clamp(x, SIDE_MARGIN, this.bounds.width - SIDE_MARGIN);
    this.targetY = clamp(y, this.bounds.top, this.bounds.bottom);
    this.flip = this.targetX < this.x;
    this.leapHeight = LEAP_MIN_HEIGHT + Math.hypot(this.targetX - this.x, this.targetY - this.y) * LEAP_HEIGHT_PER_PX;
    this.enter("leap", LEAP_MS, now);
  }

  /** Rolls with the page: the ball turns the way the content moves. */
  scroll(deltaY: number, now: number) {
    this.lastActionAt = now;
    if (this.mode === "leap") return;
    this.rotate += deltaY * TUMBLE_DEGREES_PER_PX;
    this.enter("tumble", TUMBLE_HOLD_MS, now);
  }

  routeChanged(now: number) {
    this.lastActionAt = now;
    if (this.mode !== "leap") this.enter("cheer", CHEER_MS, now);
  }

  /** The cursor moved: a sitting pet turns to it, a sleeping one stays asleep. */
  lookAt(x: number) {
    if (this.mode === "sit") this.flip = x < this.x;
  }

  private enter(mode: PetMode, durationMs: number, now: number) {
    this.mode = mode;
    this.modeStart = now;
    this.modeEnd = now + durationMs;
  }

  private sit(now: number) {
    this.rotate = 0;
    this.enter("sit", between(...SIT_MS), now);
  }

  private wander(now: number) {
    if (now - this.lastActionAt > SLEEP_AFTER_MS) {
      this.enter("sleep", Infinity, now);
      return;
    }
    this.targetX = between(SIDE_MARGIN, this.bounds.width - SIDE_MARGIN);
    this.targetY = between(this.bounds.top, this.bounds.bottom);
    this.flip = this.targetX < this.x;
    this.enter("run", Infinity, now);
  }

  private land(now: number) {
    this.x = this.targetX;
    this.y = this.targetY;
    this.landedAt = now;
    this.onLand(this.x, this.y);
    if (this.afterLanding === "cheer") this.enter("cheer", CHEER_MS, now);
    else if (this.afterLanding === "dizzy") this.enter("dizzy", DIZZY_MS, now);
    else this.sit(now);
  }

  /** Moves toward the target; true on arrival. */
  private step(elapsedMs: number) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const left = Math.hypot(dx, dy);
    const stride = (RUN_SPEED * elapsedMs) / 1000;
    if (left <= stride) return true;
    this.x += (dx / left) * stride;
    this.y += (dy / left) * stride;
    return false;
  }

  update(now: number, elapsedMs: number): PetPose {
    const pose: PetPose = {
      x: this.x,
      y: this.y,
      lift: 0,
      flip: this.flip,
      face: "open",
      feet: "stand",
      bubble: null,
      bob: false,
      rotate: 0,
      squash: 1 - 0.3 * clamp(1 - (now - this.landedAt) / SQUASH_MS, 0, 1),
      asleep: false,
    };
    const stepping = Math.floor(now / STEP_MS) % 2 === 0;
    const expired = now >= this.modeEnd;

    switch (this.mode) {
      case "sit":
        if (expired) this.wander(now);
        break;
      case "run":
        if (this.step(elapsedMs)) this.sit(now);
        pose.feet = stepping ? "stepA" : "stepB";
        pose.bob = stepping;
        break;
      case "leap": {
        const t = clamp((now - this.modeStart) / LEAP_MS, 0, 1);
        pose.x = this.fromX + (this.targetX - this.fromX) * t;
        pose.y = this.fromY + (this.targetY - this.fromY) * t;
        pose.lift = 4 * this.leapHeight * t * (1 - t);
        pose.feet = "tucked";
        pose.face = "surprised";
        if (expired) this.land(now);
        break;
      }
      case "tumble":
        pose.rotate = this.rotate;
        pose.feet = "tucked";
        pose.face = "surprised";
        if (expired) this.enter("alert", ALERT_MS, now);
        break;
      case "alert":
        pose.bubble = "alert";
        if (expired) this.sit(now);
        break;
      case "cheer":
        pose.lift = Math.abs(Math.sin(((now - this.modeStart) / CHEER_MS) * Math.PI * 3)) * CHEER_HOP_PX;
        pose.face = "happy";
        pose.feet = pose.lift > 2 ? "tucked" : "stand";
        pose.bubble = "heart";
        if (expired) this.sit(now);
        break;
      case "dizzy":
        pose.rotate = Math.sin((now - this.modeStart) / 70) * 14;
        pose.face = "dizzy";
        pose.bubble = "star";
        if (expired) this.sit(now);
        break;
      case "sleep":
        pose.face = "closed";
        pose.feet = "tucked";
        pose.bubble = Math.floor(now / BLINK_MS) % 2 === 0 ? "snore" : null;
        pose.asleep = true;
        break;
    }
    return pose;
  }
}
