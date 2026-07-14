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

interface Landmark {
  stage: StageId;
  pos: [number, number];
  type: "fogata" | "fuente" | "estatua" | "choza";
}

// Decoraciones fijas (no aleatorias) que dan personalidad a puntos concretos del mapa:
// una fogata junto al Druida Finn, una fuente en la Plaza Central, estatuas en las
// grandes plazas de Ciudad Futurista y el Reino Celestial, y chozas/puestos junto a
// los NPCs de los planetas para que no parezca decoración puesta al azar.
const LANDMARKS: Landmark[] = [
  { stage: "hub", pos: [0, 0], type: "fuente" },
  { stage: "bosque", pos: [-268, 176], type: "fogata" },
  { stage: "ciudad", pos: [0, 0], type: "estatua" },
  { stage: "celestial", pos: [0, 0], type: "estatua" },

  { stage: "planeta_escarlata", pos: [-330, 260], type: "choza" },
  { stage: "planeta_escarlata", pos: [820, -640], type: "choza" },
  { stage: "planeta_anillos", pos: [-340, -100], type: "choza" },
  { stage: "planeta_anillos", pos: [920, 580], type: "choza" },
  { stage: "planeta_cristal", pos: [-320, 240], type: "choza" },
  { stage: "planeta_cristal", pos: [870, -720], type: "choza" },
];

function buildProps(stage: StageDef): Prop[] {
  const rng = mulberry32(hashString(stage.id + "_props"));
  const props: Prop[] = [];
  const baseArea = 2200 * 1600;
  const count = Math.round((stage.id === "hub" ? 55 : 90) * ((stage.width * stage.height) / baseArea));
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

export function drawProp(ctx: CanvasRenderingContext2D, type: PropType, color: string, scale: number, variant: number) {
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

function drawLandmark(ctx: CanvasRenderingContext2D, type: Landmark["type"], t: number, accentColor: string) {
  ctx.save();
  switch (type) {
    case "choza": {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(0, 34, 42, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a2430";
      roundRect(ctx, -34, -6, 68, 42, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      roundRect(ctx, -34, -6, 68, 42, 4);
      ctx.stroke();
      ctx.fillStyle = "#181420";
      ctx.beginPath();
      ctx.moveTo(-42, -4);
      ctx.lineTo(0, -44);
      ctx.lineTo(42, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
      const glow = 0.55 + Math.sin(t * 2.4) * 0.25;
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = glow;
      roundRect(ctx, -8, 6, 16, 14, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#3a3244";
      roundRect(ctx, 14, 8, 12, 26, 2);
      ctx.fill();
      break;
    }
    case "fuente": {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 60, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#8892a8";
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      const shimmer = 0.6 + Math.sin(t * 2) * 0.15;
      ctx.fillStyle = `rgba(120,200,255,${shimmer})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 42, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6a7690";
      roundRect(ctx, -8, -46, 16, 44, 4);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 1.5;
        const spray = 6 + Math.sin(t * 4 + i) * 3;
        ctx.fillStyle = "rgba(180,225,255,0.7)";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * spray, -46 - Math.abs(Math.sin(t * 3 + i)) * 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "fogata": {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#5a3a1e";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(16, -6);
      ctx.moveTo(16, 10);
      ctx.lineTo(-16, -6);
      ctx.stroke();
      const flicker = 0.85 + Math.sin(t * 9) * 0.15;
      const grad = ctx.createRadialGradient(0, -6, 2, 0, -6, 26 * flicker);
      grad.addColorStop(0, "rgba(255,240,180,0.9)");
      grad.addColorStop(0.5, "rgba(255,140,40,0.55)");
      grad.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -6, 26 * flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffcf6b";
      ctx.beginPath();
      ctx.moveTo(0, -10 - Math.sin(t * 8) * 4);
      ctx.quadraticCurveTo(9, -2, 0, 10);
      ctx.quadraticCurveTo(-9, -2, 0, -10 - Math.sin(t * 8) * 4);
      ctx.fill();
      break;
    }
    case "estatua": {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(0, 44, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7a7f8c";
      roundRect(ctx, -30, 20, 60, 20, 4);
      ctx.fill();
      ctx.fillStyle = "#9aa0ac";
      roundRect(ctx, -16, -30, 32, 52, 5);
      ctx.fill();
      ctx.fillStyle = "#c7ccd6";
      roundRect(ctx, -10, -46, 20, 18, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      roundRect(ctx, -16, -30, 32, 52, 5);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

export class Stage2D {
  def: StageDef;
  props: Prop[];
  landmarks: Landmark[];
  spawnPoint: [number, number];
  bossGatePos: [number, number];
  trainingFieldPos: [number, number];
  private t = 0;

  constructor(id: StageId) {
    this.def = STAGES[id];
    this.props = buildProps(this.def);
    this.landmarks = LANDMARKS.filter((l) => l.stage === id);
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

  drawLandmarks(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const l of this.landmarks) {
      if (!camera.isVisible(l.pos[0], l.pos[1], 90)) continue;
      const [sx, sy] = camera.worldToScreen(l.pos[0], l.pos[1]);
      ctx.save();
      ctx.translate(sx, sy);
      drawLandmark(ctx, l.type, this.t, this.def.accentColor);
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
