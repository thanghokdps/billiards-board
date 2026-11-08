import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type Scene,
  type Texture,
} from "three";

import type { Slice } from "@/lib/wheel";

import { eightBallTexture } from "./wheel-face";

export const WHEEL_RADIUS = 3;
export const FLAPPER_PIVOT_Y = 4.05;

const HUB_RADIUS = 0.68;
const WEDGE_DEPTH = 0.14;
const WEDGE_BEVEL = 0.035;
const GAP_DEG = 0.5;
const PEG_RADIUS = 3.07;
const RIM_INNER = 3.14;
const BULB_RADIUS = 3.46;
export const BULB_COUNT = 30;

export interface WheelTokens {
  wood: string;
  woodDark: string;
  night: string;
  ivory: string;
  lamp: string;
  chalk: string;
  house: string;
  font: string;
}

/** The scene paints with the page's tokens; next/font's family only exists as a CSS variable. */
export function readWheelTokens(el: Element): WheelTokens {
  const css = getComputedStyle(el);
  const token = (name: string) => css.getPropertyValue(name).trim();
  return {
    wood: token("--color-wood"),
    woodDark: token("--color-wood-dark"),
    night: token("--color-night"),
    ivory: token("--color-ivory"),
    lamp: token("--color-lamp"),
    chalk: token("--color-chalk"),
    house: token("--color-house"),
    font: token("--font-shoulders") || "sans-serif",
  };
}

/** Slices run clockwise from 12 o'clock; three.js angles run counter-clockwise from 3 o'clock. */
const toAngle = (deg: number) => Math.PI / 2 - (deg * Math.PI) / 180;

function wedgeShape(slice: Slice): Shape {
  const shape = new Shape();
  if (slice.share >= 0.9999) {
    shape.absarc(0, 0, WHEEL_RADIUS, 0, Math.PI * 2, false);
    return shape;
  }
  const from = toAngle(slice.start + GAP_DEG / 2);
  const to = toAngle(slice.end - GAP_DEG / 2);
  shape.absarc(0, 0, WHEEL_RADIUS, from, to, true);
  shape.absarc(0, 0, HUB_RADIUS, to, from, false);
  shape.closePath();
  return shape;
}

export interface Wedge {
  mesh: Mesh;
  face: MeshPhysicalMaterial;
  /** Outward direction in the wheel's plane, to lift a winning wedge along. */
  out: Vector2;
}

/** Bevelled wedges, one mesh each so a winner can rise alone; caps read the shared face by their own x, y. */
export function buildWedges(group: Group, slices: Slice[], map: Texture): Wedge[] {
  const faces = new Map<string, MeshPhysicalMaterial>();
  const face = new MeshPhysicalMaterial({ map, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.35 });
  return slices.map((slice) => {
    const curveSegments = Math.max(4, Math.ceil(72 * slice.share));
    const geometry = new ExtrudeGeometry(wedgeShape(slice), {
      depth: WEDGE_DEPTH,
      bevelEnabled: true,
      bevelThickness: WEDGE_BEVEL,
      bevelSize: WEDGE_BEVEL,
      bevelOffset: -WEDGE_BEVEL,
      bevelSegments: 2,
      curveSegments,
    });
    const edge =
      faces.get(slice.entry.color) ??
      new MeshPhysicalMaterial({ color: slice.entry.color, roughness: 0.4, clearcoat: 0.6 });
    faces.set(slice.entry.color, edge);
    const mesh = new Mesh(geometry, [face, edge]);
    mesh.receiveShadow = true;
    group.add(mesh);
    const mid = toAngle((slice.start + slice.end) / 2);
    return { mesh, face, out: new Vector2(Math.cos(mid), Math.sin(mid)) };
  });
}

export function buildPegs(group: Group, count: number, brass: MeshStandardMaterial): InstancedMesh {
  const pegs = new InstancedMesh(new CylinderGeometry(0.045, 0.045, 0.32, 10), brass, count);
  const dummy = new Object3D();
  for (let i = 0; i < count; i++) {
    const angle = toAngle((i * 360) / count);
    dummy.position.set(Math.cos(angle) * PEG_RADIUS, Math.sin(angle) * PEG_RADIUS, 0.26);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    pegs.setMatrixAt(i, dummy.matrix);
  }
  pegs.castShadow = true;
  group.add(pegs);
  return pegs;
}

function glowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, "rgb(255 255 255 / 1)");
    glow.addColorStop(0.3, "rgb(255 255 255 / 0.35)");
    glow.addColorStop(1, "rgb(255 255 255 / 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(canvas);
}

export interface Bulbs {
  lamps: InstancedMesh;
  halos: InstancedMesh;
}

function buildBulbs(rig: Group): Bulbs {
  const lamps = new InstancedMesh(
    new SphereGeometry(0.075, 12, 10),
    new MeshBasicMaterial({ toneMapped: false }),
    BULB_COUNT,
  );
  const halos = new InstancedMesh(
    new PlaneGeometry(0.62, 0.62),
    new MeshBasicMaterial({
      map: glowTexture(),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
      side: DoubleSide,
    }),
    BULB_COUNT,
  );
  const dummy = new Object3D();
  const off = new Color(0);
  for (let i = 0; i < BULB_COUNT; i++) {
    const angle = (i / BULB_COUNT) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * BULB_RADIUS, Math.sin(angle) * BULB_RADIUS, 0.46);
    dummy.updateMatrix();
    lamps.setMatrixAt(i, dummy.matrix);
    dummy.position.z = 0.54;
    dummy.updateMatrix();
    halos.setMatrixAt(i, dummy.matrix);
    lamps.setColorAt(i, off);
    halos.setColorAt(i, off);
  }
  rig.add(lamps, halos);
  return { lamps, halos };
}

function buildRim(rig: Group, tokens: WheelTokens, brass: MeshStandardMaterial) {
  const profile = [
    [RIM_INNER, -0.25],
    [RIM_INNER, 0.34],
    [RIM_INNER + 0.08, 0.42],
    [3.72, 0.42],
    [3.86, 0.28],
    [3.86, -0.3],
    [3.6, -0.42],
  ]
    .reverse() // Lathe normals face out only when the profile runs bottom-outer to top-inner.
    .map(([r, y]) => new Vector2(r, y));
  const wood = new MeshPhysicalMaterial({
    color: tokens.wood,
    roughness: 0.42,
    clearcoat: 0.6,
    clearcoatRoughness: 0.4,
  });
  const rim = new Mesh(new LatheGeometry(profile, 96), wood);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  const inlay = new Mesh(new TorusGeometry(RIM_INNER + 0.03, 0.035, 12, 96), brass);
  inlay.position.z = 0.38;
  const back = new Mesh(
    new CylinderGeometry(RIM_INNER, RIM_INNER, 0.1, 64),
    new MeshStandardMaterial({ color: tokens.woodDark, roughness: 0.8 }),
  );
  back.rotation.x = Math.PI / 2;
  back.position.z = -0.1;
  rig.add(rim, inlay, back);
}

function buildHub(wheel: Group, tokens: WheelTokens, brass: MeshStandardMaterial) {
  const ball = new Mesh(
    new SphereGeometry(HUB_RADIUS * 0.82, 40, 28),
    new MeshPhysicalMaterial({
      map: eightBallTexture(tokens.night, tokens.ivory, tokens.font),
      roughness: 0.12,
      clearcoat: 1,
    }),
  );
  ball.rotation.y = -Math.PI / 2;
  ball.position.z = 0.44;
  ball.castShadow = true;
  const collar = new Mesh(new TorusGeometry(HUB_RADIUS * 0.9, 0.09, 14, 56), brass);
  collar.position.z = 0.2;
  collar.castShadow = true;
  wheel.add(ball, collar);
}

/** A short cue at 12 o'clock, hinged above the wheel so the pegs flick its chalked tip. */
function buildFlapper(rig: Group, tokens: WheelTokens, brass: MeshStandardMaterial): Group {
  const flapper = new Group();
  flapper.position.set(0, FLAPPER_PIVOT_Y, 0.56);
  const part = (top: number, bottom: number, length: number, y: number, material: MeshStandardMaterial) => {
    const mesh = new Mesh(new CylinderGeometry(top, bottom, length, 20), material);
    mesh.position.y = y;
    mesh.castShadow = true;
    flapper.add(mesh);
  };
  part(0.13, 0.09, 0.56, -0.2, new MeshPhysicalMaterial({ color: tokens.wood, roughness: 0.3, clearcoat: 1 }));
  part(0.09, 0.075, 0.14, -0.55, new MeshStandardMaterial({ color: tokens.ivory, roughness: 0.4 }));
  part(0.075, 0.02, 0.26, -0.75, new MeshStandardMaterial({ color: tokens.chalk, roughness: 0.7 }));
  const pin = new Mesh(new SphereGeometry(0.17, 20, 16), brass);
  pin.position.z = 0.04;
  flapper.add(pin);
  rig.add(flapper);
  return flapper;
}

export interface WheelParts {
  rig: Group;
  /** Everything that turns: wedges and pegs are rebuilt inside it when the players change. */
  wheel: Group;
  slicesGroup: Group;
  brass: MeshStandardMaterial;
  bulbs: Bulbs;
  flapper: Group;
}

export function buildWheel(scene: Scene, tokens: WheelTokens): WheelParts {
  const rig = new Group();
  const wheel = new Group();
  const slicesGroup = new Group();
  const brass = new MeshStandardMaterial({ color: tokens.lamp, metalness: 1, roughness: 0.28 });
  wheel.add(slicesGroup);
  rig.add(wheel);
  buildRim(rig, tokens, brass);
  buildHub(wheel, tokens, brass);
  const bulbs = buildBulbs(rig);
  const flapper = buildFlapper(rig, tokens, brass);
  scene.add(rig);
  return { rig, wheel, slicesGroup, brass, bulbs, flapper };
}
