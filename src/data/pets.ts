import { RARITIES, type Rarity, rollRarity } from "./rarity";

export type PetPowerType =
  | "turboRecarga" // recarga el boost más rápido
  | "golpeFuerte" // más fuerza al golpear el balón
  | "efectoCurva" // permite curvar el balón
  | "saltoAlto" // salto más alto para jugadas aéreas
  | "escudoGol" // reduce el impulso de los disparos rivales cerca de tu portería
  | "iman"; // atrae ligeramente el balón hacia el coche

export interface PetArchetype {
  id: string;
  name: string;
  power: PetPowerType;
  shape: "cubo" | "icosaedro" | "esfera" | "octaedro";
  description: string;
}

export const PET_ARCHETYPES: PetArchetype[] = [
  { id: "chispa", name: "Chispa", power: "turboRecarga", shape: "icosaedro", description: "Un pequeño espíritu eléctrico que recarga tu turbo más rápido." },
  { id: "golpetazo", name: "Golpetazo", power: "golpeFuerte", shape: "cubo", description: "Da más fuerza a cada golpe al balón." },
  { id: "espiral", name: "Espiral", power: "efectoCurva", shape: "octaedro", description: "Te permite curvar el balón en el aire." },
  { id: "saltarin", name: "Saltarín", power: "saltoAlto", shape: "esfera", description: "Aumenta la altura de tus saltos para jugadas aéreas." },
  { id: "guardian", name: "Guardián", power: "escudoGol", shape: "cubo", description: "Reduce la potencia de los disparos rivales cerca de tu portería." },
  { id: "magneto", name: "Magneto", power: "iman", shape: "icosaedro", description: "Atrae ligeramente el balón hacia tu coche." },
];

export interface OwnedPet {
  uid: string;
  archetypeId: string;
  rarity: Rarity;
  nickname?: string;
}

// La magnitud del poder de una mascota escala con la rareza (multiplicador de RARITIES).
const BASE_POWER: Record<PetPowerType, number> = {
  turboRecarga: 0.15, // +% velocidad de recarga de turbo
  golpeFuerte: 0.12, // +% fuerza de golpeo
  efectoCurva: 0.2, // fuerza de curva máxima
  saltoAlto: 0.15, // +% altura de salto
  escudoGol: 0.18, // -% potencia de disparos rivales
  iman: 0.1, // radio/fuerza de atracción
};

export function petPowerValue(pet: OwnedPet): number {
  const arche = PET_ARCHETYPES.find((a) => a.id === pet.archetypeId);
  if (!arche) return 0;
  const base = BASE_POWER[arche.power];
  const mult = RARITIES[pet.rarity].powerMultiplier;
  return base * mult;
}

let petUidCounter = 1;
export function rollNewPet(luckBonus = 0, forcedArchetype?: string): OwnedPet {
  const archetype = forcedArchetype ?? PET_ARCHETYPES[Math.floor(Math.random() * PET_ARCHETYPES.length)].id;
  const rarity = rollRarity(luckBonus);
  return { uid: `pet_${Date.now()}_${petUidCounter++}`, archetypeId: archetype, rarity };
}
