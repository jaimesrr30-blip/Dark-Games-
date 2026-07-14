import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "../entities/Car2D";
import type { ParkourChallenge, VoidBand, GateHazard, LaserHazard } from "../data/parkour";

export type ParkourStatus = "ongoing" | "dead" | "success";

interface BandState {
  band: VoidBand;
  steppedAt: number | null;
  collapsed: boolean;
}

const PLAYER_RADIUS = 20;
const GOAL_RADIUS = 55;

// Motor genérico para los 3 tipos de desafíos de parkour letales de los
// mundos de espacio profundo: plataformas que colapsan, compuertas de vacío
// sincronizadas, y salas de láseres rotatorios. Un solo contacto con el
// peligro (o pisar el vacío) mata; llegar a la meta entrega la llave.
export class ParkourArena2D {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  status: ParkourStatus = "ongoing";
  t = 0;
  collectibleTaken = false;
  private bandStates: BandState[] = [];

  constructor(public challenge: ParkourChallenge, collectibleAlreadyOwned: boolean) {
    const hw = challenge.width / 2;
    const hh = challenge.height / 2;
    this.bounds = { minX: -hw, maxX: hw, minY: -hh, maxY: hh };
    this.bandStates = (challenge.bands ?? []).map((band) => ({ band, steppedAt: null, collapsed: false }));
    this.collectibleTaken = collectibleAlreadyOwned;
  }

  private gateOpen(g: GateHazard): boolean {
    const phase = (this.t + g.phase) % g.period;
    return phase < g.period / 2;
  }

  private laserAngle(l: LaserHazard): number {
    return l.phase + this.t * l.angularSpeed;
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;
    return Math.hypot(px - cx, py - cy);
  }

  private inSafeZone(x: number, y: number): boolean {
    const c = this.challenge;
    if (Math.hypot(x - c.spawnPos[0], y - c.spawnPos[1]) < 110) return true;
    if (Math.hypot(x - c.goalPos[0], y - c.goalPos[1]) < 110) return true;
    return false;
  }

  private onSolidGround(x: number, y: number): boolean {
    if (this.challenge.kind !== "plataformas") return true;
    if (this.inSafeZone(x, y)) return true;
    for (const bs of this.bandStates) {
      if (y > bs.band.minY && y < bs.band.maxY) {
        if (!bs.collapsed && x > bs.band.platX0 && x < bs.band.platX1) return true;
        return false;
      }
    }
    return true;
  }

  update(dt: number, playerX: number, playerY: number) {
    if (this.status !== "ongoing") return;
    this.t += dt;

    if (this.challenge.kind === "plataformas") {
      for (const bs of this.bandStates) {
        if (bs.collapsed) continue;
        const onPlatform = playerY > bs.band.minY && playerY < bs.band.maxY && playerX > bs.band.platX0 && playerX < bs.band.platX1;
        if (onPlatform) {
          if (bs.steppedAt === null) bs.steppedAt = this.t;
          else if (this.t - bs.steppedAt >= bs.band.collapseAfter) bs.collapsed = true;
        } else {
          bs.steppedAt = null;
        }
      }
      if (!this.onSolidGround(playerX, playerY)) {
        this.status = "dead";
        return;
      }
    } else if (this.challenge.kind === "compuertas") {
      for (const g of this.challenge.gates ?? []) {
        if (this.gateOpen(g)) continue;
        if (playerY > g.y - g.h / 2 - PLAYER_RADIUS && playerY < g.y + g.h / 2 + PLAYER_RADIUS) {
          this.status = "dead";
          return;
        }
      }
    } else if (this.challenge.kind === "laseres") {
      for (const l of this.challenge.lasers ?? []) {
        const ang = this.laserAngle(l);
        const ex = l.pivot[0] + Math.cos(ang) * l.length;
        const ey = l.pivot[1] + Math.sin(ang) * l.length;
        const d = this.distToSegment(playerX, playerY, l.pivot[0], l.pivot[1], ex, ey);
        if (d < PLAYER_RADIUS + 6) {
          this.status = "dead";
          return;
        }
      }
    }

    if (
      this.challenge.collectibleId &&
      !this.collectibleTaken &&
      this.challenge.collectiblePos &&
      Math.hypot(playerX - this.challenge.collectiblePos[0], playerY - this.challenge.collectiblePos[1]) < 36
    ) {
      this.collectibleTaken = true;
    }

    if (Math.hypot(playerX - this.challenge.goalPos[0], playerY - this.challenge.goalPos[1]) < GOAL_RADIUS) {
      this.status = "success";
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    ctx.fillStyle = "#05040a";
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);

    const [x0, y0] = camera.worldToScreen(this.bounds.minX, this.bounds.minY);
    const [x1, y1] = camera.worldToScreen(this.bounds.maxX, this.bounds.maxY);
    ctx.fillStyle = "#14100c";
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = "#c9701f";
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 10;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.globalAlpha = 1;

    this.drawSafeZone(ctx, camera, this.challenge.spawnPos, "INICIO");
    this.drawSafeZone(ctx, camera, this.challenge.goalPos, "META");

    if (this.challenge.kind === "plataformas") this.drawPlatforms(ctx, camera);
    else if (this.challenge.kind === "compuertas") this.drawGates(ctx, camera);
    else if (this.challenge.kind === "laseres") this.drawLasers(ctx, camera);

    if (this.challenge.collectibleId && this.challenge.collectiblePos && !this.collectibleTaken) {
      const [sx, sy] = camera.worldToScreen(this.challenge.collectiblePos[0], this.challenge.collectiblePos[1]);
      const bob = Math.sin(this.t * 3) * 4;
      ctx.save();
      ctx.translate(sx, sy + bob);
      ctx.fillStyle = "#8fd3ff";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.font = "bold 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 3;
      ctx.fillText(this.challenge.collectibleLabel ?? "Objeto", sx, sy - 26);
      ctx.shadowBlur = 0;
    }
  }

  private drawSafeZone(ctx: CanvasRenderingContext2D, camera: Camera2D, pos: [number, number], label: string) {
    const [sx, sy] = camera.worldToScreen(pos[0], pos[1]);
    ctx.save();
    ctx.fillStyle = "rgba(120,200,140,0.18)";
    ctx.beginPath();
    ctx.arc(sx, sy, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,220,140,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    ctx.font = "bold 11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#bfe6c8";
    ctx.fillText(label, sx, sy + 5);
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const bs of this.bandStates) {
      const b = bs.band;
      // vacío a ambos lados de la plataforma dentro de la banda
      const [vx0, vy0] = camera.worldToScreen(this.bounds.minX, b.minY);
      const [vx1, vy1] = camera.worldToScreen(this.bounds.maxX, b.maxY);
      ctx.fillStyle = "#000";
      ctx.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
      // estrellas en el vacío
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 8; i++) {
        const sx = vx0 + ((i * 53) % Math.max(1, vx1 - vx0));
        const sy = vy0 + ((i * 29) % Math.max(1, vy1 - vy0));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      if (bs.collapsed) continue;
      const [px0, py0] = camera.worldToScreen(b.platX0, b.minY);
      const [px1, py1] = camera.worldToScreen(b.platX1, b.maxY);
      const standing = bs.steppedAt !== null;
      const warn = standing ? Math.min(1, (this.t - (bs.steppedAt ?? 0)) / b.collapseAfter) : 0;
      ctx.fillStyle = warn > 0.5 ? `rgba(255,${Math.round(90 - warn * 60)},60,0.9)` : "#8a4a1f";
      roundRect(ctx, px0, py0, px1 - px0, py1 - py0, 6);
      ctx.fill();
      ctx.strokeStyle = warn > 0.5 ? "#ff5a3d" : "#c9701f";
      ctx.lineWidth = 3;
      roundRect(ctx, px0, py0, px1 - px0, py1 - py0, 6);
      ctx.stroke();
      if (standing) {
        ctx.fillStyle = "#fff";
        ctx.font = "900 12px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.max(0, b.collapseAfter - (this.t - (bs.steppedAt ?? 0))).toFixed(1)}s`, (px0 + px1) / 2, (py0 + py1) / 2 + 4);
      }
    }
  }

  private drawGates(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const g of this.challenge.gates ?? []) {
      const open = this.gateOpen(g);
      const [x0, y0] = camera.worldToScreen(this.bounds.minX, g.y - g.h / 2);
      const [x1, y1] = camera.worldToScreen(this.bounds.maxX, g.y + g.h / 2);
      ctx.fillStyle = open ? "rgba(120,220,255,0.18)" : "rgba(255,70,50,0.75)";
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = open ? "#66ccff" : "#ff3b3b";
      ctx.lineWidth = 4;
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      ctx.font = "900 13px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 3;
      ctx.fillText(open ? "ABIERTA" : "CERRADA", (x0 + x1) / 2, (y0 + y1) / 2 + 4);
      ctx.shadowBlur = 0;
    }
  }

  private drawLasers(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const l of this.challenge.lasers ?? []) {
      const ang = this.laserAngle(l);
      const ex = l.pivot[0] + Math.cos(ang) * l.length;
      const ey = l.pivot[1] + Math.sin(ang) * l.length;
      const [px, py] = camera.worldToScreen(l.pivot[0], l.pivot[1]);
      const [sx, sy] = camera.worldToScreen(ex, ey);
      ctx.save();
      ctx.strokeStyle = "#ff3b3b";
      ctx.shadowColor = "#ff3b3b";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#8a2020";
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
