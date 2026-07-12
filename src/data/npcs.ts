import { D, type RegionId } from "./regions";

export interface NpcDef {
  id: string;
  name: string;
  region: RegionId;
  pos: [number, number];
  colorHex: number;
  role: "mision" | "tienda" | "garaje" | "historia";
  shopId?: string;
  dialogue: string[];
  missionIds?: string[];
}

export const NPCS: NpcDef[] = [
  {
    id: "mecanico_rex",
    name: "Mecánico Rex",
    region: "hub",
    pos: [12, -8],
    colorHex: 0xffaa33,
    role: "garaje",
    dialogue: [
      "¡Vaya, un nuevo piloto! Bienvenido a la Plaza Central.",
      "Aquí tienes tu primer coche. Cúbico, sencillo... ¡pero es tuyo!",
      "Visita el garaje cuando quieras para personalizarlo. Y no olvides explorar, hay secretos por todo el mapa.",
    ],
    missionIds: ["m_intro"],
  },
  {
    id: "capitana_vega",
    name: "Capitana Vega",
    region: "hub",
    pos: [-15, 20],
    colorHex: 0x3d8bff,
    role: "mision",
    dialogue: [
      "El Estadio Central te espera. ¿Listo para tu primer partido?",
      "Recuerda: el balón flota, las porterías están en alto y tu coche también flota un poco. ¡Aprovecha el aire!",
    ],
    missionIds: ["m_primer_partido"],
  },
  {
    id: "vendedor_neo",
    name: "Vendedor Neo",
    region: "ciudad",
    pos: [D + 40, 30],
    colorHex: 0xff2fd1,
    role: "tienda",
    shopId: "shop_ciudad",
    dialogue: [
      "Bienvenido a la Ciudad Futurista. Aquí encontrarás las mejores piezas de neón.",
      "También hay cofres escondidos entre los callejones... si tienes buen ojo.",
    ],
    missionIds: ["s_cofres_ciudad"],
  },
  {
    id: "druida_finn",
    name: "Druida Finn",
    region: "bosque",
    pos: [-20, D - 20],
    colorHex: 0x4caf50,
    role: "mision",
    dialogue: [
      "Shh... escucha el bosque. Hay pequeñas criaturas escondidas entre los árboles.",
      "Si encuentras alguna, se unirá a ti y te dará poder en los partidos.",
    ],
    missionIds: ["s_mascotas_bosque"],
  },
  {
    id: "comerciante_amir",
    name: "Comerciante Amir",
    region: "desierto",
    pos: [D * 0.7 + 20, D * 0.7 - 10],
    colorHex: 0xd8b168,
    role: "tienda",
    shopId: "shop_desierto",
    dialogue: ["El calor del desierto templa a los grandes campeones. ¿Buscas turbos o quieres poner a prueba tu puntería?"],
    missionIds: ["s_goles_desierto"],
  },
];
