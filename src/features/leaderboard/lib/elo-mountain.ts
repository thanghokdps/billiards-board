import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";

import { ballTexture, type Tokens } from "@/lib/table-3d/table-mesh";

export const MOUNTAIN_RADIUS = 5.2;
export const PEAK_HEIGHT = 3.8;

/** Above 1 gives the concave flanks of a real peak: gentle foothills, a steep summit. */
const SLOPE = 1.55;
/** Angular frequency, phase and height of each ridge line running down from the summit. */
const RIDGES = [
  [3, 0.4, 0.2],
  [5, 1.7, 0.13],
  [11, 0.9, 0.06],
] as const;
const CRAGS = 0.04;
const RINGS = 90;
const SEGMENTS = 168;
const FOOTHILL_LINE = 0.06;
const SNOW_LINE = 0.56;
const SNOW_BLEND = 0.1;
const PLINTH_HEIGHT = 0.3;
const CLIMBER_SCALE = 0.3;

const smooth = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Height of the ground. `theta` is the bearing with 0 facing the camera, `reach` runs from the summit (0) to the rim (1). */
export function groundHeight(theta: number, reach: number): number {
  const up = 1 - reach;
  const ridges = RIDGES.reduce((sum, [k, phase, size]) => sum + Math.abs(Math.sin(k * theta + phase)) * size, 0);
  const crags = Math.sin(theta * 17 + reach * 23) * Math.sin(reach * 31) * CRAGS;
  // Ridges fade out at the rim and the tip, so the base stays round and the summit stays a point.
  const relief = 1 + (ridges + crags) * smooth(0, 0.25, up) * smooth(0, 0.3, reach);
  return PEAK_HEIGHT * up ** SLOPE * relief;
}

export function groundPoint(theta: number, reach: number, out = new Vector3()): Vector3 {
  const radius = reach * MOUNTAIN_RADIUS;
  return out.set(Math.sin(theta) * radius, groundHeight(theta, reach), Math.cos(theta) * radius);
}

/** The reach at which a climber `height` of the way up (0 to 1) stands. */
export const reachAtHeight = (height: number) => 1 - height ** (1 / SLOPE);

function mountainGeometry(tokens: Tokens): BufferGeometry {
  const felt = new Color(tokens.felt);
  const snow = new Color(tokens.ivory);
  // The wood token alone reads as chocolate; grey it towards granite.
  const rock = new Color(tokens.wood).lerp(new Color(tokens.night), 0.3).lerp(snow, 0.22);
  const shade = new Color();
  const point = new Vector3();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let ring = 0; ring <= RINGS; ring++) {
    for (let segment = 0; segment < SEGMENTS; segment++) {
      const theta = (segment / SEGMENTS) * Math.PI * 2;
      groundPoint(theta, ring / RINGS, point);
      positions.push(point.x, point.y, point.z);
      const height = point.y / PEAK_HEIGHT;
      // A jagged snow line: drifts reach further down the gullies than the ridges.
      const snowLine = SNOW_LINE + Math.sin(theta * 9) * 0.05 + Math.sin(theta * 23) * 0.03;
      // Rock strata: bands that follow the contour and break up across the slope.
      const strata = 0.82 + 0.3 * Math.abs(Math.sin(height * 34 + Math.sin(theta * 13) * 2.2));
      shade
        .copy(rock)
        .multiplyScalar(strata)
        .lerp(felt, 1 - smooth(0, FOOTHILL_LINE, height));
      shade.lerp(snow, smooth(snowLine, snowLine + SNOW_BLEND, height));
      colors.push(shade.r, shade.g, shade.b);
    }
  }
  for (let ring = 0; ring < RINGS; ring++) {
    for (let segment = 0; segment < SEGMENTS; segment++) {
      const next = (segment + 1) % SEGMENTS;
      const [a, b] = [ring * SEGMENTS + segment, ring * SEGMENTS + next];
      const [c, d] = [(ring + 1) * SEGMENTS + segment, (ring + 1) * SEGMENTS + next];
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** The mountain on a round wooden plinth, with the leader's flag planted on the summit. */
export function buildMountain(tokens: Tokens): Group {
  const mountain = new Group();
  mountain.add(new Mesh(mountainGeometry(tokens), new MeshStandardMaterial({ vertexColors: true, roughness: 0.92 })));
  const plinth = new Mesh(
    new CylinderGeometry(MOUNTAIN_RADIUS, MOUNTAIN_RADIUS * 1.03, PLINTH_HEIGHT, 96),
    new MeshStandardMaterial({ color: tokens.wood, roughness: 0.45 }),
  );
  plinth.position.y = -PLINTH_HEIGHT / 2 - 0.005;
  const pole = new Mesh(
    new CylinderGeometry(0.018, 0.018, 0.75, 8),
    new MeshStandardMaterial({ color: tokens.ivory, roughness: 0.5 }),
  );
  pole.position.y = PEAK_HEIGHT + 0.3;
  const flag = new Mesh(
    new ConeGeometry(0.13, 0.36, 3),
    new MeshStandardMaterial({ color: tokens.lamp, emissive: tokens.lamp, emissiveIntensity: 0.4 }),
  );
  flag.rotation.z = -Math.PI / 2;
  flag.position.set(0.17, PEAK_HEIGHT + 0.55, 0);
  mountain.add(plinth, pole, flag);
  return mountain;
}

export interface Climber {
  figure: Group;
  /** The ball is the climber's head; it turns to the camera so the number stays readable. */
  head: Mesh;
}

/** A small figure with a pack and an ice axe, in the player's colour, wearing their ball as a head. */
export function buildClimber(color: string, number: number, tokens: Tokens): Climber {
  const figure = new Group();
  const suit = new MeshStandardMaterial({ color, roughness: 0.6 });
  const body = new Mesh(new CapsuleGeometry(0.34, 0.5, 4, 12), suit);
  body.position.y = 0.6;
  const pack = new Mesh(new CapsuleGeometry(0.2, 0.26, 4, 8), new MeshStandardMaterial({ color: tokens.night }));
  pack.position.set(0, 0.68, -0.34);
  const axe = new Mesh(
    new CylinderGeometry(0.035, 0.035, 1.25, 6),
    new MeshStandardMaterial({ color: tokens.ivory, roughness: 0.4 }),
  );
  axe.position.set(0.48, 0.55, 0.1);
  axe.rotation.z = -0.16;
  const head = new Mesh(
    new SphereGeometry(0.44, 24, 16),
    new MeshStandardMaterial({ map: ballTexture(color, tokens, number), roughness: 0.16 }),
  );
  head.position.y = 1.42;
  figure.add(body, pack, axe, head);
  figure.scale.setScalar(CLIMBER_SCALE);
  return { figure, head };
}

export const climberScale = (zoom: number) => CLIMBER_SCALE * zoom;
