import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "../entities/Car2D";
import { drawProp } from "./Stage2D";
import type { PropType } from "../data/stages";
import type { ZoneQuest, ZoneUnlockKind } from "../data/zoneQuests";
import { hashString, mulberry32 } from "../utils/random";

const HALF_W = 320;
const HALF_H = 260;

interface ZoneTheme {
  bg: string;
  floorA: string;
  floorB: string;
  propType: PropType;
  propColor: string;
  accent: string;
}

const THEMES: Record<ZoneUnlockKind, ZoneTheme> = {
  puente: { bg: "#1a0e08", floorA: "#3a1810", floorB: "#4a2016", propType: "roca", propColor: "#8a2a12", accent: "#ff5a3d" },
  generador: { bg: "#120c22", floorA: "#241a3a", floorB: "#2c2246", propType: "nube", propColor: "#c9a8ff", accent: "#d9b8ff" },
  resonancia: { bg: "#04141c", floorA: "#0f2a3a", floorB: "#123648", propType: "cristal", propColor: "#7bf2ff", accent: "#7bf2ff" },
};

interface Decor {
  x: number;
  y: number;
  scale: number;
  variant: number;
}

// Zona propia a la que se llega cruzando el puente / subiendo a la plataforma
// del generador / atravesando el domo de resonancia. Aquí vive el guardián,
// separado del mapa principal como una pequeña dimensión propia.
export class ZoneInterior2D {
  bounds = { minX: -HALF_W, maxX: HALF_W, minY: -HALF_H, maxY: HALF_H };
  guardianPos: [number, number] = [0, -150];
  exitPos: [number, number] = [0, 190];
  spawnPos: [number, number] = [0, 160];
  private t = 0;
  private decor: Decor[] = [];
  private theme: ZoneTheme;

  constructor(public zone: ZoneQuest) {
    this.theme = THEMES[zone.kind];
    const rng = mulberry32(hashString(zone.id + "_decor"));
    for (let i = 0; i < 10; i++) {
      const x = (rng() - 0.5) * HALF_W * 1.7;
      const y = (rng() - 0.5) * HALF_H * 1.6;
      if (Math.hypot(x, y - this.guardianPos[1]) < 80) continue;
      if (Math.abs(x) < 60 && y > HALF_H * 0.4) continue;
      this.decor.push({ x, y, scale: 0.7 + rng() * 0.7, variant: Math.floor(rng() * 3) });
    }
  }

  update(dt: number) {
    this.t += dt;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    ctx.fillStyle = this.theme.bg;
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);

    const [x0, y0] = camera.worldToScreen(this.bounds.minX, this.bounds.minY);
    const [x1, y1] = camera.worldToScreen(this.bounds.maxX, this.bounds.maxY);
    const w = x1 - x0;
    const h = y1 - y0;
    ctx.fillStyle = this.theme.floorA;
    ctx.fillRect(x0, y0, w, h);
    for (let gx = 0; gx < w; gx += 46) {
      for (let gy = 0; gy < h; gy += 46) {
        if (((gx / 46) | 0) % 2 === ((gy / 46) | 0) % 2) {
          ctx.fillStyle = this.theme.floorB;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(x0 + gx, y0 + gy, 46, 46);
          ctx.globalAlpha = 1;
        }
      }
    }
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 14;
    ctx.strokeRect(x0, y0, w, h);

    for (const d of this.decor) {
      const [sx, sy] = camera.worldToScreen(d.x, d.y);
      ctx.save();
      ctx.translate(sx, sy);
      drawProp(ctx, this.theme.propType, this.theme.propColor, d.scale, d.variant);
      ctx.restore();
    }

    const [gsx, gsy] = camera.worldToScreen(0, -40);
    const pulse = 0.3 + Math.sin(this.t * 1.6) * 0.1;
    const grad = ctx.createRadialGradient(gsx, gsy, 10, gsx, gsy, 220);
    grad.addColorStop(0, `${this.theme.accent}55`);
    grad.addColorStop(1, `${this.theme.accent}00`);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);
    ctx.restore();

    const [ex, ey] = camera.worldToScreen(this.exitPos[0], this.exitPos[1]);
    ctx.fillStyle = "#6b4a2a";
    roundRect(ctx, ex - 26, ey - 6, 52, 30, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SALIDA", ex, ey + 46);
  }
}
