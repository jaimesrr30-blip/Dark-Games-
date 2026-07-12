import * as THREE from "three";
import type { NpcDef } from "../data/npcs";
import { getGroundHeight } from "../world/height";

export function buildNpcMesh(def: NpcDef): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: def.colorHex, roughness: 0.5, metalness: 0.1 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.9), mat);
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);

  const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.6 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), headMat);
  head.position.y = 1.7;
  head.castShadow = true;
  group.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
    eye.position.set(side * 0.15, 1.72, 0.31);
    group.add(eye);
  }

  const armMat = mat;
  for (const side of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), armMat);
    arm.position.set(side * 0.58, 0.85, 0);
    arm.name = "arm";
    group.add(arm);
  }

  const markerMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), markerMat);
  marker.position.y = 2.5;
  marker.rotation.x = Math.PI;
  marker.name = "marker";
  group.add(marker);

  return group;
}

export class NpcInstance {
  group: THREE.Group;
  def: NpcDef;
  worldPos: THREE.Vector3;

  constructor(def: NpcDef, worldX: number, worldZ: number) {
    this.def = def;
    this.group = buildNpcMesh(def);
    const y = getGroundHeight(worldX, worldZ);
    this.worldPos = new THREE.Vector3(worldX, y, worldZ);
    this.group.position.copy(this.worldPos);
  }

  update(dt: number, hasContent: boolean) {
    const t = performance.now() * 0.001;
    this.group.position.y = this.worldPos.y + Math.sin(t * 1.5 + this.worldPos.x) * 0.02;
    for (const child of this.group.children) {
      if (child.name === "arm") {
        child.rotation.x = Math.sin(t * 1.2 + this.worldPos.z) * 0.08;
      }
      if (child.name === "marker") {
        child.visible = hasContent;
        child.position.y = 2.5 + Math.sin(t * 3) * 0.1;
        child.rotation.y += dt * 2;
      }
    }
  }
}
