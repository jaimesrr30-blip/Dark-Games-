import * as THREE from "three";
import { CHESTS, PET_SPAWNS, PORTALS } from "../data/spawns";
import { RARITIES, rollRarity, type Rarity } from "../data/rarity";
import { rollNewPet } from "../data/pets";
import { getGroundHeight } from "./height";
import type { GameState } from "../state/GameState";

export type InteractableKind = "chest" | "pet" | "portal";

export interface Interactable {
  id: string;
  kind: InteractableKind;
  object3d: THREE.Object3D;
  promptLabel: string;
  isAvailable(gs: GameState): boolean;
  interact(gs: GameState): InteractResult;
  update?(dt: number, playerPos: THREE.Vector3): void;
}

export interface InteractResult {
  type: InteractableKind;
  message: string;
  rarity?: Rarity;
}

function chestMesh(minRarityColor: number): THREE.Object3D {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x5a3d22, roughness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1), baseMat);
  base.position.y = 0.45;
  group.add(base);
  const lidMat = new THREE.MeshStandardMaterial({ color: minRarityColor, emissive: minRarityColor, emissiveIntensity: 0.5, roughness: 0.4 });
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.35, 1.05), lidMat);
  lid.position.y = 1.05;
  lid.name = "lid";
  group.add(lid);
  group.castShadow = true;
  return group;
}

function petPickupMesh(): THREE.Object3D {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x99ccff, emissiveIntensity: 0.8, roughness: 0.3 });
  const shape = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), mat);
  shape.name = "shape";
  group.add(shape);
  return group;
}

function portalMesh(color: number): THREE.Object3D {
  const group = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.28, 12, 24), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 2.2;
  group.add(ring);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  disc.rotation.x = Math.PI / 2;
  disc.position.y = 2.2;
  group.add(disc);
  const glow = new THREE.PointLight(color, 1.6, 10);
  glow.position.y = 2.2;
  group.add(glow);
  return group;
}

export function buildInteractables(scene: THREE.Scene, gs: GameState): Interactable[] {
  const list: Interactable[] = [];

  for (const c of CHESTS) {
    const color = RARITIES[c.minRarity].color;
    const colorNum = parseInt(color.replace("#", "0x"), 16);
    const mesh = chestMesh(colorNum);
    const y = getGroundHeight(c.pos[0], c.pos[1]);
    mesh.position.set(c.pos[0], y, c.pos[1]);
    scene.add(mesh);
    list.push({
      id: c.id,
      kind: "chest",
      object3d: mesh,
      promptLabel: "Abrir cofre",
      isAvailable: (g) => !g.data.chests.collected[c.id],
      interact: (g) => {
        g.collectChest(c.id);
        mesh.visible = false;
        const rarity = rollRarity();
        const rarityInfo = RARITIES[rarity];
        const monedas = 50 + rarityInfo.order * 60;
        g.addCurrency(monedas, rarityInfo.order >= 5 ? Math.round(rarityInfo.order * 1.5) : 0);
        g.notifyEvent("recogerCofres", c.region, 1);
        return { type: "chest", message: `Cofre abierto: +${monedas} monedas (calidad ${rarityInfo.label})`, rarity };
      },
      update(dt) {
        mesh.rotation.y += dt * 0.4;
      },
    });
  }

  for (const p of PET_SPAWNS) {
    const mesh = petPickupMesh();
    const baseY = getGroundHeight(p.pos[0], p.pos[1]) + 1.1;
    mesh.position.set(p.pos[0], baseY, p.pos[1]);
    scene.add(mesh);
    list.push({
      id: p.id,
      kind: "pet",
      object3d: mesh,
      promptLabel: "Recoger mascota",
      isAvailable: (g) => !g.data.petsCollected[p.id],
      interact: (g) => {
        g.collectPetSpawn(p.id);
        mesh.visible = false;
        const pet = rollNewPet();
        g.addPet(pet);
        g.notifyEvent("recogerMascotas", p.region, 1);
        return { type: "pet", message: `¡Nueva mascota! Rareza: ${RARITIES[pet.rarity].label}`, rarity: pet.rarity };
      },
      update(dt) {
        mesh.rotation.y += dt * 1.2;
        mesh.position.y = baseY + Math.sin(performance.now() * 0.003 + mesh.id) * 0.3;
      },
    });
  }

  for (const port of PORTALS) {
    const color = port.secret ? 0xff2fd1 : 0x66ccff;
    const mesh = portalMesh(color);
    const y = getGroundHeight(port.pos[0], port.pos[1]);
    mesh.position.set(port.pos[0], y, port.pos[1]);
    if (port.secret) mesh.visible = false;
    scene.add(mesh);
    list.push({
      id: port.id,
      kind: "portal",
      object3d: mesh,
      promptLabel: `Viajar a ${port.label}`,
      isAvailable: () => mesh.visible,
      interact: (g) => {
        if (port.secret) g.discoverSecret(port.id);
        return { type: "portal", message: `Viajando a ${port.label}...` };
      },
      update(dt, playerPos) {
        const ring = mesh.children[0];
        ring.rotation.z += dt * 0.6;
        if (port.secret && !mesh.visible) {
          const dx = playerPos.x - mesh.position.x;
          const dz = playerPos.z - mesh.position.z;
          if (dx * dx + dz * dz < 30 * 30) mesh.visible = true;
        }
      },
    });
  }

  return list;
}
