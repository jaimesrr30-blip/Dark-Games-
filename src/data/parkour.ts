import type { StageId } from "./stages";

// Los mundos de espacio profundo ya no reparten sus llaves con partidos:
// hay que sobrevivir a un desafío de parkour donde un solo error mata.
export type ParkourKind = "plataformas" | "compuertas" | "laseres" | "saltos";

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

// Un hueco que solo se cruza saltando: pulsa el salto dentro de la "pista de
// despegue" (los últimos `runway` px antes del vacío) y aterrizas a salvo en
// `landingY`. Caminar dentro del hueco sin saltar es una caída mortal.
export interface JumpGap {
  minY: number;
  maxY: number;
  runway: number;
  landingY: number;
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
  jumps?: JumpGap[];
  collectibleId?: string;
  collectiblePos?: [number, number];
  collectibleLabel?: string;
  collectibleReward?: number;
  // Reskin visual opcional para que cada mundo se sienta distinto aunque
  // reutilice el mismo motor de peligros. Por defecto usa el óxido original.
  accentColor?: string;
  bgColor?: string;
  floorColor?: string;
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

  // ---------------- Cinturón de Asteroides Fracturado ----------------
  {
    id: "parkour_asteroides_1",
    stage: "cinturon_asteroides",
    guardianId: "piloto_saltador",
    kind: "saltos",
    keyId: "key_cinturon_asteroides_1",
    name: "Saltos entre Rocas a la Deriva",
    introLine: "No hay puente entre estas rocas. Toma carrerilla y salta en el momento justo, o cae para siempre.",
    warnLine: "¡Cuidado! Pulsa ESPACIO cerca del borde para saltar. Si caminas dentro del hueco sin saltar, caes al vacío.",
    successLine: "¡Cuatro saltos perfectos! Aquí tienes la llave, piloto ágil.",
    deathLine: "Calculaste mal el salto... y el vacío entre las rocas te tragó.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    jumps: [
      { minY: 470, maxY: 560, runway: 90, landingY: 440 },
      { minY: 230, maxY: 320, runway: 90, landingY: 200 },
      { minY: -50, maxY: 40, runway: 90, landingY: -80 },
      { minY: -320, maxY: -230, runway: 90, landingY: -350 },
    ],
    accentColor: "#8a94a8",
    bgColor: "#08090c",
    floorColor: "#1a1c22",
  },
  {
    id: "parkour_asteroides_2",
    stage: "cinturon_asteroides",
    guardianId: "centinela_fractura",
    kind: "plataformas",
    keyId: "key_cinturon_asteroides_2",
    name: "Rocas Inestables",
    introLine: "Estos fragmentos giran a la deriva. Se estabilizan un instante al pisarlos... y luego se desintegran.",
    warnLine: "¡Cuidado! Cada roca se desintegra 2 segundos después de pisarla.",
    successLine: "Cruzaste el campo de rocas sin caer. Toma la llave, la ganaste.",
    deathLine: "La roca se desintegró bajo tus ruedas. Caíste entre los fragmentos.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    bands: [
      { minY: 430, maxY: 520, platX0: 100, platX1: 240, collapseAfter: 2 },
      { minY: 190, maxY: 280, platX0: -240, platX1: -100, collapseAfter: 2 },
      { minY: -50, maxY: 40, platX0: 100, platX1: 240, collapseAfter: 2 },
      { minY: -290, maxY: -200, platX0: -240, platX1: -100, collapseAfter: 2 },
      { minY: -530, maxY: -440, platX0: -70, platX1: 70, collapseAfter: 2 },
    ],
    accentColor: "#8a94a8",
    bgColor: "#08090c",
    floorColor: "#1a1c22",
  },
  {
    id: "parkour_asteroides_3",
    stage: "cinturon_asteroides",
    guardianId: "vigia_minero",
    kind: "laseres",
    keyId: "key_cinturon_asteroides_3",
    name: "Escáneres del Puesto Minero",
    introLine: "Los escáneres de seguridad minera siguen barriendo el túnel, décadas después de que todos se fueran.",
    warnLine: "¡Cuidado! Tocar un haz en movimiento es letal al instante.",
    successLine: "Ni un rasguño entre los escáneres. Te ganaste la llave, piloto.",
    deathLine: "Un escáner te barrió de lleno. Las luces del túnel parpadearon una última vez.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    lasers: [
      { pivot: [0, 420], length: 280, angularSpeed: 1.6, phase: 0.3 },
      { pivot: [200, 150], length: 300, angularSpeed: -1.3, phase: 1.5 },
      { pivot: [-200, -120], length: 300, angularSpeed: 1.5, phase: 2.4 },
      { pivot: [0, -400], length: 300, angularSpeed: -1.7, phase: 0.8 },
    ],
    accentColor: "#8a94a8",
    bgColor: "#08090c",
    floorColor: "#1a1c22",
  },

  // ---------------- Horizonte de un Agujero Negro ----------------
  {
    id: "parkour_agujero_1",
    stage: "agujero_negro",
    guardianId: "vigia_horizonte",
    kind: "laseres",
    keyId: "key_agujero_negro_1",
    name: "Filamentos de Radiación Gravitacional",
    introLine: "Cerca del horizonte, la luz misma se dobla. Estos filamentos giran más rápido de lo que nada debería girar.",
    warnLine: "¡Cuidado! Cinco filamentos, mucho más rápidos que cualquier cosa que hayas visto. Un roce es el final.",
    successLine: "Cruzaste el horizonte de radiación entero. Toma la llave, si es que aún tiemblan tus manos.",
    deathLine: "Un filamento te alcanzó. La luz que emitiste al desaparecer tardará eones en llegar a alguna parte.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    lasers: [
      { pivot: [0, 450], length: 300, angularSpeed: 2.0, phase: 0 },
      { pivot: [-220, 250], length: 320, angularSpeed: -1.8, phase: 0.6 },
      { pivot: [220, 50], length: 320, angularSpeed: 2.1, phase: 1.2 },
      { pivot: [-220, -150], length: 320, angularSpeed: -1.9, phase: 1.8 },
      { pivot: [0, -400], length: 300, angularSpeed: 2.2, phase: 2.4 },
    ],
    accentColor: "#ff8a3d",
    bgColor: "#020103",
    floorColor: "#150a1e",
  },
  {
    id: "parkour_agujero_2",
    stage: "agujero_negro",
    guardianId: "tecnico_singularidad",
    kind: "compuertas",
    keyId: "key_agujero_negro_2",
    name: "Compuertas en Colapso",
    introLine: "Seis compuertas de contención parpadean al borde de la singularidad. Cada ciclo es más corto que el anterior.",
    warnLine: "¡Cuidado! Los ciclos son mucho más rápidos que en cualquier otro sitio. Si una se cierra encima tuya, colapsas con ella.",
    successLine: "Cronometraste las seis compuertas al límite. La llave es tuya.",
    deathLine: "Una compuerta colapsó justo encima de ti. No quedó ni luz.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    gates: [
      { y: 470, h: 60, period: 2.0, phase: 0 },
      { y: 310, h: 60, period: 2.2, phase: 0.5 },
      { y: 150, h: 60, period: 1.9, phase: 1.0 },
      { y: -10, h: 60, period: 2.3, phase: 1.5 },
      { y: -170, h: 60, period: 2.0, phase: 0.3 },
      { y: -400, h: 60, period: 2.4, phase: 1.2 },
    ],
    accentColor: "#ff8a3d",
    bgColor: "#020103",
    floorColor: "#150a1e",
  },
  {
    id: "parkour_agujero_3",
    stage: "agujero_negro",
    guardianId: "centinela_vacio_absoluto",
    kind: "saltos",
    keyId: "key_agujero_negro_3",
    name: "Saltos sobre Fracturas del Espacio-Tiempo",
    introLine: "El espacio se rasga aquí mismo. La pista para saltar es más corta que en ningún otro sitio: no lo dudes.",
    warnLine: "¡Cuidado! Las pistas de salto son mucho más estrechas. Si dudas, caes por la fractura.",
    successLine: "Cinco saltos sobre la nada misma. Nadie más lo ha logrado. La llave es tuya.",
    deathLine: "Dudaste un instante de más... y la fractura te tragó entero.",
    width: 1000,
    height: 1500,
    spawnPos: [0, 650],
    goalPos: [0, -650],
    jumps: [
      { minY: 500, maxY: 570, runway: 60, landingY: 480 },
      { minY: 320, maxY: 390, runway: 60, landingY: 300 },
      { minY: 140, maxY: 210, runway: 60, landingY: 120 },
      { minY: -60, maxY: 10, runway: 60, landingY: -80 },
      { minY: -260, maxY: -190, runway: 60, landingY: -280 },
    ],
    accentColor: "#ff8a3d",
    bgColor: "#020103",
    floorColor: "#150a1e",
  },
];

export function parkourForGuardian(guardianId: string): ParkourChallenge | undefined {
  return PARKOUR_CHALLENGES.find((p) => p.guardianId === guardianId);
}

export function parkourChallengesForStage(stage: StageId): ParkourChallenge[] {
  return PARKOUR_CHALLENGES.filter((p) => p.stage === stage);
}
