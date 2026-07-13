// Cada "etapa" es una zona 2D delimitada e independiente (no un mundo continuo).
// El jugador viaja entre etapas a través del Mapa de Etapas una vez desbloqueadas.
export type StageId =
  | "hub"
  | "ciudad"
  | "desierto"
  | "bosque"
  | "volcan"
  | "helado"
  | "islas"
  | "laboratorio"
  | "celestial"
  | "planeta_escarlata"
  | "planeta_anillos"
  | "planeta_cristal";

export type PropType = "arbol" | "cactus" | "roca" | "cristal" | "nieve" | "nube" | "tuberia" | "farola";

export interface StageDef {
  id: StageId;
  name: string;
  description: string;
  order: number;
  width: number;
  height: number;
  groundColor: string;
  groundColorAlt: string;
  accentColor: string;
  skyColor: string;
  propType: PropType;
  propColor: string;
  bossName: string;
  bossTitle: string;
  // Los planetas viven en el "Sistema Solar" (se viaja a ellos con el cohete,
  // no por el Mapa de Etapas normal) en vez del mundo con base en tierra.
  realm?: "solar";
}

const W = 2200;
const H = 1600;
// Los planetas del sistema solar tienen mapas más grandes que las etapas
// terrestres para caber más misiones secundarias y construcciones.
const PW = 3200;
const PH = 2400;

export const STAGES: Record<StageId, StageDef> = {
  hub: {
    id: "hub",
    name: "Plaza Central",
    description: "El punto de partida de todo piloto.",
    order: 0,
    width: 1400,
    height: 1000,
    groundColor: "#4a5a72",
    groundColorAlt: "#526481",
    accentColor: "#3d8bff",
    skyColor: "#8fc7ff",
    propType: "farola",
    propColor: "#2c3648",
    bossName: "",
    bossTitle: "",
  },
  ciudad: {
    id: "ciudad",
    name: "Ciudad Futurista",
    description: "Rascacielos de neón y autopistas elevadas.",
    order: 1,
    width: W,
    height: H,
    groundColor: "#232840",
    groundColorAlt: "#2b3050",
    accentColor: "#ff2fd1",
    skyColor: "#170f33",
    propType: "farola",
    propColor: "#3a2f66",
    bossName: "Neo-Piloto X9",
    bossTitle: "El Campeón de Neón",
  },
  desierto: {
    id: "desierto",
    name: "Desierto Solar",
    description: "Dunas infinitas y ruinas enterradas.",
    order: 2,
    width: W,
    height: H,
    groundColor: "#d8b168",
    groundColorAlt: "#e4c580",
    accentColor: "#ff9d2f",
    skyColor: "#ffcf8a",
    propType: "cactus",
    propColor: "#3d7a4a",
    bossName: "Khamsin",
    bossTitle: "Señor de las Dunas",
  },
  bosque: {
    id: "bosque",
    name: "Bosque Mágico",
    description: "Árboles bioluminiscentes y ruinas cubiertas de musgo.",
    order: 3,
    width: W,
    height: H,
    groundColor: "#264a30",
    groundColorAlt: "#2e5a3a",
    accentColor: "#4caf50",
    skyColor: "#123322",
    propType: "arbol",
    propColor: "#1c7a3e",
    bossName: "Sylvara",
    bossTitle: "Guardiana del Bosque",
  },
  volcan: {
    id: "volcan",
    name: "Zona Volcánica",
    description: "Ríos de lava y rocas ardientes.",
    order: 4,
    width: W,
    height: H,
    groundColor: "#3a1414",
    groundColorAlt: "#4a1c1c",
    accentColor: "#ff5500",
    skyColor: "#2a0d0d",
    propType: "roca",
    propColor: "#661a0a",
    bossName: "Ignarok",
    bossTitle: "El Corazón de Magma",
  },
  helado: {
    id: "helado",
    name: "Reino Helado",
    description: "Glaciares brillantes y ventiscas heladas.",
    order: 5,
    width: W,
    height: H,
    groundColor: "#d8ecf5",
    groundColorAlt: "#c2e0ee",
    accentColor: "#66e0ff",
    skyColor: "#e8fbff",
    propType: "nieve",
    propColor: "#ffffff",
    bossName: "Frosthelm",
    bossTitle: "El Rey de Escarcha",
  },
  islas: {
    id: "islas",
    name: "Islas Flotantes",
    description: "Fragmentos de tierra suspendidos en el cielo.",
    order: 6,
    width: W,
    height: H,
    groundColor: "#4a7a5a",
    groundColorAlt: "#5a8f6a",
    accentColor: "#dfffea",
    skyColor: "#bfe6ff",
    propType: "nube",
    propColor: "#ffffff",
    bossName: "Aeris",
    bossTitle: "Señora del Viento",
  },
  laboratorio: {
    id: "laboratorio",
    name: "Laboratorio Tecnológico",
    description: "Instalaciones secretas y robots de prueba.",
    order: 7,
    width: W,
    height: H,
    groundColor: "#242b2e",
    groundColorAlt: "#2c363a",
    accentColor: "#4dffe0",
    skyColor: "#0a0e12",
    propType: "tuberia",
    propColor: "#3a4a4a",
    bossName: "Unidad Ω",
    bossTitle: "Prototipo Fallido",
  },
  celestial: {
    id: "celestial",
    name: "Reino Celestial",
    description: "El torneo final, sobre las nubes.",
    order: 8,
    width: W,
    height: H,
    groundColor: "#fff2c2",
    groundColorAlt: "#ffe08a",
    accentColor: "#ffd76b",
    skyColor: "#fff6da",
    propType: "nube",
    propColor: "#fff8e0",
    bossName: "El Campeón Eterno",
    bossTitle: "Maestro de Todos los Pilotos",
  },

  // ---------------- Sistema Solar (tras construir el cohete) ----------------
  planeta_escarlata: {
    id: "planeta_escarlata",
    name: "Planeta Escarlata",
    description: "Cañones rojos y agujas de roca bajo dos soles.",
    order: 9,
    width: PW,
    height: PH,
    groundColor: "#4a1408",
    groundColorAlt: "#5c1c0c",
    accentColor: "#ff5a3d",
    skyColor: "#2a0a08",
    propType: "roca",
    propColor: "#8a2a12",
    bossName: "Vorrak",
    bossTitle: "El Devorador de Cañones",
  },
  planeta_anillos: {
    id: "planeta_anillos",
    name: "Anillos de Kaion",
    description: "Plataformas flotantes entre los anillos de un gigante gaseoso.",
    order: 10,
    width: PW,
    height: PH,
    groundColor: "#332a4a",
    groundColorAlt: "#3d3258",
    accentColor: "#d9b8ff",
    skyColor: "#1a1430",
    propType: "nube",
    propColor: "#c9a8ff",
    bossName: "Nébula-9",
    bossTitle: "Guardián de los Anillos",
  },
  planeta_cristal: {
    id: "planeta_cristal",
    name: "Luna de Cristal",
    description: "Formaciones de cristal viviente que laten con luz propia.",
    order: 11,
    width: PW,
    height: PH,
    groundColor: "#0f2a3a",
    groundColorAlt: "#123648",
    accentColor: "#7bf2ff",
    skyColor: "#081824",
    propType: "cristal",
    propColor: "#7bf2ff",
    bossName: "Prisma Eterna",
    bossTitle: "El Eco de Cristal",
  },
};

export const STAGE_ORDER: StageId[] = [
  "hub",
  "ciudad",
  "desierto",
  "bosque",
  "volcan",
  "helado",
  "islas",
  "laboratorio",
  "celestial",
];

export const PLANET_ORDER: StageId[] = ["planeta_escarlata", "planeta_anillos", "planeta_cristal"];

export function nextStage(id: StageId): StageId | null {
  const idx = STAGE_ORDER.indexOf(id);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function prevStage(id: StageId): StageId | null {
  const idx = STAGE_ORDER.indexOf(id);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}

export function nextPlanet(id: StageId): StageId | null {
  const idx = PLANET_ORDER.indexOf(id);
  if (idx < 0 || idx >= PLANET_ORDER.length - 1) return null;
  return PLANET_ORDER[idx + 1];
}

// Progresión unificada: al derrotar un jefe se desbloquea lo siguiente, ya sea
// la próxima etapa terrestre o el próximo planeta del sistema solar.
export function nextInProgression(id: StageId): StageId | null {
  return nextStage(id) ?? nextPlanet(id);
}
