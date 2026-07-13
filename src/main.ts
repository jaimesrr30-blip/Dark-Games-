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
import { STAGES, STAGE_ORDER, type StageId } from "./data/stages";
import { Stage2D } from "./stage/Stage2D";
import { buildInteractables2D, type Interactable2D } from "./stage/Interactables2D";
import { Match2D } from "./match2d/Match2D";
import { Interior2D } from "./stage/Interior2D";
import { HideoutInterior2D } from "./stage/HideoutInterior2D";
import { PYRAMID_BUTTONS, SECRET_DOORS, pyramidPos, ROCKET_PARTS, ROCKET_ENGINE_ID, HIDEOUTS, type HideoutSpawn } from "./data/spawns";
import { petSellPrice } from "./data/pets";
import { hashString } from "./utils/random";

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
let hideoutInterior: HideoutInterior2D | null = null;
let mode: "world" | "match" | "interior" | "ceremony" | "hideout" = "world";
let pendingGuardian: NpcDef | null = null;
let pendingHideout: HideoutSpawn | null = null;
let matchEnding = false;
let portalFxT = 0;

interface KeyCeremony {
  t: number;
  total: number;
  onDone: () => void;
}
let ceremony: KeyCeremony | null = null;

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
      if (action === "payAndPlay") {
        if (gs.spend(g.priceCoins, "monedas")) {
          ui.toast(g.payLine, "raro");
          beginGuardianMatch(def);
        } else {
          ui.toast(g.noMoneyLine);
        }
      }
    });
  });
}

function fieldThemeForGuardian(def: NpcDef): StageId {
  const others = STAGE_ORDER.filter((s) => s !== "hub" && s !== stage.def.id);
  const idx = hashString(def.id) % others.length;
  return others[idx];
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
  match = new Match2D(gs, input, "normal", stage.def.id, def.guardian!.difficulty, def.color, fieldThemeForGuardian(def));
  camera.snap(0, 0);
  mode = "match";
  ui.showMatchHUD();
  ui.setMatchPetBadge(match.activePetBadge);
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
  ui.setMatchPetBadge(match.activePetBadge);
}

function endMatch() {
  if (!match || !match.result || matchEnding) return;
  matchEnding = true;
  const r = match.result;
  const guardian = pendingGuardian;
  pendingGuardian = null;
  const hideout = pendingHideout;
  pendingHideout = null;

  if (guardian && r.won) {
    gs.grantKey(guardian.guardian!.keyId);
  }
  if (hideout && r.won) {
    // defeatHideout dispara la misión de la guarida, que ya otorga
    // rewardMonedas/rewardDiamantes/rewardXp automáticamente al completarse.
    gs.defeatHideout(hideout.id);
    if (hideout.rewardItemId) gs.grantItem(hideout.rewardItemId);
  }

  let wonRocketEngine = false;
  if (r.won && r.mode === "boss" && r.stage === "celestial" && !gs.hasPuzzleItem(ROCKET_ENGINE_ID)) {
    gs.collectPuzzleItem(ROCKET_ENGINE_ID);
    wonRocketEngine = true;
  }

  const rewardsText = r.won
    ? guardian
      ? `${guardian.guardian!.winLine} +200 monedas · +4 diamantes · +120 XP`
      : hideout
        ? `¡Guarida despejada! +${hideout.rewardCoins} monedas${hideout.rewardItemId ? " · +1 objeto" : ""} · +8 diamantes · +130 XP`
        : r.mode === "boss"
          ? wonRocketEngine
            ? "+900 monedas · +30 diamantes · +450 XP · ¡Consigues el motor del cohete!"
            : "+900 monedas · +30 diamantes · +450 XP · ¡Siguiente etapa desbloqueada!"
          : "+200 monedas · +4 diamantes · +120 XP"
    : "Sin recompensas esta vez. ¡Inténtalo de nuevo!";
  ui.hideMatchHUD();
  ui.showMatchEnd(r.won, r.scoreA, r.scoreB, rewardsText, () => {
    match = null;
    matchEnding = false;
    mode = hideout ? "hideout" : "world";
    if (r.won && r.mode === "boss") portalFxT = 1.4;
    if (wonRocketEngine && gs.countPuzzleItems([...ROCKET_PARTS.map((p) => p.id), ROCKET_ENGINE_ID]) >= 5) {
      ui.showEnding(() => {});
    }
  });
}

// ---------------- Ceremonia de las 3 llaves ----------------

function beginKeyCeremony(onDone: () => void) {
  ceremony = { t: 0, total: 2.6, onDone };
  mode = "ceremony";
  ui.hideWorldMenus();
  ui.setInteractPrompt(null);
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

// ---------------- Guaridas (misión secundaria) ----------------

function enterHideout(hideout: HideoutSpawn) {
  hideoutInterior = new HideoutInterior2D(hideout);
  player.setPosition(hideoutInterior.spawnPos[0], hideoutInterior.spawnPos[1]);
  camera.snap(player.x, player.y);
  mode = "hideout";
  ui.hideWorldMenus();
}

function exitHideout() {
  if (!hideoutInterior) return;
  const h = hideoutInterior.hideout;
  hideoutInterior = null;
  mode = "world";
  player.setPosition(h.pos[0], h.pos[1] + 60);
  camera.snap(player.x, player.y);
  ui.showWorldMenus();
}

function beginHideoutMatch(h: HideoutSpawn) {
  pendingHideout = h;
  match = new Match2D(gs, input, "normal", h.stage, h.difficulty, h.enemyColor);
  camera.snap(0, 0);
  mode = "match";
  ui.showMatchHUD();
  ui.setMatchPetBadge(match.activePetBadge);
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

  const hideout = HIDEOUTS.find((h) => h.stage === stage.def.id);
  if (hideout) {
    const d = Math.hypot(p.x - hideout.pos[0], p.y - hideout.pos[1]);
    if (d < 45 && (!best || d < best.dist)) {
      best = {
        dist: d,
        label: gs.isHideoutDefeated(hideout.id) ? "Entrar a la guarida (ya despejada)" : "Entrar a la guarida",
        run: () => enterHideout(hideout),
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
          beginKeyCeremony(() => ui.showBossIntro(stage.def.id, () => beginMatch("boss")));
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
    drawHideoutDoor();
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
    ui.updateMatchHUD(match.scoreA, match.scoreB, match.timeLeft, match.boostFuel, match.touchCount, match.turboBoostActive);
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
  } else if (mode === "hideout" && hideoutInterior) {
    if (!ui.anyModalOpen()) {
      player.update(dt, { x: input.moveX, y: input.moveY, boost: input.boost }, hideoutInterior.bounds);
    }
    hideoutInterior.update(dt);
    camera.follow(player.x, player.y, { w: 520, h: 400 }, 0.15);
    const defeated = gs.isHideoutDefeated(hideoutInterior.hideout.id);
    hideoutInterior.draw(ctx, camera, defeated);
    player.draw(ctx, camera, player.speed > 20);

    const dEnemy = Math.hypot(player.x - hideoutInterior.enemyPos[0], player.y - hideoutInterior.enemyPos[1]);
    const dExitH = Math.hypot(player.x - hideoutInterior.exitPos[0], player.y - hideoutInterior.exitPos[1]);
    let hLabel: string | null = null;
    let hAction: (() => void) | null = null;
    if (dEnemy < 45 && !defeated) {
      hLabel = `Desafiar a ${hideoutInterior.hideout.enemyName}`;
      hAction = () => beginHideoutMatch(hideoutInterior!.hideout);
    } else if (dExitH < 45) {
      hLabel = "Salir";
      hAction = () => exitHideout();
    }
    ui.setInteractPrompt(hLabel);
    if (hLabel && hAction && input.wasPressed("KeyE")) hAction();
  } else if (mode === "ceremony" && ceremony) {
    ceremony.t += dt;
    camera.follow(player.x, player.y, { w: stage.def.width, h: stage.def.height }, 0.2);

    stage.drawBackground(ctx, camera);
    stage.drawProps(ctx, camera);
    stage.drawLandmarks(ctx, camera);
    player.draw(ctx, camera, false);
    drawKeyCeremonyFx(ceremony.t, ceremony.total);

    if (ceremony.t >= ceremony.total) {
      const onDone = ceremony.onDone;
      ceremony = null;
      mode = "world";
      ui.showWorldMenus();
      onDone();
    }
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

function drawHideoutDoor() {
  const hideout = HIDEOUTS.find((h) => h.stage === stage.def.id);
  if (!hideout || !camera.isVisible(hideout.pos[0], hideout.pos[1], 100)) return;
  const [sx, sy] = camera.worldToScreen(hideout.pos[0], hideout.pos[1]);
  const defeated = gs.isHideoutDefeated(hideout.id);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = defeated ? "#2a1f1f" : "#3a1414";
  ctx.fillRect(-22, -36, 44, 46);
  ctx.strokeStyle = defeated ? "#7a5a5a" : "#ff5a5a";
  ctx.lineWidth = 3;
  ctx.strokeRect(-22, -36, 44, 46);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 3;
  ctx.fillText(defeated ? "Guarida (despejada)" : "Guarida", 0, -46);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawKeyCeremonyFx(t: number, total: number) {
  const [px, py] = camera.worldToScreen(player.x, player.y);
  const w = camera.viewW;
  const h = camera.viewH;

  ctx.save();

  // viñeta: oscurece los bordes para centrar la atención en el coche
  const vignetteIn = Math.min(1, t / 0.5);
  const vignetteOut = t > total - 0.4 ? Math.max(0, (total - t) / 0.4) : 1;
  const vignetteA = vignetteIn * vignetteOut;
  const grad = ctx.createRadialGradient(px, py, 40, px, py, Math.max(w, h) * 0.65);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(4,4,10,${0.8 * vignetteA})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // las 3 llaves vuelan desde distintos puntos de la pantalla y convergen en el coche
  const keyColors = ["#ffd76b", "#8fd3ff", "#ff8fe0"];
  const startOffsets: [number, number][] = [
    [-w * 0.36, -h * 0.3],
    [w * 0.38, -h * 0.12],
    [0, h * 0.36],
  ];
  const arriveStart = 0.35;
  const arriveEnd = 1.7;
  for (let i = 0; i < 3; i++) {
    const localT = Math.max(0, Math.min(1, (t - arriveStart - i * 0.15) / (arriveEnd - arriveStart)));
    if (localT <= 0) continue;
    const ease = 1 - Math.pow(1 - localT, 3);
    const kx = px + startOffsets[i][0] * (1 - ease);
    const ky = py + startOffsets[i][1] * (1 - ease);
    const scale = 0.6 + ease * 0.6;
    const fadeOut = t > arriveEnd ? Math.max(0, 1 - (t - arriveEnd) / 0.35) : 1;
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(ease * Math.PI * 2 * (i % 2 === 0 ? 1 : -1));
    ctx.scale(scale, scale);
    ctx.globalAlpha = fadeOut;
    ctx.fillStyle = keyColors[i];
    ctx.strokeStyle = "#2a1a00";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-2.5, -4, 5, 16);
    ctx.fillRect(0, 8, 6, 3);
    ctx.fillRect(0, 3, 5, 3);
    ctx.restore();
  }

  // estallido de portal cuando las 3 llaves encajan
  if (t > arriveEnd) {
    const bt = Math.min(1, (t - arriveEnd) / 0.5);
    ctx.globalAlpha = Math.max(0, 1 - bt) * 0.9;
    ctx.fillStyle = "#fff8e0";
    ctx.beginPath();
    ctx.arc(px, py, 60 * bt, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffe08a";
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = Math.max(0, 1 - bt) * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, 20 + bt * (200 + i * 50), 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // texto de la ceremonia
  ctx.save();
  const textAlpha = t < arriveEnd ? Math.min(1, t / 0.4) : Math.max(0, 1 - (t - arriveEnd) / 0.5);
  ctx.globalAlpha = textAlpha;
  ctx.font = "900 26px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9a8";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 8;
  ctx.fillText(t < arriveEnd ? "Colocando las 3 llaves..." : "¡El portal se abre!", w / 2, h * 0.16);
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
