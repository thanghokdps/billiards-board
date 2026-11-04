import {
  Mesh,
  Quaternion,
  Vector3,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PlaneGeometry,
  type SphereGeometry,
} from "three";

/** Tips the number disc up and towards the camera, so a ball at rest can be read. */
const NUMBER_UP = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.95);
const SHADOW_OFFSET = 0.06;
const SHADOW_Y = 0.004;
const TURN_UP_FROM = 0.66;

const AXIS = new Vector3();
const STEP = new Quaternion();
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const linear = (t: number) => t;

interface Leg {
  to: Vector3;
  startAt: number;
  durationMs: number;
  ease: (t: number) => number;
}

/** One ball and its shadow. Its orientation comes from the distance travelled, so it rolls instead of sliding. */
export class RollingBall {
  readonly mesh: Mesh;
  readonly shadow: Mesh;
  private readonly from = new Vector3();
  private readonly rolled = NUMBER_UP.clone();
  private readonly previous = new Vector3();
  private leg: Leg | null = null;
  private nextLeg: Leg | null = null;

  constructor(
    geometry: SphereGeometry,
    material: MeshStandardMaterial,
    shadowGeometry: PlaneGeometry,
    shadowMaterial: MeshBasicMaterial,
    private readonly radius: number,
  ) {
    this.mesh = new Mesh(geometry, material);
    this.mesh.quaternion.copy(NUMBER_UP);
    this.shadow = new Mesh(shadowGeometry, shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2;
  }

  set visible(value: boolean) {
    this.mesh.visible = value;
    this.shadow.visible = value;
  }

  place(at: Vector3) {
    this.mesh.position.set(at.x, this.radius, at.z);
    this.shadow.position.set(at.x + SHADOW_OFFSET, SHADOW_Y, at.z + SHADOW_OFFSET);
    this.leg = null;
  }

  /** `then` runs right after this leg, for the cue ball bouncing off the rack. */
  send(leg: Leg, then: Leg | null = null) {
    this.from.copy(this.mesh.position);
    this.rolled.copy(this.mesh.quaternion);
    this.leg = leg;
    this.nextLeg = then;
  }

  /** Moves to `now`; returns true while the ball still has somewhere to go. */
  tick(now: number): boolean {
    const { leg } = this;
    if (!leg) return false;
    if (now < leg.startAt) return true;
    const t = clamp01((now - leg.startAt) / leg.durationMs);
    const eased = leg.ease(t);
    this.previous.copy(this.mesh.position);
    this.mesh.position.set(
      this.from.x + (leg.to.x - this.from.x) * eased,
      this.radius,
      this.from.z + (leg.to.z - this.from.z) * eased,
    );
    const { x, z } = this.mesh.position;
    this.shadow.position.set(x + SHADOW_OFFSET, SHADOW_Y, z + SHADOW_OFFSET);
    const dx = x - this.previous.x;
    const dz = z - this.previous.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0) {
      AXIS.set(dz / distance, 0, -dx / distance);
      this.rolled.premultiply(STEP.setFromAxisAngle(AXIS, distance / this.radius));
    }
    this.mesh.quaternion.copy(this.rolled).slerp(NUMBER_UP, clamp01((t - TURN_UP_FROM) / (1 - TURN_UP_FROM)));
    if (t < 1) return true;
    this.leg = null;
    if (!this.nextLeg) return false;
    this.send({ ...this.nextLeg, startAt: now });
    return true;
  }
}
