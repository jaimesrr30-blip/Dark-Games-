import type { Camera2D } from "../core/Camera2D";

export interface CarVisual2D {
  bodyColor: string;
  borderColor: string;
  turboColor: string;
  antennaColor: string | null;
}

export interface Bounds2D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const SIZE = 34;

export class CarBody2D {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  facing = 1; // 1 = derecha, -1 = izquierda (para el pequeño indicador direccional)
  boostFuel = 1;
  boostRegenMult = 1;
  size = SIZE;
  private bobT = Math.random() * 10;

  constructor(public visual: CarVisual2D) {}

  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
  }

  update(dt: number, input: { x: number; y: number; boost: boolean }, bounds?: Bounds2D, maxSpeedMult = 1) {
    const len = Math.hypot(input.x, input.y);
    const nx = len > 0 ? input.x / len : 0;
    const ny = len > 0 ? input.y / len : 0;

    const boosting = input.boost && this.boostFuel > 0.02;
    // constantes ajustadas para que la velocidad de equilibrio (aceleración vs fricción)
    // ronde realmente ~260 u/s normal y ~440 u/s con turbo, no solo un techo inalcanzable.
    const baseAccel = 2200 * maxSpeedMult;
    const accel = boosting ? baseAccel * 1.7 : baseAccel;
    const maxSpeed = 500 * maxSpeedMult * (boosting ? 1.7 : 1); // techo de seguridad, no se alcanza en juego normal

    this.vx += nx * accel * dt;
    this.vy += ny * accel * dt;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    const friction = Math.pow(len > 0 ? 0.86 : 0.82, dt * 60);
    this.vx *= friction;
    this.vy *= friction;

    if (boosting) {
      this.boostFuel = Math.max(0, this.boostFuel - dt * 0.4);
    } else {
      this.boostFuel = Math.min(1, this.boostFuel + dt * 0.25 * this.boostRegenMult);
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (bounds) {
      const half = this.size / 2;
      if (this.x < bounds.minX + half) { this.x = bounds.minX + half; this.vx = 0; }
      if (this.x > bounds.maxX - half) { this.x = bounds.maxX - half; this.vx = 0; }
      if (this.y < bounds.minY + half) { this.y = bounds.minY + half; this.vy = 0; }
      if (this.y > bounds.maxY - half) { this.y = bounds.maxY - half; this.vy = 0; }
    }

    if (Math.abs(this.vx) > 8) this.facing = this.vx > 0 ? 1 : -1;
    this.bobT += dt * (4 + speed * 0.01);
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera2D, isMoving: boolean) {
    const [sx, sy] = camera.worldToScreen(this.x, this.y);
    const s = this.size;
    const bob = isMoving ? Math.sin(this.bobT) * 1.5 : 0;

    ctx.save();
    ctx.translate(sx, sy + bob);

    // sombra
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, s * 0.42, s * 0.42, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // estela de turbo
    if (this.speed > 40) {
      const boosting = this.boostFuel < 0.98;
      ctx.fillStyle = this.visual.turboColor;
      ctx.globalAlpha = boosting ? 0.55 : 0.28;
      const tailLen = boosting ? 22 : 12;
      const dirX = this.vx !== 0 || this.vy !== 0 ? -this.vx / (this.speed || 1) : -this.facing;
      const dirY = this.vx !== 0 || this.vy !== 0 ? -this.vy / (this.speed || 1) : 0;
      ctx.beginPath();
      ctx.ellipse(dirX * tailLen, dirY * tailLen, s * 0.28, s * 0.18, Math.atan2(dirY, dirX), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // cuerpo (cubo visto desde arriba)
    const r = 8;
    ctx.fillStyle = this.visual.bodyColor;
    roundRect(ctx, -s / 2, -s / 2, s, s, r);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.visual.borderColor;
    roundRect(ctx, -s / 2, -s / 2, s, s, r);
    ctx.stroke();

    // ventanas/luces (para dar orientación aunque sea un cubo)
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, -s * 0.28, -s * 0.28, s * 0.56, s * 0.4, 4);
    ctx.fill();

    // antena
    if (this.visual.antennaColor) {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s / 2);
      ctx.lineTo(-s * 0.34, -s / 2 - 10);
      ctx.stroke();
      ctx.fillStyle = this.visual.antennaColor;
      ctx.beginPath();
      ctx.arc(-s * 0.34, -s / 2 - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
