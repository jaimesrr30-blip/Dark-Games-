import type { RegionId } from "./regions";

export type MissionType = "principal" | "secundaria" | "especial" | "oculta";
export type MissionObjectiveType =
  | "hablarCon"
  | "ganarPartido"
  | "derrotarJefe"
  | "recogerCofres"
  | "recogerMascotas"
  | "llegarA"
  | "marcarGoles";

export interface MissionObjective {
  type: MissionObjectiveType;
  target: string; // id de npc / region / jefe / etc.
  count: number;
  description: string;
}

export interface MissionDef {
  id: string;
  type: MissionType;
  region: RegionId;
  title: string;
  giver: string; // npc id, o "sistema"
  description: string;
  objectives: MissionObjective[];
  rewardMonedas: number;
  rewardDiamantes: number;
  rewardXp: number;
  requires?: string[]; // ids de misiones previas requeridas
  hidden?: boolean; // solo visible tras cumplir condición de descubrimiento
}

export const MISSIONS: MissionDef[] = [
  {
    id: "m_intro",
    type: "principal",
    region: "hub",
    title: "Tu Primer Motor",
    giver: "mecanico_rex",
    description: "Habla con el Mecánico Rex en el garaje de la Plaza Central para recibir tu primer coche.",
    objectives: [{ type: "hablarCon", target: "mecanico_rex", count: 1, description: "Habla con Mecánico Rex" }],
    rewardMonedas: 200,
    rewardDiamantes: 5,
    rewardXp: 50,
  },
  {
    id: "m_primer_partido",
    type: "principal",
    region: "hub",
    title: "Bienvenido al Estadio",
    giver: "capitana_vega",
    description: "Juega y gana tu primer partido en el Estadio Central.",
    objectives: [{ type: "ganarPartido", target: "estadio_central", count: 1, description: "Gana un partido en el Estadio Central" }],
    rewardMonedas: 400,
    rewardDiamantes: 10,
    rewardXp: 120,
    requires: ["m_intro"],
  },
  {
    id: "m_ciudad_jefe",
    type: "principal",
    region: "ciudad",
    title: "El Campeón de Neón",
    giver: "sistema",
    description: "Derrota a Neo-Piloto X9 en el Estadio Galáctico para desbloquear nuevas regiones.",
    objectives: [{ type: "derrotarJefe", target: "ciudad", count: 1, description: "Derrota a Neo-Piloto X9" }],
    rewardMonedas: 1500,
    rewardDiamantes: 50,
    rewardXp: 500,
    requires: ["m_primer_partido"],
  },
  {
    id: "m_desierto_jefe",
    type: "principal",
    region: "desierto",
    title: "Señor de las Dunas",
    giver: "sistema",
    description: "Derrota a Khamsin en el Estadio del Oasis.",
    objectives: [{ type: "derrotarJefe", target: "desierto", count: 1, description: "Derrota a Khamsin" }],
    rewardMonedas: 2000,
    rewardDiamantes: 60,
    rewardXp: 650,
    requires: ["m_ciudad_jefe"],
  },
  {
    id: "m_bosque_jefe",
    type: "principal",
    region: "bosque",
    title: "Guardiana del Bosque",
    giver: "sistema",
    description: "Derrota a Sylvara en el Estadio del Bosque.",
    objectives: [{ type: "derrotarJefe", target: "bosque", count: 1, description: "Derrota a Sylvara" }],
    rewardMonedas: 2000,
    rewardDiamantes: 60,
    rewardXp: 650,
    requires: ["m_ciudad_jefe"],
  },
  {
    id: "m_volcan_jefe",
    type: "principal",
    region: "volcan",
    title: "El Corazón de Magma",
    giver: "sistema",
    description: "Derrota a Ignarok en el Estadio del Volcán.",
    objectives: [{ type: "derrotarJefe", target: "volcan", count: 1, description: "Derrota a Ignarok" }],
    rewardMonedas: 2500,
    rewardDiamantes: 70,
    rewardXp: 800,
    requires: ["m_desierto_jefe"],
  },
  {
    id: "m_helado_jefe",
    type: "principal",
    region: "helado",
    title: "El Rey de Escarcha",
    giver: "sistema",
    description: "Derrota a Frosthelm en el Estadio Glaciar.",
    objectives: [{ type: "derrotarJefe", target: "helado", count: 1, description: "Derrota a Frosthelm" }],
    rewardMonedas: 2500,
    rewardDiamantes: 70,
    rewardXp: 800,
    requires: ["m_bosque_jefe"],
  },
  {
    id: "m_laboratorio_jefe",
    type: "principal",
    region: "laboratorio",
    title: "Prototipo Fallido",
    giver: "sistema",
    description: "Derrota a la Unidad Ω en el Estadio Submarino.",
    objectives: [{ type: "derrotarJefe", target: "laboratorio", count: 1, description: "Derrota a la Unidad Ω" }],
    rewardMonedas: 3000,
    rewardDiamantes: 80,
    rewardXp: 1000,
    requires: ["m_volcan_jefe"],
  },
  {
    id: "m_islas_jefe",
    type: "principal",
    region: "islas",
    title: "Señora del Viento",
    giver: "sistema",
    description: "Derrota a Aeris en el Estadio del Cielo.",
    objectives: [{ type: "derrotarJefe", target: "islas", count: 1, description: "Derrota a Aeris" }],
    rewardMonedas: 3000,
    rewardDiamantes: 80,
    rewardXp: 1000,
    requires: ["m_helado_jefe"],
  },
  {
    id: "m_final",
    type: "principal",
    region: "celestial",
    title: "El Gran Torneo",
    giver: "sistema",
    description: "Derrota al Campeón Eterno en el Estadio Celestial y conviértete en el mejor piloto del mundo.",
    objectives: [{ type: "derrotarJefe", target: "celestial", count: 1, description: "Derrota al Campeón Eterno" }],
    rewardMonedas: 10000,
    rewardDiamantes: 300,
    rewardXp: 5000,
    requires: ["m_islas_jefe", "m_laboratorio_jefe"],
  },

  // Secundarias
  {
    id: "s_cofres_ciudad",
    type: "secundaria",
    region: "ciudad",
    title: "Cazador de Cofres",
    giver: "vendedor_neo",
    description: "Encuentra 3 cofres escondidos en la Ciudad Futurista.",
    objectives: [{ type: "recogerCofres", target: "ciudad", count: 3, description: "Encuentra 3 cofres en Ciudad Futurista" }],
    rewardMonedas: 500,
    rewardDiamantes: 15,
    rewardXp: 150,
  },
  {
    id: "s_mascotas_bosque",
    type: "secundaria",
    region: "bosque",
    title: "Amigos Peludos (y Cúbicos)",
    giver: "druida_finn",
    description: "Encuentra 2 mascotas en el Bosque Mágico.",
    objectives: [{ type: "recogerMascotas", target: "bosque", count: 2, description: "Encuentra 2 mascotas en el Bosque Mágico" }],
    rewardMonedas: 400,
    rewardDiamantes: 20,
    rewardXp: 180,
  },
  {
    id: "s_goles_desierto",
    type: "secundaria",
    region: "desierto",
    title: "Puntería del Desierto",
    giver: "comerciante_amir",
    description: "Marca 5 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 5, description: "Marca 5 goles" }],
    rewardMonedas: 600,
    rewardDiamantes: 15,
    rewardXp: 200,
  },

  // Especiales (eventos temporales)
  {
    id: "e_doble_xp",
    type: "especial",
    region: "hub",
    title: "Fin de Semana de Doble XP",
    giver: "sistema",
    description: "Gana 3 partidos durante el evento de doble experiencia.",
    objectives: [{ type: "ganarPartido", target: "any", count: 3, description: "Gana 3 partidos" }],
    rewardMonedas: 1000,
    rewardDiamantes: 40,
    rewardXp: 400,
  },

  // Ocultas
  {
    id: "h_portal_secreto",
    type: "oculta",
    region: "islas",
    title: "??? ",
    giver: "sistema",
    description: "Algo te observa desde un portal oculto entre las Islas Flotantes...",
    objectives: [{ type: "llegarA", target: "portal_secreto_islas", count: 1, description: "Descubre el portal oculto" }],
    rewardMonedas: 2000,
    rewardDiamantes: 100,
    rewardXp: 300,
    hidden: true,
  },
];

export function missionById(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}
