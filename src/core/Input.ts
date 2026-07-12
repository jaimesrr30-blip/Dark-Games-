export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  public pointerLocked = false;
  public mouseDX = 0;
  public mouseDY = 0;

  constructor(target: HTMLElement) {
    window.addEventListener("keydown", (e) => {
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    target.addEventListener("mousemove", (e) => {
      if (this.pointerLocked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    });
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === target;
    });
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  consumeFrame() {
    this.justPressed.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
  }

  get throttle(): number {
    let v = 0;
    if (this.isDown("KeyW") || this.isDown("ArrowUp")) v += 1;
    if (this.isDown("KeyS") || this.isDown("ArrowDown")) v -= 1;
    return v;
  }

  get steer(): number {
    let v = 0;
    if (this.isDown("KeyA") || this.isDown("ArrowLeft")) v += 1;
    if (this.isDown("KeyD") || this.isDown("ArrowRight")) v -= 1;
    return v;
  }

  get boost(): boolean {
    return this.isDown("ShiftLeft") || this.isDown("ShiftRight");
  }

  get jump(): boolean {
    return this.isDown("Space");
  }
}
