import type { Camera2D } from "../core/Camera2D";

export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Ball2D {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  radius = 14;
  private trail: { x: number; y: number }[] = [];

  constructor(public color: string) {}

  reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.trail = [];
  }

  update(dt: number, bounds: { minX: number; maxX: number; minY: number; maxY: number }, walls: WallRect[], goalGapY: [number, number]) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.992, dt * 60);
    this.vy *= Math.pow(0.992, dt * 60);

    if (this.y - this.radius < bounds.minY) {
      this.y = bounds.minY + this.radius;
      this.vy = Math.abs(this.vy) * 0.85;
    }
    if (this.y + this.radius > bounds.maxY) {
      this.y = bounds.maxY - this.radius;
      this.vy = -Math.abs(this.vy) * 0.85;
    }

    const inGoalGapLeft = this.y > goalGapY[0] && this.y < goalGapY[1];
    if (this.x - this.radius < bounds.minX && !inGoalGapLeft) {
      this.x = bounds.minX + this.radius;
      this.vx = Math.abs(this.vx) * 0.85;
    }
    if (this.x + this.radius > bounds.maxX && !inGoalGapLeft) {
      this.x = bounds.maxX - this.radius;
      this.vx = -Math.abs(this.vx) * 0.85;
    }

    for (const wall of walls) {
      this.collideWall(wall);
    }

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();
  }

  private collideWall(w: WallRect) {
    const closestX = Math.max(w.x, Math.min(this.x, w.x + w.w));
    const closestY = Math.max(w.y, Math.min(this.y, w.y + w.h));
    const dx = this.x - closestX;
    const dy = this.y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < this.radius * this.radius && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = this.radius - dist;
      this.x += nx * overlap;
      this.y += ny * overlap;
      const dot = this.vx * nx + this.vy * ny;
      this.vx -= 2 * dot * nx;
      this.vy -= 2 * dot * ny;
      this.vx *= 0.9;
      this.vy *= 0.9;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      const [sx, sy] = camera.worldToScreen(pt.x, pt.y);
      ctx.globalAlpha = (i / this.trail.length) * 0.25;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const [sx, sy] = camera.worldToScreen(this.x, this.y);
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
