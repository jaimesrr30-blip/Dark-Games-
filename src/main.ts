import "./style.css";
import { GameState } from "./state/GameState";
import { UIManager } from "./ui/UIManager";
import { Input } from "./core/Input";
import { Camera2D } from "./core/Camera2D";
import { CarBody2D } from "./entities/Car2D";
import { visualFromState } from "./entities/carVisual";
import { Npc2DInstance } from "./entities/Npc2D";
import { NPCS } from "./data/npcs";
import { MISSIONS } from "./data/missions";
import { STAGES, type StageId } from "./data/stages";
import { Stage2D } from "./stage/Stage2D";
import { buildInteractables2D, type Interactable2D } from "./stage/Interactables2D";
import { Match2D } from "./match2d/Match2D";

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const gs = new GameState();
const uiRoot = document.getElementById("ui-root") as HTMLElement;
const ui = new UIManager(uiRoot, gs);
const input = new Input();
const camera = new Camera2D();

let stage: Stage2D;
let player: CarBody2D;
let npcInstances: Npc2DInstance[] = [];
let interactables: Interactable2D[] = [];
let match: Match2D | null = null;
let mode: "world" | "match" = "world";

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * Math.min(window.devicePixelRatio || 1, 2);
  canvas.height = h * Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  camera.viewW = w;
  camera.viewH = h;
}
window.addEventListener("resize", resize);

function npcHasContent(def: (typeof NPCS)[number]): boolean {
  if (!def.missionIds) return false;
  return def.missionIds.some((id) => {
    const m = MISSIONS.find((mm) => mm.id === id);
    if (!m) return false;
    if (!gs.isMissionAvailable(m)) return false;
    return !gs.getMissionProgress(id).completed;
  });
}

function loadStage(id: StageId, pos?: [number, number] | null) {
  stage = new Stage2D(id);
  interactables = buildInteractables2D(id);
  npcInstances = NPCS.filter((n) => n.stage === id).map((def) => new Npc2DInstance(def, def.pos[0], def.pos[1]));

  if (!player) player = new CarBody2D(visualFromState(gs));
  const spawn = pos ?? stage.spawnPoint;
  player.setPosition(spawn[0], spawn[1]);
  camera.snap(spawn[0], spawn[1]);
  gs.setPlayerLocation(id, spawn);
}

function talkToNpc(npc: Npc2DInstance) {
  ui.openDialogue(npc.def.name, npc.def.dialogue, () => {
    gs.notifyEvent("hablarCon", npc.def.id, 1);
    if (npc.def.shopId) ui.openShopModal(`Tienda de ${npc.def.name}`);
  });
}

function beginMatch(modeType: "normal" | "boss") {
  match = new Match2D(gs, input, modeType, stage.def.id);
  camera.snap(0, 0);
  mode = "match";
  ui.showMatchHUD();
}

function endMatch() {
  if (!match || !match.result) return;
  const r = match.result;
  const rewardsText = r.won
    ? r.mode === "boss"
      ? "+900 monedas · +30 diamantes · +450 XP · ¡Siguiente etapa desbloqueada!"
      : "+200 monedas · +4 diamantes · +120 XP"
    : "Sin recompensas esta vez. ¡Inténtalo de nuevo!";
  ui.hideMatchHUD();
  ui.showMatchEnd(r.won, r.scoreA, r.scoreB, rewardsText, () => {
    match = null;
    mode = "world";
  });
}

function findNearestInteraction(): { label: string; run: () => void } | null {
  const p = player;
  let best: { dist: number; label: string; run: () => void } | null = null;

  for (const npc of npcInstances) {
    const d = Math.hypot(p.x - npc.x, p.y - npc.y);
    if (d < 55 && (!best || d < best.dist)) {
      best = { dist: d, label: `Hablar con ${npc.def.name}`, run: () => talkToNpc(npc) };
    }
  }

  for (const it of interactables) {
    if (!it.isAvailable(gs)) continue;
    const d = Math.hypot(p.x - it.x, p.y - it.y);
    if (d < 50 && (!best || d < best.dist)) {
      best = {
        dist: d,
        label: it.promptLabel,
        run: () => {
          const result = it.interact(gs);
          ui.toast(result.message, result.rarity);
        },
      };
    }
  }

  const [tx, ty] = stage.trainingFieldPos;
  const dTrain = Math.hypot(p.x - tx, p.y - ty);
  if (dTrain < 60 && (!best || dTrain < best.dist)) {
    best = { dist: dTrain, label: "Jugar partido de entrenamiento", run: () => beginMatch("normal") };
  }

  if (stage.def.id !== "hub") {
    const [gx, gy] = stage.bossGatePos;
    const dGate = Math.hypot(p.x - gx, p.y - gy);
    if (dGate < 70 && (!best || dGate < best.dist)) {
      const gate = gs.stageGateStatus(stage.def.id);
      const locked = !gate.ready;
      best = {
        dist: dGate,
        label: locked ? `Puerta bloqueada (misiones ${gate.completed}/${gate.required}, monedas ${Math.floor(gs.data.monedas)}/${gate.requiredCoins})` : `Desafiar a ${stage.def.bossName}`,
        run: () => {
          if (locked) {
            ui.toast("Aún no cumples los requisitos para entrar.");
            return;
          }
          ui.showBossIntro(stage.def.id, () => beginMatch("boss"));
        },
      };
    }
  }

  return best;
}

let saveTimer = 0;

function loop(tsMs: number) {
  const dt = Math.min(0.05, (loop.last ? (tsMs - loop.last) / 1000 : 0.016));
  loop.last = tsMs;

  if (mode === "world") {
    const modalOpen = ui.anyModalOpen();
    if (!modalOpen) {
      player.update(dt, { x: input.moveX, y: input.moveY, boost: input.boost }, stage.bounds);
    }
    stage.update(dt);

    camera.follow(player.x, player.y, { w: stage.def.width, h: stage.def.height });

    stage.drawBackground(ctx, camera);
    stage.drawProps(ctx, camera);
    stage.drawTrainingField(ctx, camera);
    stage.drawBossGate(ctx, camera, gs.stageGateStatus(stage.def.id).ready, gs.isBossDefeated(stage.def.id));
    stage.drawBounds(ctx, camera);

    for (const it of interactables) it.draw(ctx, camera, performance.now() / 1000);
    for (const npc of npcInstances) npc.draw(ctx, camera, dt, npcHasContent(npc.def));
    player.draw(ctx, camera, player.speed > 20);

    ui.renderMinimap(player.x, player.y, stage, false);

    if (!modalOpen) {
      const nearest = findNearestInteraction();
      ui.setInteractPrompt(nearest?.label ?? null);
      if (nearest && input.wasPressed("KeyE")) nearest.run();
    } else {
      ui.setInteractPrompt(null);
    }

    if (ui.isGarageOpen()) ui.renderGarageFrame(dt);

    saveTimer += dt;
    if (saveTimer > 1) {
      saveTimer = 0;
      gs.setPlayerLocation(stage.def.id, [player.x, player.y]);
    }
  } else if (match) {
    match.update(dt);
    camera.follow(match.player.x, match.player.y, { w: match.width, h: match.height }, 0.1);
    ui.updateMatchHUD(match.scoreA, match.scoreB, match.timeLeft, match.boostFuel, match.touchCount);
    ui.renderMinimap(0, 0, stage, true);
    match.draw(ctx, camera);
    if (match.finished) endMatch();
  }

  input.consumeFrame();
  requestAnimationFrame(loop);
}
loop.last = 0;

function startGame() {
  loadStage(gs.data.currentStage, gs.data.playerPos);
  ui.onEquipChange = () => {
    player.visual = visualFromState(gs);
  };
  ui.onTravelToStage = (id) => loadStage(id);
  resize();
  ui.hideLoading();
  requestAnimationFrame(loop);

  if (import.meta.env.DEV) {
    (window as unknown as { __game: unknown }).__game = {
      gs,
      ui,
      player,
      stage: () => stage,
      match: () => match,
      forceBoss: () => beginMatch("boss"),
    };
  }
}

ui.hideLoading();
ui.showMainMenu(
  !!localStorage.getItem("cubo_pilot_2d_save_v1"),
  () => {
    gs.resetSave();
    startGame();
  },
  () => startGame()
);
