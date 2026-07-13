import { STAGES, type StageId } from "./stages";
import { NPCS } from "./npcs";
import { SECRET_DOORS, HIDEOUTS } from "./spawns";

export type MissionType = "principal" | "secundaria" | "especial" | "oculta";
export type MissionObjectiveType =
  | "hablarCon"
  | "ganarPartido"
  | "derrotarJefe"
  | "recogerCofres"
  | "recogerMascotas"
  | "marcarGoles"
  | "obtenerLlave"
  | "recogerBotones"
  | "venderMascota"
  | "descubrirSecreto"
  | "recogerPiezas"
  | "derrotarEnemigo";

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

  // ---------- El secreto de la pirámide (Desierto) ----------
  {
    id: "s_piramide_desierto",
    type: "secundaria",
    stage: "desierto",
    title: "El Secreto de la Pirámide",
    giver: "custodio_piramide",
    description: "Encuentra los 3 botones de piedra escondidos por el Desierto Solar y llévalos a la pirámide.",
    objectives: [{ type: "recogerBotones", target: "desierto", count: 3, description: "Encuentra los 3 botones de piedra" }],
    rewardMonedas: 500,
    rewardDiamantes: 20,
    rewardXp: 300,
  },

  // ---------- El cohete (Reino Celestial) ----------
  {
    id: "s_piezas_cohete",
    type: "secundaria",
    stage: "celestial",
    title: "Piezas del Cohete",
    giver: "guardian_celestial",
    description: "Reúne las 4 piezas de un misterioso cohete escondidas por el Reino Celestial.",
    objectives: [{ type: "recogerPiezas", target: "celestial", count: 4, description: "Encuentra las 4 piezas del cohete" }],
    rewardMonedas: 2000,
    rewardDiamantes: 60,
    rewardXp: 800,
  },
  {
    id: "m_construir_cohete",
    type: "principal",
    stage: "celestial",
    title: "El Cohete Despega",
    giver: "ingeniero_cohete",
    description: "Lleva las 4 piezas y el motor del cohete al Ingeniero Vex para que lo construya.",
    objectives: [{ type: "hablarCon", target: "ingeniero_cohete", count: 1, description: "Habla con el Ingeniero Vex con todo lo necesario" }],
    rewardMonedas: 3000,
    rewardDiamantes: 100,
    rewardXp: 1000,
    requires: ["s_piezas_cohete", "m_final"],
  },

  // ---------- Planeta Escarlata ----------
  {
    id: "s_cofres_escarlata",
    type: "secundaria",
    stage: "planeta_escarlata",
    title: "Tesoros del Cañón",
    giver: "mercader_marciano",
    description: "Encuentra 3 cofres escondidos en el Planeta Escarlata.",
    objectives: [{ type: "recogerCofres", target: "planeta_escarlata", count: 3, description: "Encuentra 3 cofres" }],
    rewardMonedas: 1800,
    rewardDiamantes: 45,
    rewardXp: 500,
  },
  {
    id: "s_goles_escarlata",
    type: "secundaria",
    stage: "planeta_escarlata",
    title: "Puntería Marciana",
    giver: "cazador_rojo",
    description: "Marca 6 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 6, description: "Marca 6 goles" }],
    rewardMonedas: 1800,
    rewardDiamantes: 45,
    rewardXp: 500,
  },
  {
    id: "s_partido_escarlata",
    type: "secundaria",
    stage: "planeta_escarlata",
    title: "Entrénate en Marte",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en el Planeta Escarlata.",
    objectives: [{ type: "ganarPartido", target: "campo_planeta_escarlata", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 1800,
    rewardDiamantes: 45,
    rewardXp: 500,
  },
  {
    id: "m_escarlata_jefe",
    type: "principal",
    stage: "planeta_escarlata",
    title: "El Devorador de Cañones",
    giver: "sistema",
    description: "Derrota a Vorrak.",
    objectives: [{ type: "derrotarJefe", target: "planeta_escarlata", count: 1, description: "Derrota a Vorrak" }],
    rewardMonedas: 4000,
    rewardDiamantes: 120,
    rewardXp: 1500,
  },

  // ---------- Anillos de Kaion ----------
  {
    id: "s_cofres_anillos",
    type: "secundaria",
    stage: "planeta_anillos",
    title: "Botín entre las Nubes",
    giver: "comerciante_flotante",
    description: "Encuentra 3 cofres escondidos en los Anillos de Kaion.",
    objectives: [{ type: "recogerCofres", target: "planeta_anillos", count: 3, description: "Encuentra 3 cofres" }],
    rewardMonedas: 2200,
    rewardDiamantes: 55,
    rewardXp: 600,
  },
  {
    id: "s_goles_anillos",
    type: "secundaria",
    stage: "planeta_anillos",
    title: "Puntería entre Anillos",
    giver: "vigia_anillo",
    description: "Marca 7 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 7, description: "Marca 7 goles" }],
    rewardMonedas: 2200,
    rewardDiamantes: 55,
    rewardXp: 600,
  },
  {
    id: "s_partido_anillos",
    type: "secundaria",
    stage: "planeta_anillos",
    title: "Entrénate entre los Anillos",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en los Anillos de Kaion.",
    objectives: [{ type: "ganarPartido", target: "campo_planeta_anillos", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 2200,
    rewardDiamantes: 55,
    rewardXp: 600,
  },
  {
    id: "m_anillos_jefe",
    type: "principal",
    stage: "planeta_anillos",
    title: "Guardián de los Anillos",
    giver: "sistema",
    description: "Derrota a Nébula-9.",
    objectives: [{ type: "derrotarJefe", target: "planeta_anillos", count: 1, description: "Derrota a Nébula-9" }],
    rewardMonedas: 5000,
    rewardDiamantes: 150,
    rewardXp: 2000,
  },

  // ---------- Luna de Cristal ----------
  {
    id: "s_cofres_cristal",
    type: "secundaria",
    stage: "planeta_cristal",
    title: "Fragmentos Olvidados",
    giver: "vendedor_cristalino",
    description: "Encuentra 3 cofres escondidos en la Luna de Cristal.",
    objectives: [{ type: "recogerCofres", target: "planeta_cristal", count: 3, description: "Encuentra 3 cofres" }],
    rewardMonedas: 2800,
    rewardDiamantes: 70,
    rewardXp: 700,
  },
  {
    id: "s_goles_cristal",
    type: "secundaria",
    stage: "planeta_cristal",
    title: "Puntería de Cristal",
    giver: "eco_cristal",
    description: "Marca 8 goles en cualquier partido.",
    objectives: [{ type: "marcarGoles", target: "any", count: 8, description: "Marca 8 goles" }],
    rewardMonedas: 2800,
    rewardDiamantes: 70,
    rewardXp: 700,
  },
  {
    id: "s_partido_cristal",
    type: "secundaria",
    stage: "planeta_cristal",
    title: "Entrénate en la Luna de Cristal",
    giver: "sistema",
    description: "Gana un partido de entrenamiento en la Luna de Cristal.",
    objectives: [{ type: "ganarPartido", target: "campo_planeta_cristal", count: 1, description: "Gana un partido de entrenamiento" }],
    rewardMonedas: 2800,
    rewardDiamantes: 70,
    rewardXp: 700,
  },
  {
    id: "m_cristal_jefe",
    type: "principal",
    stage: "planeta_cristal",
    title: "El Eco de Cristal",
    giver: "sistema",
    description: "Derrota a Prisma Eterna y conviértete en leyenda de todo el sistema solar.",
    objectives: [{ type: "derrotarJefe", target: "planeta_cristal", count: 1, description: "Derrota a Prisma Eterna" }],
    rewardMonedas: 8000,
    rewardDiamantes: 250,
    rewardXp: 3500,
  },
];

// Una misión por cada guardián: conseguir su llave (pagando, ganando un partido,
// o resolviendo su desafío especial) cuenta como una misión más en el registro.
function guardianKeyMissions(): MissionDef[] {
  return NPCS.filter((n) => n.role === "guardian" && n.guardian).map((n) => {
    const order = STAGES[n.stage].order;
    const def: MissionDef = {
      id: `key_mission_${n.id}`,
      type: "secundaria",
      stage: n.stage,
      title: `La llave de ${n.name}`,
      giver: n.id,
      description: `Consigue la llave que guarda ${n.name}.`,
      objectives: [{ type: "obtenerLlave", target: n.guardian!.keyId, count: 1, description: `Consigue la llave de ${n.name}` }],
      rewardMonedas: 80 + order * 40,
      rewardDiamantes: 2 + order,
      rewardXp: 60 + order * 20,
    };
    return def;
  });
}

// Una misión por cada comprador de mascotas: véndele al menos una.
function petSellMissions(): MissionDef[] {
  return NPCS.filter((n) => n.role === "mascotas").map((n) => {
    const def: MissionDef = {
      id: `sell_mission_${n.id}`,
      type: "secundaria",
      stage: n.stage,
      title: `Trato con ${n.name}`,
      giver: n.id,
      description: `${n.name} paga bien por mascotas. Véndele una.`,
      objectives: [{ type: "venderMascota", target: "any", count: 1, description: "Vende una mascota" }],
      rewardMonedas: 150,
      rewardDiamantes: 5,
      rewardXp: 100,
    };
    return def;
  });
}

// Una misión oculta por cada puerta secreta: el id de la misión coincide con el
// id de la puerta para que se revele en el registro justo al descubrirla.
function secretDoorMissions(): MissionDef[] {
  return SECRET_DOORS.map((d) => {
    const def: MissionDef = {
      id: d.id,
      type: "oculta",
      stage: d.stage,
      title: "Puerta Misteriosa",
      giver: "sistema",
      description: "Alguien escondió algo valioso tras una puerta secreta en esta etapa.",
      objectives: [{ type: "descubrirSecreto", target: d.id, count: 1, description: "Descubre el secreto" }],
      rewardMonedas: d.coins,
      rewardDiamantes: 10,
      rewardXp: 150,
      hidden: true,
    };
    return def;
  });
}

// Una misión secundaria por cada guarida: entra, derrota al enemigo y cobra la recompensa.
function hideoutMissions(): MissionDef[] {
  return HIDEOUTS.map((h) => {
    const def: MissionDef = {
      id: h.id,
      type: "secundaria",
      stage: h.stage,
      title: `Guarida: ${h.enemyName}`,
      giver: "sistema",
      description: `Hay una guarida escondida en esta etapa. Entra y derrota a ${h.enemyName} en un partido para conseguir tu recompensa.`,
      objectives: [{ type: "derrotarEnemigo", target: h.id, count: 1, description: `Derrota a ${h.enemyName}` }],
      rewardMonedas: h.rewardCoins,
      rewardDiamantes: 8,
      rewardXp: 130,
    };
    return def;
  });
}

MISSIONS.push(...guardianKeyMissions(), ...petSellMissions(), ...secretDoorMissions(), ...hideoutMissions());

export function missionById(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function missionsForStage(stage: StageId): MissionDef[] {
  return MISSIONS.filter((m) => m.stage === stage);
}
