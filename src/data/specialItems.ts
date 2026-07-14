// Objetos narrativos especiales: no son cosméticos ni llaves, pero el
// jugador los lleva encima y se muestran en la pestaña "Equipo" del
// inventario mientras los tenga. Algunos no hacen nada... todavía.
export interface SpecialItemDef {
  id: string;
  name: string;
  description: string;
}

export const SPECIAL_ITEMS: SpecialItemDef[] = [
  {
    id: "cronometro_roto",
    name: "Cronómetro Roto",
    description: "No marca ninguna hora. Pesa más de lo que debería. El anciano dijo que algún día recordaría para qué sirve.",
  },
  {
    id: "reloj_del_vacio",
    name: "Reloj del Vacío",
    description: "El cronómetro absorbió la energía del Sol y despertó. Una vez, cuando todo esté perdido, podrá detener el tiempo diez segundos.",
  },
];

export function specialItem(id: string): SpecialItemDef | undefined {
  return SPECIAL_ITEMS.find((i) => i.id === id);
}
