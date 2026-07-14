import type { StageId } from "./stages";

// Sistema de "zonas de guardián" de los planetas: en vez de negociar con el
// guardián directamente, primero hay que desbloquear el acceso a su zona
// reuniendo materiales (puente/generador/cristal según el planeta) y
// llevándolos al punto de desbloqueo. Una vez dentro, el guardián no pide
// dinero ni partido: pide un favor personal (encontrar algo que perdió en
// otra parte del planeta). Al entregárselo, da la llave directamente.
export type ZoneUnlockKind = "puente" | "generador" | "resonancia";

export interface MaterialSpawn {
  id: string;
  pos: [number, number];
}

export interface ZoneQuest {
  id: string;
  stage: StageId;
  guardianId: string;
  kind: ZoneUnlockKind;
  zoneName: string;
  unlockPos: [number, number];
  materials: MaterialSpawn[];
  materialLabel: string;
  favorItemId: string;
  favorItemPos: [number, number];
  favorLabel: string;
  askLine: string;
  thanksLine: string;
}

export const ZONE_QUESTS: ZoneQuest[] = [
  // ---------------- Planeta Escarlata: puentes de piedra ----------------
  {
    id: "zona_escarlata_1",
    stage: "planeta_escarlata",
    guardianId: "centinela_canon",
    kind: "puente",
    zoneName: "Cañón del Eco",
    unlockPos: [820, -600],
    materials: [
      { id: "tablon_escarlata_1", pos: [650, -450] },
      { id: "tablon_escarlata_2", pos: [700, -900] },
    ],
    materialLabel: "tablón de piedra",
    favorItemId: "objeto_movil_escarlata",
    favorItemPos: [-500, -300],
    favorLabel: "Recoger el móvil perdido",
    askLine: "Antes de darte la llave necesito un favor: se me cayó el móvil explorando el cañón. ¿Me lo buscas?",
    thanksLine: "¡Mi móvil! Gracias, piloto. Un trato es un trato, aquí tienes la llave.",
  },
  {
    id: "zona_escarlata_2",
    stage: "planeta_escarlata",
    guardianId: "cazador_rojo",
    kind: "puente",
    zoneName: "Guarida del Cazador",
    unlockPos: [-850, 620],
    materials: [
      { id: "tablon_escarlata_3", pos: [-600, 500] },
      { id: "tablon_escarlata_4", pos: [-750, 900] },
    ],
    materialLabel: "tablón de piedra",
    favorItemId: "objeto_cuchillo_escarlata",
    favorItemPos: [550, 400],
    favorLabel: "Recoger el cuchillo de caza",
    askLine: "Perdí mi cuchillo de caza cerca de un cráter, al otro lado del planeta. Tráemelo y la llave es tuya.",
    thanksLine: "Mi cuchillo... pensé que lo había perdido para siempre. Toma, te ganaste la llave.",
  },
  {
    id: "zona_escarlata_3",
    stage: "planeta_escarlata",
    guardianId: "custodio_vorrak",
    kind: "puente",
    zoneName: "Entrada de Vorrak",
    unlockPos: [0, -920],
    materials: [
      { id: "tablon_escarlata_5", pos: [250, -800] },
      { id: "tablon_escarlata_6", pos: [-300, -850] },
    ],
    materialLabel: "tablón de piedra",
    favorItemId: "objeto_amuleto_escarlata",
    favorItemPos: [900, 300],
    favorLabel: "Recoger el amuleto protector",
    askLine: "Bajando al cañón profundo perdí mi amuleto protector. No pienso vigilar la entrada de Vorrak sin él. Búscalo.",
    thanksLine: "Con mi amuleto de vuelta, puedo dormir tranquilo otra vez. Toma la llave, la ganaste.",
  },

  // ---------------- Anillos de Kaion: generadores antigravedad ----------------
  {
    id: "zona_anillos_1",
    stage: "planeta_anillos",
    guardianId: "vigia_anillo",
    kind: "generador",
    zoneName: "Plataforma del Vigía",
    unlockPos: [900, 500],
    materials: [
      { id: "nucleo_anillos_1", pos: [700, 400] },
      { id: "nucleo_anillos_2", pos: [750, 750] },
    ],
    materialLabel: "núcleo de energía",
    favorItemId: "objeto_telescopio_anillos",
    favorItemPos: [-500, -350],
    favorLabel: "Recoger el telescopio perdido",
    askLine: "Una tormenta de anillos me arrancó el telescopio de las manos. Sin él no distingo amigo de enemigo. Encuéntralo.",
    thanksLine: "¡Mi telescopio! Ahora sí puedo vigilar como es debido. La llave es tuya.",
  },
  {
    id: "zona_anillos_2",
    stage: "planeta_anillos",
    guardianId: "piloto_nebula",
    kind: "generador",
    zoneName: "Plataforma de Nébula",
    unlockPos: [-950, -550],
    materials: [
      { id: "nucleo_anillos_3", pos: [-700, -450] },
      { id: "nucleo_anillos_4", pos: [-800, -850] },
    ],
    materialLabel: "núcleo de energía",
    favorItemId: "objeto_casco_anillos",
    favorItemPos: [600, 300],
    favorLabel: "Recoger el casco de piloto",
    askLine: "Perdí mi casco en una carrera hace estaciones. Vuela conmigo desde entonces solo el recuerdo. Tráemelo y hablamos de la llave.",
    thanksLine: "Con mi casco puesto vuelvo a sentirme piloto de verdad. Toma, te la has ganado.",
  },
  {
    id: "zona_anillos_3",
    stage: "planeta_anillos",
    guardianId: "custodio_kaion",
    kind: "generador",
    zoneName: "Plataforma de Kaion",
    unlockPos: [0, 950],
    materials: [
      { id: "nucleo_anillos_5", pos: [250, 850] },
      { id: "nucleo_anillos_6", pos: [-300, 900] },
    ],
    materialLabel: "núcleo de energía",
    favorItemId: "objeto_bandera_anillos",
    favorItemPos: [900, -300],
    favorLabel: "Recoger la bandera del anillo",
    askLine: "La última tormenta se llevó la bandera que marca mi puesto. No soy custodio sin ella. Recupérala.",
    thanksLine: "Mi puesto vuelve a tener bandera. Nébula-9 estaría orgullosa. Aquí tienes la llave.",
  },

  // ---------------- Luna de Cristal: resonancia de cristales ----------------
  {
    id: "zona_cristal_1",
    stage: "planeta_cristal",
    guardianId: "eco_cristal",
    kind: "resonancia",
    zoneName: "Domo del Eco",
    unlockPos: [850, -650],
    materials: [{ id: "cristal_resonante_1", pos: [600, -500] }],
    materialLabel: "cristal resonante",
    favorItemId: "objeto_fragmento_cristal",
    favorItemPos: [-500, 400],
    favorLabel: "Recoger el fragmento de memoria",
    askLine: "En las profundidades perdí un fragmento de memoria: sin él, mi eco repite huecos. Encuéntralo y la llave será tuya.",
    thanksLine: "Mi memoria vuelve a resonar completa. Gracias, piloto. Toma la llave.",
  },
  {
    id: "zona_cristal_2",
    stage: "planeta_cristal",
    guardianId: "guardian_prisma",
    kind: "resonancia",
    zoneName: "Domo del Prisma",
    unlockPos: [-900, 650],
    materials: [{ id: "cristal_resonante_2", pos: [-650, 500] }],
    materialLabel: "cristal resonante",
    favorItemId: "objeto_lente_cristal",
    favorItemPos: [600, -350],
    favorLabel: "Recoger la lente de resonancia",
    askLine: "Sin mi lente de resonancia, la luz que atraviesa mi prisma sale rota. Búscala por el resto de la luna.",
    thanksLine: "La luz vuelve a salir limpia de mi prisma. Te la has ganado: aquí tienes la llave.",
  },
  {
    id: "zona_cristal_3",
    stage: "planeta_cristal",
    guardianId: "custodio_prisma_eterna",
    kind: "resonancia",
    zoneName: "Domo Eterno",
    unlockPos: [0, -1020],
    materials: [{ id: "cristal_resonante_3", pos: [250, -900] }],
    materialLabel: "cristal resonante",
    favorItemId: "objeto_nucleo_cristal",
    favorItemPos: [850, 650],
    favorLabel: "Recoger el núcleo prismático",
    askLine: "Mi núcleo prismático se perdió antes de que llegaras. Sin él no puedo custodiar la entrada de Prisma Eterna.",
    thanksLine: "El núcleo vuelve a latir en su sitio. Prisma Eterna te espera. Toma la llave.",
  },
];

export function zoneQuestsForStage(stage: StageId): ZoneQuest[] {
  return ZONE_QUESTS.filter((z) => z.stage === stage);
}

export function zoneQuestForGuardian(guardianId: string): ZoneQuest | undefined {
  return ZONE_QUESTS.find((z) => z.guardianId === guardianId);
}
