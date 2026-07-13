import type { Camera2D } from "../core/Camera2D";
import { CarBody2D, roundRect } from "../entities/Car2D";
import { visualFromState } from "../entities/carVisual";
import { Ball2D, type WallRect } from "./Ball2D";
import { generateMaze } from "./MazeGen";
import type { Input } from "../core/Input";
import type { GameState } from "../state/GameState";
import { getItem } from "../data/items";
import { petPowerValue, PET_ARCHETYPES } from "../data/pets";
import { RARITIES } from "../data/rarity";
import type { StageId } from "../data/stages";
import { STAGES } from "../data/stages";
import { hashString } from "../utils/random";

const POWER_LABELS: Record<string, string> = {
  chispa: "Recarga de Turbo",
  golpetazo: "Golpe Fuerte",
  espiral: "Efecto Curva",
  saltarin: "Impulso de Velocidad",
  guardian: "Escudo de Gol",
  magneto: "Imán de Balón",
};

interface PetFx {
  hitMult: number;
  curve: number;
  magnet: number;
  shield: number;
  speedMult: number;
}

interface FxPopup {
  x: number;
  y: number;
  text: string;
  t: number;
  color: string;
}

export type MatchMode = "normal" | "boss";
const GOALS_TO_WIN = 5;
const MATCH_DURATION = 150;

export interface MatchResult2D {
  won: boolean;
  scoreA: number;
  scoreB: number;
  mode: MatchMode;
  stage?: StageId;
}

interface Coin {
  x: number;
  y: number;
  taken: boolean;
  value: number;
}

export class Match2D {
  width: number;
  height: number;
  goalGapY: [number, number];
  walls: WallRect[] = [];
  coins: Coin[] = [];
  player: CarBody2D;
  opponent: CarBody2D;
  ball: Ball2D;
  scoreA = 0;
  scoreB = 0;
  timeLeft = MATCH_DURATION;
  finished = false;
  result: MatchResult2D | null = null;
  fieldName: string;
  private goalPause = 0;
  private touches = 0;
  private goalFxT = 0;
  private goalFxX = 0;
  private goalFxColor: string;
  private goalFxColor2: string;
  private goalFxRarityMult: number;
  private fx: PetFx;
  activePetBadge: { name: string; power: string } | null = null;
  private playerTouching = false;
  private opponentTouching = false;
  private fxPopups: FxPopup[] = [];

  skill: number;

  constructor(
    private gs: GameState,
    private input: Input,
    public mode: MatchMode,
    public stage?: StageId,
    skill?: number,
    opponentColor?: string
  ) {
    if (mode === "boss" && stage) {
      this.width = 2000;
      this.height = 1300;
      this.fieldName = `Duelo contra ${STAGES[stage].bossName}`;
    } else {
      this.width = 1500;
      this.height = 820;
      this.fieldName = stage ? `Campo de ${STAGES[stage].name}` : "Campo de Entrenamiento";
    }
    this.goalGapY = [-140, 140];
    this.skill = skill ?? (mode === "boss" ? 0.85 : 0.5);

    if (mode === "boss" && stage) {
      this.walls = generateMaze(hashString(stage), this.width / 2, this.height / 2);
      this.coins = this.generateCoins(stage);
    }

    this.player = new CarBody2D(visualFromState(gs));
    this.player.setPosition(-this.width / 2 + 120, 0);

    const bossColor = opponentColor ?? (mode === "boss" ? "#ff2c2c" : "#ff8a3d");
    this.opponent = new CarBody2D({ bodyColor: bossColor, borderColor: "#3a0a0a", turboColor: "#ffcf6b", antennaColor: mode === "boss" ? "#fff" : null });
    this.opponent.setPosition(this.width / 2 - 120, 0);
    if (mode === "boss") this.opponent.size = 42;

    const balon = getItem(gs.data.equipped.balon);
    this.ball = new Ball2D(balon?.colorHex ?? "#ffffff");
    this.ball.reset(0, 0);

    const explosion = getItem(gs.data.equipped.explosionGol);
    this.goalFxColor = explosion?.colorHex ?? "#ffcc33";
    this.goalFxColor2 = explosion?.colorHex2 ?? this.goalFxColor;
    this.goalFxRarityMult = explosion ? RARITIES[explosion.rarity].order : 1;

    this.fx = this.petFx();
    const activePet = gs.getActivePet();
    if (activePet) {
      const arche = PET_ARCHETYPES.find((a) => a.id === activePet.archetypeId);
      if (arche) this.activePetBadge = { name: arche.name, power: POWER_LABELS[arche.id] ?? arche.power };
    }
  }

  private generateCoins(stage: StageId): Coin[] {
    const coins: Coin[] = [];
    const rng = hashString(stage + "_coins");
    let seed = rng;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 1000) / 1000;
    };
    for (let i = 0; i < 14; i++) {
      const x = (rand() - 0.5) * (this.width - 300);
      const y = (rand() - 0.5) * (this.height - 200);
      coins.push({ x, y, taken: false, value: 15 + Math.floor(rand() * 20) });
    }
    return coins;
  }

  private petFx(): PetFx {
    const pet = this.gs.getActivePet();
    this.player.boostRegenMult = 1;
    const fx: PetFx = { hitMult: 1, curve: 0, magnet: 0, shield: 0, speedMult: 0 };
    if (!pet) return fx;
    const power = petPowerValue(pet);
    switch (pet.archetypeId) {
      case "chispa":
        this.player.boostRegenMult = 1 + power * 3;
        break;
      case "golpetazo":
        fx.hitMult = 1 + power;
        break;
      case "espiral":
        fx.curve = power;
        break;
      case "guardian":
        fx.shield = power;
        break;
      case "magneto":
        fx.magnet = power;
        break;
      case "saltarin":
        // Sin eje vertical en este juego 2D: el "salto" se traduce en un
        // impulso extra de velocidad punta y aceleración.
        fx.speedMult = power;
        break;
    }
    return fx;
  }

  update(dt: number) {
    if (this.goalFxT > 0) this.goalFxT = Math.max(0, this.goalFxT - dt);
    for (const p of this.fxPopups) p.t += dt;
    this.fxPopups = this.fxPopups.filter((p) => p.t < 0.9);
    if (this.finished) return;
    if (this.goalPause > 0) {
      this.goalPause -= dt;
      return;
    }
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.endMatch();
      return;
    }

    const bounds = { minX: -this.width / 2, maxX: this.width / 2, minY: -this.height / 2, maxY: this.height / 2 };
    const fx = this.fx;

    this.player.update(dt, { x: this.input.moveX, y: this.input.moveY, boost: this.input.boost }, bounds, 1 + fx.speedMult);
    const aiInput = this.computeAiInput();
    const speedMult = 0.72 + this.skill * 0.55;
    this.opponent.update(dt, aiInput, bounds, speedMult);

    this.resolveCarWalls(this.player);
    this.resolveCarWalls(this.opponent);
    this.resolveCarCar();

    this.ball.update(dt, bounds, this.walls, this.goalGapY);
    this.resolveBallCar(this.player, true, fx);
    this.resolveBallCar(this.opponent, false, fx);

    if (this.mode === "boss") {
      for (const coin of this.coins) {
        if (coin.taken) continue;
        const d = Math.hypot(this.player.x - coin.x, this.player.y - coin.y);
        if (d < this.player.size / 2 + 10) {
          coin.taken = true;
          this.gs.addCurrency(coin.value, 0);
        }
      }
    }

    this.checkGoal(bounds);
  }

  private computeAiInput() {
    const toBallX = this.ball.x - this.opponent.x;
    const toBallY = this.ball.y - this.opponent.y;
    const dist = Math.hypot(toBallX, toBallY);
    const defending = this.ball.x > this.width * 0.15;
    let targetX = this.ball.x + 40;
    let targetY = this.ball.y;
    if (!defending) {
      targetX = this.width / 2 - 140;
      targetY = this.ball.y * 0.5;
    }
    const dx = targetX - this.opponent.x;
    const dy = targetY - this.opponent.y;
    const len = Math.hypot(dx, dy) || 1;
    const boost = dist < 260 && Math.random() < 0.01 + this.skill * 0.06;
    return { x: dx / len, y: dy / len, boost };
  }

  private resolveCarWalls(car: CarBody2D) {
    for (const w of this.walls) {
      const half = car.size / 2;
      const closestX = Math.max(w.x, Math.min(car.x, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(car.y, w.y + w.h));
      const dx = car.x - closestX;
      const dy = car.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < half * half && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = half - dist;
        car.x += (dx / dist) * overlap;
        car.y += (dy / dist) * overlap;
      }
    }
  }

  private resolveCarCar() {
    const dx = this.opponent.x - this.player.x;
    const dy = this.opponent.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    const minDist = (this.player.size + this.opponent.size) / 2;
    if (dist > 0 && dist < minDist) {
      const push = (minDist - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;
      this.player.x -= nx * push;
      this.player.y -= ny * push;
      this.opponent.x += nx * push;
      this.opponent.y += ny * push;
    }
  }

  private pushPopup(x: number, y: number, text: string, color: string) {
    this.fxPopups.push({ x, y, text, t: 0, color });
  }

  private resolveBallCar(car: CarBody2D, isPlayer: boolean, fx: PetFx) {
    const dx = this.ball.x - car.x;
    const dy = this.ball.y - car.y;
    const dist = Math.hypot(dx, dy);
    const minDist = this.ball.radius + car.size * 0.55;
    const touching = dist < minDist && dist > 0.001;
    const wasTouching = isPlayer ? this.playerTouching : this.opponentTouching;
    const justEntered = touching && !wasTouching;
    if (isPlayer) this.playerTouching = touching;
    else this.opponentTouching = touching;

    if (touching) {
      const nx = dx / dist;
      const ny = dy / dist;
      let power = 220 + car.speed * 0.9;
      const shieldActive = !isPlayer && fx.shield > 0 && this.ball.x < -this.width * 0.3;
      if (isPlayer) power *= fx.hitMult;
      if (shieldActive) power *= Math.max(0.3, 1 - fx.shield);

      this.ball.vx += nx * power + car.vx * 0.35;
      this.ball.vy += ny * power + car.vy * 0.35;

      if (isPlayer && fx.curve > 0) {
        this.ball.vx += -car.vy * fx.curve * 3;
        this.ball.vy += car.vx * fx.curve * 3;
      }

      const overlap = minDist - dist;
      this.ball.x += nx * overlap;
      this.ball.y += ny * overlap;
      this.touches++;

      if (justEntered) {
        if (isPlayer && fx.hitMult > 1.05) this.pushPopup(this.ball.x, this.ball.y - 30, "¡GOLPE FUERTE!", "#ffcc33");
        else if (isPlayer && fx.curve > 0.05) this.pushPopup(this.ball.x, this.ball.y - 30, "↺ EFECTO CURVA", "#66e0ff");
        if (shieldActive) this.pushPopup(this.player.x, this.player.y - 40, "🛡 ESCUDO", "#8fd3ff");
      }
    } else if (isPlayer && fx.magnet > 0 && dist < 200) {
      const pull = (1 - dist / 200) * fx.magnet * 400;
      this.ball.vx -= (dx / dist) * pull * 0.016;
      this.ball.vy -= (dy / dist) * pull * 0.016;
    }
  }

  private checkGoal(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
    const inGap = this.ball.y > this.goalGapY[0] && this.ball.y < this.goalGapY[1];
    if (!inGap) return;
    if (this.ball.x - this.ball.radius < bounds.minX) {
      this.onGoal("opponent");
    } else if (this.ball.x + this.ball.radius > bounds.maxX) {
      this.onGoal("player");
    }
  }

  private onGoal(scorer: "player" | "opponent") {
    if (scorer === "player") {
      this.scoreA++;
      this.gs.recordGoal();
    } else {
      this.scoreB++;
    }
    this.goalFxT = 1.1;
    this.goalFxX = scorer === "player" ? this.width / 2 : -this.width / 2;
    this.ball.reset(0, 0);
    this.player.setPosition(-this.width / 2 + 120, 0);
    this.opponent.setPosition(this.width / 2 - 120, 0);
    this.goalPause = 1.3;
    if (this.scoreA >= GOALS_TO_WIN || this.scoreB >= GOALS_TO_WIN) this.endMatch();
  }

  private endMatch() {
    this.finished = true;
    const won = this.scoreA > this.scoreB;
    this.result = { won, scoreA: this.scoreA, scoreB: this.scoreB, mode: this.mode, stage: this.stage };
    if (won) {
      const coins = this.mode === "boss" ? 900 : 200;
      const diamonds = this.mode === "boss" ? 30 : 4;
      const xp = this.mode === "boss" ? 450 : 120;
      this.gs.addCurrency(coins, diamonds);
      this.gs.addXp(xp);
      if (this.mode === "boss" && this.stage) {
        this.gs.defeatBoss(this.stage);
        this.gs.notifyEvent("derrotarJefe", this.stage, 1);
      }
      this.gs.recordMatchWin(this.fieldId());
    }
  }

  private fieldId(): string {
    if (this.mode === "boss" && this.stage) return `campo_${this.stage}`;
    return this.stage ? `campo_${this.stage}` : "campo_hub";
  }

  get boostFuel() {
    return this.player.boostFuel;
  }

  get touchCount() {
    return this.touches;
  }

  // ---------- Render ----------
  draw(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    const bounds = { minX: -this.width / 2, maxX: this.width / 2, minY: -this.height / 2, maxY: this.height / 2 };

    ctx.fillStyle = this.mode === "boss" ? "#120a1c" : "#0e1420";
    ctx.fillRect(0, 0, camera.viewW, camera.viewH);

    const tile = 70;
    for (let gx = bounds.minX; gx < bounds.maxX; gx += tile) {
      for (let gy = bounds.minY; gy < bounds.maxY; gy += tile) {
        const ix = Math.round((gx - bounds.minX) / tile);
        const iy = Math.round((gy - bounds.minY) / tile);
        const checker = (ix + iy) % 2 === 0;
        ctx.fillStyle = checker ? (this.mode === "boss" ? "#1c1230" : "#152036") : (this.mode === "boss" ? "#221836" : "#182740");
        const [sx, sy] = camera.worldToScreen(gx, gy);
        ctx.fillRect(sx, sy, tile + 1, tile + 1);
      }
    }

    // linea central discontinua
    ctx.strokeStyle = "rgba(102,224,255,0.5)";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 14]);
    const [cx0, cy0] = camera.worldToScreen(0, bounds.minY);
    const [cx1, cy1] = camera.worldToScreen(0, bounds.maxY);
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(cx1, cy1);
    ctx.stroke();
    ctx.setLineDash([]);

    // bordes del campo
    const [bx0, by0] = camera.worldToScreen(bounds.minX, bounds.minY);
    const [bx1, by1] = camera.worldToScreen(bounds.maxX, bounds.maxY);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);

    // porterías estilo corchete
    this.drawGoalBracket(ctx, camera, bounds.minX, "#66ccff");
    this.drawGoalBracket(ctx, camera, bounds.maxX, "#ff6bd6");

    // paredes del laberinto (solo jefe)
    for (const w of this.walls) {
      const [sx, sy] = camera.worldToScreen(w.x, w.y);
      ctx.fillStyle = "#3a2a55";
      ctx.strokeStyle = "#6b4fae";
      ctx.lineWidth = 2;
      roundRect(ctx, sx, sy, w.w, w.h, 6);
      ctx.fill();
      ctx.stroke();
    }

    // monedas (solo jefe)
    for (const coin of this.coins) {
      if (coin.taken) continue;
      const [sx, sy] = camera.worldToScreen(coin.x, coin.y);
      ctx.fillStyle = "#ffcc33";
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7a5c00";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    this.ball.draw(ctx, camera);
    this.opponent.draw(ctx, camera, this.opponent.speed > 20);
    this.player.draw(ctx, camera, this.player.speed > 20);

    if (this.fx.magnet > 0) this.drawMagnetAura(ctx, camera);
    if (this.goalFxT > 0) this.drawGoalExplosion(ctx, camera);
    this.drawFxPopups(ctx, camera);
  }

  private drawMagnetAura(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    const [sx, sy] = camera.worldToScreen(this.player.x, this.player.y);
    const pulse = 1 + Math.sin(performance.now() / 260) * 0.06;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#8fc0ff";
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 200 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawFxPopups(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const p of this.fxPopups) {
      const [sx, sy] = camera.worldToScreen(p.x, p.y);
      const alpha = Math.max(0, 1 - p.t / 0.9);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = "900 16px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = p.color;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, sx, sy - p.t * 40);
      ctx.fillText(p.text, sx, sy - p.t * 40);
      ctx.restore();
    }
  }

  get turboBoostActive(): boolean {
    return this.player.boostRegenMult > 1.01;
  }

  private drawGoalExplosion(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    const t = 1 - this.goalFxT / 1.1; // 0 al empezar, 1 al terminar
    const [sx, sy] = camera.worldToScreen(this.goalFxX, 0);
    ctx.save();

    // destello de fondo (más grande e intenso cuanto más rara la explosión equipada)
    const reach = 220 + this.goalFxRarityMult * 10;
    ctx.globalAlpha = Math.max(0, 1 - t * 1.6);
    ctx.fillStyle = this.goalFxColor2;
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(sx, sy, 40 + t * (reach + 40), 0, Math.PI * 2);
    ctx.fill();

    // partículas radiales (bicolor, más cantidad cuanto más rara la explosión)
    const count = 14 + Math.round(this.goalFxRarityMult * 2.4);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + t * 1.5;
      const dist = t * reach;
      const px = sx + Math.cos(angle) * dist;
      const py = sy + Math.sin(angle) * dist;
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.fillStyle = i % 2 === 0 ? this.goalFxColor : this.goalFxColor2;
      ctx.beginPath();
      ctx.arc(px, py, 6 * (1 - t) + 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t * 1.2);
    ctx.font = "900 34px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = this.goalFxColor;
    ctx.lineWidth = 4;
    ctx.strokeText("¡GOL!", sx, sy - 60 - t * 20);
    ctx.fillText("¡GOL!", sx, sy - 60 - t * 20);
    ctx.restore();
  }

  private drawGoalBracket(ctx: CanvasRenderingContext2D, camera: Camera2D, worldX: number, color: string) {
    const inward = worldX < 0 ? 1 : -1;
    const [sx, sy1] = camera.worldToScreen(worldX, this.goalGapY[0]);
    const [, sy2] = camera.worldToScreen(worldX, this.goalGapY[1]);
    const depth = 26 * inward;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(sx + depth, sy1);
    ctx.lineTo(sx, sy1);
    ctx.lineTo(sx, sy2);
    ctx.lineTo(sx + depth, sy2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
