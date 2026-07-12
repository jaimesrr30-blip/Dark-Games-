import { D, R, type RegionId } from "./regions";
import type { Rarity } from "./rarity";

export interface ChestSpawn {
  id: string;
  region: RegionId;
  pos: [number, number];
  minRarity: Rarity;
}

export interface PetSpawnPoint {
  id: string;
  region: RegionId;
  pos: [number, number];
}

export interface PortalDef {
  id: string;
  region: RegionId;
  pos: [number, number];
  targetRegion: RegionId;
  targetPos: [number, number];
  secret?: boolean;
  label: string;
}

export interface ArenaSpawn {
  id: string;
  region: RegionId;
  worldPos: [number, number];
  name: string;
  isBossArena: boolean;
}

function offset(region: RegionId, dx: number, dz: number): [number, number] {
  const centers: Record<RegionId, [number, number]> = {
    hub: [0, 0],
    ciudad: [D, 0],
    desierto: [D * 0.7, D * 0.7],
    bosque: [0, D],
    volcan: [-D * 0.7, D * 0.7],
    helado: [-D, 0],
    islas: [-D * 0.7, -D * 0.7],
    laboratorio: [0, -D],
    celestial: [D * 0.7, -D * 0.7],
  };
  const c = centers[region];
  return [c[0] + dx, c[1] + dz];
}

export const CHESTS: ChestSpawn[] = [
  { id: "chest_hub_1", region: "hub", pos: offset("hub", 60, -40), minRarity: "comun" },
  { id: "chest_hub_2", region: "hub", pos: offset("hub", -60, 50), minRarity: "pocoComun" },
  { id: "chest_ciudad_1", region: "ciudad", pos: offset("ciudad", 60, -60), minRarity: "raro" },
  { id: "chest_ciudad_2", region: "ciudad", pos: offset("ciudad", -80, 30), minRarity: "comun" },
  { id: "chest_ciudad_3", region: "ciudad", pos: offset("ciudad", 10, 100), minRarity: "epico" },
  { id: "chest_desierto_1", region: "desierto", pos: offset("desierto", 50, -40), minRarity: "raro" },
  { id: "chest_desierto_2", region: "desierto", pos: offset("desierto", -70, 60), minRarity: "legendario" },
  { id: "chest_bosque_1", region: "bosque", pos: offset("bosque", 40, 40), minRarity: "pocoComun" },
  { id: "chest_bosque_2", region: "bosque", pos: offset("bosque", -60, -30), minRarity: "epico" },
  { id: "chest_volcan_1", region: "volcan", pos: offset("volcan", 30, -50), minRarity: "legendario" },
  { id: "chest_helado_1", region: "helado", pos: offset("helado", -50, 60), minRarity: "raro" },
  { id: "chest_helado_2", region: "helado", pos: offset("helado", 70, -20), minRarity: "dios" },
  { id: "chest_islas_1", region: "islas", pos: offset("islas", 20, 20), minRarity: "epico" },
  { id: "chest_laboratorio_1", region: "laboratorio", pos: offset("laboratorio", -40, -60), minRarity: "secreto" },
  { id: "chest_celestial_1", region: "celestial", pos: offset("celestial", 0, 0), minRarity: "divino" },
];

export const PET_SPAWNS: PetSpawnPoint[] = [
  { id: "pet_hub_1", region: "hub", pos: offset("hub", 30, 30) },
  { id: "pet_ciudad_1", region: "ciudad", pos: offset("ciudad", -30, -60) },
  { id: "pet_desierto_1", region: "desierto", pos: offset("desierto", 60, 10) },
  { id: "pet_bosque_1", region: "bosque", pos: offset("bosque", 30, 60) },
  { id: "pet_bosque_2", region: "bosque", pos: offset("bosque", -50, 20) },
  { id: "pet_volcan_1", region: "volcan", pos: offset("volcan", -20, 40) },
  { id: "pet_helado_1", region: "helado", pos: offset("helado", 40, -40) },
  { id: "pet_islas_1", region: "islas", pos: offset("islas", -30, 10) },
  { id: "pet_laboratorio_1", region: "laboratorio", pos: offset("laboratorio", 50, -20) },
  { id: "pet_celestial_1", region: "celestial", pos: offset("celestial", 20, -20) },
];

export const PORTALS: PortalDef[] = [
  { id: "portal_hub_ciudad", region: "hub", pos: offset("hub", 90, -10), targetRegion: "ciudad", targetPos: offset("ciudad", -90, 0), label: "Ciudad Futurista" },
  { id: "portal_ciudad_hub", region: "ciudad", pos: offset("ciudad", -90, 0), targetRegion: "hub", targetPos: offset("hub", 90, -10), label: "Plaza Central" },
  { id: "portal_secreto_islas", region: "islas", pos: offset("islas", 90, 90), targetRegion: "celestial", targetPos: offset("celestial", -60, 60), secret: true, label: "??? " },
];

export const ARENAS: ArenaSpawn[] = [
  { id: "estadio_central", region: "hub", worldPos: offset("hub", 0, -110), name: "Estadio Central", isBossArena: false },
  { id: "estadio_galactico", region: "ciudad", worldPos: offset("ciudad", 0, -R * 0.55), name: "Estadio Galáctico", isBossArena: true },
  { id: "estadio_oasis", region: "desierto", worldPos: offset("desierto", 0, -R * 0.55), name: "Estadio del Oasis", isBossArena: true },
  { id: "estadio_bosque", region: "bosque", worldPos: offset("bosque", 0, -R * 0.55), name: "Estadio del Bosque", isBossArena: true },
  { id: "estadio_volcan", region: "volcan", worldPos: offset("volcan", 0, -R * 0.55), name: "Estadio del Volcán", isBossArena: true },
  { id: "estadio_glaciar", region: "helado", worldPos: offset("helado", 0, -R * 0.55), name: "Estadio Glaciar", isBossArena: true },
  { id: "estadio_cielo", region: "islas", worldPos: offset("islas", 0, -R * 0.55), name: "Estadio del Cielo", isBossArena: true },
  { id: "estadio_submarino", region: "laboratorio", worldPos: offset("laboratorio", 0, -R * 0.55), name: "Estadio Submarino", isBossArena: true },
  { id: "estadio_celestial", region: "celestial", worldPos: offset("celestial", 0, -R * 0.55), name: "Estadio Celestial", isBossArena: true },
];
