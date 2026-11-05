import {
  AmbientLight,
  CatmullRomCurve3,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

import { readTokens } from "@/lib/table-3d/table-mesh";

import {
  buildClimber,
  buildMountain,
  climberScale,
  groundPoint,
  MOUNTAIN_RADIUS,
  reachAtHeight,
  type Climber,
} from "./elo-mountain";

export interface EloSeries {
  color: string;
  number: number;
  /** One rating per day; null before the player's first match. */
  ratings: (number | null)[];
}

const FOV = 30;
const NEAREST_DISTANCE = 15;
const CAMERA_PITCH = 0.2;
const AIM_Y = 1.15;
const FIT_MARGIN = 1.08;
const SWAY_RADIANS = 0.5;
const DRAW_IN_MS = 1800;
/** How far up the mountain the lowest and the highest rating stand; the summit itself stays out of reach. */
const BASE_CAMP = 0.1;
const TOP_CAMP = 0.86;
/** Bearings the routes spread over, all on the side facing the camera. */
const ROUTES_ARC = 2.1;
/** Each route also traverses sideways with the days, so a flat rating still reads as a walked path. */
const TRAVERSE = 0.4;
const TRAIL_RADIUS = 0.022;
const TRAIL_SIDES = 6;
const TRAIL_LIFT = 0.03;
const SAMPLES_PER_DAY = 14;

const easeInOut = (t: number) => t * t * (3 - 2 * t);

interface Camp {
  theta: number;
  reach: number;
}

interface Route {
  /** One camp per day; null before the player's first match. */
  camps: (Camp | null)[];
  firstDay: number;
  climber: Climber;
  trail: Mesh | null;
  trailSegments: number;
}

/** Elo as a climb: height on the mountain is rating, and each day's camp is a stop on the player's own route. */
export class EloScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 2, 0.1, 100);
  private readonly routes: Route[];
  private readonly days: number;
  private frame = 0;
  private startedAt = 0;
  private drawn = 0;
  private day: number;
  private sway = 0;
  private distance = NEAREST_DISTANCE;

  constructor(canvas: HTMLCanvasElement, series: EloSeries[]) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const tokens = readTokens(canvas);
    this.days = Math.max(...series.map((s) => s.ratings.length), 1);
    this.day = this.days - 1;

    const ratings = series.flatMap((s) => s.ratings.flatMap((r) => (r === null ? [] : [r])));
    const low = Math.min(...ratings);
    const span = Math.max(Math.max(...ratings) - low, 1);
    const toReach = (rating: number) => reachAtHeight(BASE_CAMP + ((rating - low) / span) * (TOP_CAMP - BASE_CAMP));
    const trailMaterial = (color: string) =>
      new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.5 });

    const sun = new DirectionalLight(tokens.ivory, 2.4);
    sun.position.set(-6, 7, 4);
    const fill = new DirectionalLight(tokens.lampSoft, 0.5);
    fill.position.set(6, 2, 3);
    this.scene.add(buildMountain(tokens), new AmbientLight(tokens.ivory, 0.75), sun, fill);

    this.routes = series.map((s, lane) => {
      const bearing = ((lane + 0.5) / series.length - 0.5) * ROUTES_ARC;
      const camps = s.ratings.map((rating, day) =>
        rating === null
          ? null
          : { theta: bearing + (day / Math.max(this.days - 1, 1) - 0.5) * TRAVERSE, reach: toReach(rating) },
      );
      const firstDay = camps.findIndex((camp) => camp !== null);
      const route: Route = {
        camps,
        firstDay,
        climber: buildClimber(s.color, s.number, tokens),
        trail: null,
        trailSegments: 0,
      };
      const walked = this.sampleTrail(route);
      // A curve needs two points: a player with one rated day stands at camp with no trail.
      if (walked.length > 1) {
        route.trailSegments = walked.length * 2;
        route.trail = new Mesh(
          new TubeGeometry(new CatmullRomCurve3(walked), route.trailSegments, TRAIL_RADIUS, TRAIL_SIDES),
          trailMaterial(s.color),
        );
        this.scene.add(route.trail);
      }
      this.scene.add(route.climber.figure);
      return route;
    });
  }

  /** The ground under a route at a fractional day; between camps the climber eases, resting a moment at each. */
  private routePoint({ camps, firstDay }: Route, at: number, out: Vector3): boolean {
    if (firstDay < 0 || at < firstDay) return false;
    const whole = Math.min(Math.floor(at), camps.length - 1);
    const from = camps[whole];
    if (!from) return false;
    const to = camps[whole + 1] ?? from;
    const t = easeInOut(at - whole);
    groundPoint(from.theta + (to.theta - from.theta) * t, from.reach + (to.reach - from.reach) * t, out);
    return true;
  }

  private sampleTrail(route: Route): Vector3[] {
    const points: Vector3[] = [];
    if (route.firstDay < 0) return points;
    const steps = (route.camps.length - 1 - route.firstDay) * SAMPLES_PER_DAY;
    for (let step = 0; step <= steps; step++) {
      const point = new Vector3();
      if (!this.routePoint(route, route.firstDay + step / SAMPLES_PER_DAY, point)) continue;
      point.y += TRAIL_LIFT;
      points.push(point);
    }
    return points;
  }

  resize(width: number, height: number) {
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    // The mountain's width sets the distance, so a phone sees all of it from further back.
    const halfView = Math.tan((FOV * Math.PI) / 360) * this.camera.aspect;
    this.distance = Math.max((MOUNTAIN_RADIUS * FIT_MARGIN) / halfView, NEAREST_DISTANCE);
    const size = climberScale(this.distance / NEAREST_DISTANCE);
    for (const { climber } of this.routes) climber.figure.scale.setScalar(size);
    this.camera.updateProjectionMatrix();
    this.play();
  }

  /** Sends the climbers up from their first camp, once. */
  start() {
    this.startedAt = performance.now();
    this.play();
  }

  /** Shows one day: the climbers go to that day's camp and the camera circles with the pointer. `day` is null for the latest. */
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
    this.drawn = easeInOut(progress);
    const angle = this.sway * SWAY_RADIANS;
    this.camera.position.set(
      Math.sin(angle) * this.distance,
      AIM_Y + this.distance * CAMERA_PITCH,
      Math.cos(angle) * this.distance,
    );
    this.camera.lookAt(0, AIM_Y, 0);
    for (const route of this.routes) this.place(route);
    this.renderer.render(this.scene, this.camera);
    if (progress > 0 && progress < 1) this.play();
  };

  private place(route: Route) {
    const { camps, firstDay, climber, trail, trailSegments } = route;
    const at = firstDay + Math.max(this.day - firstDay, 0) * this.drawn;
    const onMountain = this.day >= firstDay && this.routePoint(route, at, climber.figure.position);
    climber.figure.visible = onMountain;
    if (onMountain) climber.head.lookAt(this.camera.position);
    if (!trail) return;
    const lastDay = camps.length - 1;
    const walked = lastDay > firstDay ? (at - firstDay) / (lastDay - firstDay) : 0;
    trail.geometry.setDrawRange(0, Math.floor(trailSegments * walked) * TRAIL_SIDES * 6);
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
