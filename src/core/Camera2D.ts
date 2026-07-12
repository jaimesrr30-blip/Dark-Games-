export class Camera2D {
  x = 0;
  y = 0;
  viewW = 800;
  viewH = 600;

  follow(targetX: number, targetY: number, bounds: { w: number; h: number }, smooth = 0.12) {
    const halfW = this.viewW / 2;
    const halfH = this.viewH / 2;
    const minX = -bounds.w / 2 + halfW;
    const maxX = bounds.w / 2 - halfW;
    const minY = -bounds.h / 2 + halfH;
    const maxY = bounds.h / 2 - halfH;

    let desiredX = targetX;
    let desiredY = targetY;
    if (minX <= maxX) desiredX = Math.max(minX, Math.min(maxX, desiredX));
    else desiredX = 0;
    if (minY <= maxY) desiredY = Math.max(minY, Math.min(maxY, desiredY));
    else desiredY = 0;

    this.x += (desiredX - this.x) * smooth;
    this.y += (desiredY - this.y) * smooth;
  }

  snap(targetX: number, targetY: number) {
    this.x = targetX;
    this.y = targetY;
  }

  worldToScreen(wx: number, wy: number): [number, number] {
    return [wx - this.x + this.viewW / 2, wy - this.y + this.viewH / 2];
  }

  isVisible(wx: number, wy: number, margin = 80): boolean {
    const [sx, sy] = this.worldToScreen(wx, wy);
    return sx > -margin && sx < this.viewW + margin && sy > -margin && sy < this.viewH + margin;
  }
}
