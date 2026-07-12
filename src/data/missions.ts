import type { StageId } from "./stages";

export type MissionType = "principal" | "secundaria" | "especial" | "oculta";
export type MissionObjectiveType =
  | "hablarCon"
  | "ganarPartido"
  | "derrotarJefe"
  | "recogerCofres"
  | "recogerMascotas"
  | "marcarGoles";

export interface MissionObjective {
  type: MissionObjectiveType;
  target: string;
  count: number;
  description: string;
}

export interface MissionDef {
  id: string;
  type: MissionType;
  stage: StageId;
  title: string;
  giver: string;
  description: string;
  objectives: MissionObjective[];
  rewardMonedas: number;
  rewardDiamantes: number;
  rewardXp: number;
  requires?: string[];
  hidden?: boolean;
  // cuenta para el requisito de "3 misiones" que desbloquea la puerta del jefe de la etapa
  countsForStageGate?: boolean;
}

export const MISSIONS: MissionDef[] = [
  // ---------- Hub / tutorial ----------
  {
    id: "m_intro",
    type: "principal",
    stage: "hub",
    title: "Tu Primer Motor",
    giver: "mecanico_rex",
    description: "Habla con el Mecánico Rex en el garaje de la Plaza Central.",
    objectives: [{ type: "hablarCon", target: "mecanico_rex", count: 1, description: "Habla con Mecánico Rex" }],
    rewardMonedas: 200,
    rewardDiamantes: 5,
    rewardXp: 50,
  },
  {
    id: "m_primer_partido",
    type: "principal",
    stage: "hub",
    title: "Bienvenido al Campo",
    giver: "capitana_vega",
    description: "Juega y gana tu primer partido de entrenamiento.",
    objectives: [{ type: "ganarPartido", target: "campo_hub", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 400,
    rewardDiamantes: 10,
    rewardXp: 120,
    requires: ["m_intro"],
  },

  // ---------- Ciudad ----------
  {
    id: "s_cofres_ciudad",
    type: "secundaria",
    stage: "ciudad",
    title: "Cazador de Cofres",
    giver: "vendedor_neo",
    description: "Encuentra 2 cofres escondidos en la Ciudad Futurista.",
    objectives: [{ type: "recogerCofres", target: "ciudad", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 300,
    rewardDiamantes: 10,
    rewardXp: 120,
    countsForStageGate: true,
  },
  {
    id: "s_goles_ciudad",
    type: "secundaria",
    stage: "ciudad",
    title: "Puntería de Neón",
    giver: "guardia_neon",
    description: "Marca 3 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 3, description: "Marca 3 goles" }],
    rewardMonedas: 300,
    rewardDiamantes: 10,
    rewardXp: 120,
    countsForStageGate: true,
  },
  {
    id: "s_partido_ciudad",
    type: "secundaria",
    stage: "ciudad",
    title: "Entrénate en la Ciudad",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en la Ciudad Futurista.",
    objectives: [{ type: "ganarPartido", target: "campo_ciudad", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 300,
    rewardDiamantes: 10,
    rewardXp: 120,
    countsForStageGate: true,
  },
  {
    id: "m_ciudad_jefe",
    type: "principal",
    stage: "ciudad",
    title: "El Campeón de Neón",
    giver: "sistema",
    description: "Derrota a Neo-Piloto X9.",
    objectives: [{ type: "derrotarJefe", target: "ciudad", count: 1, description: "Derrota a Neo-Piloto X9" }],
    rewardMonedas: 1200,
    rewardDiamantes: 50,
    rewardXp: 500,
  },

  // ---------- Desierto ----------
  {
    id: "s_cofres_desierto",
    type: "secundaria",
    stage: "desierto",
    title: "Ruinas Enterradas",
    giver: "explorador_tarek",
    description: "Encuentra 2 cofres en el Desierto Solar.",
    objectives: [{ type: "recogerCofres", target: "desierto", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 400,
    rewardDiamantes: 12,
    rewardXp: 160,
    countsForStageGate: true,
  },
  {
    id: "s_goles_desierto",
    type: "secundaria",
    stage: "desierto",
    title: "Puntería del Desierto",
    giver: "comerciante_amir",
    description: "Marca 4 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 4, description: "Marca 4 goles" }],
    rewardMonedas: 400,
    rewardDiamantes: 12,
    rewardXp: 160,
    countsForStageGate: true,
  },
  {
    id: "s_partido_desierto",
    type: "secundaria",
    stage: "desierto",
    title: "Entrénate en el Desierto",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en el Desierto Solar.",
    objectives: [{ type: "ganarPartido", target: "campo_desierto", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 400,
    rewardDiamantes: 12,
    rewardXp: 160,
    countsForStageGate: true,
  },
  {
    id: "m_desierto_jefe",
    type: "principal",
    stage: "desierto",
    title: "Señor de las Dunas",
    giver: "sistema",
    description: "Derrota a Khamsin.",
    objectives: [{ type: "derrotarJefe", target: "desierto", count: 1, description: "Derrota a Khamsin" }],
    rewardMonedas: 1600,
    rewardDiamantes: 55,
    rewardXp: 600,
  },

  // ---------- Bosque ----------
  {
    id: "s_mascotas_bosque",
    type: "secundaria",
    stage: "bosque",
    title: "Amigos Cúbicos",
    giver: "druida_finn",
    description: "Encuentra 2 mascotas en el Bosque Mágico.",
    objectives: [{ type: "recogerMascotas", target: "bosque", count: 2, description: "Encuentra 2 mascotas" }],
    rewardMonedas: 500,
    rewardDiamantes: 15,
    rewardXp: 200,
    countsForStageGate: true,
  },
  {
    id: "s_cofres_bosque",
    type: "secundaria",
    stage: "bosque",
    title: "Tesoros del Bosque",
    giver: "guardabosques_lira",
    description: "Encuentra 2 cofres en el Bosque Mágico.",
    objectives: [{ type: "recogerCofres", target: "bosque", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 500,
    rewardDiamantes: 15,
    rewardXp: 200,
    countsForStageGate: true,
  },
  {
    id: "s_partido_bosque",
    type: "secundaria",
    stage: "bosque",
    title: "Entrénate en el Bosque",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en el Bosque Mágico.",
    objectives: [{ type: "ganarPartido", target: "campo_bosque", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 500,
    rewardDiamantes: 15,
    rewardXp: 200,
    countsForStageGate: true,
  },
  {
    id: "m_bosque_jefe",
    type: "principal",
    stage: "bosque",
    title: "Guardiana del Bosque",
    giver: "sistema",
    description: "Derrota a Sylvara.",
    objectives: [{ type: "derrotarJefe", target: "bosque", count: 1, description: "Derrota a Sylvara" }],
    rewardMonedas: 2000,
    rewardDiamantes: 60,
    rewardXp: 700,
  },

  // ---------- Volcán ----------
  {
    id: "s_goles_volcan",
    type: "secundaria",
    stage: "volcan",
    title: "Forjado en Fuego",
    giver: "vigilante_kora",
    description: "Marca 5 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 5, description: "Marca 5 goles" }],
    rewardMonedas: 600,
    rewardDiamantes: 18,
    rewardXp: 250,
    countsForStageGate: true,
  },
  {
    id: "s_cofres_volcan",
    type: "secundaria",
    stage: "volcan",
    title: "Tesoros de Magma",
    giver: "herrero_dorn",
    description: "Encuentra 2 cofres en la Zona Volcánica.",
    objectives: [{ type: "recogerCofres", target: "volcan", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 600,
    rewardDiamantes: 18,
    rewardXp: 250,
    countsForStageGate: true,
  },
  {
    id: "s_partido_volcan",
    type: "secundaria",
    stage: "volcan",
    title: "Entrénate en el Volcán",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en la Zona Volcánica.",
    objectives: [{ type: "ganarPartido", target: "campo_volcan", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 600,
    rewardDiamantes: 18,
    rewardXp: 250,
    countsForStageGate: true,
  },
  {
    id: "m_volcan_jefe",
    type: "principal",
    stage: "volcan",
    title: "El Corazón de Magma",
    giver: "sistema",
    description: "Derrota a Ignarok.",
    objectives: [{ type: "derrotarJefe", target: "volcan", count: 1, description: "Derrota a Ignarok" }],
    rewardMonedas: 2500,
    rewardDiamantes: 65,
    rewardXp: 800,
  },

  // ---------- Helado ----------
  {
    id: "s_cofres_helado",
    type: "secundaria",
    stage: "helado",
    title: "Tesoros Congelados",
    giver: "chaman_nieve",
    description: "Encuentra 2 cofres en el Reino Helado.",
    objectives: [{ type: "recogerCofres", target: "helado", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 700,
    rewardDiamantes: 20,
    rewardXp: 280,
    countsForStageGate: true,
  },
  {
    id: "s_goles_helado",
    type: "secundaria",
    stage: "helado",
    title: "Puntería Helada",
    giver: "mercader_glacial",
    description: "Marca 5 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 5, description: "Marca 5 goles" }],
    rewardMonedas: 700,
    rewardDiamantes: 20,
    rewardXp: 280,
    countsForStageGate: true,
  },
  {
    id: "s_partido_helado",
    type: "secundaria",
    stage: "helado",
    title: "Entrénate en el Hielo",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en el Reino Helado.",
    objectives: [{ type: "ganarPartido", target: "campo_helado", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 700,
    rewardDiamantes: 20,
    rewardXp: 280,
    countsForStageGate: true,
  },
  {
    id: "m_helado_jefe",
    type: "principal",
    stage: "helado",
    title: "El Rey de Escarcha",
    giver: "sistema",
    description: "Derrota a Frosthelm.",
    objectives: [{ type: "derrotarJefe", target: "helado", count: 1, description: "Derrota a Frosthelm" }],
    rewardMonedas: 3000,
    rewardDiamantes: 70,
    rewardXp: 900,
  },

  // ---------- Islas ----------
  {
    id: "s_mascotas_islas",
    type: "secundaria",
    stage: "islas",
    title: "Criaturas del Viento",
    giver: "viajera_del_viento",
    description: "Encuentra 2 mascotas en las Islas Flotantes.",
    objectives: [{ type: "recogerMascotas", target: "islas", count: 2, description: "Encuentra 2 mascotas" }],
    rewardMonedas: 800,
    rewardDiamantes: 22,
    rewardXp: 320,
    countsForStageGate: true,
  },
  {
    id: "s_cofres_islas",
    type: "secundaria",
    stage: "islas",
    title: "Tesoros del Cielo",
    giver: "sistema",
    description: "Encuentra 2 cofres en las Islas Flotantes.",
    objectives: [{ type: "recogerCofres", target: "islas", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 800,
    rewardDiamantes: 22,
    rewardXp: 320,
    countsForStageGate: true,
  },
  {
    id: "s_partido_islas",
    type: "secundaria",
    stage: "islas",
    title: "Entrénate en el Cielo",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en las Islas Flotantes.",
    objectives: [{ type: "ganarPartido", target: "campo_islas", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 800,
    rewardDiamantes: 22,
    rewardXp: 320,
    countsForStageGate: true,
  },
  {
    id: "m_islas_jefe",
    type: "principal",
    stage: "islas",
    title: "Señora del Viento",
    giver: "sistema",
    description: "Derrota a Aeris.",
    objectives: [{ type: "derrotarJefe", target: "islas", count: 1, description: "Derrota a Aeris" }],
    rewardMonedas: 3500,
    rewardDiamantes: 75,
    rewardXp: 1000,
  },

  // ---------- Laboratorio ----------
  {
    id: "s_goles_laboratorio",
    type: "secundaria",
    stage: "laboratorio",
    title: "Protocolo de Puntería",
    giver: "robot_asistente",
    description: "Marca 6 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 6, description: "Marca 6 goles" }],
    rewardMonedas: 900,
    rewardDiamantes: 25,
    rewardXp: 360,
    countsForStageGate: true,
  },
  {
    id: "s_cofres_laboratorio",
    type: "secundaria",
    stage: "laboratorio",
    title: "Datos Perdidos",
    giver: "cientifica_lux",
    description: "Encuentra 2 cofres en el Laboratorio.",
    objectives: [{ type: "recogerCofres", target: "laboratorio", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 900,
    rewardDiamantes: 25,
    rewardXp: 360,
    countsForStageGate: true,
  },
  {
    id: "s_partido_laboratorio",
    type: "secundaria",
    stage: "laboratorio",
    title: "Entrénate en el Laboratorio",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en el Laboratorio.",
    objectives: [{ type: "ganarPartido", target: "campo_laboratorio", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 900,
    rewardDiamantes: 25,
    rewardXp: 360,
    countsForStageGate: true,
  },
  {
    id: "m_laboratorio_jefe",
    type: "principal",
    stage: "laboratorio",
    title: "Prototipo Fallido",
    giver: "sistema",
    description: "Derrota a la Unidad Ω.",
    objectives: [{ type: "derrotarJefe", target: "laboratorio", count: 1, description: "Derrota a la Unidad Ω" }],
    rewardMonedas: 4000,
    rewardDiamantes: 80,
    rewardXp: 1200,
  },

  // ---------- Celestial (final) ----------
  {
    id: "s_final_1",
    type: "secundaria",
    stage: "celestial",
    title: "Prueba de Velocidad",
    giver: "guardian_celestial",
    description: "Marca 8 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 8, description: "Marca 8 goles" }],
    rewardMonedas: 1200,
    rewardDiamantes: 30,
    rewardXp: 400,
    countsForStageGate: true,
  },
  {
    id: "s_final_2",
    type: "secundaria",
    stage: "celestial",
    title: "Reliquias Doradas",
    giver: "sistema",
    description: "Encuentra 2 cofres en el Reino Celestial.",
    objectives: [{ type: "recogerCofres", target: "celestial", count: 2, description: "Encuentra 2 cofres" }],
    rewardMonedas: 1200,
    rewardDiamantes: 30,
    rewardXp: 400,
    countsForStageGate: true,
  },
  {
    id: "s_final_3",
    type: "secundaria",
    stage: "celestial",
    title: "Entrénate en el Cielo Dorado",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en el Reino Celestial.",
    objectives: [{ type: "ganarPartido", target: "campo_celestial", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 1200,
    rewardDiamantes: 30,
    rewardXp: 400,
    countsForStageGate: true,
  },
  {
    id: "m_final",
    type: "principal",
    stage: "celestial",
    title: "El Gran Torneo",
    giver: "sistema",
    description: "Derrota al Campeón Eterno y conviértete en el mejor piloto del mundo.",
    objectives: [{ type: "derrotarJefe", target: "celestial", count: 1, description: "Derrota al Campeón Eterno" }],
    rewardMonedas: 10000,
    rewardDiamantes: 300,
    rewardXp: 5000,
  },

  // ---------- Especiales / ocultas ----------
  {
    id: "e_doble_xp",
    type: "especial",
    stage: "hub",
    title: "Fin de Semana de Doble XP",
    giver: "sistema",
    description: "Gana 3 partidos durante el evento de doble experiencia.",
    objectives: [{ type: "ganarPartido", target: "any", count: 3, description: "Gana 3 partidos" }],
    rewardMonedas: 1000,
    rewardDiamantes: 40,
    rewardXp: 400,
  },
];

export function missionById(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function stageGateMissions(stage: StageId): MissionDef[] {
  return MISSIONS.filter((m) => m.stage === stage && m.countsForStageGate);
}

export function stageBossMission(stage: StageId): MissionDef | undefined {
  return MISSIONS.find((m) => m.stage === stage && m.type === "principal" && m.objectives[0]?.type === "derrotarJefe");
}
