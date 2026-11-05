import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

import { easeOut, linear, RollingBall } from "./rolling-ball";
import {
  ballTexture,
  buildTable,
  RAIL_BASE,
  RAIL_HEIGHT,
  readTokens,
  shadowTexture,
  TABLE,
  type SceneLayout,
  type Tokens,
} from "./table-mesh";

export interface Point {
  x: number;
  y: number;
}

export interface SceneBall {
  id: number;
  color: string;
  /** An empty string leaves the disc blank for an icon laid over it. */
  number: number | string;
  /** Where the ball rests, in % of the felt. */
  point: Point;
  delayMs: number;
}

/** The break, in % of the felt. */
export interface CuePath {
  start: Point;
  hit: Point;
  rest: Point;
}

const ROLL_MS = 900;
const CUE_MS = 300;
const POCKET_TABLE_CUE: CuePath = { start: { x: 8, y: 50 }, hit: { x: 38, y: 50 }, rest: { x: 20, y: 64 } };
const FOV = 26;
const FIT = 0.97;

const PROJECTED = new Vector3();

/** A lit table with the players' balls on it. It draws only while a ball moves, so an idle page costs no battery. */
export class TableScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private readonly balls = new Map<number, RollingBall>();
  private readonly targets = new Map<number, Point>();
  private readonly tokens: Tokens;
  private readonly sizes;
  private readonly sphere: SphereGeometry;
  private readonly shadowGeometry: PlaneGeometry;
  private readonly shadowMaterial = new MeshBasicMaterial({
    map: shadowTexture(),
    transparent: true,
    depthWrite: false,
  });
  private readonly cue: RollingBall;
  private frame = 0;
  private width = 1;
  private height = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly root: HTMLElement,
    private readonly layout: SceneLayout,
    private readonly cuePath: CuePath = POCKET_TABLE_CUE,
  ) {
    this.sizes = TABLE[layout];
    this.tokens = readTokens(canvas);
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.sphere = new SphereGeometry(this.sizes.ball, 32, 24);
    this.shadowGeometry = new PlaneGeometry(this.sizes.ball * 3.2, this.sizes.ball * 3.2);
    buildTable(this.scene, layout, this.tokens);
    this.cue = this.addBall(this.tokens.ivory);
    this.cue.visible = false;
  }

  private addBall(color: string, number?: number | string): RollingBall {
    const material = new MeshStandardMaterial({ map: ballTexture(color, this.tokens, number), roughness: 0.16 });
    const ball = new RollingBall(this.sphere, material, this.shadowGeometry, this.shadowMaterial, this.sizes.ball);
    this.scene.add(ball.mesh, ball.shadow);
    return ball;
  }

  private toWorld({ x, y }: Point): Vector3 {
    const { width, depth } = this.sizes;
    return new Vector3((x / 100 - 0.5) * width, 0, (y / 100 - 0.5) * depth);
  }

  private aimCamera(distance: number, aimZ: number) {
    const { tilt } = this.sizes;
    this.camera.position.set(0, Math.cos(tilt) * distance, aimZ + Math.sin(tilt) * distance);
    this.camera.lookAt(0, 0, aimZ);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /** Finds the distance that fits the rails in the canvas and the aim that centres them; a few passes converge. */
  private fitCamera() {
    const { width, depth, rail } = this.sizes;
    this.camera.aspect = this.width / this.height;
    const x = width / 2 + rail;
    const z = depth / 2 + rail;
    const corners = [-1, 1].flatMap((sx) =>
      [-1, 1].flatMap((sz) => [RAIL_BASE, RAIL_HEIGHT].map((y) => new Vector3(sx * x, y, sz * z))),
    );
    let distance = 20;
    let aimZ = 0;
    for (let pass = 0; pass < 4; pass++) {
      this.aimCamera(distance, aimZ);
      const projected = corners.map((c) => c.clone().project(this.camera));
      const ys = projected.map((p) => p.y);
      const top = Math.max(...ys);
      const bottom = Math.min(...ys);
      distance *= Math.max(...projected.map((p) => Math.abs(p.x)), (top - bottom) / 2) / FIT;
      aimZ -= ((top + bottom) / 2) * depth * 0.4;
    }
    this.aimCamera(distance, aimZ);
  }

  resize(width: number, height: number) {
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.fitCamera();
    this.draw();
  }

  /** Sends each ball to its point; a new ball starts there, and `breakShot` fires the cue ball into the rack first. */
  update(balls: SceneBall[], breakShot: boolean) {
    const now = performance.now();
    const wait = breakShot ? CUE_MS : 0;
    if (breakShot && balls.length > 0) this.fireCueBall(now);
    const shown = new Set(balls.map((b) => b.id));
    for (const [id, ball] of this.balls) ball.visible = shown.has(id);
    for (const { id, color, number, point, delayMs } of balls) {
      const ball = this.balls.get(id);
      const target = this.targets.get(id);
      if (!ball) {
        const fresh = this.addBall(color, number);
        fresh.place(this.toWorld(point));
        this.balls.set(id, fresh);
      } else if (target?.x !== point.x || target.y !== point.y) {
        ball.send({ to: this.toWorld(point), startAt: now + wait + delayMs, durationMs: ROLL_MS, ease: easeOut });
      }
      this.targets.set(id, point);
    }
    this.play();
  }

  private fireCueBall(now: number) {
    const { start, hit, rest } = this.cuePath;
    this.cue.place(this.toWorld(start));
    this.cue.visible = true;
    this.cue.send(
      { to: this.toWorld(hit), startAt: now, durationMs: CUE_MS, ease: linear },
      { to: this.toWorld(rest), startAt: now, durationMs: ROLL_MS, ease: easeOut },
    );
  }

  hop(id: number) {
    this.balls.get(id)?.hop(performance.now());
    this.play();
  }

  private play() {
    if (!this.frame) this.frame = requestAnimationFrame(this.loop);
  }

  private readonly loop = (now: number) => {
    this.frame = 0;
    let moving = this.cue.tick(now);
    for (const ball of this.balls.values()) moving = ball.tick(now) || moving;
    this.draw();
    if (moving) this.play();
  };

  private draw() {
    this.renderer.render(this.scene, this.camera);
    this.pinControls();
  }

  /** Keeps the HTML buttons on what they label. They are the real controls: the canvas is only a picture. */
  private pinControls() {
    for (const el of this.root.querySelectorAll<HTMLElement>("[data-ball]")) {
      const ball = this.balls.get(Number(el.dataset.ball));
      if (ball) this.pin(el, ball.mesh.position);
    }
    for (const el of this.root.querySelectorAll<HTMLElement>("[data-pocket]")) {
      const [x = 0, y = 0] = (el.dataset[this.layout] ?? "").split(",").map(Number);
      this.pin(el, this.toWorld({ x, y }));
    }
  }

  private pin(el: HTMLElement, world: Vector3) {
    PROJECTED.copy(world).project(this.camera);
    const x = ((PROJECTED.x + 1) / 2) * this.width + this.canvas.offsetLeft;
    const y = ((1 - PROJECTED.y) / 2) * this.height + this.canvas.offsetTop;
    el.style.setProperty("--scene-x", `${x.toFixed(1)}px`);
    el.style.setProperty("--scene-y", `${y.toFixed(1)}px`);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    // A new layout reuses this canvas's GL context, and three's start-up uploads reject a leftover flip-Y state.
    const gl = this.renderer.getContext();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.renderer.dispose();
  }
}
