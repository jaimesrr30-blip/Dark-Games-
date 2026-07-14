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
  relampago: "Recarga de Turbo",
  golpetazo: "Golpe Fuerte",
  titan: "Golpe Fuerte",
  espiral: "Efecto Curva",
  remolino: "Efecto Curva",
  saltarin: "Impulso de Velocidad",
  brincador: "Impulso de Velocidad",
  guardian: "Escudo de Gol",
  coraza: "Escudo de Gol",
  magneto: "Imán de Balón",
  graviton: "Imán de Balón",
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

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(v, 16) || 0;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
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

interface Flare {
  x: number;
  y: number;
  t: number;
  phase: "warn" | "burn";
  radius: number;
  damage: number;
}

interface RadiationBolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
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
  private tileColorA: string;
  private tileColorB: string;
  private attackNextIn = 0;
  private attackCharging = false;
  private attackChargeT = 0;
  private attackStrikeFxT = 0;
  private static readonly ATTACK_CHARGE_TIME = 1.1;
  private static readonly ATTACK_STRIKE_RADIUS = 260;

  // ---------- Batalla final del Sol (5 minutos, 3 fases) ----------
  private duration: number;
  private flares: Flare[] = [];
  private flareTimer = 3;
  private bolts: RadiationBolt[] = [];
  private boltTimer = 4;
  private radiationHits = 0;
  bossInvulnerable = false;
  private slowMoT = 0;
  voidClockUsed = false;
  private static readonly SLOWMO_FACTOR = 0.3;

  skill: number;

  constructor(
    private gs: GameState,
    private input: Input,
    public mode: MatchMode,
    public stage?: StageId,
    skill?: number,
    opponentColor?: string,
    fieldStage?: StageId,
    public lethal = false,
    private onPlayerDamage?: (amount: number) => void,
    public sunFinal = false,
    public hasVoidClock = false
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
    this.duration = sunFinal ? 300 : MATCH_DURATION;
    this.timeLeft = this.duration;

    const theme = STAGES[fieldStage ?? stage ?? "hub"];
    this.tileColorA = darken(theme.groundColor, 0.82);
    this.tileColorB = darken(theme.groundColorAlt, 0.8);

    if (mode === "boss" && stage && !sunFinal) {
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

    if (this.lethal) this.attackNextIn = 2.4 + Math.random() * 1.4;
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
    const arche = PET_ARCHETYPES.find((a) => a.id === pet.archetypeId);
    if (!arche) return fx;
    const power = petPowerValue(pet);
    // Se distingue por el tipo de poder (no por el id del arquetipo) para que
    // cualquier mascota nueva con un poder ya existente funcione sin tener
    // que tocar este switch cada vez.
    switch (arche.power) {
      case "turboRecarga":
        this.player.boostRegenMult = 1 + power * 3;
        break;
      case "golpeFuerte":
        fx.hitMult = 1 + power;
        break;
      case "efectoCurva":
        fx.curve = power;
        break;
      case "escudoGol":
        fx.shield = power;
        break;
      case "iman":
        fx.magnet = power;
        break;
      case "saltoAlto":
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

    // El Reloj del Vacío ralentiza todo el campo (menos al jugador) 10s.
    if (this.slowMoT > 0) this.slowMoT = Math.max(0, this.slowMoT - dt);
    const hazardDt = this.sunFinal && this.slowMoT > 0 ? dt * Match2D.SLOWMO_FACTOR : dt;

    this.timeLeft -= hazardDt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endMatch();
      return;
    }

    const bounds = { minX: -this.width / 2, maxX: this.width / 2, minY: -this.height / 2, maxY: this.height / 2 };
    const fx = this.fx;

    this.player.update(dt, { x: this.input.moveX, y: this.input.moveY, boost: this.input.boost }, bounds, 1 + fx.speedMult);
    const aiInput = this.computeAiInput();
    const speedMult = 0.72 + this.skill * 0.55;
    this.opponent.update(hazardDt, aiInput, bounds, speedMult);

    this.resolveCarWalls(this.player);
    this.resolveCarWalls(this.opponent);
    this.resolveCarCar();

    this.ball.update(hazardDt, bounds, this.walls, this.goalGapY);
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

    if (this.attackStrikeFxT > 0) this.attackStrikeFxT = Math.max(0, this.attackStrikeFxT - dt);
    if (this.lethal && this.mode === "boss" && !this.sunFinal) this.updateLethalAttack(dt);
    if (this.sunFinal) this.updateSunFinal(hazardDt);

    this.checkGoal(bounds);
  }

  // Activa el Reloj del Vacío: 10s de tiempo ralentizado para todo salvo el
  // jugador. Un solo uso por batalla.
  activateVoidClock(): boolean {
    if (!this.sunFinal || !this.hasVoidClock || this.voidClockUsed || this.finished) return false;
    this.voidClockUsed = true;
    this.slowMoT = 10;
    return true;
  }

  private spawnFlare(big: boolean) {
    const hw = this.width / 2 - 120;
    const hh = this.height / 2 - 100;
    const x = (Math.random() * 2 - 1) * hw;
    const y = (Math.random() * 2 - 1) * hh;
    this.flares.push({ x, y, t: 0, phase: "warn", radius: big ? 130 : 85, damage: big ? 26 : 14 });
  }

  // Fase 1 (0-2min): llamaradas aleatorias en el campo. Fase 2 (2-4min): el
  // calor sube el doble de rápido y además dispara ráfagas de energía
  // directas contra el jugador (3 impactos = muerte). Fase 3 (último
  // minuto): el jefe es invulnerable y el campo entero se llena de
  // meteoritos; sobrevivir hasta que acabe el reloj es la única salida.
  private updateSunFinal(hazardDt: number) {
    const elapsed = this.duration - this.timeLeft;
    const phase = elapsed < 120 ? 1 : elapsed < 240 ? 2 : 3;
    this.bossInvulnerable = phase === 3;

    this.flareTimer -= hazardDt;
    const flareInterval = phase === 1 ? 3.2 : phase === 2 ? 1.6 : 0.9;
    if (this.flareTimer <= 0) {
      this.spawnFlare(phase === 3);
      this.flareTimer = flareInterval + Math.random() * 0.8;
    }
    for (const f of this.flares) {
      f.t += hazardDt;
      if (f.phase === "warn" && f.t >= 0.8) {
        f.phase = "burn";
        f.t = 0;
      } else if (f.phase === "burn") {
        const d = Math.hypot(this.player.x - f.x, this.player.y - f.y);
        if (d < f.radius) this.onPlayerDamage?.(f.damage * hazardDt);
      }
    }
    this.flares = this.flares.filter((f) => !(f.phase === "burn" && f.t >= 1.5));

    if (phase >= 2) {
      this.boltTimer -= hazardDt;
      if (this.boltTimer <= 0) {
        const dx = this.player.x - this.opponent.x;
        const dy = this.player.y - this.opponent.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = 420;
        this.bolts.push({ x: this.opponent.x, y: this.opponent.y, vx: (dx / len) * speed, vy: (dy / len) * speed });
        this.boltTimer = phase === 3 ? 2.2 : 3.4;
      }
      for (const b of this.bolts) {
        b.x += b.vx * hazardDt;
        b.y += b.vy * hazardDt;
      }
      this.bolts = this.bolts.filter((b) => {
        const d = Math.hypot(this.player.x - b.x, this.player.y - b.y);
        if (d < this.player.size / 2 + 14) {
          this.radiationHits++;
          this.onPlayerDamage?.(15);
          this.pushPopup(this.player.x, this.player.y - 30, `¡RADIACIÓN! (${this.radiationHits}/3)`, "#8fffb0");
          if (this.radiationHits >= 3) this.onPlayerDamage?.(9999);
          return false;
        }
        return Math.abs(b.x) < this.width && Math.abs(b.y) < this.height;
      });
    }
  }

  private computeAiInput() {
    // Cuanto más hábil el rival, más lejos predice la trayectoria del balón
    // en vez de perseguir solo su posición actual: se siente más "vivo".
    const leadT = 0.12 + this.skill * 0.3;
    const predBallX = this.ball.x + this.ball.vx * leadT;
    const predBallY = this.ball.y + this.ball.vy * leadT;

    const toBallX = predBallX - this.opponent.x;
    const toBallY = predBallY - this.opponent.y;
    const dist = Math.hypot(toBallX, toBallY);
    const defending = this.ball.x > this.width * 0.15;

    let targetX: number;
    let targetY: number;
    if (!defending) {
      // Postura defensiva: se coloca entre el balón y su propia portería.
      targetX = this.width / 2 - 140;
      targetY = predBallY * 0.5;
    } else {
      // Ataca hacia el balón previsto; con más habilidad, desvía el golpe
      // hacia el centro de la portería rival en vez de solo despejar.
      targetX = predBallX + 40;
      targetY = this.skill > 0.55 ? predBallY * (1 - Math.min(0.6, (this.skill - 0.55) * 1.3)) : predBallY;
    }

    const dx = targetX - this.opponent.x;
    const dy = targetY - this.opponent.y;
    const len = Math.hypot(dx, dy) || 1;
    const boostRange = 220 + this.skill * 120;
    const boost = dist < boostRange && Math.random() < 0.012 + this.skill * 0.1;
    return { x: dx / len, y: dy / len, boost };
  }

  // El jefe letal telegrafía un ataque (anillo que crece) y golpea si el
  // jugador sigue dentro del radio al terminar la carga: evitable moviéndote.
  private updateLethalAttack(dt: number) {
    if (!this.attackCharging) {
      this.attackNextIn -= dt;
      if (this.attackNextIn <= 0) {
        this.attackCharging = true;
        this.attackChargeT = 0;
      }
      return;
    }
    this.attackChargeT += dt;
    if (this.attackChargeT >= Match2D.ATTACK_CHARGE_TIME) {
      this.attackCharging = false;
      const d = Math.hypot(this.player.x - this.opponent.x, this.player.y - this.opponent.y);
      if (d < Match2D.ATTACK_STRIKE_RADIUS) {
        this.onPlayerDamage?.(16 + this.skill * 10);
        this.pushPopup(this.player.x, this.player.y - 30, "¡IMPACTO!", "#ff3b3b");
      }
      this.attackStrikeFxT = 0.4;
      this.attackNextIn = 3.2 + Math.random() * 1.8 - this.skill * 0.6;
    }
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
    if (scorer === "player" && this.bossInvulnerable) {
      // Último minuto: Heliarca es invulnerable, los goles no cuentan.
      this.pushPopup(0, 0, "¡INVULNERABLE!", "#ff3b3b");
      this.ball.reset(0, 0);
      return;
    }
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
    // En la batalla final del Sol, sobrevivir los 5 minutos completos ya es
    // una victoria aunque no se llegue a los 5 goles (el último minuto ni
    // siquiera permite marcar: Heliarca es invulnerable).
    let won = this.scoreA > this.scoreB;
    if (this.sunFinal && this.timeLeft <= 0) won = true;
    this.result = { won, scoreA: this.scoreA, scoreB: this.scoreB, mode: this.mode, stage: this.stage };
    if (won) {
      const coins = this.sunFinal ? 15000 : this.mode === "boss" ? 900 : 200;
      const diamonds = this.sunFinal ? 500 : this.mode === "boss" ? 30 : 4;
      const xp = this.sunFinal ? 6000 : this.mode === "boss" ? 450 : 120;
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
        if (this.mode === "boss") {
          ctx.fillStyle = checker ? "#1c1230" : "#221836";
        } else {
          ctx.fillStyle = checker ? this.tileColorA : this.tileColorB;
        }
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
    if (this.lethal && (this.attackCharging || this.attackStrikeFxT > 0)) this.drawLethalAttackFx(ctx, camera);
    if (this.sunFinal) this.drawSunFinalFx(ctx, camera);
    this.drawFxPopups(ctx, camera);
  }

  private drawSunFinalFx(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    for (const f of this.flares) {
      const [sx, sy] = camera.worldToScreen(f.x, f.y);
      ctx.save();
      if (f.phase === "warn") {
        const p = Math.min(1, f.t / 0.8);
        ctx.globalAlpha = 0.25 + p * 0.35;
        ctx.strokeStyle = "#ffcf3d";
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(sx, sy, f.radius * p, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const p = Math.min(1, f.t / 1.5);
        ctx.globalAlpha = Math.max(0, 1 - p) * 0.75;
        const grad = ctx.createRadialGradient(sx, sy, 4, sx, sy, f.radius);
        grad.addColorStop(0, "rgba(255,240,180,0.9)");
        grad.addColorStop(0.6, "rgba(255,90,20,0.6)");
        grad.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const b of this.bolts) {
      const [sx, sy] = camera.worldToScreen(b.x, b.y);
      ctx.save();
      ctx.fillStyle = "#8fffb0";
      ctx.shadowColor = "#8fffb0";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.bossInvulnerable) {
      const [ox, oy] = camera.worldToScreen(this.opponent.x, this.opponent.y);
      const pulse = 1 + Math.sin(performance.now() / 180) * 0.1;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#ff3b3b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ox, oy, 46 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.slowMoT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#8fd3ff";
      ctx.fillRect(0, 0, camera.viewW, camera.viewH);
      ctx.restore();
      ctx.save();
      ctx.font = "900 20px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#8fd3ff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 6;
      ctx.fillText(`RELOJ DEL VACÍO · ${this.slowMoT.toFixed(1)}s`, camera.viewW / 2, 70);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private drawLethalAttackFx(ctx: CanvasRenderingContext2D, camera: Camera2D) {
    const [sx, sy] = camera.worldToScreen(this.opponent.x, this.opponent.y);
    ctx.save();
    if (this.attackCharging) {
      const p = Math.min(1, this.attackChargeT / Match2D.ATTACK_CHARGE_TIME);
      ctx.strokeStyle = "#ff3b3b";
      ctx.globalAlpha = 0.35 + p * 0.5;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(sx, sy, Match2D.ATTACK_STRIKE_RADIUS * p, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (this.attackStrikeFxT > 0) {
      const p = 1 - this.attackStrikeFxT / 0.4;
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.fillStyle = "rgba(255,59,59,0.35)";
      ctx.beginPath();
      ctx.arc(sx, sy, Match2D.ATTACK_STRIKE_RADIUS * (0.7 + p * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
