export type RegionId =
  | "hub"
  | "ciudad"
  | "desierto"
  | "bosque"
  | "volcan"
  | "helado"
  | "islas"
  | "laboratorio"
  | "celestial";

export interface RegionDef {
  id: RegionId;
  name: string;
  description: string;
  // posición del centro de la región en el grid del mundo (unidades de mundo)
  center: [number, number];
  radius: number;
  groundColor: number;
  groundColorAlt: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  skyTop: number;
  skyBottom: number;
  ambientColor: number;
  propTypes: ("cube" | "cone" | "cylinder" | "crystal" | "ice" | "cactus" | "tree" | "pipe" | "cloudRock")[];
  bossName: string;
  bossTitle: string;
  arenaTheme: string;
  requiresBossDefeated?: RegionId; // región cuyo jefe hay que derrotar para desbloquear ésta
  weather: "clear" | "sand" | "rain" | "snow" | "ash" | "aurora";
  musicTag: string;
}

export const R = 220; // "radio" de cada región cuadrada/circular
export const D = 520; // distancia del centro del hub a cada región

export const REGIONS: Record<RegionId, RegionDef> = {
  hub: {
    id: "hub",
    name: "Plaza Central",
    description: "El punto de partida de todo piloto. Aquí están el garaje principal y las primeras tiendas.",
    center: [0, 0],
    radius: 180,
    groundColor: 0x556270,
    groundColorAlt: 0x64778a,
    fogColor: 0x9fb4c7,
    fogNear: 60,
    fogFar: 420,
    skyTop: 0x8fc7ff,
    skyBottom: 0xdcefff,
    ambientColor: 0xffffff,
    propTypes: ["cube", "cylinder"],
    bossName: "—",
    bossTitle: "—",
    arenaTheme: "Estadio Central",
    weather: "clear",
    musicTag: "hub",
  },
  ciudad: {
    id: "ciudad",
    name: "Ciudad Futurista",
    description: "Rascacielos de neón, autopistas elevadas y hologramas por todas partes.",
    center: [D, 0],
    radius: R,
    groundColor: 0x2b2f45,
    groundColorAlt: 0x363c58,
    fogColor: 0x1b1e33,
    fogNear: 40,
    fogFar: 380,
    skyTop: 0x120a2e,
    skyBottom: 0x3a1e63,
    ambientColor: 0x8fa4ff,
    propTypes: ["cube", "cylinder"],
    bossName: "Neo-Piloto X9",
    bossTitle: "El Campeón de Neón",
    arenaTheme: "Estadio Galáctico",
    weather: "clear",
    musicTag: "ciudad",
  },
  desierto: {
    id: "desierto",
    name: "Desierto Solar",
    description: "Dunas infinitas, ruinas enterradas y tormentas de arena repentinas.",
    center: [D * 0.7, D * 0.7],
    radius: R,
    groundColor: 0xd8b168,
    groundColorAlt: 0xe4c580,
    fogColor: 0xf0d9a0,
    fogNear: 50,
    fogFar: 400,
    skyTop: 0xffb066,
    skyBottom: 0xffe2a8,
    ambientColor: 0xffdca0,
    propTypes: ["cactus", "cube"],
    bossName: "Khamsin",
    bossTitle: "Señor de las Dunas",
    arenaTheme: "Estadio del Oasis",
    requiresBossDefeated: "ciudad",
    weather: "sand",
    musicTag: "desierto",
  },
  bosque: {
    id: "bosque",
    name: "Bosque Mágico",
    description: "Árboles bioluminiscentes, ruinas cubiertas de musgo y criaturas curiosas.",
    center: [0, D],
    radius: R,
    groundColor: 0x2f5d3a,
    groundColorAlt: 0x3a7048,
    fogColor: 0x1c3a24,
    fogNear: 30,
    fogFar: 300,
    skyTop: 0x0c2b1a,
    skyBottom: 0x1f5c3c,
    ambientColor: 0x9dffb0,
    propTypes: ["tree", "crystal"],
    bossName: "Sylvara",
    bossTitle: "Guardiana del Bosque",
    arenaTheme: "Estadio del Bosque",
    requiresBossDefeated: "ciudad",
    weather: "rain",
    musicTag: "bosque",
  },
  volcan: {
    id: "volcan",
    name: "Zona Volcánica",
    description: "Ríos de lava, rocas ardientes y temblores constantes.",
    center: [-D * 0.7, D * 0.7],
    radius: R,
    groundColor: 0x3a1414,
    groundColorAlt: 0x4a1c1c,
    fogColor: 0x2a0d0d,
    fogNear: 30,
    fogFar: 320,
    skyTop: 0x1a0505,
    skyBottom: 0x5c1a0a,
    ambientColor: 0xff7a3d,
    propTypes: ["cube", "pipe"],
    bossName: "Ignarok",
    bossTitle: "El Corazón de Magma",
    arenaTheme: "Estadio del Volcán",
    requiresBossDefeated: "desierto",
    weather: "ash",
    musicTag: "volcan",
  },
  helado: {
    id: "helado",
    name: "Reino Helado",
    description: "Glaciares brillantes, auroras y ventiscas heladas.",
    center: [-D, 0],
    radius: R,
    groundColor: 0xd8ecf5,
    groundColorAlt: 0xc2e0ee,
    fogColor: 0xe8f6ff,
    fogNear: 40,
    fogFar: 340,
    skyTop: 0x8fd3ff,
    skyBottom: 0xe8fbff,
    ambientColor: 0xd0f0ff,
    propTypes: ["ice", "crystal"],
    bossName: "Frosthelm",
    bossTitle: "El Rey de Escarcha",
    arenaTheme: "Estadio Glaciar",
    requiresBossDefeated: "bosque",
    weather: "snow",
    musicTag: "helado",
  },
  islas: {
    id: "islas",
    name: "Islas Flotantes",
    description: "Fragmentos de tierra suspendidos en el cielo, unidos por puentes de energía.",
    center: [-D * 0.7, -D * 0.7],
    radius: R,
    groundColor: 0x4a7a5a,
    groundColorAlt: 0x5a8f6a,
    fogColor: 0xbfe6ff,
    fogNear: 60,
    fogFar: 420,
    skyTop: 0x3d7fff,
    skyBottom: 0xbfe6ff,
    ambientColor: 0xdfffea,
    propTypes: ["cloudRock", "crystal"],
    bossName: "Aeris",
    bossTitle: "Señora del Viento",
    arenaTheme: "Estadio del Cielo",
    requiresBossDefeated: "helado",
    weather: "clear",
    musicTag: "islas",
  },
  laboratorio: {
    id: "laboratorio",
    name: "Laboratorio Tecnológico",
    description: "Instalaciones secretas, robots de prueba y experimentos fuera de control.",
    center: [0, -D],
    radius: R,
    groundColor: 0x2a2f33,
    groundColorAlt: 0x373f45,
    fogColor: 0x1a1d1f,
    fogNear: 30,
    fogFar: 300,
    skyTop: 0x0a0e12,
    skyBottom: 0x1f2a33,
    ambientColor: 0x4dffe0,
    propTypes: ["pipe", "cube"],
    bossName: "Unidad Ω",
    bossTitle: "Prototipo Fallido",
    arenaTheme: "Estadio Submarino",
    requiresBossDefeated: "volcan",
    weather: "rain",
    musicTag: "laboratorio",
  },
  celestial: {
    id: "celestial",
    name: "Reino Celestial",
    description: "El torneo final. Un reino dorado sobre las nubes, reservado a los mejores pilotos.",
    center: [D * 0.7, -D * 0.7],
    radius: R,
    groundColor: 0xfff2c2,
    groundColorAlt: 0xffe08a,
    fogColor: 0xfff6da,
    fogNear: 60,
    fogFar: 440,
    skyTop: 0xffe9a8,
    skyBottom: 0xfffdf2,
    ambientColor: 0xfff2c2,
    propTypes: ["crystal", "cloudRock"],
    bossName: "El Campeón Eterno",
    bossTitle: "Maestro de Todos los Pilotos",
    arenaTheme: "Estadio Celestial",
    requiresBossDefeated: "laboratorio",
    weather: "aurora",
    musicTag: "celestial",
  },
};

export const REGION_ORDER: RegionId[] = [
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

export function regionAt(x: number, z: number): RegionDef {
  let best: RegionDef = REGIONS.hub;
  let bestDist = Infinity;
  for (const id of REGION_ORDER) {
    const r = REGIONS[id];
    const dx = x - r.center[0];
    const dz = z - r.center[1];
    // distancia normalizada por el radio: favorece la región dentro de cuyo círculo
    // cae el punto de forma más clara, evitando que regiones vecinas se "roben" bordes
    const d = (Math.sqrt(dx * dx + dz * dz) - r.radius) / r.radius;
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}
