// El arsenal de la Armería de El Umbral: se compra por niveles (no es un
// cosmético de coche, es un objeto de utilidad) y cada nivel dispara más
// fuerte contra los monstruos que aparecen sueltos por la dimensión.
export interface WeaponTier {
  tier: number;
  id: string;
  name: string;
  damage: number;
  price: number;
  description: string;
}

export const WEAPON_TIERS: WeaponTier[] = [
  { tier: 1, id: "pistola_umbral", name: "Pistola del Umbral", damage: 14, price: 1500, description: "Recuperada de un viajero que no llegó muy lejos. Funciona." },
  { tier: 2, id: "escopeta_umbral", name: "Escopeta del Umbral", damage: 26, price: 5000, description: "Poca precisión, mucho argumento a corta distancia." },
  { tier: 3, id: "rifle_umbral", name: "Rifle del Umbral", damage: 42, price: 12000, description: "El arma más precisa que queda en pie en toda la estación." },
];

export function weaponForTier(tier: number): WeaponTier | undefined {
  return WEAPON_TIERS.find((w) => w.tier === tier);
}

export function nextWeaponTier(currentTier: number): WeaponTier | undefined {
  return weaponForTier(currentTier + 1);
}

export const AMMO_PRICE_PER_UNIT = 8;
export const AMMO_BATCH_SIZES = [20, 100];
