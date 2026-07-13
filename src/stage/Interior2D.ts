import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "../entities/Car2D";
import type { SecretDoorSpawn } from "../data/spawns";

const HALF_W = 260;
const HALF_H = 200;

export class Interior2D {
  bounds = { minX: -HALF_W, maxX: HALF_W, minY: -HALF_H, maxY: HALF_H };
  chestPos: [number, number] = [0, -60];
  exitPos: [number, number] = [0, 150];
  spawnPos: [number, number] = [0, 130];
  private t = 0;

  constructor(public door: SecretDoorSpawn) {}

  update(dt: number) {
    this.t += dt;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);

    const [x0, y0] = camera.worldToScreen(this.bounds.minX, this.bounds.minY);
    const [x1, y1] = camera.worldToScreen(this.bounds.maxX, this.bounds.maxY);
    const w = x1 - x0;
    const h = y1 - y0;

    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(x0, y0, w, h);
    for (let gx = 0; gx < w; gx += 40) {
      for (let gy = 0; gy < h; gy += 40) {
        if (((gx / 40) | 0) % 2 === ((gy / 40) | 0) % 2) {
          ctx.fillStyle = "rgba(0,0,0,0.08)";
          ctx.fillRect(x0 + gx, y0 + gy, 40, 40);
        }
      }
    }
    ctx.strokeStyle = "#12100c";
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

    // cofre
    const [cx, cy] = camera.worldToScreen(this.chestPos[0], this.chestPos[1]);
    const bob = Math.sin(this.t * 2) * 3;
    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 20, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b4a2a";
    roundRect(ctx, -22, -8, 44, 26, 5);
    ctx.fill();
    ctx.fillStyle = "#ffcc33";
    roundRect(ctx, -23, -20, 46, 14, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    roundRect(ctx, -22, -8, 44, 26, 5);
    ctx.stroke();
    ctx.restore();
  }
}
