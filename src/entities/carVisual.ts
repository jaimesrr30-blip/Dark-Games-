import type { CarVisual2D } from "./Car2D";
import { getItem } from "../data/items";
import type { GameState } from "../state/GameState";

export function visualFromState(gs: GameState): CarVisual2D {
  const color = getItem(gs.data.equipped.color);
  const rueda = getItem(gs.data.equipped.rueda);
  const turbo = getItem(gs.data.equipped.turbo);
  const antena = getItem(gs.data.equipped.antena);
  return {
    bodyColor: gs.data.carColor,
    bodyColor2: color?.colorHex2,
    borderColor: rueda?.colorHex ?? "#222222",
    borderColor2: rueda?.colorHex2,
    turboColor: turbo?.colorHex ?? "#66ccff",
    antennaColor: antena && antena.id !== "antena_ninguna" ? antena.colorHex ?? "#ffffff" : null,
  };
}
