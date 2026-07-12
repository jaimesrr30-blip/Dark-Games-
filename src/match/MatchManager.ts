import * as THREE from "three";
import { CarBody, DEFAULT_MATCH_PHYSICS, buildCarMesh } from "../entities/Car";
import { Ball } from "./Ball";
import { buildArena, ARENA_BOUNDS, ARENA_THEMES, type ArenaTheme } from "./Arena";
import { aiInput, type AiConfig } from "./AIOpponent";
import { Input } from "../core/Input";
import type { GameState } from "../state/GameState";
import { getItem } from "../data/items";
import { visualConfigFromState } from "../entities/PlayerController";
import { petPowerValue } from "../data/pets";
import type { RegionId } from "../data/regions";
import { REGIONS } from "../data/regions";

export type MatchMode = "normal" | "boss";

export interface MatchResult {
  won: boolean;
  scoreA: number;
  scoreB: number;
  region?: RegionId;
  mode: MatchMode;
}

interface TeamCar {
  car: CarBody;
  team: "A" | "B";
  isPlayer: boolean;
  aiConfig?: AiConfig;
}

const MATCH_DURATION = 180;
const GOALS_TO_WIN = 5;

export class MatchManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ball: Ball;
  cars: TeamCar[] = [];
  playerCar: TeamCar;
  scoreA = 0;
  scoreB = 0;
  timeLeft = MATCH_DURATION;
  finished = false;
  result: MatchResult | null = null;
  private goalPauseTimer = 0;
  private cameraDistance = 11;
  private cameraHeight = 4.5;
  arenaName: string;

  constructor(
    private gs: GameState,
    private input: Input,
    public mode: MatchMode,
    public region: RegionId | undefined,
    arenaThemeName: string
  ) {
    const theme: ArenaTheme = ARENA_THEMES[arenaThemeName] ?? ARENA_THEMES["Estadio Central"];
    this.arenaName = theme.name;
    this.scene = buildArena(theme);
    this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 700);

    const balonItem = getItem(gs.data.equipped.balon);
    this.ball = new Ball(balonItem?.colorHex ?? 0xffffff);
    this.ball.reset(new THREE.Vector3(0, 6, 0));
    this.scene.add(this.ball.group);

    const physicsBounds = {
      minX: -ARENA_BOUNDS.halfW + 2,
      maxX: ARENA_BOUNDS.halfW - 2,
      minZ: -ARENA_BOUNDS.halfL + 2,
      maxZ: ARENA_BOUNDS.halfL - 2,
    };

    const playerBody = new CarBody(visualConfigFromState(gs), { ...DEFAULT_MATCH_PHYSICS, bounds: physicsBounds });
    playerBody.setPosition(0, -ARENA_BOUNDS.halfL * 0.55);
    this.scene.add(playerBody.group);
    this.playerCar = { car: playerBody, team: "A", isPlayer: true };
    this.cars.push(this.playerCar);

    if (mode === "normal") {
      const mate = this.spawnAiCar("A", 0x3d8bff, physicsBounds, new THREE.Vector3(-8, 0, -ARENA_BOUNDS.halfL * 0.4), 0.55);
      const opp1 = this.spawnAiCar("B", 0xd7263d, physicsBounds, new THREE.Vector3(6, 0, ARENA_BOUNDS.halfL * 0.55), 0.6);
      const opp2 = this.spawnAiCar("B", 0xd7263d, physicsBounds, new THREE.Vector3(-6, 0, ARENA_BOUNDS.halfL * 0.4), 0.55);
      this.cars.push(mate, opp1, opp2);
    } else {
      const boss = this.spawnAiCar("B", 0x8b0000, physicsBounds, new THREE.Vector3(0, 0, ARENA_BOUNDS.halfL * 0.55), 0.92, true);
      this.cars.push(boss);
    }

    const light = new THREE.PointLight(0xffffff, 0.4, 20);
    light.position.set(0, 10, 0);
    this.scene.add(light);
  }

  private spawnAiCar(
    team: "A" | "B",
    color: number,
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    pos: THREE.Vector3,
    skill: number,
    isBoss = false
  ): TeamCar {
    const body = new CarBody(
      { bodyColor: color, wheelColor: 0x222222, turboColor: isBoss ? 0xff0033 : 0xffffff, antenna: isBoss, trail: true, scale: isBoss ? 1.15 : 1 },
      { ...DEFAULT_MATCH_PHYSICS, bounds, maxSpeed: DEFAULT_MATCH_PHYSICS.maxSpeed * (isBoss ? 1.15 : 1) }
    );
    body.setPosition(pos.x, pos.z);
    this.scene.add(body.group);
    const aiConfig: AiConfig = {
      aggressiveness: 0.6,
      targetGoalZ: team === "A" ? ARENA_BOUNDS.halfL : -ARENA_BOUNDS.halfL,
      ownGoalZ: team === "A" ? -ARENA_BOUNDS.halfL : ARENA_BOUNDS.halfL,
      skill,
    };
    return { car: body, team, isPlayer: false, aiConfig };
  }

  private applyPetPowers() {
    const pet = this.gs.getActivePet();
    this.playerCar.car.boostRegenMult = 1;
    if (!pet) return { hitMult: 1, curve: 0, magnet: 0, shield: 0, jumpBoost: 0 };
    const power = petPowerValue(pet);
    let hitMult = 1;
    let curve = 0;
    let magnet = 0;
    let shield = 0;
    let jumpBoost = 0;
    switch (pet.archetypeId) {
      case "chispa":
        this.playerCar.car.boostRegenMult = 1 + power * 3;
        break;
      case "golpetazo":
        hitMult = 1 + power;
        break;
      case "espiral":
        curve = power;
        break;
      case "saltarin":
        jumpBoost = power * 12;
        break;
      case "guardian":
        shield = power;
        break;
      case "magneto":
        magnet = power;
        break;
    }
    return { hitMult, curve, magnet, shield, jumpBoost };
  }

  update(dt: number) {
    if (this.finished) return;

    if (this.goalPauseTimer > 0) {
      this.goalPauseTimer -= dt;
      this.updateCamera(dt);
      return;
    }

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.endMatch();
      return;
    }

    const petFx = this.applyPetPowers();

    for (const tc of this.cars) {
      if (tc.isPlayer) {
        tc.car.update(
          dt,
          {
            throttle: this.input.throttle,
            steer: this.input.steer,
            boost: this.input.boost,
            jumpPressed: this.input.jump,
          },
          9 + petFx.jumpBoost
        );
      } else if (tc.aiConfig) {
        const inp = aiInput(tc.car, this.ball, tc.aiConfig, dt);
        tc.car.update(dt, inp);
      }
    }

    // colisiones simples coche-coche (empuje)
    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const a = this.cars[i].car;
        const b = this.cars[j].car;
        const dx = b.position.x - a.position.x;
        const dz = b.position.z - a.position.z;
        const dist = Math.hypot(dx, dz);
        const minDist = a.radius + b.radius;
        if (dist > 0 && dist < minDist) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist;
          const nz = dz / dist;
          a.position.x -= nx * push;
          a.position.z -= nz * push;
          b.position.x += nx * push;
          b.position.z += nz * push;
        }
      }
    }

    this.ball.update(dt, { halfW: ARENA_BOUNDS.halfW, halfL: ARENA_BOUNDS.halfL, wallH: ARENA_BOUNDS.wallH });

    // colisión coche-balón
    for (const tc of this.cars) {
      const car = tc.car;
      const dx = this.ball.position.x - car.position.x;
      const dy = this.ball.position.y - (car.position.y + 0.5);
      const dz = this.ball.position.z - car.position.z;
      const dist = Math.hypot(dx, dy, dz);
      const minDist = this.ball.radius + car.radius * 0.75;
      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        const carSpeed = car.speed;
        let hitPower = 10 + Math.abs(carSpeed) * 0.9;
        if (tc.isPlayer) hitPower *= petFx.hitMult;

        // escudo del portero: reduce potencia de disparos rivales cerca de la portería del jugador
        if (!tc.isPlayer && petFx.shield > 0) {
          const nearOwnGoal = Math.abs(this.ball.position.z - -ARENA_BOUNDS.halfL) < 20;
          if (nearOwnGoal) hitPower *= Math.max(0.3, 1 - petFx.shield);
        }

        this.ball.velocity.x += nx * hitPower * 0.6 + Math.sin(car.heading) * hitPower * 0.4;
        this.ball.velocity.y += Math.max(ny, 0.15) * hitPower * 0.5 + 2;
        this.ball.velocity.z += nz * hitPower * 0.6 + Math.cos(car.heading) * hitPower * 0.4;

        if (tc.isPlayer && petFx.curve > 0) {
          const side = new THREE.Vector3(Math.cos(car.heading), 0, -Math.sin(car.heading));
          this.ball.velocity.addScaledVector(side, (this.input.steer || 0) * petFx.curve * 8);
        }

        const overlap = minDist - dist;
        this.ball.position.x += nx * overlap;
        this.ball.position.y += ny * overlap;
        this.ball.position.z += nz * overlap;
      } else if (tc.isPlayer && petFx.magnet > 0 && dist < 14) {
        const pull = (1 - dist / 14) * petFx.magnet * 6;
        this.ball.velocity.x -= (dx / dist) * pull * dt * 10;
        this.ball.velocity.z -= (dz / dist) * pull * dt * 10;
      }
    }

    this.checkGoal();
    this.updateCamera(dt);
  }

  private checkGoal() {
    const b = ARENA_BOUNDS;
    const inGoalWindow =
      Math.abs(this.ball.position.x) < b.goalHalfWidth &&
      this.ball.position.y > b.goalBottom &&
      this.ball.position.y < b.goalTop;
    if (!inGoalWindow) return;

    if (this.ball.position.z > b.halfL) {
      this.onGoal("A");
    } else if (this.ball.position.z < -b.halfL) {
      this.onGoal("B");
    }
  }

  private onGoal(scoringTeam: "A" | "B") {
    if (scoringTeam === "A") {
      this.scoreA++;
      this.gs.recordGoal();
    } else {
      this.scoreB++;
    }
    this.ball.reset(new THREE.Vector3(0, 6, 0));
    for (const tc of this.cars) {
      tc.car.setPosition(tc.team === "A" ? -6 : 6, tc.team === "A" ? -ARENA_BOUNDS.halfL * 0.5 : ARENA_BOUNDS.halfL * 0.5);
    }
    this.goalPauseTimer = 1.6;

    if (this.scoreA >= GOALS_TO_WIN || this.scoreB >= GOALS_TO_WIN) {
      this.endMatch();
    }
  }

  private endMatch() {
    this.finished = true;
    const won = this.scoreA > this.scoreB;
    this.result = { won, scoreA: this.scoreA, scoreB: this.scoreB, region: this.region, mode: this.mode };
    if (won) {
      const baseCoins = this.mode === "boss" ? 800 : 250;
      const baseXp = this.mode === "boss" ? 400 : 150;
      this.gs.addCurrency(baseCoins, this.mode === "boss" ? 25 : 5);
      this.gs.addXp(baseXp);
      if (this.mode === "boss" && this.region) {
        this.gs.defeatBoss(this.region);
        this.gs.notifyEvent("derrotarJefe", this.region, 1);
      }
      this.gs.recordMatchWin(this.arenaId());
    }
  }

  private arenaId(): string {
    if (!this.region) return "estadio_central";
    return `estadio_${this.region}`;
  }

  private updateCamera(dt: number) {
    const car = this.playerCar.car;
    const behind = new THREE.Vector3(Math.sin(car.heading + Math.PI), 0, Math.cos(car.heading + Math.PI));
    const desired = car.position
      .clone()
      .add(behind.multiplyScalar(this.cameraDistance))
      .add(new THREE.Vector3(0, this.cameraHeight, 0));
    const smoothing = 1 - Math.pow(0.0008, dt);
    this.camera.position.lerp(desired, smoothing);
    this.camera.lookAt(car.position.clone().add(new THREE.Vector3(0, 1, 0)).lerp(this.ball.position, 0.15));
  }

  dispose() {
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
  }
}

export function bossNameFor(region: RegionId): { name: string; title: string } {
  const r = REGIONS[region];
  return { name: r.bossName, title: r.bossTitle };
}

export function buildBossPreviewMesh(_region: RegionId): THREE.Group {
  return buildCarMesh({ bodyColor: 0x8b0000, wheelColor: 0x111111, turboColor: 0xff0033, antenna: true, trail: true, scale: 1.15 });
}
