import type { Rarity } from "./rarity";

export type ItemSlot =
  | "color"
  | "vinilo"
  | "rueda"
  | "turbo"
  | "explosionGol"
  | "estela"
  | "bocina"
  | "antena"
  | "titulo"
  | "balon";

export interface ItemDef {
  id: string;
  slot: ItemSlot;
  name: string;
  rarity: Rarity;
  price: number;
  currency: "monedas" | "diamantes";
  // color hex principal usado para previsualizar en tienda/garaje
  colorHex?: number;
  colorHex2?: number;
  description: string;
}

export const ITEMS: ItemDef[] = [
  // Colores
  { id: "color_blanco", slot: "color", name: "Blanco Clásico", rarity: "comun", price: 0, currency: "monedas", colorHex: 0xf2f2f2, description: "El color de fábrica." },
  { id: "color_rojo", slot: "color", name: "Rojo Carreras", rarity: "comun", price: 300, currency: "monedas", colorHex: 0xd7263d, description: "Un rojo intenso clásico." },
  { id: "color_azul", slot: "color", name: "Azul Turbo", rarity: "pocoComun", price: 600, currency: "monedas", colorHex: 0x2f6fd6, description: "Azul vibrante con acabado satinado." },
  { id: "color_esmeralda", slot: "color", name: "Esmeralda", rarity: "raro", price: 1200, currency: "monedas", colorHex: 0x1fae6b, description: "Un verde brillante muy codiciado." },
  { id: "color_holografico", slot: "color", name: "Holográfico", rarity: "epico", price: 2500, currency: "monedas", colorHex: 0xb35bff, description: "Cambia de tono según la luz." },
  { id: "color_dorado", slot: "color", name: "Dorado Legendario", rarity: "legendario", price: 60, currency: "diamantes", colorHex: 0xffcc33, description: "Reservado a los mejores pilotos." },
  { id: "color_sangre_divina", slot: "color", name: "Sangre de Dios", rarity: "dios", price: 140, currency: "diamantes", colorHex: 0xff2c2c, description: "Emana un brillo pulsante." },
  { id: "color_vacio", slot: "color", name: "Vacío Secreto", rarity: "secreto", price: 260, currency: "diamantes", colorHex: 0x0a0a0a, colorHex2: 0xff2fd1, description: "Absorbe la luz a su alrededor." },
  { id: "color_prohibido", slot: "color", name: "Prohibido", rarity: "prohibido", price: 999, currency: "diamantes", colorHex: 0x1a0022, colorHex2: 0xff0033, description: "Nadie sabe de dónde viene este color." },

  // Ruedas
  { id: "rueda_estandar", slot: "rueda", name: "Ruedas Estándar", rarity: "comun", price: 0, currency: "monedas", colorHex: 0x222222, description: "Ruedas de serie." },
  { id: "rueda_deportiva", slot: "rueda", name: "Ruedas Deportivas", rarity: "pocoComun", price: 500, currency: "monedas", colorHex: 0x333333, description: "Mejor agarre en curva." },
  { id: "rueda_neon", slot: "rueda", name: "Ruedas Neón", rarity: "epico", price: 2200, currency: "monedas", colorHex: 0x00e5ff, description: "Dejan una estela de luz." },
  { id: "rueda_celestial", slot: "rueda", name: "Ruedas Celestiales", rarity: "divino", price: 320, currency: "diamantes", colorHex: 0xfff2c2, description: "Flotan ligeramente sobre el suelo." },

  // Turbos
  { id: "turbo_basico", slot: "turbo", name: "Turbo Básico", rarity: "comun", price: 0, currency: "monedas", colorHex: 0x66ccff, description: "Impulso estándar." },
  { id: "turbo_llamas", slot: "turbo", name: "Turbo de Llamas", rarity: "raro", price: 1400, currency: "monedas", colorHex: 0xff5500, description: "Deja un rastro de fuego." },
  { id: "turbo_arcoiris", slot: "turbo", name: "Turbo Arcoíris", rarity: "legendario", price: 80, currency: "diamantes", colorHex: 0xff66cc, description: "Un espectáculo de colores." },
  { id: "turbo_omega", slot: "turbo", name: "Turbo Prohibido", rarity: "prohibido", price: 900, currency: "diamantes", colorHex: 0x7d00ff, description: "Rompe las leyes de la física." },

  // Explosiones de gol
  { id: "gol_confeti", slot: "explosionGol", name: "Confeti", rarity: "comun", price: 200, currency: "monedas", description: "Una lluvia de confeti al marcar." },
  { id: "gol_fuegos", slot: "explosionGol", name: "Fuegos Artificiales", rarity: "raro", price: 1500, currency: "monedas", description: "Fuegos artificiales en el cielo del estadio." },
  { id: "gol_supernova", slot: "explosionGol", name: "Supernova", rarity: "secreto", price: 200, currency: "diamantes", description: "Una explosión de luz que ilumina todo el estadio." },
  { id: "gol_divino", slot: "explosionGol", name: "Juicio Divino", rarity: "divino", price: 400, currency: "diamantes", description: "Rayos de luz caen del cielo." },

  // Bocinas
  { id: "bocina_clasica", slot: "bocina", name: "Bocina Clásica", rarity: "comun", price: 0, currency: "monedas", description: "Sonido de claxon estándar." },
  { id: "bocina_risa", slot: "bocina", name: "Bocina Risa", rarity: "pocoComun", price: 400, currency: "monedas", description: "Suelta una carcajada." },
  { id: "bocina_epica", slot: "bocina", name: "Acorde Épico", rarity: "epico", price: 60, currency: "diamantes", description: "Un acorde orquestal dramático." },

  // Antenas
  { id: "antena_ninguna", slot: "antena", name: "Sin Antena", rarity: "comun", price: 0, currency: "monedas", description: "" },
  { id: "antena_bandera", slot: "antena", name: "Antena Bandera", rarity: "comun", price: 150, currency: "monedas", description: "Una pequeña bandera ondeante." },
  { id: "antena_cristal", slot: "antena", name: "Antena de Cristal", rarity: "epico", price: 1800, currency: "monedas", description: "Brilla con luz interior." },
  { id: "antena_secreta", slot: "antena", name: "Antena del Vacío", rarity: "secreto", price: 300, currency: "diamantes", description: "Nadie sabe qué capta." },

  // Estelas
  { id: "estela_ninguna", slot: "estela", name: "Sin Estela", rarity: "comun", price: 0, currency: "monedas", description: "" },
  { id: "estela_humo", slot: "estela", name: "Estela de Humo", rarity: "pocoComun", price: 350, currency: "monedas", description: "Deja un rastro de humo." },
  { id: "estela_estrellas", slot: "estela", name: "Estela Estelar", rarity: "legendario", price: 100, currency: "diamantes", colorHex: 0xfff6cc, description: "Un rastro de estrellas brillantes." },

  // Balones (para partidos)
  { id: "balon_clasico", slot: "balon", name: "Balón Clásico", rarity: "comun", price: 0, currency: "monedas", colorHex: 0xffffff, description: "El balón de siempre." },
  { id: "balon_electrico", slot: "balon", name: "Balón Eléctrico", rarity: "raro", price: 1000, currency: "monedas", colorHex: 0x66e0ff, description: "Chispea al ser golpeado." },
  { id: "balon_dios", slot: "balon", name: "Balón de los Dioses", rarity: "dios", price: 220, currency: "diamantes", colorHex: 0xffdf6b, description: "Deja marcada la trayectoria en el aire." },

  // Títulos
  { id: "titulo_novato", slot: "titulo", name: "Novato de las Ruedas", rarity: "comun", price: 0, currency: "monedas", description: "" },
  { id: "titulo_explorador", slot: "titulo", name: "Explorador Incansable", rarity: "raro", price: 0, currency: "monedas", description: "Otorgado al completar el 25% del mapa." },
  { id: "titulo_campeon", slot: "titulo", name: "Campeón Regional", rarity: "legendario", price: 0, currency: "monedas", description: "Otorgado al derrotar a un jefe de región." },
  { id: "titulo_eterno", slot: "titulo", name: "Piloto Eterno", rarity: "prohibido", price: 0, currency: "monedas", description: "Otorgado al derrotar al Campeón Eterno." },
];

export function itemsBySlot(slot: ItemSlot): ItemDef[] {
  return ITEMS.filter((i) => i.slot === slot);
}
export function getItem(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}
