import { Color, InstancedMesh, MeshPhysicalMaterial, Object3D, SphereGeometry, Vector3, type Scene } from "three";

const COUNT = 42;
const LIFE_S = 1.5;
const GRAVITY = 15;

const DUMMY = new Object3D();

interface Spark {
  position: Vector3;
  velocity: Vector3;
  size: number;
}

/** Small balls thrown from the winning wedge towards the camera, then falling off the frame. */
export class WheelBurst {
  private readonly mesh: InstancedMesh;
  private readonly sparks: Spark[] = [];
  private age = LIFE_S;

  constructor(scene: Scene) {
    this.mesh = new InstancedMesh(
      new SphereGeometry(1, 16, 12),
      new MeshPhysicalMaterial({ roughness: 0.15, clearcoat: 1 }),
      COUNT,
    );
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  fire(origin: Vector3, colors: string[]) {
    this.sparks.length = 0;
    const tint = new Color();
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.sparks.push({
        position: origin.clone(),
        velocity: new Vector3(Math.cos(angle) * speed, Math.sin(angle) * speed + 5, 2 + Math.random() * 6),
        size: 0.08 + Math.random() * 0.12,
      });
      this.mesh.setColorAt(i, tint.set(colors[i % colors.length] ?? "#ffffff"));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.age = 0;
    this.mesh.visible = true;
  }

  /** Returns true while any ball is still flying. */
  tick(dt: number): boolean {
    if (this.age >= LIFE_S) return false;
    this.age += dt;
    const shrink = Math.max(0, 1 - this.age / LIFE_S);
    this.sparks.forEach((spark, i) => {
      spark.velocity.y -= GRAVITY * dt;
      spark.position.addScaledVector(spark.velocity, dt);
      DUMMY.position.copy(spark.position);
      DUMMY.scale.setScalar(spark.size * Math.min(1, shrink * 3));
      DUMMY.updateMatrix();
      this.mesh.setMatrixAt(i, DUMMY.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.age >= LIFE_S) this.mesh.visible = false;
    return this.age < LIFE_S;
  }
}
