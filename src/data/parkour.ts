import type { StageId } from "./stages";

// Los mundos de espacio profundo ya no reparten sus llaves con partidos:
// hay que sobrevivir a un desafío de parkour donde un solo error mata.
export type ParkourKind = "plataformas" | "compuertas" | "laseres";

export interface VoidBand {
  minY: number;
  maxY: number;
  platX0: number;
  platX1: number;
  collapseAfter: number; // segundos de pie sobre la plataforma antes de que colapse
}

export interface GateHazard {
  y: number;
  h: number;
  period: number; // segundos de un ciclo completo abierta+cerrada
  phase: number;
}

export interface LaserHazard {
  pivot: [number, number];
  length: number;
  angularSpeed: number; // rad/s
  phase: number;
}

export interface ParkourChallenge {
  id: string;
  stage: StageId;
  guardianId: string;
  kind: ParkourKind;
  keyId: string;
  name: string;
  introLine: string;
  warnLine: string;
  successLine: string;
  deathLine: string;
  width: number;
  height: number;
  spawnPos: [number, number];
  goalPos: [number, number];
  bands?: VoidBand[];
  gates?: GateHazard[];
  lasers?: LaserHazard[];
  collectibleId?: string;
  collectiblePos?: [number, number];
  collectibleLabel?: string;
  collectibleReward?: number;
}

export const PARKOUR_CHALLENGES: ParkourChallenge[] = [
  {
    id: "parkour_estacion_1",
    stage: "estacion_oxido",
    guardianId: "centinela_colapso",
    kind: "plataformas",
    keyId: "key_estacion_oxido_1",
    name: "El Puente Colapsado",
    introLine: "Estas plataformas llevan siglos oxidándose. Aguantan tu peso... dos segundos. Ni uno más.",
    warnLine: "¡Cuidado! Cada plataforma colapsa 2 segundos después de pisarla. Si te quedas encima, caes al vacío.",
    successLine: "¡Cruzaste sin caer! Toma, te la has ganado de verdad.",
    deathLine: "La plataforma cedió bajo tus ruedas... caíste al vacío de la estación.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    bands: [
      { minY: 430, maxY: 520, platX0: -70, platX1: 70, collapseAfter: 2 },
      { minY: 190, maxY: 280, platX0: 120, platX1: 260, collapseAfter: 2 },
      { minY: -50, maxY: 40, platX0: -260, platX1: -120, collapseAfter: 2 },
      { minY: -290, maxY: -200, platX0: -70, platX1: 70, collapseAfter: 2 },
      { minY: -530, maxY: -440, platX0: 110, platX1: 250, collapseAfter: 2 },
    ],
    collectibleId: "parkour_estacion_nucleo_1",
    collectiblePos: [350, 350],
    collectibleLabel: "Núcleo de energía perdido",
    collectibleReward: 400,
  },
  {
    id: "parkour_estacion_2",
    stage: "estacion_oxido",
    guardianId: "tecnico_esclusa",
    kind: "compuertas",
    keyId: "key_estacion_oxido_2",
    name: "Compuertas de Vacío Sincronizadas",
    introLine: "Cinco esclusas separan este pasillo del vacío exterior. Se abren y cierran solas. Cronométrate bien.",
    warnLine: "¡Cuidado! Si una compuerta se cierra encima tuya, te despresuriza al instante.",
    successLine: "¡Cronometraste las cinco esclusas a la perfección! Aquí tienes la llave.",
    deathLine: "Una compuerta se cerró justo encima de ti. El vacío no perdona.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    gates: [
      { y: 430, h: 60, period: 2.6, phase: 0 },
      { y: 230, h: 60, period: 3.0, phase: 1.0 },
      { y: 20, h: 60, period: 2.4, phase: 0.6 },
      { y: -190, h: 60, period: 3.2, phase: 2.0 },
      { y: -410, h: 60, period: 2.8, phase: 1.4 },
    ],
  },
  {
    id: "parkour_estacion_3",
    stage: "estacion_oxido",
    guardianId: "vigia_laser",
    kind: "laseres",
    keyId: "key_estacion_oxido_3",
    name: "Sala de Láseres Rotatorios",
    introLine: "Los láseres de seguridad todavía funcionan. Nunca se apagaron. Encuentra el hueco entre ellos.",
    warnLine: "¡Cuidado! Tocar un láser en movimiento es letal al instante.",
    successLine: "Ni un rasguño. El Custodio Corroído estará orgulloso. Toma la llave.",
    deathLine: "Un haz te alcanzó de lleno. No sentiste nada... y todo se apagó.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    lasers: [
      { pivot: [0, 400], length: 260, angularSpeed: 1.4, phase: 0 },
      { pivot: [-220, 130], length: 320, angularSpeed: -1.1, phase: 1.0 },
      { pivot: [220, -110], length: 320, angularSpeed: 1.3, phase: 2.0 },
      { pivot: [0, -380], length: 300, angularSpeed: -1.6, phase: 0.5 },
    ],
  },
];

export function parkourForGuardian(guardianId: string): ParkourChallenge | undefined {
  return PARKOUR_CHALLENGES.find((p) => p.guardianId === guardianId);
}

export function parkourChallengesForStage(stage: StageId): ParkourChallenge[] {
  return PARKOUR_CHALLENGES.filter((p) => p.stage === stage);
}
