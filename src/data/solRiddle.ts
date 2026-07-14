// El acertijo del Sol: 4 fragmentos escondidos por el mundo (uno por cada
// realidad ya conquistada, en su orden cronológico) narran el orden correcto
// en el que hay que activar los 4 pilares del Altar del Eclipse para abrir
// la puerta de la batalla final. Un orden equivocado no mata: solo reinicia
// la secuencia.
export interface EclipseFragment {
  id: string;
  pos: [number, number];
  title: string;
  text: string;
  order: number; // 1-4, el orden narrativo/correcto
}

export const ECLIPSE_FRAGMENTS: EclipseFragment[] = [
  {
    id: "frag_eclipse_1",
    pos: [-1300, 900],
    title: "Fragmento del Eclipse I",
    text: "\"Donde el polvo rojo cae, ahí comienza la cuenta.\"",
    order: 1,
  },
  {
    id: "frag_eclipse_2",
    pos: [1300, 900],
    title: "Fragmento del Eclipse II",
    text: "\"Después, donde los anillos flotan sin caer jamás.\"",
    order: 2,
  },
  {
    id: "frag_eclipse_3",
    pos: [-1300, -900],
    title: "Fragmento del Eclipse III",
    text: "\"Luego, donde el cristal recuerda cada eco.\"",
    order: 3,
  },
  {
    id: "frag_eclipse_4",
    pos: [1300, -900],
    title: "Fragmento del Eclipse IV",
    text: "\"Y al final, donde el óxido guarda el último sistema.\"",
    order: 4,
  },
];

export interface EclipsePillar {
  id: string;
  pos: [number, number];
  color: string;
  order: number; // posición correcta en la secuencia (1-4)
  label: string;
}

export const SOL_PILLARS: EclipsePillar[] = [
  { id: "pilar_escarlata", pos: [-180, -850], color: "#ff5a3d", order: 1, label: "Pilar del Polvo Rojo" },
  { id: "pilar_anillos", pos: [-60, -850], color: "#d9b8ff", order: 2, label: "Pilar de los Anillos" },
  { id: "pilar_cristal", pos: [60, -850], color: "#7bf2ff", order: 3, label: "Pilar del Cristal" },
  { id: "pilar_oxido", pos: [180, -850], color: "#c9701f", order: 4, label: "Pilar del Óxido" },
];

export const SOL_RIDDLE_SOLVED_ID = "sol_riddle_solved";

export function eclipseFragmentIds(): string[] {
  return ECLIPSE_FRAGMENTS.map((f) => f.id);
}
