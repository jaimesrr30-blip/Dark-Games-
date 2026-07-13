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
    "gol_neon",
  ],
  shop_desierto: [
    "color_arena_dorada",
    "rueda_bronce",
    "balon_sol",
    "turbo_llamas",
    "antena_bandera",
    "bocina_risa",
    "gol_tormenta_arena",
  ],
  shop_bosque: [
    "color_musgo",
    "estela_hojas",
    "bocina_pajaro",
    "color_esmeralda",
    "rueda_deportiva",
    "estela_humo",
    "gol_hojas_magicas",
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
    "gol_ventisca",
  ],
  shop_islas: [
    "color_cielo",
    "antena_pluma",
    "estela_nube",
    "rueda_celestial",
    "balon_electrico",
    "gol_aurora",
  ],
  shop_laboratorio: [
    "color_plasma",
    "turbo_reactor",
    "bocina_robot",
    "antena_secreta",
    "balon_electrico",
    "gol_datos",
  ],
  shop_celestial: [
    "color_dorado",
    "gol_bendicion",
    "gol_divino",
    "estela_celestial",
    "balon_dios",
    "color_sangre_divina",
  ],
  shop_planeta_escarlata: [
    "color_lava_marciana",
    "rueda_canon",
    "gol_impacto_meteorito",
    "turbo_marciano",
    "estela_polvo_rojo",
  ],
  shop_planeta_anillos: [
    "color_nebulosa",
    "rueda_anillo_kaion",
    "gol_supernova_kaion",
    "antena_anillo",
    "balon_nebula",
  ],
  shop_planeta_cristal: [
    "color_prisma_viviente",
    "rueda_resonancia",
    "gol_eco_cristal",
    "estela_cristalina",
    "bocina_resonante",
  ],
};

export function shopCatalog(shopId: string): string[] {
  return SHOP_CATALOGS[shopId] ?? [];
}
