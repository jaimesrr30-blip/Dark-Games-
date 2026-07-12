import { regionAt } from "../data/regions";

export interface RampDef {
  type: "ramp";
  x: number;
  z: number;
  width: number; // eje X local
  length: number; // eje Z local, dirección de la rampa
  height: number;
  rotationY: number; // radianes
}

export interface PlatformDef {
  type: "platform";
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

export type Structure = RampDef | PlatformDef;

export const STRUCTURES: Structure[] = [
  // Rampas y plataformas cerca del Hub para practicar saltos
  { type: "ramp", x: 40, z: 10, width: 12, length: 20, height: 6, rotationY: 0 },
  { type: "ramp", x: -40, z: 10, width: 12, length: 20, height: 5, rotationY: Math.PI },
  { type: "platform", x: 0, z: 60, width: 30, depth: 30, height: 4 },
  { type: "ramp", x: 0, z: 45, width: 16, length: 15, height: 4, rotationY: Math.PI },

  // Ciudad: atajos entre azoteas (plataformas elevadas)
  { type: "platform", x: 520 + 30, z: 40, width: 20, depth: 20, height: 5 },
  { type: "ramp", x: 520 + 30, z: 20, width: 14, length: 14, height: 5, rotationY: Math.PI },
  { type: "platform", x: 520 - 40, z: -30, width: 18, depth: 18, height: 6 },

  // Desierto: dunas-rampa hacia ruinas
  { type: "ramp", x: 520 * 0.7 + 50, z: 520 * 0.7 - 20, width: 20, length: 25, height: 7, rotationY: 0.4 },

  // Volcán: plataformas sobre lava
  { type: "platform", x: -520 * 0.7, z: 520 * 0.7 + 40, width: 16, depth: 16, height: 3 },
  { type: "platform", x: -520 * 0.7 + 30, z: 520 * 0.7 + 30, width: 14, depth: 14, height: 3 },

  // Islas flotantes: plataformas grandes (la "isla" en sí)
  { type: "platform", x: -520 * 0.7, z: -520 * 0.7, width: 90, depth: 90, height: 8 },
  { type: "platform", x: -520 * 0.7 + 100, z: -520 * 0.7 + 40, width: 40, depth: 40, height: 10 },
];

function baseNoise(x: number, z: number, amp: number): number {
  return (
    Math.sin(x * 0.02) * Math.cos(z * 0.02) * amp * 0.5 +
    Math.sin(x * 0.055 + 1.7) * Math.sin(z * 0.055) * amp * 0.3
  );
}

export function getGroundHeight(x: number, z: number): number {
  const region = regionAt(x, z);
  const amp = region.id === "hub" ? 0.8 : region.id === "islas" ? 0.5 : 1.6;
  let h = baseNoise(x, z, amp);

  for (const s of STRUCTURES) {
    if (s.type === "platform") {
      const hw = s.width / 2;
      const hd = s.depth / 2;
      if (x > s.x - hw && x < s.x + hw && z > s.z - hd && z < s.z + hd) {
        h = Math.max(h, s.height);
      }
    } else if (s.type === "ramp") {
      const dx = x - s.x;
      const dz = z - s.z;
      const cos = Math.cos(-s.rotationY);
      const sin = Math.sin(-s.rotationY);
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      const hw = s.width / 2;
      if (lx > -hw && lx < hw && lz > 0 && lz < s.length) {
        const t = lz / s.length; // 0 en la base, 1 en la cima
        h = Math.max(h, t * s.height);
      }
    }
  }
  return h;
}

export function isInsideStructureFootprint(x: number, z: number): boolean {
  for (const s of STRUCTURES) {
    if (s.type === "platform") {
      const hw = s.width / 2;
      const hd = s.depth / 2;
      if (x > s.x - hw && x < s.x + hw && z > s.z - hd && z < s.z + hd) return true;
    }
  }
  return false;
}
