import "./style.css";
import { GameState } from "./state/GameState";
import { UIManager } from "./ui/UIManager";
import { Input } from "./core/Input";
import { Camera2D } from "./core/Camera2D";
import { CarBody2D } from "./entities/Car2D";
import { visualFromState } from "./entities/carVisual";
import { Npc2DInstance } from "./entities/Npc2D";
import { NPCS, type NpcDef } from "./data/npcs";
import { MISSIONS } from "./data/missions";
import { STAGES, type StageId } from "./data/stages";
import { Stage2D } from "./stage/Stage2D";
import { buildInteractables2D, type Interactable2D } from "./stage/Interactables2D";
import { Match2D } from "./match2d/Match2D";
import { Interior2D } from "./stage/Interior2D";
import { PYRAMID_BUTTONS, SECRET_DOORS, pyramidPos, ROCKET_PARTS, ROCKET_ENGINE_ID } from "./data/spawns";
import { petSellPrice } from "./data/pets";

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
let interior: Interior2D | null = null;
let mode: "world" | "match" | "interior" = "world";
let pendingGuardian: NpcDef | null = null;
let portalFxT = 0;

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

function npcHasContent(def: NpcDef): boolean {
  if (def.role === "guardian") return def.guardian ? !gs.hasKey(def.guardian.keyId) : false;
  if (def.role === "mascotas") return gs.data.pets.length > 0;
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

// ---------------- NPCs: diálogo, tienda, mascotas, guardianes ----------------

function talkToNpc(npc: Npc2DInstance) {
  const def = npc.def;
  if (def.role === "guardian") {
    talkToGuardian(def);
    return;
  }
  if (def.role === "mascotas") {
    ui.openDialogue(def.name, def.dialogue, () => {
      ui.openPetSellModal(def.name, (uid) => {
        const pet = gs.data.pets.find((p) => p.uid === uid);
        if (!pet) return;
        const price = petSellPrice(pet);
        gs.sellPet(uid, price);
        ui.toast(`Vendida por ${price} monedas.`);
      });
    });
    return;
  }
  ui.openDialogue(def.name, def.dialogue, () => {
    gs.notifyEvent("hablarCon", def.id, 1);
    if (def.shopId) ui.openShopModal(`Tienda de ${def.name}`, def.shopId);
  });
}

function talkToGuardian(def: NpcDef) {
  const g = def.guardian!;
  ui.openDialogue(def.name, def.dialogue, () => {
    if (gs.hasKey(g.keyId)) {
      ui.toast(g.alreadyLine);
      return;
    }
    if (def.id === "custodio_piramide") {
      talkToPyramidGuardian(def);
      return;
    }
    ui.openGuardianModal(def, (action) => {
      if (action === "pay") {
        if (gs.spend(g.priceCoins, "monedas")) {
          gs.grantKey(g.keyId);
          ui.toast(g.payLine, "raro");
        } else {
          ui.toast(g.noMoneyLine);
        }
      } else if (action === "match") {
        beginGuardianMatch(def);
      }
    });
  });
}

function pyramidButtonIds(): string[] {
  return PYRAMID_BUTTONS.map((b) => b.id);
}

function talkToPyramidGuardian(def: NpcDef) {
  const have = gs.countPuzzleItems(pyramidButtonIds());
  if (have >= 3) {
    gs.grantKey(def.guardian!.keyId);
    ui.toast("¡Los 3 botones encajan! La pirámide se abre y te entrega la llave.", "raro");
  } else {
    ui.toast(`Necesitas los 3 botones de piedra escondidos por el desierto (${have}/3 encontrados).`);
  }
}

function beginGuardianMatch(def: NpcDef) {
  pendingGuardian = def;
  match = new Match2D(gs, input, "normal", stage.def.id, def.guardian!.difficulty, def.color);
  camera.snap(0, 0);
  mode = "match";
  ui.showMatchHUD();
}

// ---------------- Partidos ----------------

function trainingSkillForStage(): number {
  return Math.min(0.9, 0.32 + STAGES[stage.def.id].order * 0.06);
}

function beginMatch(modeType: "normal" | "boss") {
  const skill = modeType === "boss" ? Math.min(0.98, 0.8 + STAGES[stage.def.id].order * 0.02) : trainingSkillForStage();
  match = new Match2D(gs, input, modeType, stage.def.id, skill);
  camera.snap(0, 0);
  mode = "match";
  ui.showMatchHUD();
}

function endMatch() {
  if (!match || !match.result) return;
  const r = match.result;
  const guardian = pendingGuardian;
  pendingGuardian = null;

  if (guardian && r.won) {
    gs.grantKey(guardian.guardian!.keyId);
  }

  let wonRocketEngine = false;
  if (r.won && r.mode === "boss" && r.stage === "celestial" && !gs.hasPuzzleItem(ROCKET_ENGINE_ID)) {
    gs.collectPuzzleItem(ROCKET_ENGINE_ID);
    wonRocketEngine = true;
  }

  const rewardsText = r.won
    ? guardian
      ? `${guardian.guardian!.winLine} +200 monedas · +4 diamantes · +120 XP`
      : r.mode === "boss"
        ? wonRocketEngine
          ? "+900 monedas · +30 diamantes · +450 XP · ¡Consigues el motor del cohete!"
          : "+900 monedas · +30 diamantes · +450 XP · ¡Siguiente etapa desbloqueada!"
        : "+200 monedas · +4 diamantes · +120 XP"
    : "Sin recompensas esta vez. ¡Inténtalo de nuevo!";
  ui.hideMatchHUD();
  ui.showMatchEnd(r.won, r.scoreA, r.scoreB, rewardsText, () => {
    match = null;
    mode = "world";
    if (r.won && r.mode === "boss") portalFxT = 1.4;
    if (wonRocketEngine && gs.countPuzzleItems([...ROCKET_PARTS.map((p) => p.id), ROCKET_ENGINE_ID]) >= 5) {
      ui.showEnding(() => {});
    }
  });
}

// ---------------- Interiores secretos ----------------

function enterInterior(door: (typeof SECRET_DOORS)[number]) {
  interior = new Interior2D(door);
  player.setPosition(interior.spawnPos[0], interior.spawnPos[1]);
  camera.snap(player.x, player.y);
  mode = "interior";
  ui.hideWorldMenus();
}

function exitInterior() {
  if (!interior) return;
  const door = interior.door;
  interior = null;
  mode = "world";
  player.setPosition(door.pos[0], door.pos[1] + 60);
  camera.snap(player.x, player.y);
  ui.showWorldMenus();
}

// ---------------- Interacción más cercana ----------------

function findNearestInteraction(): { label: string; run: () => void } | null {
  const p = player;
  let best: { dist: number; label: string; run: () => void } | null = null;

  for (const npc of npcInstances) {
    const d = Math.hypot(p.x - npc.x, p.y - npc.y);
    if (d < 55 && (!best || d < best.dist)) {
      const label = npc.def.role === "guardian" ? `Hablar con ${npc.def.name} (guardián)` : npc.def.role === "mascotas" ? `Hablar con ${npc.def.name} (compra mascotas)` : `Hablar con ${npc.def.name}`;
      best = { dist: d, label, run: () => talkToNpc(npc) };
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

  if (stage.def.id === "desierto") {
    for (const btn of PYRAMID_BUTTONS) {
      if (gs.hasPuzzleItem(btn.id)) continue;
      const d = Math.hypot(p.x - btn.pos[0], p.y - btn.pos[1]);
      if (d < 45 && (!best || d < best.dist)) {
        best = {
          dist: d,
          label: "Recoger botón de piedra",
          run: () => {
            gs.collectPuzzleItem(btn.id);
            gs.notifyEvent("recogerBotones", "desierto", 1);
            const have = gs.countPuzzleItems(pyramidButtonIds());
            ui.toast(`Botón de piedra recogido (${have}/3). Llévalos a la pirámide.`);
          },
        };
      }
    }
  }

  if (stage.def.id === "celestial") {
    for (const part of ROCKET_PARTS) {
      if (gs.hasPuzzleItem(part.id)) continue;
      const d = Math.hypot(p.x - part.pos[0], p.y - part.pos[1]);
      if (d < 45 && (!best || d < best.dist)) {
        best = {
          dist: d,
          label: "Recoger pieza de cohete",
          run: () => {
            gs.collectPuzzleItem(part.id);
            gs.notifyEvent("recogerPiezas", "celestial", 1);
            const have = gs.countPuzzleItems(ROCKET_PARTS.map((r) => r.id));
            ui.toast(`Pieza de cohete recogida (${have}/4).`);
          },
        };
      }
    }
  }

  const door = SECRET_DOORS.find((d) => d.stage === stage.def.id);
  if (door) {
    const d = Math.hypot(p.x - door.pos[0], p.y - door.pos[1]);
    if (d < 45 && (!best || d < best.dist)) {
      best = {
        dist: d,
        label: gs.data.discoveredSecrets[door.id] ? "Entrar (secreto ya visitado)" : "??? Entrar a la puerta secreta",
        run: () => {
          gs.discoverSecret(door.id);
          enterInterior(door);
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
      const gate = gs.stageKeysStatus(stage.def.id);
      const locked = !gate.ready;
      best = {
        dist: dGate,
        label: locked ? `Puerta bloqueada (llaves ${gate.have}/${gate.required})` : `Desafiar a ${stage.def.bossName}`,
        run: () => {
          if (locked) {
            ui.toast("Aún no tienes las 3 llaves de esta etapa.");
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
  const dt = Math.min(0.05, loop.last ? (tsMs - loop.last) / 1000 : 0.016);
  loop.last = tsMs;

  if (portalFxT > 0) portalFxT = Math.max(0, portalFxT - dt);

  if (mode === "world") {
    const modalOpen = ui.anyModalOpen();
    if (!modalOpen) {
      player.update(dt, { x: input.moveX, y: input.moveY, boost: input.boost }, stage.bounds);
    }
    stage.update(dt);

    camera.follow(player.x, player.y, { w: stage.def.width, h: stage.def.height });

    stage.drawBackground(ctx, camera);
    stage.drawProps(ctx, camera);
    stage.drawLandmarks(ctx, camera);
    stage.drawTrainingField(ctx, camera);
    stage.drawBossGate(ctx, camera, gs.stageKeysStatus(stage.def.id).ready, gs.isBossDefeated(stage.def.id));
    if (stage.def.id === "desierto") drawPyramidAndButtons();
    if (stage.def.id === "celestial") drawRocketParts();
    drawSecretDoor();
    stage.drawBounds(ctx, camera);

    for (const it of interactables) it.draw(ctx, camera, performance.now() / 1000);
    for (const npc of npcInstances) npc.draw(ctx, camera, dt, npcHasContent(npc.def));
    player.draw(ctx, camera, player.speed > 20);

    if (portalFxT > 0) drawPortalFx();

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
  } else if (mode === "match" && match) {
    match.update(dt);
    camera.follow(match.player.x, match.player.y, { w: match.width, h: match.height }, 0.1);
    ui.updateMatchHUD(match.scoreA, match.scoreB, match.timeLeft, match.boostFuel, match.touchCount);
    ui.renderMinimap(0, 0, stage, true);
    match.draw(ctx, camera);
    if (match.finished) endMatch();
  } else if (mode === "interior" && interior) {
    if (!ui.anyModalOpen()) {
      player.update(dt, { x: input.moveX, y: input.moveY, boost: input.boost }, interior.bounds);
    }
    interior.update(dt);
    camera.follow(player.x, player.y, { w: 520, h: 400 }, 0.15);
    interior.draw(ctx, camera);
    player.draw(ctx, camera, player.speed > 20);

    const chestId = `secret_chest_${interior.door.id}`;
    const dChest = Math.hypot(player.x - interior.chestPos[0], player.y - interior.chestPos[1]);
    const dExit = Math.hypot(player.x - interior.exitPos[0], player.y - interior.exitPos[1]);
    let label: string | null = null;
    let action: (() => void) | null = null;
    if (dChest < 45 && !gs.data.chests.collected[chestId]) {
      label = "Abrir cofre secreto";
      action = () => {
        gs.collectChest(chestId);
        gs.grantItem(interior!.door.rewardItemId);
        gs.addCurrency(interior!.door.coins, 0);
        ui.toast(`¡Encontraste un objeto secreto y +${interior!.door.coins} monedas!`, interior!.door.chestMinRarity);
      };
    } else if (dExit < 45) {
      label = "Salir";
      action = () => exitInterior();
    }
    ui.setInteractPrompt(label);
    if (label && action && input.wasPressed("KeyE")) action();
  }

  input.consumeFrame();
  requestAnimationFrame(loop);
}
loop.last = 0;

function drawPyramidAndButtons() {
  const [px, py] = pyramidPos();
  if (!camera.isVisible(px, py, 140)) return;
  const [sx, sy] = camera.worldToScreen(px, py);
  const have = gs.countPuzzleItems(pyramidButtonIds());
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = have >= 3 ? "#ffdf6b" : "#c9a45c";
  ctx.beginPath();
  ctx.moveTo(0, -70);
  ctx.lineTo(70, 40);
  ctx.lineTo(-70, 40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#7a5a2a";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#0006";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.restore();
  ctx.font = "bold 12px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 3;
  ctx.fillText(`Pirámide (${have}/3 botones)`, sx, sy - 84);
  ctx.shadowBlur = 0;

  for (const btn of PYRAMID_BUTTONS) {
    if (gs.hasPuzzleItem(btn.id)) continue;
    if (!camera.isVisible(btn.pos[0], btn.pos[1])) continue;
    const [bx, by] = camera.worldToScreen(btn.pos[0], btn.pos[1]);
    ctx.fillStyle = "#c9a45c";
    ctx.beginPath();
    ctx.arc(bx, by, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a3a1a";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawRocketParts() {
  for (const part of ROCKET_PARTS) {
    if (gs.hasPuzzleItem(part.id)) continue;
    if (!camera.isVisible(part.pos[0], part.pos[1])) continue;
    const [sx, sy] = camera.worldToScreen(part.pos[0], part.pos[1]);
    const bob = Math.sin(performance.now() / 400 + part.pos[0]) * 4;
    ctx.save();
    ctx.translate(sx, sy + bob);
    ctx.fillStyle = "#dfe7ff";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, 6);
    ctx.lineTo(0, 14);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#8fa8ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawSecretDoor() {
  const door = SECRET_DOORS.find((d) => d.stage === stage.def.id);
  if (!door || !camera.isVisible(door.pos[0], door.pos[1], 100)) return;
  const [sx, sy] = camera.worldToScreen(door.pos[0], door.pos[1]);
  const pulse = 1 + Math.sin(performance.now() / 300) * 0.08;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "#241a12";
  ctx.fillRect(-20, -34, 40, 44);
  ctx.strokeStyle = "#ffd76b";
  ctx.lineWidth = 3;
  ctx.strokeRect(-20, -34, 40, 44);
  ctx.restore();
}

function drawPortalFx() {
  const t = 1 - portalFxT / 1.4;
  const [sx, sy] = camera.worldToScreen(player.x, player.y);
  ctx.save();
  ctx.globalAlpha = Math.min(1, portalFxT * 1.4);
  ctx.strokeStyle = "#8fd3ff";
  ctx.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(sx, sy, 30 + t * 300 + i * 40, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(143,211,255,0.15)";
  ctx.fillRect(0, 0, camera.viewW, camera.viewH);
  ctx.restore();
}

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
    ui.showIntroStory(() => startGame());
  },
  () => startGame()
);
