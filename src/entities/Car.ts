import * as THREE from "three";
import { getGroundHeight } from "../world/height";

export interface CarVisualConfig {
  bodyColor: number;
  wheelColor: number;
  turboColor: number;
  antenna: boolean;
  trail: boolean;
  scale?: number;
}

export function buildCarMesh(cfg: CarVisualConfig): THREE.Group {
  const group = new THREE.Group();
  const scale = cfg.scale ?? 1;

  const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.bodyColor, roughness: 0.35, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.2), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);

  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.2, metalness: 0.6 });
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), cabinMat);
  cabin.position.set(0, 1.05, -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: cfg.wheelColor, roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12);
  const wheelPositions: [number, number, number][] = [
    [1.15, 0.45, 1.1],
    [-1.15, 0.45, 1.1],
    [1.15, 0.45, -1.1],
    [-1.15, 0.45, -1.1],
  ];
  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    wheel.name = "wheel";
    group.add(wheel);
  }

  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
  for (const side of [1, -1]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), lightMat);
    light.position.set(side * 0.75, 0.6, 1.62);
    group.add(light);
  }

  const turboMat = new THREE.MeshStandardMaterial({
    color: cfg.turboColor,
    emissive: cfg.turboColor,
    emissiveIntensity: 1.6,
  });
  const turbo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.15), turboMat);
  turbo.position.set(0, 0.5, -1.65);
  turbo.name = "turboGlow";
  group.add(turbo);

  const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x111318 });
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.4), spoilerMat);
  spoiler.position.set(0, 1.15, -1.5);
  group.add(spoiler);

  if (cfg.antenna) {
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), antennaMat);
    pole.position.set(-0.6, 1.6, -0.4);
    group.add(pole);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: cfg.turboColor, emissive: cfg.turboColor, emissiveIntensity: 1 }));
    tip.position.set(-0.6, 2.0, -0.4);
    group.add(tip);
  }

  group.scale.setScalar(scale);
  return group;
}

export interface CarPhysicsOptions {
  maxSpeed: number;
  accel: number;
  brakeAccel: number;
  turnRate: number;
  boostMultiplier: number;
  hover: number; // altura sobre el suelo (efecto flotante)
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  arenaFloorY?: number; // si está definido, usar suelo plano de arena en vez del terreno
}

export const DEFAULT_WORLD_PHYSICS: CarPhysicsOptions = {
  maxSpeed: 34,
  accel: 26,
  brakeAccel: 34,
  turnRate: 2.4,
  boostMultiplier: 1.8,
  hover: 0.05,
};

export const DEFAULT_MATCH_PHYSICS: CarPhysicsOptions = {
  maxSpeed: 30,
  accel: 30,
  brakeAccel: 36,
  turnRate: 2.8,
  boostMultiplier: 1.9,
  hover: 0.7, // los coches flotan ligeramente sobre el terreno del estadio
  arenaFloorY: 0,
};

export class CarBody {
  group: THREE.Group;
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  heading = 0;
  speed = 0;
  verticalVelocity = 0;
  grounded = true;
  boostFuel = 1; // 0..1
  boostRegenMult = 1;
  jumpsAvailable = 2;
  private wasJumpDown = false;
  radius = 1.4;

  constructor(cfg: CarVisualConfig, public physics: CarPhysicsOptions) {
    this.group = buildCarMesh(cfg);
  }

  setPosition(x: number, z: number) {
    this.position.set(x, this.groundY(x, z) + this.physics.hover, z);
    this.group.position.copy(this.position);
  }

  private groundY(x: number, z: number): number {
    if (this.physics.arenaFloorY !== undefined) return this.physics.arenaFloorY;
    return getGroundHeight(x, z);
  }

  update(dt: number, input: { throttle: number; steer: number; boost: boolean; jumpPressed: boolean }, jumpForce = 9) {
    const p = this.physics;
    const boosting = input.boost && this.boostFuel > 0.02;

    const targetAccel = input.throttle * p.accel * (boosting ? p.boostMultiplier : 1);
    this.speed += targetAccel * dt;

    // fricción / resistencia
    const drag = 0.985 - Math.min(0.02, Math.abs(this.speed) * 0.0004);
    this.speed *= Math.pow(drag, dt * 60);
    if (input.throttle === 0) this.speed *= Math.pow(0.965, dt * 60);

    const maxS = p.maxSpeed * (boosting ? p.boostMultiplier : 1);
    this.speed = THREE.MathUtils.clamp(this.speed, -maxS * 0.5, maxS);

    const speedFactor = THREE.MathUtils.clamp(1 - Math.abs(this.speed) / (maxS * 1.6), 0.35, 1);
    if (Math.abs(this.speed) > 0.05) {
      const dir = this.speed >= 0 ? 1 : -1;
      this.heading += input.steer * p.turnRate * speedFactor * dir * dt;
    }

    if (boosting) {
      this.boostFuel = Math.max(0, this.boostFuel - dt * 0.35);
    } else {
      this.boostFuel = Math.min(1, this.boostFuel + dt * 0.22 * this.boostRegenMult);
    }

    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.velocity.copy(forward).multiplyScalar(this.speed);

    let nx = this.position.x + this.velocity.x * dt;
    let nz = this.position.z + this.velocity.z * dt;
    if (p.bounds) {
      nx = THREE.MathUtils.clamp(nx, p.bounds.minX, p.bounds.maxX);
      nz = THREE.MathUtils.clamp(nz, p.bounds.minZ, p.bounds.maxZ);
    }
    this.position.x = nx;
    this.position.z = nz;

    // salto / gravedad
    const groundTarget = this.groundY(this.position.x, this.position.z) + p.hover;
    if (input.jumpPressed && !this.wasJumpDown && this.jumpsAvailable > 0) {
      this.verticalVelocity = jumpForce;
      this.jumpsAvailable -= 1;
      this.grounded = false;
    }
    this.wasJumpDown = input.jumpPressed;

    this.verticalVelocity -= 20 * dt;
    this.position.y += this.verticalVelocity * dt;
    if (this.position.y <= groundTarget) {
      this.position.y = groundTarget;
      this.verticalVelocity = 0;
      if (!this.grounded) this.grounded = true;
      this.jumpsAvailable = 2;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    const tilt = THREE.MathUtils.clamp(-input.steer * speedFactor * 0.08 * Math.sign(this.speed || 1), -0.15, 0.15);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, tilt, 0.2);

    const turbo = this.group.getObjectByName("turboGlow") as THREE.Mesh | undefined;
    if (turbo) {
      const mat = turbo.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = boosting ? 3.2 : 1.2;
    }
    for (const child of this.group.children) {
      if (child.name === "wheel") {
        child.rotation.x -= this.speed * dt * 0.6;
      }
    }
  }
}
