import { roundRect, type CarVisual2D } from "../entities/Car2D";

export class GaragePreview2D {
  private ctx: CanvasRenderingContext2D;
  private rotation = 0;
  private resizeObserver: ResizeObserver;
  private visual: CarVisual2D = { bodyColor: "#ffffff", borderColor: "#222", turboColor: "#66ccff", antennaColor: null };

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setCar(visual: CarVisual2D) {
    this.visual = visual;
  }

  render(dt: number) {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) / 1.3);
    grad.addColorStop(0, "#232c40");
    grad.addColorStop(1, "#080b12");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // plataforma
    ctx.save();
    ctx.translate(w / 2, h / 2 + 40);
    ctx.scale(1, 0.35);
    ctx.fillStyle = "#1c2333";
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    this.rotation += dt * 0.6;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    const s = Math.min(w, h) * 0.34;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, s * 0.55, s * 0.55, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(Math.sin(this.rotation) * 0.5);

    const r = s * 0.22;
    ctx.fillStyle = this.visual.bodyColor;
    roundRect(ctx, -s / 2, -s / 2, s, s, r);
    ctx.fill();
    ctx.lineWidth = Math.max(3, s * 0.06);
    ctx.strokeStyle = this.visual.borderColor;
    roundRect(ctx, -s / 2, -s / 2, s, s, r);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, -s * 0.28, -s * 0.28, s * 0.56, s * 0.4, r * 0.4);
    ctx.fill();

    ctx.fillStyle = this.visual.turboColor;
    ctx.globalAlpha = 0.85;
    roundRect(ctx, -s * 0.32, s * 0.28, s * 0.64, s * 0.12, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (this.visual.antennaColor) {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, -s / 2);
      ctx.lineTo(-s * 0.36, -s / 2 - s * 0.22);
      ctx.stroke();
      ctx.fillStyle = this.visual.antennaColor;
      ctx.beginPath();
      ctx.arc(-s * 0.36, -s / 2 - s * 0.24, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  dispose() {
    this.resizeObserver.disconnect();
  }
}
