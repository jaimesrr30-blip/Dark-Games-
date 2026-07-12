export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  consumeFrame() {
    this.justPressed.clear();
  }

  // Movimiento 8-direccional normalizado, x: -1..1 (izq/der), y: -1..1 (arriba/abajo)
  get moveX(): number {
    let v = 0;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) v += 1;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft")) v -= 1;
    return v;
  }

  get moveY(): number {
    let v = 0;
    if (this.isDown("KeyS") || this.isDown("ArrowDown")) v += 1;
    if (this.isDown("KeyW") || this.isDown("ArrowUp")) v -= 1;
    return v;
  }

  get boost(): boolean {
    return this.isDown("Space");
  }
}
