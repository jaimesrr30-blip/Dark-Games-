import * as THREE from "three";
import type { RegionDef } from "../data/regions";

const COUNT = 400;

export class WeatherSystem {
  points: THREE.Points;
  private velocities: Float32Array;
  private geo: THREE.BufferGeometry;
  private mat: THREE.PointsMaterial;
  private radius = 60;
  currentType: RegionDef["weather"] = "clear";

  constructor(scene: THREE.Scene) {
    this.geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    this.velocities = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * this.radius * 2;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.radius * 2;
      this.velocities[i] = 6 + Math.random() * 6;
    }
    this.geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0 });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  setWeather(type: RegionDef["weather"]) {
    this.currentType = type;
    switch (type) {
      case "rain":
        this.mat.color.set(0xaee0ff);
        this.mat.size = 0.18;
        this.mat.opacity = 0.55;
        break;
      case "snow":
        this.mat.color.set(0xffffff);
        this.mat.size = 0.28;
        this.mat.opacity = 0.85;
        break;
      case "sand":
        this.mat.color.set(0xe0c07a);
        this.mat.size = 0.22;
        this.mat.opacity = 0.4;
        break;
      case "ash":
        this.mat.color.set(0x888888);
        this.mat.size = 0.22;
        this.mat.opacity = 0.5;
        break;
      case "aurora":
      case "clear":
      default:
        this.mat.opacity = 0;
        break;
    }
  }

  update(dt: number, focus: THREE.Vector3) {
    this.points.position.set(focus.x, 0, focus.z);
    if (this.mat.opacity <= 0) return;
    const positions = this.geo.attributes.position as THREE.BufferAttribute;
    const fall = this.currentType === "snow" ? 3 : this.currentType === "sand" ? 2 : 14;
    const sway = this.currentType === "sand" ? 8 : 0.6;
    for (let i = 0; i < COUNT; i++) {
      let y = positions.getY(i) - fall * dt;
      let x = positions.getX(i) + Math.sin(i + performance.now() * 0.0005) * sway * dt;
      if (y < 0) {
        y = 40;
        x = (Math.random() - 0.5) * this.radius * 2;
        positions.setZ(i, (Math.random() - 0.5) * this.radius * 2);
      }
      positions.setX(i, x);
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  }
}
