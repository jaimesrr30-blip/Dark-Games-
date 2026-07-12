import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "../entities/Car2D";
import { STAGES, type StageDef, type StageId, type PropType } from "../data/stages";
import { stageBossGate, stageSpawnPoint, stageTrainingField } from "../data/spawns";
import { hashString, mulberry32 } from "../utils/random";

interface Prop {
  x: number;
  y: number;
  scale: number;
  variant: number;
}

function buildProps(stage: StageDef): Prop[] {
  if (stage.id === "hub") return [];
  const rng = mulberry32(hashString(stage.id + "_props"));
  const props: Prop[] = [];
  const count = 90;
  for (let i = 0; i < count; i++) {
    const x = (rng() - 0.5) * stage.width * 0.94;
    const y = (rng() - 0.5) * stage.height * 0.94;
    // deja un pasillo libre en el centro y cerca de los bordes de entrada/salida
    if (Math.abs(x) < 90 && Math.abs(y) < stage.height * 0.45) continue;
    if (Math.abs(y) > stage.height / 2 - 90) continue;
    props.push({ x, y, scale: 0.75 + rng() * 0.8, variant: Math.floor(rng() * 3) });
  }
  return props;
}

function drawProp(ctx: CanvasRenderingContext2D, type: PropType, color: string, scale: number, variant: number) {
  ctx.save();
  ctx.scale(scale, scale);
  switch (type) {
    case "arbol": {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 18, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(-4, 0, 8, 18);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -10, 16 + variant * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-10, 2, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(10, 2, 11, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "cactus": {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 16, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -6, -18, 12, 34, 6);
      ctx.fill();
      roundRect(ctx, -16, -6, 10, 16, 5);
      ctx.fill();
      roundRect(ctx, 6, -12, 10, 20, 5);
      ctx.fill();
      break;
    }
    case "roca": {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-18, 10);
      ctx.lineTo(-10, -14);
      ctx.lineTo(6, -18);
      ctx.lineTo(18, -2);
      ctx.lineTo(14, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,120,60,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case "cristal": {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 22);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case "nieve": {
      ctx.fillStyle = "rgba(150,200,230,0.3)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 4, 12, 0, Math.PI * 2);
      ctx.arc(-8, 12, 9, 0, Math.PI * 2);
      ctx.arc(8, 12, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "nube": {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(-10, 0, 12, 0, Math.PI * 2);
      ctx.arc(6, -4, 15, 0, Math.PI * 2);
      ctx.arc(18, 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case "tuberia": {
      ctx.fillStyle = color;
      roundRect(ctx, -7, -20, 14, 40, 5);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(-7, -20, 4, 40);
      break;
    }
    case "farola": {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(0, 22, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(-2, -20, 4, 42);
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.arc(0, -22, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

export class Stage2D {
  def: StageDef;
  props: Prop[];
  spawnPoint: [number, number];
  bossGatePos: [number, number];
  trainingFieldPos: [number, number];
  private t = 0;

  constructor(id: StageId) {
    this.def = STAGES[id];
    this.props = buildProps(this.def);
    this.spawnPoint = stageSpawnPoint(id);
    this.bossGatePos = stageBossGate(id);
    this.trainingFieldPos = stageTrainingField(id);
  }

  get bounds() {
    return { minX: -this.def.width / 2, maxX: this.def.width / 2, minY: -this.def.height / 2, maxY: this.def.height / 2 };
  }

  update(dt: number) {
    this.t += dt;
  }

  drawBackground(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    ctx.fillStyle = this.def.skyColor;
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);

    const b = this.bounds;
    const tile = 60;
    const startX = Math.floor((camera.x - camera.viewW / 2 - b.minX) / tile) * tile + b.minX;
    const startY = Math.floor((camera.y - camera.viewH / 2 - b.minY) / tile) * tile + b.minY;
    const endX = Math.min(b.maxX, camera.x + camera.viewW / 2 + tile);
    const endY = Math.min(b.maxY, camera.y + camera.viewH / 2 + tile);

    for (let gx = Math.max(b.minX, startX); gx < endX; gx += tile) {
      for (let gy = Math.max(b.minY, startY); gy < endY; gy += tile) {
        const ix = Math.round((gx - b.minX) / tile);
        const iy = Math.round((gy - b.minY) / tile);
        const checker = (ix + iy) % 2 === 0;
        ctx.fillStyle = checker ? this.def.groundColor : this.def.groundColorAlt;
        const [sx, sy] = camera.worldToScreen(gx, gy);
        ctx.fillRect(sx, sy, tile + 1, tile + 1);
      }
    }
  }

  drawBounds(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    const b = this.bounds;
    const [x0, y0] = camera.worldToScreen(b.minX, b.minY);
    const [x1, y1] = camera.worldToScreen(b.maxX, b.maxY);
    ctx.strokeStyle = this.def.accentColor;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.globalAlpha = 1;
  }

  drawProps(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const p of this.props) {
      if (!camera.isVisible(p.x, p.y, 60)) continue;
      const [sx, sy] = camera.worldToScreen(p.x, p.y);
      ctx.save();
      ctx.translate(sx, sy);
      drawProp(ctx, this.def.propType, this.def.propColor, p.scale, p.variant);
      ctx.restore();
    }
  }

  drawTrainingField(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    const [x, y] = this.trainingFieldPos;
    if (!camera.isVisible(x, y, 100)) return;
    const [sx, sy] = camera.worldToScreen(x, y);
    const pulse = 1 + Math.sin(this.t * 2) * 0.06;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(102,204,255,0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.font = "bold 12px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 3;
    ctx.fillText("CAMPO DE ENTRENAMIENTO", sx, sy - 46);
    ctx.shadowBlur = 0;
  }

  drawBossGate(ctx: CanvasRenderingContext2D, camera: Camera2D, unlocked: boolean, defeated: boolean) {
    if (this.def.id === "hub") return;
    const [x, y] = this.bossGatePos;
    if (!camera.isVisible(x, y, 120)) return;
    const [sx, sy] = camera.worldToScreen(x, y);
    ctx.save();
    ctx.translate(sx, sy);

    const color = defeated ? "#4caf50" : unlocked ? this.def.accentColor : "#555";
    ctx.globalAlpha = defeated ? 0.55 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 10, 46, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-46, 10);
    ctx.lineTo(-46, 50);
    ctx.moveTo(46, 10);
    ctx.lineTo(46, 50);
    ctx.stroke();

    if (unlocked || defeated) {
      const glow = 0.4 + Math.sin(this.t * 3) * 0.2;
      ctx.fillStyle = color;
      ctx.globalAlpha = defeated ? 0.25 : glow;
      ctx.beginPath();
      ctx.arc(0, 10, 40, Math.PI, 0);
      ctx.fill();
    } else {
      ctx.fillStyle = "#222";
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 10, 40, Math.PI, 0);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ccc";
      roundRect(ctx, -7, -12, 14, 12, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -16, 7, Math.PI, 0);
      ctx.strokeStyle = "#ccc";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = defeated ? "#4caf50" : unlocked ? "#ffe066" : "#aaa";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 3;
    ctx.fillText(defeated ? `${this.def.bossName} (derrotado)` : this.def.bossName, sx, sy - 62);
    ctx.shadowBlur = 0;
  }
}
