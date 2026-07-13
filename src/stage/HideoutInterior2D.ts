import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "../entities/Car2D";
import type { HideoutSpawn } from "../data/spawns";

const HALF_W = 260;
const HALF_H = 200;

export class HideoutInterior2D {
  bounds = { minX: -HALF_W, maxX: HALF_W, minY: -HALF_H, maxY: HALF_H };
  enemyPos: [number, number] = [0, -60];
  exitPos: [number, number] = [0, 150];
  spawnPos: [number, number] = [0, 130];
  private t = 0;

  constructor(public hideout: HideoutSpawn) {}

  update(dt: number) {
    this.t += dt;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D, defeated = false) {
    ctx.fillStyle = "#140a0a";
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);

    const [x0, y0] = camera.worldToScreen(this.bounds.minX, this.bounds.minY);
    const [x1, y1] = camera.worldToScreen(this.bounds.maxX, this.bounds.maxY);
    const w = x1 - x0;
    const h = y1 - y0;

    ctx.fillStyle = "#2e1a1a";
    ctx.fillRect(x0, y0, w, h);
    for (let gx = 0; gx < w; gx += 40) {
      for (let gy = 0; gy < h; gy += 40) {
        if (((gx / 40) | 0) % 2 === ((gy / 40) | 0) % 2) {
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          ctx.fillRect(x0 + gx, y0 + gy, 40, 40);
        }
      }
    }
    ctx.strokeStyle = "#150c0c";
    ctx.lineWidth = 14;
    ctx.strokeRect(x0, y0, w, h);

    // puerta de salida
    const [ex, ey] = camera.worldToScreen(this.exitPos[0], this.exitPos[1]);
    ctx.fillStyle = "#6b4a2a";
    roundRect(ctx, ex - 26, ey - 6, 52, 30, 4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SALIDA", ex, ey + 46);

    // enemigo
    const [enx, eny] = camera.worldToScreen(this.enemyPos[0], this.enemyPos[1]);
    const bob = defeated ? 0 : Math.sin(this.t * 2.4) * 3;
    ctx.save();
    ctx.translate(enx, eny + bob);
    ctx.globalAlpha = defeated ? 0.4 : 1;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 24, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.hideout.enemyColor;
    roundRect(ctx, -18, -18, 36, 36, 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 2;
    roundRect(ctx, -18, -18, 36, 36, 7);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, -10, -10, 20, 14, 3);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 3;
    ctx.fillText(defeated ? "✔ Despejado" : this.hideout.enemyName, enx, eny - 36);
    ctx.shadowBlur = 0;
  }
}
