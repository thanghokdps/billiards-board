import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

import { canvasTexture, readTokens, type Tokens } from "@/lib/table-3d/table-mesh";

const STAGE_WIDTH = 8;
const FLOOR_SIZE = 60;
const TICK_Z = 1.3;
const MAX_CHIPS = 16;
const CHIP_HEIGHT = 0.15;
const CHIP_FILL = 0.84;
const MAX_RADIUS = 0.62;
const JITTER = 0.025;
const CHIP_TWIST = 2.4;
const AIM_Y = 0.7;
const STRIPES = 8;
const FOV = 30;
const NEAREST_DISTANCE = 11;
const CAMERA_PITCH = 0.62;
const SWAY_RADIANS = 0.18;
const DROP_HEIGHT = 1.6;
const DROP_MS = 340;
const STACK_DELAY_MS = 70;
const CHIP_DELAY_MS = 20;
const DIMMED = new Color(0.5, 0.5, 0.5);
const LIT = new Color(1, 1, 1);
const FOCUSED = new Color(1.25, 1.25, 1.25);

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const PROJECTED = new Vector3();
const MATRIX = new Matrix4();
const SCALE = new Vector3();

function sideMaterial(tokens: Tokens): MeshStandardMaterial {
  const map = canvasTexture(512, 32, (ctx) => {
    ctx.fillStyle = tokens.lamp;
    ctx.fillRect(0, 0, 512, 32);
    ctx.fillStyle = tokens.ivory;
    for (let i = 0; i < STRIPES; i++) ctx.fillRect((i * 512) / STRIPES, 0, 24, 32);
    // A dark lip at each edge parts one chip from the next in the stack.
    ctx.fillStyle = tokens.night;
    ctx.fillRect(0, 0, 512, 3);
    ctx.fillRect(0, 29, 512, 3);
  });
  return new MeshStandardMaterial({ map, roughness: 0.4 });
}

function faceMaterial(tokens: Tokens): MeshStandardMaterial {
  const map = canvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = tokens.lamp;
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = tokens.ivory;
    ctx.lineWidth = 10;
    ctx.setLineDash([22, 18]);
    ctx.beginPath();
    ctx.arc(64, 64, 57, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 64, 36, 0, Math.PI * 2);
    ctx.stroke();
  });
  return new MeshStandardMaterial({ map, roughness: 0.35 });
}

interface Stack {
  x: number;
  chips: number;
  /** Index of this stack's first chip in the instanced mesh. */
  first: number;
}

/** One stack of chips per bucket, dropped in once. Draws only while moving, so an idle page costs no battery. */
export class ChipScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 2, 0.1, 100);
  private readonly chips: InstancedMesh;
  private readonly stacks: Stack[];
  private readonly radius: number;
  private frame = 0;
  private startedAt = 0;
  private active: number | null = null;
  private sway = 0;
  private distance = NEAREST_DISTANCE;
  private width = 1;
  private height = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly root: HTMLElement,
    totals: number[],
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const tokens = readTokens(canvas);
    const max = Math.max(...totals, 1);
    const slot = STAGE_WIDTH / Math.max(totals.length, 1);
    this.radius = Math.min(MAX_RADIUS, (slot / 2) * CHIP_FILL);

    let first = 0;
    this.stacks = totals.map((total, index) => {
      const chips = total > 0 ? Math.max(1, Math.round((total / max) * MAX_CHIPS)) : 0;
      const stack = { x: (index + 0.5) * slot - STAGE_WIDTH / 2, chips, first };
      first += chips;
      return stack;
    });

    const side = sideMaterial(tokens);
    const face = faceMaterial(tokens);
    this.chips = new InstancedMesh(
      new CylinderGeometry(this.radius, this.radius, CHIP_HEIGHT, 40),
      [side, face, face],
      first,
    );
    this.chips.frustumCulled = false;
    this.paint();

    // Wider than any view, so the felt fills the card; the lamp's pool of light is what gives it depth.
    const floor = new Mesh(
      new PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE),
      new MeshStandardMaterial({ color: tokens.felt, roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    const key = new DirectionalLight(tokens.ivory, 1.2);
    key.position.set(-3, 7, 5);
    const lamp = new PointLight(tokens.lampSoft, 26, 0, 2);
    lamp.position.set(0, 4.5, 0.5);
    this.scene.add(floor, this.chips, new AmbientLight(tokens.ivory, 0.7), key, lamp);
  }

  resize(width: number, height: number) {
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // The stage's width sets the distance, so a phone sees all of it from further back.
    const halfWidth = STAGE_WIDTH / 2 + 0.8;
    const halfView = Math.tan((FOV * Math.PI) / 360) * this.camera.aspect;
    this.distance = Math.max(halfWidth / halfView, NEAREST_DISTANCE);
    this.camera.updateProjectionMatrix();
    this.play();
  }

  /** Drops the stacks in, once. */
  start() {
    this.startedAt = performance.now();
    this.play();
  }

  /** Lights one stack, or all of them for null, and leans the camera with the pointer (-1 to 1). */
  show(index: number | null, sway: number) {
    this.active = index;
    this.sway = sway;
    this.paint();
    this.play();
  }

  private paint() {
    for (const [index, { chips, first }] of this.stacks.entries()) {
      const tint = this.active === null ? LIT : index === this.active ? FOCUSED : DIMMED;
      for (let n = 0; n < chips; n++) this.chips.setColorAt(first + n, tint);
    }
    if (this.chips.instanceColor) this.chips.instanceColor.needsUpdate = true;
  }

  private play() {
    if (!this.frame) this.frame = requestAnimationFrame(this.loop);
  }

  /** Places every chip for `now`; returns true while any is still falling. */
  private drop(now: number): boolean {
    let falling = false;
    for (const [index, { x, chips, first }] of this.stacks.entries()) {
      for (let n = 0; n < chips; n++) {
        const startAt = this.startedAt + index * STACK_DELAY_MS + n * CHIP_DELAY_MS;
        const t = this.startedAt ? Math.min(1, Math.max(0, (now - startAt) / DROP_MS)) : 0;
        if (t < 1) falling = true;
        const rest = CHIP_HEIGHT * (n + 0.5);
        // A fixed scatter per chip, so a redraw never makes the stack shiver.
        const nudgeX = Math.sin(n * 12.9 + index) * JITTER;
        const nudgeZ = Math.cos(n * 7.3 + index) * JITTER;
        MATRIX.makeRotationY(n * CHIP_TWIST)
          .scale(SCALE.setScalar(t > 0 ? 1 : 0))
          .setPosition(x + nudgeX, rest + (1 - easeOut(t)) * DROP_HEIGHT, nudgeZ);
        this.chips.setMatrixAt(first + n, MATRIX);
      }
    }
    this.chips.instanceMatrix.needsUpdate = true;
    return falling && this.startedAt > 0;
  }

  private readonly loop = (now: number) => {
    this.frame = 0;
    const falling = this.drop(now);
    const angle = this.sway * SWAY_RADIANS;
    this.camera.position.set(
      Math.sin(angle) * this.distance,
      this.distance * CAMERA_PITCH,
      Math.cos(angle) * this.distance,
    );
    this.camera.lookAt(0, AIM_Y, 0);
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
    this.pinLabels();
    if (falling) this.play();
  };

  /** The axis and the amount are HTML, kept on their stacks: text stays sharp and in the page's type. */
  private pinLabels() {
    for (const el of this.root.querySelectorAll<HTMLElement>("[data-stack]")) {
      const stack = this.stacks[Number(el.dataset.stack)];
      if (stack) this.pin(el, stack.x, 0, TICK_Z);
    }
    const tip = this.root.querySelector<HTMLElement>("[data-tip]");
    const shown = this.stacks[this.active ?? this.stacks.length - 1];
    if (tip && shown) this.pin(tip, shown.x, shown.chips * CHIP_HEIGHT + 0.1, 0);
  }

  private pin(el: HTMLElement, x: number, y: number, z: number) {
    PROJECTED.set(x, y, z).project(this.camera);
    el.style.setProperty("--scene-x", `${(((PROJECTED.x + 1) / 2) * this.width).toFixed(1)}px`);
    el.style.setProperty("--scene-y", `${(((1 - PROJECTED.y) / 2) * this.height).toFixed(1)}px`);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    // New totals reuse this canvas's GL context, and three's start-up uploads reject a leftover flip-Y state.
    const gl = this.renderer.getContext();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.renderer.dispose();
  }
}
