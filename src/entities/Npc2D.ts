import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "./Car2D";
import type { NpcDef } from "../data/npcs";

export class Npc2DInstance {
  private t = Math.random() * 10;
  size = 30;

  constructor(public def: NpcDef, public x: number, public y: number) {}

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D, dt: number, hasContent: boolean) {
    if (!camera.isVisible(this.x, this.y)) {
      this.t += dt;
      return;
    }
    this.t += dt;
    const [sx, sy] = camera.worldToScreen(this.x, this.y);
    const bob = Math.sin(this.t * 1.6) * 2;
    const s = this.size;

    ctx.save();
    ctx.translate(sx, sy + bob);

    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, s * 0.5, s * 0.4, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.def.color;
    roundRect(ctx, -s / 2, -s / 2, s, s, 7);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, -s / 2, -s / 2, s, s, 7);
    ctx.stroke();

    // ojitos simples
    ctx.fillStyle = "#12141a";
    ctx.fillRect(-s * 0.2, -s * 0.08, 4, 6);
    ctx.fillRect(s * 0.2 - 4, -s * 0.08, 4, 6);

    // traje espacial: burbuja de casco translúcida sobre el cubo
    if (this.def.suited) {
      ctx.strokeStyle = "rgba(232,244,255,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -s * 0.05, s * 0.66, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(200,230,255,0.14)";
      ctx.fill();
    }

    ctx.restore();

    // nombre
    ctx.font = "bold 11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 3;
    ctx.fillText(this.def.name, sx, sy - s / 2 - 10 + bob);
    ctx.shadowBlur = 0;

    if (hasContent) {
      const markerBob = Math.sin(this.t * 3) * 3;
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.moveTo(sx, sy - s / 2 - 30 + markerBob);
      ctx.lineTo(sx - 6, sy - s / 2 - 20 + markerBob);
      ctx.lineTo(sx + 6, sy - s / 2 - 20 + markerBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#7a5c00";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}
