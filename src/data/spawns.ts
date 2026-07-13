import type { Rarity } from "./rarity";
import type { StageId } from "./stages";
import { STAGES } from "./stages";

export interface ChestSpawn {
  id: string;
  stage: StageId;
  pos: [number, number];
  minRarity: Rarity;
}

export interface PetSpawnPoint {
  id: string;
  stage: StageId;
  pos: [number, number];
}

export const CHESTS: ChestSpawn[] = [
  { id: "chest_hub_1", stage: "hub", pos: [220, 120], minRarity: "comun" },

  { id: "chest_ciudad_1", stage: "ciudad", pos: [420, -260], minRarity: "raro" },
  { id: "chest_ciudad_2", stage: "ciudad", pos: [-360, 300], minRarity: "comun" },

  { id: "chest_desierto_1", stage: "desierto", pos: [380, 280], minRarity: "raro" },
  { id: "chest_desierto_2", stage: "desierto", pos: [-420, -220], minRarity: "legendario" },

  { id: "chest_bosque_1", stage: "bosque", pos: [340, 260], minRarity: "pocoComun" },
  { id: "chest_bosque_2", stage: "bosque", pos: [-380, -260], minRarity: "epico" },

  { id: "chest_volcan_1", stage: "volcan", pos: [360, -280], minRarity: "legendario" },
  { id: "chest_volcan_2", stage: "volcan", pos: [-320, 240], minRarity: "raro" },

  { id: "chest_helado_1", stage: "helado", pos: [-380, 260], minRarity: "raro" },
  { id: "chest_helado_2", stage: "helado", pos: [400, -200], minRarity: "dios" },

  { id: "chest_islas_1", stage: "islas", pos: [260, 220], minRarity: "epico" },
  { id: "chest_islas_2", stage: "islas", pos: [-300, -240], minRarity: "raro" },

  { id: "chest_laboratorio_1", stage: "laboratorio", pos: [-360, -260], minRarity: "secreto" },
  { id: "chest_laboratorio_2", stage: "laboratorio", pos: [320, 240], minRarity: "epico" },

  { id: "chest_celestial_1", stage: "celestial", pos: [0, 0], minRarity: "divino" },
  { id: "chest_celestial_2", stage: "celestial", pos: [-300, -180], minRarity: "prohibido" },
];

export const PET_SPAWNS: PetSpawnPoint[] = [
  { id: "pet_hub_1", stage: "hub", pos: [-260, -160] },
  { id: "pet_ciudad_1", stage: "ciudad", pos: [-260, -300] },
  { id: "pet_desierto_1", stage: "desierto", pos: [300, 100] },
  { id: "pet_bosque_1", stage: "bosque", pos: [200, 300] },
  { id: "pet_bosque_2", stage: "bosque", pos: [-300, 60] },
  { id: "pet_volcan_1", stage: "volcan", pos: [-140, 300] },
  { id: "pet_helado_1", stage: "helado", pos: [280, -300] },
  { id: "pet_islas_1", stage: "islas", pos: [-200, 100] },
  { id: "pet_laboratorio_1", stage: "laboratorio", pos: [300, -100] },
  { id: "pet_islas_2", stage: "islas", pos: [180, -260] },
  { id: "pet_celestial_1", stage: "celestial", pos: [180, -160] },
];

export interface PuzzleButtonSpawn {
  id: string;
  stage: StageId;
  pos: [number, number];
}

// Los 3 botones de piedra escondidos en el Desierto Solar: llévalos a la
// pirámide (junto al Custodio de la Pirámide) para conseguir la tercera llave.
export const PYRAMID_BUTTONS: PuzzleButtonSpawn[] = [
  { id: "boton_piramide_1", stage: "desierto", pos: [-180, -520] },
  { id: "boton_piramide_2", stage: "desierto", pos: [780, 200] },
  { id: "boton_piramide_3", stage: "desierto", pos: [-780, 500] },
];

export function pyramidPos(): [number, number] {
  return [420, -480];
}

// Las 4 piezas del cohete escondidas en el Reino Celestial. El motor lo suelta
// el Campeón Eterno al ser derrotado.
export const ROCKET_PARTS: PuzzleButtonSpawn[] = [
  { id: "pieza_cohete_1", stage: "celestial", pos: [350, 350] },
  { id: "pieza_cohete_2", stage: "celestial", pos: [-450, 250] },
  { id: "pieza_cohete_3", stage: "celestial", pos: [550, -250] },
  { id: "pieza_cohete_4", stage: "celestial", pos: [-550, -100] },
];
export const ROCKET_ENGINE_ID = "motor_cohete";

export interface SecretDoorSpawn {
  id: string;
  stage: StageId;
  pos: [number, number];
  chestMinRarity: Rarity;
  rewardItemId: string;
  coins: number;
}

// Una puerta secreta escondida por etapa. Al entrar, el jugador aparece en un
// pequeño interior con un cofre bonus de objetos para el garaje/inventario.
export const SECRET_DOORS: SecretDoorSpawn[] = [
  { id: "secreto_hub", stage: "hub", pos: [-560, 380], chestMinRarity: "raro", rewardItemId: "estela_humo", coins: 300 },
  { id: "secreto_ciudad", stage: "ciudad", pos: [-900, 0], chestMinRarity: "epico", rewardItemId: "bocina_epica", coins: 500 },
  { id: "secreto_desierto", stage: "desierto", pos: [900, -600], chestMinRarity: "epico", rewardItemId: "rueda_celestial", coins: 600 },
  { id: "secreto_bosque", stage: "bosque", pos: [-900, -600], chestMinRarity: "legendario", rewardItemId: "antena_cristal", coins: 700 },
  { id: "secreto_volcan", stage: "volcan", pos: [900, 600], chestMinRarity: "legendario", rewardItemId: "turbo_omega", coins: 800 },
  { id: "secreto_helado", stage: "helado", pos: [-900, 600], chestMinRarity: "dios", rewardItemId: "estela_estrellas", coins: 900 },
  { id: "secreto_islas", stage: "islas", pos: [900, 600], chestMinRarity: "dios", rewardItemId: "color_prohibido", coins: 1000 },
  { id: "secreto_laboratorio", stage: "laboratorio", pos: [-900, 600], chestMinRarity: "secreto", rewardItemId: "gol_supernova", coins: 1200 },
  { id: "secreto_celestial", stage: "celestial", pos: [900, 600], chestMinRarity: "divino", rewardItemId: "color_sangre_divina", coins: 1500 },
];

// Punto de entrada al jugar la etapa (siempre cerca del borde inferior).
export function stageSpawnPoint(stage: StageId): [number, number] {
  const s = STAGES[stage];
  return [0, s.height / 2 - 130];
}

// Puerta del jefe: al fondo de la etapa, bloqueada hasta cumplir los requisitos.
export function stageBossGate(stage: StageId): [number, number] {
  const s = STAGES[stage];
  return [0, -s.height / 2 + 130];
}

// Campo de entrenamiento (partido normal, siempre disponible).
export function stageTrainingField(stage: StageId): [number, number] {
  const s = STAGES[stage];
  return [s.width / 2 - 220, 0];
}
