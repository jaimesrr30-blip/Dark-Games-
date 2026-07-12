import * as THREE from "three";
import { buildCarMesh, type CarVisualConfig } from "../entities/Car";

export class GarageScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private carGroup: THREE.Group | null = null;
  private rotationY = Math.PI * 0.2;
  private dragging = false;
  private lastX = 0;
  private autoRotate = true;
  private canvas: HTMLCanvasElement;
  private resizeObserver: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(0, 2.2, 7);
    this.camera.lookAt(0, 0.6, 0);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 5);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x6699ff, 0.8);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const platGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.2, 32);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1c2333, roughness: 0.4, metalness: 0.5 });
    const plat = new THREE.Mesh(platGeo, platMat);
    plat.position.y = -0.1;
    this.scene.add(plat);

    canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.autoRotate = false;
      this.lastX = e.clientX;
    });
    window.addEventListener("pointerup", () => (this.dragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      this.lastX = e.clientX;
      this.rotationY += dx * 0.01;
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);
    this.handleResize();
  }

  private handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setCar(cfg: CarVisualConfig) {
    if (this.carGroup) {
      this.scene.remove(this.carGroup);
    }
    this.carGroup = buildCarMesh({ ...cfg, scale: 1.3 });
    this.carGroup.rotation.y = this.rotationY;
    this.scene.add(this.carGroup);
  }

  render(dt: number) {
    if (this.autoRotate) this.rotationY += dt * 0.35;
    if (this.carGroup) this.carGroup.rotation.y = this.rotationY;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
  }
}
