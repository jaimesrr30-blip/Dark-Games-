import type { WallRect } from "./Ball2D";
import { mulberry32 } from "../utils/random";

// Genera obstáculos simétricos (izquierda/derecha) tipo laberinto para la arena de jefe.
// Deja siempre un carril central libre para que el balón y los coches puedan cruzar.
export function generateMaze(seed: number, halfW: number, halfH: number): WallRect[] {
  const rng = mulberry32(seed);
  const walls: WallRect[] = [];
  const cols = 3;
  const rows = 4;
  const cellW = (halfW - 260) / cols;
  const cellH = (halfH * 2 - 240) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > 0.55) continue;
      const w = cellW * (0.5 + rng() * 0.35);
      const h = cellH * (0.25 + rng() * 0.2);
      const cx = 140 + c * cellW + cellW / 2;
      const cy = -halfH + 120 + r * cellH + cellH / 2;
      const rect: WallRect = { x: cx - w / 2, y: cy - h / 2, w, h };
      walls.push(rect);
      // espejo hacia el lado izquierdo para simetría
      walls.push({ x: -rect.x - rect.w, y: rect.y, w: rect.w, h: rect.h });
    }
  }
  return walls;
}
