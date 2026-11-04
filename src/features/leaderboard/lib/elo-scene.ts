import {
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  DirectionalLight,
  Float32BufferAttribute,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Color,
  Vector3,
  WebGLRenderer,
  DoubleSide,
} from "three";

import { ballTexture, readTokens } from "./table-mesh";

export interface EloSeries {
  color: string;
  number: number;
  /** One rating per day; null before the player's first match. */
  ratings: (number | null)[];
}

const STAGE_WIDTH = 8;
const STAGE_HEIGHT = 2.4;
/** Canvas aspect at which the stage needs no extra height. */
const WIDE_ASPECT = 2;
const MAX_HEIGHT_SCALE = 1.7;
const NEAREST_DISTANCE = 8.5;
const CAMERA_PITCH = 0.4;
const LANE_DEPTH = 0.7;
const FLOOR_MARGIN = 0.6;
const BALL_RADIUS = 0.15;
const TUBE_RADIUS = 0.03;
const TUBE_SIDES = 6;
const CURTAIN_ALPHA = 0.6;
const DRAW_IN_MS = 1400;
const SWAY_RADIANS = 0.22;
const FOV = 30;

const easeOut = (t: number) => 1 - (1 - t) ** 3;

interface Ribbon {
  points: (Vector3 | null)[];
  curtain: Mesh;
  tube: Mesh;
  tubeSegments: number;
  ball: Mesh;
}

function curtainGeometry(points: (Vector3 | null)[], color: Color): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const push = (p: Vector3, y: number, alpha: number) => {
    positions.push(p.x, y, p.z);
    colors.push(color.r, color.g, color.b, alpha);
  };
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    if (!a || !b) continue;
    push(a, 0, 0);
    push(b, 0, 0);
    push(b, b.y, CURTAIN_ALPHA);
    push(a, 0, 0);
    push(b, b.y, CURTAIN_ALPHA);
    push(a, a.y, CURTAIN_ALPHA);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 4));
  return geometry;
}

/** Elo as lit curtains in depth, one lane per player, with each player's ball riding the top edge. */
export class EloScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 2, 0.1, 100);
  private readonly ribbons: Ribbon[];
  private readonly days: number;
  private frame = 0;
  private startedAt = 0;
  private drawn = 0;
  private day: number;
  private sway = 0;
  private distance = NEAREST_DISTANCE;
  private readonly lookAtY: number;

  constructor(canvas: HTMLCanvasElement, series: EloSeries[]) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const tokens = readTokens(canvas);
    this.days = Math.max(...series.map((s) => s.ratings.length), 1);
    this.day = this.days - 1;

    const ratings = series.flatMap((s) => s.ratings.flatMap((r) => (r === null ? [] : [r])));
    const low = Math.min(...ratings);
    const span = Math.max(Math.max(...ratings) - low, 1);
    // A narrow canvas sits further back, so the curtains grow taller to keep filling it.
    const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    const stageHeight = STAGE_HEIGHT * Math.min(Math.max(WIDE_ASPECT / aspect, 1), MAX_HEIGHT_SCALE);
    this.lookAtY = stageHeight * CAMERA_PITCH;
    const toY = (rating: number) => 0.25 + ((rating - low) / span) * stageHeight;
    const toX = (day: number) => (day / Math.max(this.days - 1, 1) - 0.5) * STAGE_WIDTH;
    const laneOf = (lane: number) => (lane - (series.length - 1) / 2) * LANE_DEPTH;

    const depth = series.length * LANE_DEPTH + FLOOR_MARGIN;
    const floor = new Mesh(
      new PlaneGeometry(STAGE_WIDTH + FLOOR_MARGIN * 2, depth),
      new MeshStandardMaterial({ color: tokens.felt, roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    const grid = new GridHelper(STAGE_WIDTH + FLOOR_MARGIN * 2, 12, tokens.lampSoft, tokens.felt);
    grid.position.y = 0.002;
    grid.scale.z = depth / (STAGE_WIDTH + FLOOR_MARGIN * 2);
    const key = new DirectionalLight(tokens.ivory, 1.6);
    key.position.set(-3, 6, 5);
    this.scene.add(floor, grid, new AmbientLight(tokens.ivory, 1), key);

    const sphere = new SphereGeometry(BALL_RADIUS, 24, 16);
    this.ribbons = series.map((s, lane) => {
      const points = s.ratings.map((r, day) => (r === null ? null : new Vector3(toX(day), toY(r), laneOf(lane))));
      const curtain = new Mesh(
        curtainGeometry(points, new Color(s.color)),
        new MeshBasicMaterial({ vertexColors: true, transparent: true, side: DoubleSide, depthWrite: false }),
      );
      const known = points.flatMap((p) => (p ? [p] : []));
      const tubeSegments = Math.max(known.length * 3, 8);
      const tube = new Mesh(
        new TubeGeometry(new CatmullRomCurve3(known, false, "centripetal"), tubeSegments, TUBE_RADIUS, TUBE_SIDES),
        new MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.45, roughness: 0.4 }),
      );
      const ball = new Mesh(
        sphere,
        new MeshStandardMaterial({ map: ballTexture(s.color, tokens, s.number), roughness: 0.16 }),
      );
      this.scene.add(curtain, tube, ball);
      return { points, curtain, tube, tubeSegments, ball };
    });
  }

  resize(width: number, height: number) {
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // The stage's width sets the distance, so a phone sees all of it from further back.
    const halfWidth = STAGE_WIDTH / 2 + FLOOR_MARGIN;
    const halfView = Math.tan((FOV * Math.PI) / 360) * this.camera.aspect;
    this.distance = Math.max(halfWidth / halfView, NEAREST_DISTANCE);
    for (const { ball } of this.ribbons) ball.scale.setScalar(this.distance / NEAREST_DISTANCE);
    this.camera.updateProjectionMatrix();
    this.play();
  }

  /** Draws the curtains in from the left, once. */
  start() {
    this.startedAt = performance.now();
    this.play();
  }

  /** Shows one day: the balls ride to it and the camera leans with the pointer. `day` is null for the latest. */
  show(day: number | null, sway: number) {
    this.day = day ?? this.days - 1;
    this.sway = sway;
    this.play();
  }

  private play() {
    if (!this.frame) this.frame = requestAnimationFrame(this.loop);
  }

  private readonly loop = (now: number) => {
    this.frame = 0;
    const progress = this.startedAt ? Math.min(1, (now - this.startedAt) / DRAW_IN_MS) : 0;
    this.drawn = easeOut(progress);
    for (const ribbon of this.ribbons) this.place(ribbon);

    const angle = this.sway * SWAY_RADIANS;
    this.camera.position.set(
      Math.sin(angle) * this.distance,
      this.distance * CAMERA_PITCH,
      Math.cos(angle) * this.distance,
    );
    this.camera.lookAt(0, this.lookAtY, 0);
    this.renderer.render(this.scene, this.camera);
    if (progress > 0 && progress < 1) this.play();
  };

  private place({ points, curtain, tube, tubeSegments, ball }: Ribbon) {
    const verticesPerDay = 6;
    curtain.geometry.setDrawRange(0, Math.floor((points.length - 1) * this.drawn) * verticesPerDay);
    tube.geometry.setDrawRange(0, Math.floor(tubeSegments * this.drawn) * TUBE_SIDES * 6);
    const shownDay = Math.min(this.day, Math.round((points.length - 1) * this.drawn));
    const at = points.slice(0, shownDay + 1).findLast((p) => p !== null);
    ball.visible = at !== undefined;
    if (!at) return;
    ball.position.copy(at).setY(at.y + BALL_RADIUS * 0.6);
    ball.lookAt(this.camera.position);
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    // A remount reuses this canvas's GL context, and three's start-up uploads reject a leftover flip-Y state.
    const gl = this.renderer.getContext();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.renderer.dispose();
  }
}
