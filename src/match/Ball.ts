import * as THREE from "three";

export class Ball {
  group: THREE.Group;
  position = new THREE.Vector3(0, 4, 0);
  velocity = new THREE.Vector3();
  radius = 1.1;
  spin = new THREE.Vector3();

  constructor(colorHex = 0xffffff) {
    this.group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.1, emissive: colorHex, emissiveIntensity: 0.15 });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(this.radius, 1), mat);
    mesh.castShadow = true;
    mesh.name = "ballMesh";
    this.group.add(mesh);
    const light = new THREE.PointLight(colorHex, 0.6, 8);
    light.position.y = 0;
    this.group.add(light);
  }

  reset(pos: THREE.Vector3) {
    this.position.copy(pos);
    this.velocity.set(0, 2, 0);
    this.spin.set(0, 0, 0);
  }

  update(dt: number, bounds: { halfW: number; halfL: number; wallH: number }, floorY = 0) {
    this.velocity.y -= 11 * dt; // gravedad reducida: el balón flota
    this.position.addScaledVector(this.velocity, dt);

    if (this.position.y - this.radius < floorY) {
      this.position.y = floorY + this.radius;
      this.velocity.y = Math.abs(this.velocity.y) * 0.58;
      this.velocity.x *= 0.985;
      this.velocity.z *= 0.985;
    }
    const ceiling = 40;
    if (this.position.y + this.radius > ceiling) {
      this.position.y = ceiling - this.radius;
      this.velocity.y = -Math.abs(this.velocity.y) * 0.5;
    }

    if (Math.abs(this.position.x) > bounds.halfW - this.radius) {
      this.position.x = Math.sign(this.position.x) * (bounds.halfW - this.radius);
      this.velocity.x = -this.velocity.x * 0.6;
    }
    if (Math.abs(this.position.z) > bounds.halfL - this.radius) {
      this.position.z = Math.sign(this.position.z) * (bounds.halfL - this.radius);
      this.velocity.z = -this.velocity.z * 0.6;
    }

    // resistencia del aire suave
    this.velocity.multiplyScalar(1 - Math.min(0.02, dt * 0.05));

    this.group.position.copy(this.position);
    this.group.rotation.x += this.velocity.z * dt * 0.15;
    this.group.rotation.z -= this.velocity.x * dt * 0.15;
  }
}
