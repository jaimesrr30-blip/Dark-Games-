import type { Rarity } from "./rarity";

export type ItemSlot =
  | "color"
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
  colorHex?: string;
  colorHex2?: string;
  description: string;
}

export const ITEMS: ItemDef[] = [
  // Colores
  { id: "color_blanco", slot: "color", name: "Blanco Clásico", rarity: "comun", price: 0, currency: "monedas", colorHex: "#f2f2f2", description: "El color de fábrica." },
  { id: "color_rojo", slot: "color", name: "Rojo Carreras", rarity: "comun", price: 300, currency: "monedas", colorHex: "#d7263d", description: "Un rojo intenso clásico." },
  { id: "color_azul", slot: "color", name: "Azul Turbo", rarity: "pocoComun", price: 600, currency: "monedas", colorHex: "#2f6fd6", description: "Azul vibrante con acabado satinado." },
  { id: "color_esmeralda", slot: "color", name: "Esmeralda", rarity: "raro", price: 1200, currency: "monedas", colorHex: "#1fae6b", description: "Un verde brillante muy codiciado." },
  { id: "color_holografico", slot: "color", name: "Holográfico", rarity: "epico", price: 2500, currency: "monedas", colorHex: "#b35bff", description: "Cambia de tono según la luz." },
  { id: "color_dorado", slot: "color", name: "Dorado Legendario", rarity: "legendario", price: 60, currency: "diamantes", colorHex: "#ffcc33", description: "Reservado a los mejores pilotos." },
  { id: "color_sangre_divina", slot: "color", name: "Sangre de Dios", rarity: "dios", price: 140, currency: "diamantes", colorHex: "#ff2c2c", description: "Emana un brillo pulsante." },
  { id: "color_vacio", slot: "color", name: "Vacío Secreto", rarity: "secreto", price: 260, currency: "diamantes", colorHex: "#0a0a0a", colorHex2: "#ff2fd1", description: "Absorbe la luz a su alrededor." },
  { id: "color_prohibido", slot: "color", name: "Prohibido", rarity: "prohibido", price: 999, currency: "diamantes", colorHex: "#1a0022", colorHex2: "#ff0033", description: "Nadie sabe de dónde viene este color." },

  // Ruedas (borde del coche)
  { id: "rueda_estandar", slot: "rueda", name: "Borde Estándar", rarity: "comun", price: 0, currency: "monedas", colorHex: "#222222", description: "Borde de serie." },
  { id: "rueda_deportiva", slot: "rueda", name: "Borde Deportivo", rarity: "pocoComun", price: 500, currency: "monedas", colorHex: "#333333", description: "Mejor agarre en curva." },
  { id: "rueda_neon", slot: "rueda", name: "Borde Neón", rarity: "epico", price: 2200, currency: "monedas", colorHex: "#00e5ff", description: "Un borde brillante de neón." },
  { id: "rueda_celestial", slot: "rueda", name: "Borde Celestial", rarity: "divino", price: 320, currency: "diamantes", colorHex: "#fff2c2", description: "Un borde dorado reluciente." },

  // Turbos
  { id: "turbo_basico", slot: "turbo", name: "Turbo Básico", rarity: "comun", price: 0, currency: "monedas", colorHex: "#66ccff", description: "Impulso estándar." },
  { id: "turbo_llamas", slot: "turbo", name: "Turbo de Llamas", rarity: "raro", price: 1400, currency: "monedas", colorHex: "#ff5500", description: "Deja un rastro de fuego." },
  { id: "turbo_arcoiris", slot: "turbo", name: "Turbo Arcoíris", rarity: "legendario", price: 80, currency: "diamantes", colorHex: "#ff66cc", description: "Un espectáculo de colores." },
  { id: "turbo_omega", slot: "turbo", name: "Turbo Prohibido", rarity: "prohibido", price: 900, currency: "diamantes", colorHex: "#7d00ff", description: "Rompe las leyes de la física." },

  // Explosiones de gol
  { id: "gol_confeti", slot: "explosionGol", name: "Confeti", rarity: "comun", price: 200, currency: "monedas", colorHex: "#ffcc33", description: "Una lluvia de confeti al marcar." },
  { id: "gol_fuegos", slot: "explosionGol", name: "Fuegos Artificiales", rarity: "raro", price: 1500, currency: "monedas", colorHex: "#ff5500", description: "Fuegos artificiales en el campo." },
  { id: "gol_supernova", slot: "explosionGol", name: "Supernova", rarity: "secreto", price: 200, currency: "diamantes", colorHex: "#ff2fd1", description: "Una explosión de luz que ilumina todo el campo." },
  { id: "gol_divino", slot: "explosionGol", name: "Juicio Divino", rarity: "divino", price: 400, currency: "diamantes", colorHex: "#fff2c2", description: "Rayos de luz caen del cielo." },

  // Bocinas
  { id: "bocina_clasica", slot: "bocina", name: "Bocina Clásica", rarity: "comun", price: 0, currency: "monedas", description: "Sonido de claxon estándar." },
  { id: "bocina_risa", slot: "bocina", name: "Bocina Risa", rarity: "pocoComun", price: 400, currency: "monedas", description: "Suelta una carcajada." },
  { id: "bocina_epica", slot: "bocina", name: "Acorde Épico", rarity: "epico", price: 60, currency: "diamantes", description: "Un acorde orquestal dramático." },

  // Antenas (pequeño adorno sobre el cubo)
  { id: "antena_ninguna", slot: "antena", name: "Sin Antena", rarity: "comun", price: 0, currency: "monedas", description: "" },
  { id: "antena_bandera", slot: "antena", name: "Antena Bandera", rarity: "comun", price: 150, currency: "monedas", colorHex: "#ff3b3b", description: "Una pequeña bandera ondeante." },
  { id: "antena_cristal", slot: "antena", name: "Antena de Cristal", rarity: "epico", price: 1800, currency: "monedas", colorHex: "#66e0ff", description: "Brilla con luz interior." },
  { id: "antena_secreta", slot: "antena", name: "Antena del Vacío", rarity: "secreto", price: 300, currency: "diamantes", colorHex: "#ff2fd1", description: "Nadie sabe qué capta." },

  // Estelas
  { id: "estela_ninguna", slot: "estela", name: "Sin Estela", rarity: "comun", price: 0, currency: "monedas", description: "" },
  { id: "estela_humo", slot: "estela", name: "Estela de Humo", rarity: "pocoComun", price: 350, currency: "monedas", colorHex: "#aaaaaa", description: "Deja un rastro de humo." },
  { id: "estela_estrellas", slot: "estela", name: "Estela Estelar", rarity: "legendario", price: 100, currency: "diamantes", colorHex: "#fff6cc", description: "Un rastro de estrellas brillantes." },

  // Balones (para partidos)
  { id: "balon_clasico", slot: "balon", name: "Balón Clásico", rarity: "comun", price: 0, currency: "monedas", colorHex: "#ffffff", description: "El balón de siempre." },
  { id: "balon_electrico", slot: "balon", name: "Balón Eléctrico", rarity: "raro", price: 1000, currency: "monedas", colorHex: "#66e0ff", description: "Chispea al ser golpeado." },
  { id: "balon_dios", slot: "balon", name: "Balón de los Dioses", rarity: "dios", price: 220, currency: "diamantes", colorHex: "#ffdf6b", description: "Deja marcada la trayectoria en el aire." },

  // Títulos
  { id: "titulo_novato", slot: "titulo", name: "Novato de las Ruedas", rarity: "comun", price: 0, currency: "monedas", description: "" },
  { id: "titulo_explorador", slot: "titulo", name: "Explorador Incansable", rarity: "raro", price: 0, currency: "monedas", description: "Otorgado al completar varias etapas." },
  { id: "titulo_campeon", slot: "titulo", name: "Campeón Regional", rarity: "legendario", price: 0, currency: "monedas", description: "Otorgado al derrotar a un jefe de etapa." },
  { id: "titulo_eterno", slot: "titulo", name: "Piloto Eterno", rarity: "prohibido", price: 0, currency: "monedas", description: "Otorgado al derrotar al Campeón Eterno." },

  // Objetos exclusivos de la Ciudad Futurista
  { id: "estela_neon", slot: "estela", name: "Estela de Neón", rarity: "raro", price: 900, currency: "monedas", colorHex: "#ff2fd1", description: "Deja un rastro de neón rosa a tu paso." },
  { id: "bocina_sirena", slot: "bocina", name: "Sirena Futurista", rarity: "raro", price: 700, currency: "monedas", description: "Una sirena ensordecedora de la ciudad." },

  // Objetos exclusivos del Desierto Solar
  { id: "color_arena_dorada", slot: "color", name: "Arena Dorada", rarity: "pocoComun", price: 500, currency: "monedas", colorHex: "#e4c580", description: "El color de las dunas al atardecer." },
  { id: "rueda_bronce", slot: "rueda", name: "Borde de Bronce", rarity: "raro", price: 1300, currency: "monedas", colorHex: "#c98a3a", description: "Bronce antiguo pulido por la arena." },
  { id: "balon_sol", slot: "balon", name: "Balón Solar", rarity: "legendario", price: 90, currency: "diamantes", colorHex: "#ffb703", description: "Arde como el sol del desierto." },

  // Objetos exclusivos del Bosque Mágico
  { id: "color_musgo", slot: "color", name: "Verde Musgo", rarity: "pocoComun", price: 500, currency: "monedas", colorHex: "#4a7c3f", description: "El verde profundo del bosque." },
  { id: "estela_hojas", slot: "estela", name: "Estela de Hojas", rarity: "raro", price: 800, currency: "monedas", colorHex: "#6fcf6f", description: "Hojas mágicas flotan tras de ti." },
  { id: "bocina_pajaro", slot: "bocina", name: "Canto de Pájaro", rarity: "pocoComun", price: 350, currency: "monedas", description: "Un canto dulce del bosque." },

  // Objetos exclusivos de la Zona Volcánica
  { id: "color_lava", slot: "color", name: "Lava Fundida", rarity: "raro", price: 1300, currency: "monedas", colorHex: "#ff5a1f", description: "Aún caliente al tacto." },
  { id: "gol_erupcion", slot: "explosionGol", name: "Erupción", rarity: "legendario", price: 100, currency: "diamantes", colorHex: "#ff5500", description: "El campo entero tiembla al marcar." },

  // Objetos exclusivos del Reino Helado
  { id: "color_escarcha", slot: "color", name: "Escarcha Azul", rarity: "pocoComun", price: 500, currency: "monedas", colorHex: "#cdeeff", description: "Frío al tacto, brillante a la vista." },
  { id: "balon_nieve", slot: "balon", name: "Bola de Nieve", rarity: "raro", price: 900, currency: "monedas", colorHex: "#eaf9ff", description: "Deja un rastro helado." },
  { id: "bocina_viento", slot: "bocina", name: "Viento Helado", rarity: "pocoComun", price: 350, currency: "monedas", description: "El aullido del viento ártico." },

  // Objetos exclusivos de las Islas Flotantes
  { id: "color_cielo", slot: "color", name: "Cielo Infinito", rarity: "raro", price: 1200, currency: "monedas", colorHex: "#7fd1ff", description: "El azul interminable de las alturas." },
  { id: "antena_pluma", slot: "antena", name: "Pluma de Viento", rarity: "raro", price: 700, currency: "monedas", colorHex: "#ffffff", description: "Ligera como una pluma." },
  { id: "estela_nube", slot: "estela", name: "Estela de Nube", rarity: "epico", price: 60, currency: "diamantes", colorHex: "#ffffff", description: "Dejas nubes a tu paso." },

  // Objetos exclusivos del Laboratorio Tecnológico
  { id: "color_plasma", slot: "color", name: "Plasma Neón", rarity: "epico", price: 2300, currency: "monedas", colorHex: "#4dffe0", description: "Energía pura contenida en la pintura." },
  { id: "turbo_reactor", slot: "turbo", name: "Reactor Cuántico", rarity: "legendario", price: 85, currency: "diamantes", colorHex: "#4dffe0", description: "Tecnología experimental de propulsión." },
  { id: "bocina_robot", slot: "bocina", name: "Alarma de Robot", rarity: "raro", price: 750, currency: "monedas", description: "Bip bip. Alerta activada." },

  // Objetos exclusivos del Reino Celestial
  { id: "gol_bendicion", slot: "explosionGol", name: "Bendición Celestial", rarity: "divino", price: 350, currency: "diamantes", colorHex: "#fff2c2", description: "El cielo entero celebra tu gol." },
  { id: "estela_celestial", slot: "estela", name: "Estela Celestial", rarity: "divino", price: 250, currency: "diamantes", colorHex: "#ffe9a8", description: "Un rastro de luz dorada." },
];

export function itemsBySlot(slot: ItemSlot): ItemDef[] {
  return ITEMS.filter((i) => i.slot === slot);
}
export function getItem(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}
