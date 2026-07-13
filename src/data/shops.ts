// Catálogo curado por tienda: cada NPC vendedor de cada etapa ofrece objetos
// distintos y temáticos, en vez de repetir el catálogo completo en todas partes.
export const SHOP_CATALOGS: Record<string, string[]> = {
  shop_ciudad: [
    "color_holografico",
    "rueda_neon",
    "turbo_arcoiris",
    "antena_cristal",
    "estela_neon",
    "bocina_sirena",
    "bocina_epica",
  ],
  shop_desierto: [
    "color_arena_dorada",
    "rueda_bronce",
    "balon_sol",
    "turbo_llamas",
    "antena_bandera",
    "bocina_risa",
  ],
  shop_bosque: [
    "color_musgo",
    "estela_hojas",
    "bocina_pajaro",
    "color_esmeralda",
    "rueda_deportiva",
    "estela_humo",
  ],
  shop_volcan: [
    "color_lava",
    "gol_erupcion",
    "turbo_llamas",
    "gol_fuegos",
    "color_rojo",
  ],
  shop_helado: [
    "color_escarcha",
    "balon_nieve",
    "bocina_viento",
    "rueda_celestial",
    "color_azul",
  ],
  shop_islas: [
    "color_cielo",
    "antena_pluma",
    "estela_nube",
    "rueda_celestial",
    "balon_electrico",
  ],
  shop_laboratorio: [
    "color_plasma",
    "turbo_reactor",
    "bocina_robot",
    "antena_secreta",
    "balon_electrico",
  ],
  shop_celestial: [
    "color_dorado",
    "gol_bendicion",
    "estela_celestial",
    "balon_dios",
    "color_sangre_divina",
  ],
};

export function shopCatalog(shopId: string): string[] {
  return SHOP_CATALOGS[shopId] ?? [];
}
