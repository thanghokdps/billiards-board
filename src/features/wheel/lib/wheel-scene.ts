import {
  Color,
  DirectionalLight,
  HemisphereLight,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
  type CanvasTexture,
  type InstancedMesh,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import type { Slice } from "@/lib/wheel";

import { WheelBurst } from "./wheel-burst";
import { faceTexture } from "./wheel-face";
import {
  BULB_COUNT,
  buildPegs,
  buildWedges,
  buildWheel,
  readWheelTokens,
  WHEEL_RADIUS,
  type Wedge,
  type WheelParts,
  type WheelTokens,
} from "./wheel-mesh";

const FOV = 24;
const FRAME_HALF = 4.5;
const SPIN_MS = 5200;
const WINDUP_MS = 420;
const WINDUP_DEG = 16;
const IDLE_TILT = { x: -0.3, y: 0.24 };
const SPIN_TILT = { x: -0.14, y: 0.06 };
const PARALLAX = 0.09;
const LIFT = 0.42;
const DOLLY_IN = 0.93;
const DIMMED = 0.3;
const KICK_DECAY_MS = 80;
const EPSILON = 0.0005;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 4.6;
const easeToward = (from: number, to: number, dt: number, ms: number) => from + (to - from) * (1 - Math.exp(-dt / ms));

/** Degrees of wheel rotation at `elapsed` ms: a short pull back, then the long decay onto the target. */
function spinAngle(elapsed: number, from: number, to: number): number {
  if (elapsed < WINDUP_MS) return from - WINDUP_DEG * easeInOut(elapsed / WINDUP_MS);
  const t = Math.min(1, (elapsed - WINDUP_MS) / (SPIN_MS - WINDUP_MS));
  return from - WINDUP_DEG + (to - from + WINDUP_DEG) * easeOut(t);
}

interface Spin {
  from: number;
  to: number;
  startedAt: number;
  onTick: () => void;
  onLand: () => void;
}

/** The wheel show. It draws only while something moves, so an idle page costs no battery. */
export class WheelScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private readonly tokens: WheelTokens;
  private readonly parts: WheelParts;
  private readonly burst: WheelBurst;
  private readonly lit = new Color();
  private texture: CanvasTexture | null = null;
  private pegs: InstancedMesh | null = null;
  private wedges: Wedge[] = [];
  private slices: Slice[] = [];
  private spinState: Spin | null = null;
  private winner: Wedge | null = null;
  private rotation = 0;
  private distance = 20;
  private dolly = 1;
  private kick = 0;
  private settle = 0;
  private pegStep: number | null = null;
  private bloom = 0;
  private hover = { x: 0, y: 0 };
  private frame = 0;
  private last = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.tokens = readWheelTokens(canvas);
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.parts = buildWheel(this.scene, this.tokens);
    this.burst = new WheelBurst(this.scene);
    this.light();
    this.parts.rig.rotation.set(IDLE_TILT.x, IDLE_TILT.y, 0);
    this.paintBulbs(0);
  }

  private light() {
    const pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.3;
    pmrem.dispose();
    const lamp = new SpotLight(this.tokens.ivory, 150, 0, 0.5, 0.6, 1.6);
    lamp.position.set(-3, 8, 13);
    lamp.castShadow = true;
    lamp.shadow.mapSize.set(1024, 1024);
    lamp.shadow.bias = -0.0006;
    const kicker = new DirectionalLight(this.tokens.lamp, 0.8);
    kicker.position.set(6, -3, 5);
    this.scene.add(lamp, kicker, new HemisphereLight(this.tokens.ivory, this.tokens.night, 0.35));
  }

  resize(width: number, height: number) {
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const halfFov = (FOV * Math.PI) / 360;
    this.distance = FRAME_HALF / Math.tan(halfFov) / Math.min(1, this.camera.aspect);
    this.aimCamera();
    this.draw();
  }

  private aimCamera() {
    const distance = this.distance * this.dolly;
    this.camera.position.set(0, 0.25 * (1 - this.dolly) * 12, distance);
    this.camera.lookAt(0, 3.4 * (1 - this.dolly), 0);
    this.camera.updateProjectionMatrix();
  }

  /** Rebuilds the wedges for a new set of players and turns the wheel to `rotation` without animating. */
  setSlices(slices: Slice[], rotation: number) {
    this.clearSlices();
    this.slices = slices;
    this.rotation = rotation;
    this.winner = null;
    this.bloom = 0;
    this.pegStep = null;
    const { slicesGroup, wheel, brass } = this.parts;
    if (slices.length > 0) {
      this.texture = faceTexture(slices, this.tokens.font);
      this.texture.repeat.setScalar(1 / (2 * WHEEL_RADIUS));
      this.texture.offset.setScalar(0.5);
      this.wedges = buildWedges(slicesGroup, slices, this.texture);
      this.pegs = buildPegs(wheel, slices.length, brass);
    }
    this.settle = 1;
    this.placeWheel();
    this.play();
  }

  private clearSlices() {
    for (const { mesh } of this.wedges) {
      mesh.geometry.dispose();
      for (const material of [mesh.material].flat()) material.dispose();
    }
    this.parts.slicesGroup.clear();
    this.wedges = [];
    this.texture?.dispose();
    this.texture = null;
    if (this.pegs) {
      this.parts.wheel.remove(this.pegs);
      this.pegs.geometry.dispose();
      this.pegs.dispose();
      this.pegs = null;
    }
  }

  private placeWheel() {
    this.parts.wheel.rotation.z = (-this.rotation * Math.PI) / 180;
    this.parts.wheel.scale.setScalar(1 - 0.05 * this.settle);
  }

  spin(to: number, onTick: Spin["onTick"], onLand: Spin["onLand"]) {
    this.spinState = { from: this.rotation, to, startedAt: performance.now(), onTick, onLand };
    this.play();
  }

  /** Jumps a running spin to its target; the landing still plays. */
  skip() {
    if (this.spinState) this.spinState.startedAt = -SPIN_MS;
    this.play();
  }

  /** Slight tilt towards the pointer, in -1 to 1. */
  lean(x: number, y: number) {
    this.hover = { x, y };
    this.play();
  }

  private peg(rotation: number) {
    const width = 360 / Math.max(1, this.slices.length);
    return Math.floor(rotation / width);
  }

  private tickPegs(spin: Spin) {
    const step = this.peg(this.rotation);
    if (this.pegStep !== null && this.pegStep !== step) {
      this.kick = 1;
      spin.onTick();
    }
    this.pegStep = step;
  }

  private land(spin: Spin) {
    this.spinState = null;
    this.rotation = spin.to;
    const index = this.peg(360 - (spin.to % 360 || 360));
    const wedge = this.wedges[index];
    this.winner = wedge ?? null;
    this.bloom = 1;
    if (wedge) {
      // Wedges share one face material: the winner gets a lit copy, then the shared one dims the rest.
      const lit = wedge.face.clone();
      lit.emissive.set(this.tokens.lamp);
      lit.emissiveMap = wedge.face.map;
      lit.emissiveIntensity = 0.5;
      wedge.mesh.material = [lit, [wedge.mesh.material].flat()[1] ?? lit];
      wedge.face.color.setScalar(DIMMED);
      const origin = new Vector3(0, WHEEL_RADIUS * 0.9, 1);
      const slice = this.slices[index];
      this.burst.fire(origin, [slice?.entry.color ?? this.tokens.lamp, this.tokens.lamp, this.tokens.ivory]);
    }
    spin.onLand();
  }

  private paintBulbs(now: number) {
    const { lamps, halos } = this.parts.bulbs;
    const spinning = this.spinState !== null;
    for (let i = 0; i < BULB_COUNT; i++) {
      const chase = (i + Math.floor(now / 55)) % 5 === 0;
      const blink = Math.floor(now / 130) % 2 === i % 2;
      const on = spinning ? chase : this.bloom > 0.02 ? blink : i % 3 === 0;
      const level = spinning ? (on ? 1 : 0.12) : this.bloom > 0.02 ? (on ? 1 : 0.1) : on ? 0.8 : 0.35;
      this.lit.set(this.tokens.lamp).multiplyScalar(level);
      lamps.setColorAt(i, this.lit);
      halos.setColorAt(i, this.lit);
    }
    if (lamps.instanceColor) lamps.instanceColor.needsUpdate = true;
    if (halos.instanceColor) halos.instanceColor.needsUpdate = true;
  }

  private moveRig(dt: number): boolean {
    const { rig } = this.parts;
    const spinning = this.spinState !== null;
    const base = spinning ? SPIN_TILT : IDLE_TILT;
    const x = base.x - this.hover.y * PARALLAX;
    const y = base.y + this.hover.x * PARALLAX;
    rig.rotation.x = easeToward(rig.rotation.x, x, dt, 240);
    rig.rotation.y = easeToward(rig.rotation.y, y, dt, 240);
    return Math.abs(rig.rotation.x - x) + Math.abs(rig.rotation.y - y) > EPSILON;
  }

  private moveCamera(dt: number, spinProgress: number): boolean {
    const target = spinProgress > 0.45 ? DOLLY_IN : 1;
    this.dolly = easeToward(this.dolly, target, dt, 620);
    this.aimCamera();
    return Math.abs(this.dolly - target) > EPSILON;
  }

  private moveWinner(dt: number): boolean {
    if (!this.winner) return false;
    const { mesh, out } = this.winner;
    mesh.position.z = easeToward(mesh.position.z, LIFT, dt, 110);
    mesh.position.x = out.x * mesh.position.z * 0.25;
    mesh.position.y = out.y * mesh.position.z * 0.25;
    this.bloom = Math.max(0, this.bloom - dt / 2000);
    return this.bloom > 0;
  }

  private play() {
    if (!this.frame) this.frame = requestAnimationFrame(this.loop);
  }

  private readonly loop = (now: number) => {
    this.frame = 0;
    const dt = Math.min(50, this.last ? now - this.last : 16);
    this.last = now;
    let progress = 0;
    const spin = this.spinState;
    if (spin) {
      const elapsed = performance.now() - spin.startedAt;
      progress = elapsed / SPIN_MS;
      this.rotation = spinAngle(elapsed, spin.from, spin.to);
      this.tickPegs(spin);
      if (elapsed >= SPIN_MS) this.land(spin);
    }
    this.kick *= Math.exp(-dt / KICK_DECAY_MS);
    this.settle *= Math.exp(-dt / 90);
    this.placeWheel();
    this.parts.flapper.rotation.z = -0.5 * this.kick;
    const rigMoving = this.moveRig(dt);
    const cameraMoving = this.moveCamera(dt, progress);
    const winnerMoving = this.moveWinner(dt);
    const flying = this.burst.tick(dt / 1000);
    this.paintBulbs(now);
    this.draw();
    const moving = rigMoving || cameraMoving || winnerMoving || flying;
    if (moving || this.spinState || this.kick > 0.01 || this.settle > 0.01) this.play();
    else this.last = 0;
  };

  private draw() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.clearSlices();
    // Strict Mode reuses this canvas's GL context, and three's start-up uploads reject a leftover flip-Y state.
    const gl = this.renderer.getContext();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.renderer.dispose();
  }
}
