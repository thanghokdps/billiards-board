import {
  AmbientLight,
  CanvasTexture,
  CircleGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  PlaneGeometry,
  Shape,
  SpotLight,
  SRGBColorSpace,
  type Scene,
} from "three";

export type SceneLayout = "tall" | "wide";

/** World sizes per layout: the felt keeps the 3:4 / 8:5 of the flat table, and a ball stays about one thumb wide. */
export const TABLE = {
  tall: { width: 3, depth: 4, ball: 0.27, rail: 0.28, tilt: 0.36 },
  wide: { width: 8, depth: 5, ball: 0.33, rail: 0.4, tilt: 0.42 },
} as const;

export const RAIL_HEIGHT = 0.16;
export const RAIL_BASE = -0.3;

const POCKET_RATIO = 1.1;
const CUSHION_DEPTH = 0.13;

export interface Tokens {
  felt: string;
  wood: string;
  night: string;
  ivory: string;
  lampSoft: string;
  font: string;
}

/** The scene paints with the same tokens as the page; next/font's family only exists as a CSS variable. */
export function readTokens(el: Element): Tokens {
  const css = getComputedStyle(el);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    felt: token("--color-felt"),
    wood: token("--color-wood"),
    night: token("--color-night"),
    ivory: token("--color-ivory"),
    lampSoft: token("--color-lamp-soft"),
    font: token("--font-shoulders") || "sans-serif",
  };
}

function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Solid ball colour with an ivory number disc; pass no number for the cue ball. */
export function ballTexture(color: string, tokens: Tokens, number?: number): CanvasTexture {
  return canvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 256);
    if (number === undefined) return;
    // u = 0.25 is the +z side of a three.js sphere, which NUMBER_UP tips towards the camera.
    ctx.fillStyle = tokens.ivory;
    ctx.beginPath();
    ctx.ellipse(128, 128, 62, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tokens.night;
    ctx.font = `700 84px ${tokens.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number), 128, 134);
  });
}

/** A soft dark blob instead of a shadow map: phones draw it for free and it reads the same from above. */
export function shadowTexture(): CanvasTexture {
  return canvasTexture(64, 64, (ctx) => {
    const blob = ctx.createRadialGradient(32, 32, 8, 32, 32, 32);
    blob.addColorStop(0, "rgb(0 0 0 / 0.7)");
    blob.addColorStop(1, "rgb(0 0 0 / 0)");
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, 64, 64);
  });
}

function railShape(width: number, depth: number, rail: number): Shape {
  const x = width / 2 + rail;
  const z = depth / 2 + rail;
  const r = rail * 0.8;
  const shape = new Shape();
  shape.moveTo(-x + r, -z);
  shape.lineTo(x - r, -z);
  shape.quadraticCurveTo(x, -z, x, -z + r);
  shape.lineTo(x, z - r);
  shape.quadraticCurveTo(x, z, x - r, z);
  shape.lineTo(-x + r, z);
  shape.quadraticCurveTo(-x, z, -x, z - r);
  shape.lineTo(-x, -z + r);
  shape.quadraticCurveTo(-x, -z, -x + r, -z);
  const felt = new Path();
  felt.moveTo(-width / 2, -depth / 2);
  felt.lineTo(-width / 2, depth / 2);
  felt.lineTo(width / 2, depth / 2);
  felt.lineTo(width / 2, -depth / 2);
  felt.closePath();
  shape.holes.push(felt);
  return shape;
}

/** A cushion along x with its long face on the rail and its ends cut at the jaws; +z is towards the rail. */
function cushionGeometry(length: number): ExtrudeGeometry {
  const half = length / 2;
  const shape = new Shape();
  shape.moveTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(half - CUSHION_DEPTH, CUSHION_DEPTH);
  shape.lineTo(-half + CUSHION_DEPTH, CUSHION_DEPTH);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth: RAIL_HEIGHT - 0.02, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Six cushions around the felt: one on each short rail, two on each long rail, parted by the side pockets. */
function addCushions(scene: Scene, layout: SceneLayout, cloth: MeshStandardMaterial) {
  const { width, depth, ball } = TABLE[layout];
  const mouth = ball * POCKET_RATIO * 0.9;
  const edges = [
    { angle: 0, along: width, at: depth / 2 },
    { angle: Math.PI, along: width, at: depth / 2 },
    { angle: Math.PI / 2, along: depth, at: width / 2 },
    { angle: -Math.PI / 2, along: depth, at: width / 2 },
  ];
  const longAlong = Math.max(width, depth);
  for (const { angle, along, at } of edges) {
    const parted = along === longAlong;
    const length = parted ? along / 2 - mouth * 1.8 : along - mouth * 2;
    const geometry = cushionGeometry(length);
    for (const offset of parted ? [-along / 4 - mouth / 10, along / 4 + mouth / 10] : [0]) {
      const mesh = new Mesh(geometry, cloth);
      mesh.rotation.y = angle;
      mesh.position.set(
        Math.cos(angle) * offset + Math.sin(angle) * at,
        0,
        -Math.sin(angle) * offset + Math.cos(angle) * at,
      );
      scene.add(mesh);
    }
  }
}

/** The ivory diamonds on the rails: quarters of each half of a long rail, quarters of a short one. */
function addSights(scene: Scene, layout: SceneLayout, ivory: string) {
  const { width, depth, rail } = TABLE[layout];
  const sight = new CircleGeometry(rail * 0.14, 4);
  const material = new MeshBasicMaterial({ color: ivory });
  const longIsX = width > depth;
  const quarters = (length: number, parts: number) =>
    Array.from({ length: parts - 1 }, (_, i) => ((i + 1) / parts - 0.5) * length).filter(
      (at) => parts === 4 || Math.abs(at) > 0.001,
    );
  const put = (x: number, z: number) => {
    const mesh = new Mesh(sight, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, RAIL_HEIGHT + 0.035, z);
    scene.add(mesh);
  };
  const onX = quarters(width, longIsX ? 8 : 4);
  const onZ = quarters(depth, longIsX ? 4 : 8);
  for (const x of onX) for (const side of [-1, 1]) put(x, side * (depth / 2 + rail / 2));
  for (const z of onZ) for (const side of [-1, 1]) put(side * (width / 2 + rail / 2), z);
}

/** Felt, wood rail, cushions, sights, six pockets and the lamp above; everything that never moves. */
export function buildTable(scene: Scene, layout: SceneLayout, tokens: Tokens) {
  const { width, depth, rail, ball } = TABLE[layout];
  const cloth = new MeshStandardMaterial({ color: tokens.felt, roughness: 0.95 });
  const felt = new Mesh(new PlaneGeometry(width, depth), cloth);
  felt.rotation.x = -Math.PI / 2;
  scene.add(felt);
  addCushions(scene, layout, cloth);
  addSights(scene, layout, tokens.ivory);

  const wood = new Mesh(
    new ExtrudeGeometry(railShape(width, depth, rail), {
      depth: RAIL_HEIGHT - RAIL_BASE,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 2,
    }),
    new MeshStandardMaterial({ color: tokens.wood, roughness: 0.45 }),
  );
  wood.rotation.x = -Math.PI / 2;
  wood.position.y = RAIL_BASE;
  scene.add(wood);

  // Flat discs on top of the rail: nothing to cut out of the wood, and from above they read as holes.
  const pocket = new CircleGeometry(ball * POCKET_RATIO, 32);
  const hole = new MeshBasicMaterial({ color: tokens.night });
  const middle: [number, number][] =
    layout === "wide"
      ? [
          [0, -depth / 2],
          [0, depth / 2],
        ]
      : [
          [-width / 2, 0],
          [width / 2, 0],
        ];
  const spots: [number, number][] = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2],
    ...middle,
  ];
  for (const [x, z] of spots) {
    const mesh = new Mesh(pocket, hole);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, RAIL_HEIGHT + 0.04, z);
    scene.add(mesh);
  }

  const lamp = new SpotLight(tokens.lampSoft, 80, 0, 0.7, 0.9, 2);
  lamp.position.set(0, 7, 0);
  const key = new DirectionalLight(tokens.ivory, 1.2);
  key.position.set(-2, 6, 3);
  scene.add(new AmbientLight(tokens.ivory, 0.9), lamp, lamp.target, key);
}
