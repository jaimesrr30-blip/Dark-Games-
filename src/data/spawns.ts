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

  { id: "chest_escarlata_1", stage: "planeta_escarlata", pos: [520, 420], minRarity: "legendario" },
  { id: "chest_escarlata_2", stage: "planeta_escarlata", pos: [-560, -380], minRarity: "dios" },
  { id: "chest_escarlata_3", stage: "planeta_escarlata", pos: [780, -900], minRarity: "secreto" },

  { id: "chest_anillos_1", stage: "planeta_anillos", pos: [480, -360], minRarity: "legendario" },
  { id: "chest_anillos_2", stage: "planeta_anillos", pos: [-500, 420], minRarity: "dios" },
  { id: "chest_anillos_3", stage: "planeta_anillos", pos: [-820, 950], minRarity: "divino" },

  { id: "chest_cristal_1", stage: "planeta_cristal", pos: [460, 380], minRarity: "dios" },
  { id: "chest_cristal_2", stage: "planeta_cristal", pos: [-480, -400], minRarity: "divino" },
  { id: "chest_cristal_3", stage: "planeta_cristal", pos: [850, 920], minRarity: "prohibido" },
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

  { id: "pet_escarlata_1", stage: "planeta_escarlata", pos: [-300, 500] },
  { id: "pet_escarlata_2", stage: "planeta_escarlata", pos: [620, -200] },
  { id: "pet_anillos_1", stage: "planeta_anillos", pos: [340, 480] },
  { id: "pet_anillos_2", stage: "planeta_anillos", pos: [-620, -180] },
  { id: "pet_cristal_1", stage: "planeta_cristal", pos: [-340, 500] },
  { id: "pet_cristal_2", stage: "planeta_cristal", pos: [600, -220] },
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

// Cada planeta esconde 3 piezas de su propia nave local, muy repartidas por
// el mapa. Reconstruirla (con el mecánico del planeta) es lo que permite
// viajar al siguiente planeta, además de derrotar a su jefe.
export const PLANET_SHIP_PARTS: PuzzleButtonSpawn[] = [
  { id: "pieza_nave_escarlata_1", stage: "planeta_escarlata", pos: [-1500, -1150] },
  { id: "pieza_nave_escarlata_2", stage: "planeta_escarlata", pos: [1500, 1150] },
  { id: "pieza_nave_escarlata_3", stage: "planeta_escarlata", pos: [-1500, 1150] },

  { id: "pieza_nave_anillos_1", stage: "planeta_anillos", pos: [1500, -1150] },
  { id: "pieza_nave_anillos_2", stage: "planeta_anillos", pos: [-1500, 1150] },
  { id: "pieza_nave_anillos_3", stage: "planeta_anillos", pos: [1500, 1150] },

  { id: "pieza_nave_cristal_1", stage: "planeta_cristal", pos: [-1500, -1150] },
  { id: "pieza_nave_cristal_2", stage: "planeta_cristal", pos: [1500, -1150] },
  { id: "pieza_nave_cristal_3", stage: "planeta_cristal", pos: [1500, 1150] },
];

export function planetShipParts(stage: StageId): PuzzleButtonSpawn[] {
  return PLANET_SHIP_PARTS.filter((p) => p.stage === stage);
}
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

  { id: "secreto_escarlata", stage: "planeta_escarlata", pos: [-1200, -950], chestMinRarity: "secreto", rewardItemId: "turbo_marciano", coins: 1800 },
  { id: "secreto_anillos", stage: "planeta_anillos", pos: [1200, -950], chestMinRarity: "divino", rewardItemId: "balon_nebula", coins: 2000 },
  { id: "secreto_cristal", stage: "planeta_cristal", pos: [-1250, -980], chestMinRarity: "prohibido", rewardItemId: "estela_cristalina", coins: 2200 },
];

export interface HideoutSpawn {
  id: string;
  stage: StageId;
  pos: [number, number];
  enemyName: string;
  enemyColor: string;
  difficulty: number;
  rewardCoins: number;
  rewardItemId?: string;
}

// Una guarida escondida por etapa: entra, derrota al enemigo en un partido y
// consigue monedas (y a veces un objeto) como recompensa. Misión secundaria.
export const HIDEOUTS: HideoutSpawn[] = [
  { id: "guarida_hub", stage: "hub", pos: [560, -320], enemyName: "Matón Novato", enemyColor: "#8a8a8a", difficulty: 0.3, rewardCoins: 250 },
  { id: "guarida_ciudad", stage: "ciudad", pos: [700, 500], enemyName: "Pandillero Neón", enemyColor: "#ff2fd1", difficulty: 0.42, rewardCoins: 400, rewardItemId: "bocina_sirena" },
  { id: "guarida_desierto", stage: "desierto", pos: [-700, 550], enemyName: "Saqueador de Dunas", enemyColor: "#c98a3a", difficulty: 0.48, rewardCoins: 480 },
  { id: "guarida_bosque", stage: "bosque", pos: [700, -550], enemyName: "Cazador Furtivo", enemyColor: "#4a7c3f", difficulty: 0.54, rewardCoins: 560, rewardItemId: "estela_hojas" },
  { id: "guarida_volcan", stage: "volcan", pos: [-700, -550], enemyName: "Forajido de Magma", enemyColor: "#ff5500", difficulty: 0.6, rewardCoins: 640 },
  { id: "guarida_helado", stage: "helado", pos: [700, 550], enemyName: "Bandido de Escarcha", enemyColor: "#66e0ff", difficulty: 0.66, rewardCoins: 720, rewardItemId: "bocina_viento" },
  { id: "guarida_islas", stage: "islas", pos: [-700, -550], enemyName: "Pirata del Cielo", enemyColor: "#dfffea", difficulty: 0.72, rewardCoins: 800 },
  { id: "guarida_laboratorio", stage: "laboratorio", pos: [700, -550], enemyName: "Androide Rebelde", enemyColor: "#4dffe0", difficulty: 0.78, rewardCoins: 900, rewardItemId: "bocina_robot" },
  { id: "guarida_celestial", stage: "celestial", pos: [-700, 550], enemyName: "Centinela Caído", enemyColor: "#ffd76b", difficulty: 0.85, rewardCoins: 1100 },

  { id: "guarida_escarlata", stage: "planeta_escarlata", pos: [1200, 950], enemyName: "Renegado del Cañón", enemyColor: "#b33a1a", difficulty: 1.0, rewardCoins: 1300, rewardItemId: "gol_impacto_meteorito" },
  { id: "guarida_anillos", stage: "planeta_anillos", pos: [-1200, 950], enemyName: "Pirata de Kaion", enemyColor: "#9a6fd9", difficulty: 1.05, rewardCoins: 1450, rewardItemId: "antena_anillo" },
  { id: "guarida_cristal", stage: "planeta_cristal", pos: [1250, 980], enemyName: "Fragmento Corrupto", enemyColor: "#3fb8c9", difficulty: 1.1, rewardCoins: 1600, rewardItemId: "bocina_resonante" },
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
