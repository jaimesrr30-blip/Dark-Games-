import type { StageId } from "./stages";

// Monstruos sueltos que aparecen en El Umbral: solo se cazan con un arma
// equipada y balas en la mochila. Reaparecen tras un tiempo real desde que
// se matan (no son coleccionables de una sola vez, son una amenaza fija).
export interface MonsterSpawn {
  id: string;
  stage: StageId;
  pos: [number, number];
  name: string;
  color: string;
  maxHp: number;
  rewardCoins: number;
  rewardXp: number;
  respawnMs: number;
}

export const MONSTERS: MonsterSpawn[] = [
  { id: "monstruo_umbral_1", stage: "el_umbral", pos: [500, 300], name: "Rastro Corrupto", color: "#7a3fae", maxHp: 30, rewardCoins: 90, rewardXp: 25, respawnMs: 45_000 },
  { id: "monstruo_umbral_2", stage: "el_umbral", pos: [-500, -300], name: "Errante del Vacío", color: "#3f7aae", maxHp: 60, rewardCoins: 200, rewardXp: 50, respawnMs: 60_000 },
  { id: "monstruo_umbral_3", stage: "el_umbral", pos: [500, -400], name: "Devorador de Ecos", color: "#ae3f5a", maxHp: 100, rewardCoins: 380, rewardXp: 95, respawnMs: 90_000 },
];

export function monstersForStage(stage: StageId): MonsterSpawn[] {
  return MONSTERS.filter((m) => m.stage === stage);
}
