// Sistema de rarezas compartido por todo el contenido del juego:
// coches, cosméticos, mascotas, cofres, coleccionables, misiones especiales...
export type Rarity =
  | "comun"
  | "pocoComun"
  | "raro"
  | "epico"
  | "legendario"
  | "dios"
  | "secreto"
  | "divino"
  | "prohibido";

export interface RarityInfo {
  id: Rarity;
  label: string;
  order: number; // 1 = mas comun, 9 = mas raro
  color: string; // color base para UI / glow
  colorSecondary: string; // color de brillo/partículas
  weight: number; // peso relativo para tablas de drop (mas alto = mas comun)
  powerMultiplier: number; // usado por mascotas / objetos con efecto numerico
}

export const RARITIES: Record<Rarity, RarityInfo> = {
  comun: {
    id: "comun",
    label: "Común",
    order: 1,
    color: "#9aa0a6",
    colorSecondary: "#c7c9cc",
    weight: 1000,
    powerMultiplier: 1.0,
  },
  pocoComun: {
    id: "pocoComun",
    label: "Poco Común",
    order: 2,
    color: "#4caf50",
    colorSecondary: "#8bf49a",
    weight: 500,
    powerMultiplier: 1.25,
  },
  raro: {
    id: "raro",
    label: "Raro",
    order: 3,
    color: "#3d8bff",
    colorSecondary: "#8fc0ff",
    weight: 220,
    powerMultiplier: 1.55,
  },
  epico: {
    id: "epico",
    label: "Épico",
    order: 4,
    color: "#a742ff",
    colorSecondary: "#dcb2ff",
    weight: 90,
    powerMultiplier: 1.9,
  },
  legendario: {
    id: "legendario",
    label: "Legendario",
    order: 5,
    color: "#ff9d2f",
    colorSecondary: "#ffd27a",
    weight: 35,
    powerMultiplier: 2.3,
  },
  dios: {
    id: "dios",
    label: "Dios",
    order: 6,
    color: "#ff3b3b",
    colorSecondary: "#ff9a9a",
    weight: 12,
    powerMultiplier: 2.7,
  },
  secreto: {
    id: "secreto",
    label: "Secreto",
    order: 7,
    color: "#171717",
    colorSecondary: "#ff2fd1",
    weight: 4,
    powerMultiplier: 3.1,
  },
  divino: {
    id: "divino",
    label: "Divino",
    order: 8,
    color: "#fff7d6",
    colorSecondary: "#ffe873",
    weight: 1.2,
    powerMultiplier: 3.6,
  },
  prohibido: {
    id: "prohibido",
    label: "Prohibido",
    order: 9,
    color: "#2b0033",
    colorSecondary: "#ff0033",
    weight: 0.3,
    powerMultiplier: 4.2,
  },
};

export const RARITY_ORDER: Rarity[] = [
  "comun",
  "pocoComun",
  "raro",
  "epico",
  "legendario",
  "dios",
  "secreto",
  "divino",
  "prohibido",
];

export function rollRarity(luckBonus = 0): Rarity {
  const entries = RARITY_ORDER.map((id) => {
    const info = RARITIES[id];
    // el luckBonus reduce ligeramente la ventaja de las rarezas bajas
    const weight = info.order === 1 ? info.weight : info.weight * (1 + luckBonus * (info.order - 1) * 0.05);
    return { id, weight };
  });
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of entries) {
    if (r < e.weight) return e.id;
    r -= e.weight;
  }
  return "comun";
}

export function rarityAtLeast(a: Rarity, b: Rarity): boolean {
  return RARITIES[a].order >= RARITIES[b].order;
}
