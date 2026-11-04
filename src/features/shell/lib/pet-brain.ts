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

/** The pet's walk, corner to corner: along the floor, up and over the dock's outline, down, along the floor. */
export interface PetTrack {
  left: number;
  right: number;
  floor: number;
  dockLeft: number;
  dockRight: number;
  dockTop: number;
}

const RUN_SPEED = 110;
const CORNER_PX = 120;
const STEP_MS = 110;
const LEAP_MS = 480;
const LEAP_MIN_HEIGHT = 56;
const LEAP_HEIGHT_PER_PX = 0.22;
const SQUASH_MS = 170;
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
  /** Distance walked from the left corner. */
  private along = 0;
  private targetAlong = 0;
  /** Off the track on a dock key, so the next rest is a leap out to a corner. */
  private perched = false;
  private x: number;
  private y: number;
  private targetX = 0;
  private targetY = 0;
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
    private track: PetTrack,
    private readonly onLand: (x: number, y: number) => void,
    now: number,
  ) {
    ({ x: this.x, y: this.y } = this.pointAt(0));
    this.lastActionAt = now;
  }

  get asleep() {
    return this.mode === "sleep";
  }

  private get trackLength() {
    const { left, right, floor, dockTop } = this.track;
    return right - left + 2 * (floor - dockTop);
  }

  private pointAt(along: number) {
    const { left, floor, dockLeft, dockRight, dockTop } = this.track;
    const climb = floor - dockTop;
    const overDock = dockRight - dockLeft;
    let walked = along;
    if (walked < dockLeft - left) return { x: left + walked, y: floor };
    walked -= dockLeft - left;
    if (walked < climb) return { x: dockLeft, y: floor - walked };
    walked -= climb;
    if (walked < overDock) return { x: dockLeft + walked, y: dockTop };
    walked -= overDock;
    if (walked < climb) return { x: dockRight, y: dockTop + walked };
    return { x: dockRight + walked - climb, y: floor };
  }

  resize(track: PetTrack) {
    const oldLength = this.trackLength;
    this.track = track;
    const stretch = this.trackLength / oldLength;
    this.along *= stretch;
    this.targetAlong *= stretch;
    if (!this.perched) ({ x: this.x, y: this.y } = this.pointAt(this.along));
  }

  /** Hops onto a dock key and cheers; a burst of clicks leaves the pet dizzy. Either way it leaps out to a corner. */
  click(x: number, y: number, now: number) {
    this.lastActionAt = now;
    this.clicks = [...this.clicks.filter((at) => now - at < COMBO_WINDOW_MS), now];
    const dizzy = this.clicks.length >= COMBO_CLICKS;
    if (dizzy) this.clicks = [];
    this.perched = true;
    this.leapTo(x, y, dizzy ? "dizzy" : "cheer", now);
  }

  private leapTo(x: number, y: number, afterLanding: PetMode, now: number) {
    this.afterLanding = afterLanding;
    this.fromX = this.x;
    this.fromY = this.y;
    this.targetX = x;
    this.targetY = y;
    this.flip = x < this.x;
    this.leapHeight = LEAP_MIN_HEIGHT + Math.hypot(x - this.x, y - this.y) * LEAP_HEIGHT_PER_PX;
    this.enter("leap", LEAP_MS, now);
  }

  /** Rolls with the page: the ball turns the way the content moves. */
  scroll(deltaY: number, now: number) {
    this.lastActionAt = now;
    // Steady scrolling would re-enter tumble forever and strand a perched pet on the dock.
    if (this.mode === "leap" || this.perched) return;
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
    if (this.perched) {
      this.perched = false;
      this.along = this.targetAlong = Math.random() < 0.5 ? 0 : this.trackLength;
      const corner = this.pointAt(this.along);
      this.leapTo(corner.x, corner.y, "sit", now);
      return;
    }
    this.enter("sit", between(...SIT_MS), now);
  }

  private wander(now: number) {
    if (now - this.lastActionAt > SLEEP_AFTER_MS) {
      this.enter("sleep", Infinity, now);
      return;
    }
    const reach = between(0, CORNER_PX);
    this.targetAlong = this.along < this.trackLength / 2 ? this.trackLength - reach : reach;
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

  /** Moves along the track toward the target; true on arrival. */
  private step(elapsedMs: number) {
    const left = this.targetAlong - this.along;
    const stride = (RUN_SPEED * elapsedMs) / 1000;
    const arrived = Math.abs(left) <= stride;
    this.along = arrived ? this.targetAlong : this.along + Math.sign(left) * stride;
    const { x, y } = this.pointAt(this.along);
    if (x !== this.x) this.flip = x < this.x;
    this.x = x;
    this.y = y;
    return arrived;
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
