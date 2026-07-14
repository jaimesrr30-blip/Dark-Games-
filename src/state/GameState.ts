import type { OwnedPet } from "../data/pets";
import type { StageId } from "../data/stages";
import { nextInProgression, PLANET_ORDER } from "../data/stages";
import { MISSIONS, type MissionDef } from "../data/missions";
import { ITEMS } from "../data/items";
import { guardiansForStage } from "../data/npcs";

export interface MissionProgress {
  missionId: string;
  progress: number[];
  completed: boolean;
}

export interface ChestState {
  collected: Record<string, boolean>;
}

export interface SaveData {
  version: number;
  playerName: string;
  monedas: number;
  diamantes: number;
  xp: number;
  level: number;
  ownedItems: string[];
  equipped: Record<string, string>;
  carColor: string;
  unlockedStages: StageId[];
  defeatedBosses: StageId[];
  missions: Record<string, MissionProgress>;
  activeMissionId: string | null;
  pets: OwnedPet[];
  activePetUid: string | null;
  chests: ChestState;
  petsCollected: Record<string, boolean>;
  discoveredSecrets: Record<string, boolean>;
  keysCollected: Record<string, boolean>;
  puzzleItemsCollected: Record<string, boolean>;
  hideoutsDefeated: Record<string, boolean>;
  zonesUnlocked: Record<string, boolean>;
  planetShipsBuilt: Record<string, boolean>;
  stellarFuel: number;
  goalsScored: number;
  matchesWon: number;
  currentStage: StageId;
  playerPos: [number, number] | null;
}

const SAVE_KEY = "cubo_pilot_2d_save_v1";

function defaultSave(): SaveData {
  return {
    version: 2,
    playerName: "Piloto",
    monedas: 500,
    diamantes: 20,
    xp: 0,
    level: 1,
    ownedItems: ["color_blanco", "rueda_estandar", "turbo_basico", "gol_confeti", "bocina_clasica", "antena_ninguna", "estela_ninguna", "balon_clasico", "titulo_novato"],
    equipped: {
      color: "color_blanco",
      rueda: "rueda_estandar",
      turbo: "turbo_basico",
      explosionGol: "gol_confeti",
      bocina: "bocina_clasica",
      antena: "antena_ninguna",
      estela: "estela_ninguna",
      balon: "balon_clasico",
      titulo: "titulo_novato",
    },
    carColor: "#f2f2f2",
    unlockedStages: ["hub", "ciudad"],
    defeatedBosses: [],
    missions: {},
    activeMissionId: "m_intro",
    pets: [],
    activePetUid: null,
    chests: { collected: {} },
    petsCollected: {},
    discoveredSecrets: {},
    keysCollected: {},
    puzzleItemsCollected: {},
    hideoutsDefeated: {},
    zonesUnlocked: {},
    planetShipsBuilt: {},
    stellarFuel: 0,
    goalsScored: 0,
    matchesWon: 0,
    currentStage: "hub",
    playerPos: null,
  };
}

export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

type Listener = () => void;

export class GameState {
  data: SaveData;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        return { ...defaultSave(), ...parsed };
      }
    } catch (e) {
      console.warn("No se pudo cargar la partida guardada", e);
    }
    return defaultSave();
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("No se pudo guardar la partida", e);
    }
  }

  resetSave() {
    this.data = defaultSave();
    this.save();
    this.emit();
  }

  onChange(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    for (const l of this.listeners) l();
  }

  // ---------- Economía ----------
  addCurrency(monedas: number, diamantes = 0) {
    this.data.monedas = Math.max(0, this.data.monedas + monedas);
    this.data.diamantes = Math.max(0, this.data.diamantes + diamantes);
    this.save();
    this.emit();
  }

  canAfford(price: number, currency: "monedas" | "diamantes"): boolean {
    return this.data[currency] >= price;
  }

  spend(price: number, currency: "monedas" | "diamantes"): boolean {
    if (!this.canAfford(price, currency)) return false;
    this.data[currency] -= price;
    this.save();
    this.emit();
    return true;
  }

  addXp(amount: number) {
    this.data.xp += amount;
    let leveledUp = false;
    while (this.data.xp >= xpForLevel(this.data.level)) {
      this.data.xp -= xpForLevel(this.data.level);
      this.data.level += 1;
      leveledUp = true;
    }
    this.save();
    this.emit();
    return leveledUp;
  }

  // ---------- Inventario / equipo ----------
  ownsItem(id: string): boolean {
    return this.data.ownedItems.includes(id);
  }

  grantItem(id: string) {
    if (!this.ownsItem(id)) {
      this.data.ownedItems.push(id);
      this.save();
      this.emit();
    }
  }

  buyItem(id: string): boolean {
    const item = ITEMS.find((i) => i.id === id);
    if (!item || this.ownsItem(id)) return false;
    if (!this.spend(item.price, item.currency)) return false;
    this.grantItem(id);
    return true;
  }

  equip(slot: string, itemId: string) {
    if (!this.ownsItem(itemId)) return;
    this.data.equipped[slot] = itemId;
    if (slot === "color") {
      const item = ITEMS.find((i) => i.id === itemId);
      if (item?.colorHex !== undefined) this.data.carColor = item.colorHex;
    }
    this.save();
    this.emit();
  }

  // ---------- Etapas / jefes ----------
  isStageUnlocked(id: StageId): boolean {
    return this.data.unlockedStages.includes(id);
  }

  unlockStage(id: StageId) {
    if (!this.isStageUnlocked(id)) {
      this.data.unlockedStages.push(id);
      this.save();
      this.emit();
    }
  }

  defeatBoss(stage: StageId) {
    if (!this.data.defeatedBosses.includes(stage)) {
      this.data.defeatedBosses.push(stage);
      // En los planetas, el siguiente no se desbloquea solo por ganar al jefe:
      // hace falta además reconstruir la nave local con sus piezas escondidas.
      if (!(PLANET_ORDER as StageId[]).includes(stage)) {
        const next = nextInProgression(stage);
        if (next && !this.isStageUnlocked(next)) this.data.unlockedStages.push(next);
      }
      this.save();
      this.emit();
    }
  }

  isBossDefeated(stage: StageId): boolean {
    return this.data.defeatedBosses.includes(stage);
  }

  // ---------- Llaves de los guardianes ----------
  hasKey(keyId: string): boolean {
    return !!this.data.keysCollected[keyId];
  }

  grantKey(keyId: string) {
    if (!this.hasKey(keyId)) {
      this.data.keysCollected[keyId] = true;
      this.save();
      this.emit();
      this.notifyEvent("obtenerLlave", keyId, 1);
    }
  }

  // progreso hacia desbloquear la puerta del jefe de una etapa (3 llaves de guardianes)
  stageKeysStatus(stage: StageId) {
    const guardians = guardiansForStage(stage);
    const have = guardians.filter((g) => g.guardian && this.hasKey(g.guardian.keyId)).length;
    const required = guardians.length;
    return { have, required, ready: required > 0 && have >= required };
  }

  setPlayerLocation(stage: StageId, pos: [number, number]) {
    this.data.currentStage = stage;
    this.data.playerPos = pos;
    this.save();
  }

  // ---------- Misiones ----------
  getMissionProgress(id: string): MissionProgress {
    if (!this.data.missions[id]) {
      const def = MISSIONS.find((m) => m.id === id);
      this.data.missions[id] = {
        missionId: id,
        progress: def ? def.objectives.map(() => 0) : [],
        completed: false,
      };
    }
    return this.data.missions[id];
  }

  isMissionAvailable(def: MissionDef): boolean {
    if (def.hidden && !this.data.discoveredSecrets[def.id]) return false;
    if (def.requires) {
      for (const r of def.requires) {
        if (!this.getMissionProgress(r).completed) return false;
      }
    }
    return true;
  }

  progressMission(missionId: string, objectiveIndex: number, amount = 1) {
    const def = MISSIONS.find((m) => m.id === missionId);
    if (!def) return;
    const prog = this.getMissionProgress(missionId);
    if (prog.completed) return;
    prog.progress[objectiveIndex] = Math.min(
      def.objectives[objectiveIndex].count,
      (prog.progress[objectiveIndex] ?? 0) + amount
    );
    const allDone = def.objectives.every((obj, i) => prog.progress[i] >= obj.count);
    if (allDone) {
      prog.completed = true;
      this.addCurrency(def.rewardMonedas, def.rewardDiamantes);
      this.addXp(def.rewardXp);
      if (def.rewardFuel) this.addFuel(def.rewardFuel);
    }
    this.save();
    this.emit();
  }

  notifyEvent(type: string, target: string, amount = 1) {
    for (const def of MISSIONS) {
      const prog = this.getMissionProgress(def.id);
      if (prog.completed) continue;
      if (!this.isMissionAvailable(def)) continue;
      def.objectives.forEach((obj, i) => {
        if (obj.type !== type) return;
        if (obj.target !== target && obj.target !== "any") return;
        this.progressMission(def.id, i, amount);
      });
    }
  }

  // ---------- Cofres / mascotas / secretos ----------
  collectChest(id: string) {
    if (this.data.chests.collected[id]) return false;
    this.data.chests.collected[id] = true;
    this.save();
    this.emit();
    return true;
  }

  collectPetSpawn(id: string) {
    if (this.data.petsCollected[id]) return false;
    this.data.petsCollected[id] = true;
    this.save();
    this.emit();
    return true;
  }

  hasPuzzleItem(id: string): boolean {
    return !!this.data.puzzleItemsCollected[id];
  }

  collectPuzzleItem(id: string) {
    if (this.data.puzzleItemsCollected[id]) return false;
    this.data.puzzleItemsCollected[id] = true;
    this.save();
    this.emit();
    return true;
  }

  countPuzzleItems(ids: string[]): number {
    return ids.filter((id) => this.hasPuzzleItem(id)).length;
  }

  // ---------- Zonas de guardián (puentes/generadores/altares) ----------
  isZoneUnlocked(id: string): boolean {
    return !!this.data.zonesUnlocked[id];
  }

  unlockZone(id: string) {
    if (this.data.zonesUnlocked[id]) return false;
    this.data.zonesUnlocked[id] = true;
    this.save();
    this.emit();
    return true;
  }

  // ---------- Naves locales de cada planeta ----------
  isPlanetShipBuilt(stage: string): boolean {
    return !!this.data.planetShipsBuilt[stage];
  }

  buildPlanetShip(stage: string) {
    if (this.data.planetShipsBuilt[stage]) return false;
    this.data.planetShipsBuilt[stage] = true;
    this.save();
    this.emit();
    return true;
  }

  addFuel(amount: number) {
    this.data.stellarFuel += amount;
    this.save();
    this.emit();
  }

  spendFuel(amount: number): boolean {
    if (this.data.stellarFuel < amount) return false;
    this.data.stellarFuel -= amount;
    this.save();
    this.emit();
    return true;
  }

  // ---------- Vender mascotas ----------
  sellPet(uid: string, coins: number): boolean {
    const idx = this.data.pets.findIndex((p) => p.uid === uid);
    if (idx === -1) return false;
    this.data.pets.splice(idx, 1);
    if (this.data.activePetUid === uid) {
      this.data.activePetUid = this.data.pets[0]?.uid ?? null;
    }
    this.addCurrency(coins, 0);
    this.save();
    this.emit();
    this.notifyEvent("venderMascota", "any", 1);
    return true;
  }

  addPet(pet: OwnedPet) {
    this.data.pets.push(pet);
    if (!this.data.activePetUid) this.data.activePetUid = pet.uid;
    this.save();
    this.emit();
  }

  setActivePet(uid: string | null) {
    this.data.activePetUid = uid;
    this.save();
    this.emit();
  }

  getActivePet(): OwnedPet | undefined {
    return this.data.pets.find((p) => p.uid === this.data.activePetUid);
  }

  discoverSecret(id: string) {
    if (this.data.discoveredSecrets[id]) return false;
    this.data.discoveredSecrets[id] = true;
    this.save();
    this.emit();
    this.notifyEvent("descubrirSecreto", id, 1);
    return true;
  }

  isHideoutDefeated(id: string): boolean {
    return !!this.data.hideoutsDefeated[id];
  }

  defeatHideout(id: string) {
    if (this.data.hideoutsDefeated[id]) return false;
    this.data.hideoutsDefeated[id] = true;
    this.save();
    this.emit();
    this.notifyEvent("derrotarEnemigo", id, 1);
    return true;
  }

  recordGoal() {
    this.data.goalsScored += 1;
    this.notifyEvent("marcarGoles", "any", 1);
    this.save();
    this.emit();
  }

  recordMatchWin(fieldId: string) {
    this.data.matchesWon += 1;
    this.notifyEvent("ganarPartido", fieldId, 1);
    this.notifyEvent("ganarPartido", "any", 1);
    this.save();
    this.emit();
  }
}
