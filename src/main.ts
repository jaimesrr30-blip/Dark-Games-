import "./style.css";
import { GameState } from "./state/GameState";
import { UIManager } from "./ui/UIManager";
import { Input } from "./core/Input";
import { Camera2D } from "./core/Camera2D";
import { CarBody2D, roundRect } from "./entities/Car2D";
import { visualFromState } from "./entities/carVisual";
import { Npc2DInstance } from "./entities/Npc2D";
import { NPCS, type NpcDef } from "./data/npcs";
import { MISSIONS } from "./data/missions";
import { STAGES, STAGE_ORDER, PLANET_ORDER, nextPlanet, type StageId } from "./data/stages";
import { Stage2D } from "./stage/Stage2D";
import { buildInteractables2D, type Interactable2D } from "./stage/Interactables2D";
import { Match2D } from "./match2d/Match2D";
import { Interior2D } from "./stage/Interior2D";
import { HideoutInterior2D } from "./stage/HideoutInterior2D";
import { ZoneInterior2D } from "./stage/ZoneInterior2D";
import {
  PYRAMID_BUTTONS,
  SECRET_DOORS,
  pyramidPos,
  ROCKET_PARTS,
  ROCKET_ENGINE_ID,
  HIDEOUTS,
  planetShipParts,
  type HideoutSpawn,
} from "./data/spawns";
import { ZONE_QUESTS, zoneQuestsForStage, zoneQuestForGuardian, type ZoneQuest, type ZoneUnlockKind } from "./data/zoneQuests";
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
let zoneInterior: ZoneInterior2D | null = null;
let zoneInteriorNpc: Npc2DInstance | null = null;
let mode: "world" | "match" | "interior" | "ceremony" | "hideout" | "launch" | "solarmap" | "travel" | "zoneinterior" = "world";
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

interface LaunchFx {
  t: number;
  total: number;
  finalLabel: string;
  onDone: () => void;
}
let launch: LaunchFx | null = null;

interface PlanetTravel {
  t: number;
  total: number;
  target: StageId;
}
let travel: PlanetTravel | null = null;

let solarMapReturnPos: [number, number] | null = null;
let solarMapSelected = 0;
let solarMapT = 0;

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
  // Los guardianes de zona (puente/generador/resonancia) no viven en el mapa
  // abierto: se llega a ellos cruzando desde el punto de desbloqueo.
  npcInstances = NPCS.filter((n) => n.stage === id && !zoneQuestForGuardian(n.id)).map((def) => new Npc2DInstance(def, def.pos[0], def.pos[1]));

  if (!player) player = new CarBody2D(visualFromState(gs));
  const spawn = pos ?? stage.spawnPoint;
  player.setPosition(spawn[0], spawn[1]);
  camera.snap(spawn[0], spawn[1]);
  gs.setPlayerLocation(id, spawn);
}

// ---------------- NPCs: diálogo, tienda, mascotas, guardianes ----------------

function talkToNpc(npc: Npc2DInstance) {
  const def = npc.def;
  if (def.id === "ingeniero_cohete") {
    talkToRocketEngineer(def);
    return;
  }
  const mechanicPlanet = planetShipMechanics()[def.id];
  if (mechanicPlanet) {
    talkToPlanetMechanic(def, mechanicPlanet);
    return;
  }
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

function rocketPartsCount(): number {
  return gs.countPuzzleItems([...ROCKET_PARTS.map((p) => p.id), ROCKET_ENGINE_ID]);
}

function talkToRocketEngineer(def: NpcDef) {
  ui.openDialogue(def.name, def.dialogue, () => {
    if (gs.isStageUnlocked(PLANET_ORDER[0])) {
      ui.toast("El cohete ya está listo. Usa el botón del Sistema Solar cuando quieras viajar.", "raro");
      gs.notifyEvent("hablarCon", def.id, 1);
      return;
    }
    const have = rocketPartsCount();
    if (have >= 5) {
      ui.showEnding(() => {
        gs.unlockStage(PLANET_ORDER[0]);
        ui.setSolarSystemButtonVisible(true);
        beginLaunch("Bienvenido al Sistema Solar", () => enterSolarMap());
      });
      gs.notifyEvent("hablarCon", def.id, 1);
    } else {
      ui.toast(`Llevas ${have}/5 piezas del cohete. Sigue buscando por el Reino Celestial y derrota al Campeón Eterno.`);
    }
  });
}

function talkToGuardian(def: NpcDef) {
  const g = def.guardian!;
  if (gs.hasKey(g.keyId)) {
    ui.openDialogue(def.name, def.dialogue, () => ui.toast(g.alreadyLine));
    return;
  }
  if (def.id === "custodio_piramide") {
    ui.openDialogue(def.name, def.dialogue, () => talkToPyramidGuardian(def));
    return;
  }
  const zone = zoneQuestForGuardian(def.id);
  if (zone) {
    talkToZoneGuardian(def, zone);
    return;
  }
  ui.openDialogue(def.name, def.dialogue, () => {
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

function talkToZoneGuardian(def: NpcDef, zone: ZoneQuest) {
  if (!gs.isZoneUnlocked(zone.id)) {
    ui.toast(`Parece que no hay forma de llegar hasta ${def.name} todavía...`);
    return;
  }
  const lines = [...def.dialogue, zone.askLine];
  ui.openDialogue(def.name, lines, () => {
    if (gs.hasPuzzleItem(zone.favorItemId)) {
      gs.grantKey(def.guardian!.keyId);
      ui.toast(zone.thanksLine, "raro");
    } else {
      ui.toast(`Todavía no encontraste lo que pidió ${def.name}: ${zone.favorLabel.toLowerCase()}.`);
    }
  });
}

function planetShipMechanics(): Record<string, StageId> {
  return {
    mecanico_polvo: "planeta_escarlata",
    mecanica_flotante: "planeta_anillos",
    arquitecto_cristal: "planeta_cristal",
  };
}

const REQUIRED_FUEL = 5;
const FUEL_PRICE_PER_UNIT = 260;

function talkToPlanetMechanic(def: NpcDef, planetStage: StageId) {
  ui.openDialogue(def.name, def.dialogue, () => {
    gs.notifyEvent("hablarCon", def.id, 1);
    if (gs.isPlanetShipBuilt(planetStage)) {
      ui.toast("La nave ya está lista. Usa el Sistema Solar cuando quieras viajar.", "raro");
      return;
    }
    if (!gs.isBossDefeated(planetStage)) {
      ui.toast(`Antes de tocar la nave, demuéstrame que puedes con ${STAGES[planetStage].bossName}.`);
      return;
    }
    const parts = planetShipParts(planetStage);
    const have = gs.countPuzzleItems(parts.map((p) => p.id));
    if (have < parts.length) {
      ui.toast(`Llevas ${have}/${parts.length} piezas de la nave escondidas por ${STAGES[planetStage].name}.`);
      return;
    }
    tryBuildShip(planetStage, def.name);
  });
}

function tryBuildShip(planetStage: StageId, mechanicName: string) {
  const fuelHave = gs.data.stellarFuel;
  if (fuelHave < REQUIRED_FUEL) {
    ui.openFuelModal(mechanicName, fuelHave, REQUIRED_FUEL, FUEL_PRICE_PER_UNIT, () => {
      const missing = REQUIRED_FUEL - fuelHave;
      const cost = missing * FUEL_PRICE_PER_UNIT;
      if (gs.spend(cost, "monedas")) {
        gs.addFuel(missing);
        ui.toast("¡Combustible comprado! Construyendo la nave...", "raro");
        finishShipBuild(planetStage);
      } else {
        ui.toast("No tienes suficiente dinero para comprar el combustible que falta.");
      }
    });
    return;
  }
  finishShipBuild(planetStage);
}

function finishShipBuild(planetStage: StageId) {
  gs.spendFuel(REQUIRED_FUEL);
  gs.buildPlanetShip(planetStage);
  const next = nextPlanet(planetStage);
  if (next) {
    gs.unlockStage(next);
    ui.toast(`¡Nave reconstruida! ${STAGES[next].name} ya está disponible.`, "raro");
    beginLaunch(`Rumbo a ${STAGES[next].name}`, () => enterSolarMap());
  } else {
    ui.toast("¡Nave reconstruida! Has completado el sistema solar entero... por ahora.", "raro");
    beginLaunch("Has conquistado el Sistema Solar", () => enterSolarMap());
  }
}

function fieldThemeForGuardian(def: NpcDef): StageId {
  const others = [...STAGE_ORDER, ...PLANET_ORDER].filter((s) => s !== "hub" && s !== stage.def.id);
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
  return Math.min(1.05, 0.32 + STAGES[stage.def.id].order * 0.06);
}

function beginMatch(modeType: "normal" | "boss") {
  const skill = modeType === "boss" ? Math.min(1.2, 0.8 + STAGES[stage.def.id].order * 0.02) : trainingSkillForStage();
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

// ---------------- Zonas de guardián (puente/generador/resonancia) ----------------

function zoneCrossLabel(kind: ZoneUnlockKind): string {
  return kind === "puente" ? "Cruzar el puente" : kind === "generador" ? "Subir a la plataforma" : "Entrar al domo";
}

function enterZoneInterior(zone: ZoneQuest) {
  const guardianDef = NPCS.find((n) => n.id === zone.guardianId);
  if (!guardianDef) return;
  zoneInterior = new ZoneInterior2D(zone);
  zoneInteriorNpc = new Npc2DInstance(guardianDef, zoneInterior.guardianPos[0], zoneInterior.guardianPos[1]);
  player.setPosition(zoneInterior.spawnPos[0], zoneInterior.spawnPos[1]);
  camera.snap(player.x, player.y);
  mode = "zoneinterior";
  ui.hideWorldMenus();
}

function exitZoneInterior() {
  if (!zoneInterior) return;
  const zone = zoneInterior.zone;
  zoneInterior = null;
  zoneInteriorNpc = null;
  mode = "world";
  player.setPosition(zone.unlockPos[0], zone.unlockPos[1] + 60);
  camera.snap(player.x, player.y);
  ui.showWorldMenus();
}

// ---------------- Sistema Solar ----------------

function beginLaunch(finalLabel: string, onDone: () => void) {
  launch = { t: 0, total: 3.2, finalLabel, onDone };
  mode = "launch";
  ui.hideWorldMenus();
  ui.setInteractPrompt(null);
}

function enterSolarMap() {
  solarMapReturnPos = [player.x, player.y];
  solarMapT = 0;
  mode = "solarmap";
  ui.hideWorldMenus();
  ui.setInteractPrompt(null);
}

function exitSolarMap() {
  mode = "world";
  ui.showWorldMenus();
  if (solarMapReturnPos) {
    player.setPosition(solarMapReturnPos[0], solarMapReturnPos[1]);
    camera.snap(solarMapReturnPos[0], solarMapReturnPos[1]);
  }
}

function beginPlanetTravel(target: StageId) {
  travel = { t: 0, total: 1.8, target };
  mode = "travel";
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

  for (const part of planetShipParts(stage.def.id)) {
    if (gs.hasPuzzleItem(part.id)) continue;
    const d = Math.hypot(p.x - part.pos[0], p.y - part.pos[1]);
    if (d < 45 && (!best || d < best.dist)) {
      const allParts = planetShipParts(stage.def.id);
      best = {
        dist: d,
        label: "Recoger pieza de nave",
        run: () => {
          gs.collectPuzzleItem(part.id);
          gs.notifyEvent("recogerPiezas", stage.def.id, 1);
          const have = gs.countPuzzleItems(allParts.map((r) => r.id));
          ui.toast(`Pieza de nave recogida (${have}/${allParts.length}).`);
        },
      };
    }
  }

  for (const zq of zoneQuestsForStage(stage.def.id)) {
    for (const m of zq.materials) {
      if (gs.hasPuzzleItem(m.id)) continue;
      const d = Math.hypot(p.x - m.pos[0], p.y - m.pos[1]);
      if (d < 40 && (!best || d < best.dist)) {
        best = {
          dist: d,
          label: `Recoger ${zq.materialLabel}`,
          run: () => {
            gs.collectPuzzleItem(m.id);
            const have = zq.materials.filter((mm) => gs.hasPuzzleItem(mm.id)).length;
            ui.toast(`${zq.materialLabel[0].toUpperCase()}${zq.materialLabel.slice(1)} recogido (${have}/${zq.materials.length}).`);
          },
        };
      }
    }

    if (!gs.hasPuzzleItem(zq.favorItemId)) {
      const d = Math.hypot(p.x - zq.favorItemPos[0], p.y - zq.favorItemPos[1]);
      if (d < 40 && (!best || d < best.dist)) {
        const guardianName = NPCS.find((n) => n.id === zq.guardianId)?.name ?? "su dueño";
        best = {
          dist: d,
          label: zq.favorLabel,
          run: () => {
            gs.collectPuzzleItem(zq.favorItemId);
            ui.toast(`¡Objeto encontrado! Llévaselo a ${guardianName}.`, "raro");
          },
        };
      }
    }

    if (!gs.isZoneUnlocked(zq.id)) {
      const haveAll = zq.materials.every((m) => gs.hasPuzzleItem(m.id));
      const have = zq.materials.filter((m) => gs.hasPuzzleItem(m.id)).length;
      const d = Math.hypot(p.x - zq.unlockPos[0], p.y - zq.unlockPos[1]);
      if (d < 60 && (!best || d < best.dist)) {
        best = {
          dist: d,
          label: haveAll ? zoneActionLabel(zq.kind) : `Faltan ${zq.materials.length - have} ${zq.materialLabel}(s)`,
          run: () => {
            if (!haveAll) {
              ui.toast(`Todavía te faltan materiales (${have}/${zq.materials.length}).`);
              return;
            }
            gs.unlockZone(zq.id);
            ui.toast(zoneUnlockToast(zq.kind), "raro");
          },
        };
      }
    } else {
      const d = Math.hypot(p.x - zq.unlockPos[0], p.y - zq.unlockPos[1]);
      if (d < 60 && (!best || d < best.dist)) {
        best = { dist: d, label: zoneCrossLabel(zq.kind), run: () => enterZoneInterior(zq) };
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
    drawPlanetShipParts();
    drawZoneQuestFeatures();
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
  } else if (mode === "zoneinterior" && zoneInterior && zoneInteriorNpc) {
    if (!ui.anyModalOpen()) {
      player.update(dt, { x: input.moveX, y: input.moveY, boost: input.boost }, zoneInterior.bounds);
    }
    zoneInterior.update(dt);
    camera.follow(player.x, player.y, { w: 640, h: 520 }, 0.15);
    zoneInterior.draw(ctx, camera);
    zoneInteriorNpc.draw(ctx, camera, dt, npcHasContent(zoneInteriorNpc.def));
    player.draw(ctx, camera, player.speed > 20);

    const dNpc = Math.hypot(player.x - zoneInterior.guardianPos[0], player.y - zoneInterior.guardianPos[1]);
    const dExitZ = Math.hypot(player.x - zoneInterior.exitPos[0], player.y - zoneInterior.exitPos[1]);
    let zLabel: string | null = null;
    let zAction: (() => void) | null = null;
    if (dNpc < 55) {
      zLabel = `Hablar con ${zoneInteriorNpc.def.name} (guardián)`;
      zAction = () => talkToNpc(zoneInteriorNpc!);
    } else if (dExitZ < 45) {
      zLabel = "Salir";
      zAction = () => exitZoneInterior();
    }
    ui.setInteractPrompt(zLabel);
    if (zLabel && zAction && input.wasPressed("KeyE")) zAction();
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
  } else if (mode === "launch" && launch) {
    launch.t += dt;
    camera.follow(player.x, player.y, { w: stage.def.width, h: stage.def.height }, 0.15);
    stage.drawBackground(ctx, camera);
    stage.drawProps(ctx, camera);
    stage.drawLandmarks(ctx, camera);
    if (launch.t < launch.total * 0.55) player.draw(ctx, camera, false);
    drawLaunchFx(launch.t, launch.total, launch.finalLabel);

    if (launch.t >= launch.total) {
      const onDone = launch.onDone;
      launch = null;
      onDone();
    }
  } else if (mode === "solarmap") {
    drawSolarSystemView(dt);
  } else if (mode === "travel" && travel) {
    travel.t += dt;
    drawTravelFx(travel.t, travel.total);
    if (travel.t >= travel.total) {
      const target = travel.target;
      travel = null;
      loadStage(target);
      mode = "world";
      ui.showWorldMenus();
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

function drawPlanetShipParts() {
  for (const part of planetShipParts(stage.def.id)) {
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
    ctx.strokeStyle = "#ffd76b";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function zoneKindLabel(kind: ZoneUnlockKind): string {
  return kind === "puente" ? "Puente" : kind === "generador" ? "Generador" : "Altar";
}
function zoneActionLabel(kind: ZoneUnlockKind): string {
  return kind === "puente" ? "Construir el puente" : kind === "generador" ? "Activar el generador" : "Colocar el cristal";
}
function zoneUnlockToast(kind: ZoneUnlockKind): string {
  return kind === "puente"
    ? "¡Puente construido! Ya puedes cruzar."
    : kind === "generador"
      ? "¡Generador activado! La plataforma se eleva."
      : "¡El cristal resuena! El domo se abre.";
}
function zoneMaterialColor(kind: ZoneUnlockKind): string {
  return kind === "puente" ? "#c9a45c" : kind === "generador" ? "#8fd3ff" : "#7bf2ff";
}
function zoneUnlockedColor(kind: ZoneUnlockKind): string {
  return kind === "puente" ? "#8a5a2a" : kind === "generador" ? "#7a5fd9" : "#3fc9d9";
}

function drawZoneQuestFeatures() {
  for (const zq of zoneQuestsForStage(stage.def.id)) {
    for (const m of zq.materials) {
      if (gs.hasPuzzleItem(m.id)) continue;
      if (!camera.isVisible(m.pos[0], m.pos[1])) continue;
      const [sx, sy] = camera.worldToScreen(m.pos[0], m.pos[1]);
      const bob = Math.sin(performance.now() / 500 + m.pos[0]) * 3;
      ctx.save();
      ctx.translate(sx, sy + bob);
      ctx.fillStyle = zoneMaterialColor(zq.kind);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    if (!gs.hasPuzzleItem(zq.favorItemId) && camera.isVisible(zq.favorItemPos[0], zq.favorItemPos[1])) {
      const [sx, sy] = camera.worldToScreen(zq.favorItemPos[0], zq.favorItemPos[1]);
      const bob = Math.sin(performance.now() / 400 + zq.favorItemPos[1]) * 4;
      ctx.save();
      ctx.translate(sx, sy + bob);
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#7a5c00";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    if (camera.isVisible(zq.unlockPos[0], zq.unlockPos[1], 100)) {
      const [sx, sy] = camera.worldToScreen(zq.unlockPos[0], zq.unlockPos[1]);
      const unlocked = gs.isZoneUnlocked(zq.id);
      const have = zq.materials.filter((m) => gs.hasPuzzleItem(m.id)).length;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.globalAlpha = unlocked ? 0.9 : 0.6;
      ctx.fillStyle = unlocked ? zoneUnlockedColor(zq.kind) : "#3a3a3a";
      roundRect(ctx, -42, -14, 84, 28, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = unlocked ? "#fff" : "#888";
      ctx.lineWidth = 2;
      roundRect(ctx, -42, -14, 84, 28, 6);
      ctx.stroke();
      ctx.restore();

      ctx.font = "bold 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 3;
      const label = unlocked ? `${zoneKindLabel(zq.kind)} listo` : `${zoneKindLabel(zq.kind)} (${have}/${zq.materials.length})`;
      ctx.fillText(label, sx, sy - 26);
      ctx.shadowBlur = 0;
    }
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

function drawLaunchFx(t: number, total: number, finalLabel: string) {
  const [px, py] = camera.worldToScreen(player.x, player.y);
  const w = camera.viewW;
  const h = camera.viewH;
  const p1 = total * 0.35;
  const p2 = total * 0.85;

  ctx.save();
  const skyT = Math.min(1, Math.max(0, (t - p1) / (p2 - p1)));
  ctx.fillStyle = `rgba(4,6,14,${skyT * 0.92})`;
  ctx.fillRect(0, 0, w, h);

  if (skyT > 0) {
    ctx.globalAlpha = skyT;
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 60; i++) {
      const sx = (i * 97 + t * 30) % w;
      const sy = (i * 53) % h;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  const riseT = Math.min(1, Math.max(0, (t - p1 * 0.6) / (total - p1 * 0.6)));
  const shakeX = t < p1 ? Math.sin(t * 40) * (1 - t / p1) * 4 : 0;
  const rocketY = py - riseT * h * 1.3;
  ctx.save();
  ctx.translate(px + shakeX, rocketY);
  if (riseT > 0.05) {
    const flameLen = 30 + Math.sin(t * 30) * 8;
    const grad = ctx.createLinearGradient(0, 20, 0, 20 + flameLen);
    grad.addColorStop(0, "rgba(255,220,140,0.9)");
    grad.addColorStop(1, "rgba(255,90,20,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-8, 20);
    ctx.lineTo(8, 20);
    ctx.lineTo(0, 20 + flameLen);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#dfe7ff";
  roundRect(ctx, -10, -26, 20, 46, 8);
  ctx.fill();
  ctx.fillStyle = "#8fa8ff";
  ctx.beginPath();
  ctx.moveTo(-10, -26);
  ctx.lineTo(0, -42);
  ctx.lineTo(10, -26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a4a8f";
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(-20, 26);
  ctx.lineTo(-10, 20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(20, 26);
  ctx.lineTo(10, 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  ctx.save();
  ctx.font = "900 26px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9a8";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 8;
  const label = t < p1 ? "¡Despegando!" : t < p2 ? "Cruzando la atmósfera..." : finalLabel;
  ctx.fillText(label, w / 2, h * 0.16);
  ctx.restore();
}

function drawSolarSystemView(dt: number) {
  solarMapT += dt;
  const w = camera.viewW;
  const h = camera.viewH;

  ctx.fillStyle = "#05040c";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  for (let i = 0; i < 140; i++) {
    const sx = (i * 137) % w;
    const sy = (i * 71) % h;
    const tw = 0.4 + Math.sin(solarMapT * 2 + i) * 0.3;
    ctx.globalAlpha = Math.max(0.15, tw);
    ctx.fillStyle = "#fff";
    const size = i % 5 === 0 ? 2 : 1;
    ctx.fillRect(sx, sy, size, size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const cx = w / 2;
  const cy = h * 0.4;
  const sunPulse = 1 + Math.sin(solarMapT * 1.5) * 0.04;
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90 * sunPulse);
  grad.addColorStop(0, "#fff8e0");
  grad.addColorStop(0.5, "#ffcf6b");
  grad.addColorStop(1, "rgba(255,150,40,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 90 * sunPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fill();

  const slots: [number, number][] = [
    [cx - 260, cy + 190],
    [cx, cy + 300],
    [cx + 260, cy + 190],
  ];

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.5;
  for (const [sxp, syp] of slots) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(40, Math.abs(sxp - cx)), Math.max(40, Math.abs(syp - cy)), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < PLANET_ORDER.length; i++) {
    const id = PLANET_ORDER[i];
    const def = STAGES[id];
    const [px, pyBase] = slots[i];
    const bob = Math.sin(solarMapT * 1.2 + i) * 6;
    const py = pyBase + bob;
    const unlocked = gs.isStageUnlocked(id);
    const defeated = gs.isBossDefeated(id);
    const radius = 34;

    ctx.save();
    ctx.translate(px, py);
    ctx.globalAlpha = unlocked ? 1 : 0.5;
    ctx.fillStyle = def.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!unlocked) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔒", 0, 7);
    }
    ctx.restore();

    ctx.globalAlpha = 1;
    ctx.font = "bold 14px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = unlocked ? "#fff" : "#888";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(def.name, px, py + radius + 22);
    ctx.font = "11px 'Segoe UI', sans-serif";
    ctx.fillStyle = defeated ? "#4caf50" : unlocked ? "#ffe066" : "#888";
    ctx.fillText(defeated ? "Jefe derrotado ✓" : unlocked ? "Disponible" : "Bloqueado", px, py + radius + 40);
    ctx.shadowBlur = 0;

    if (i === solarMapSelected) {
      const arrowBob = Math.abs(Math.sin(solarMapT * 4)) * 10;
      ctx.save();
      ctx.translate(px, py - radius - 26 - arrowBob);
      ctx.fillStyle = "#ff3b3b";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(-11, -6);
      ctx.lineTo(11, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.font = "900 30px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9a8";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.fillText("SISTEMA SOLAR", w / 2, h * 0.1);
  ctx.shadowBlur = 0;

  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("A / D para elegir · E para viajar · ESC para volver", w / 2, h * 0.94);

  if (input.wasPressed("KeyA") || input.wasPressed("ArrowLeft")) solarMapSelected = Math.max(0, solarMapSelected - 1);
  if (input.wasPressed("KeyD") || input.wasPressed("ArrowRight")) solarMapSelected = Math.min(PLANET_ORDER.length - 1, solarMapSelected + 1);
  if (input.wasPressed("KeyE")) {
    const id = PLANET_ORDER[solarMapSelected];
    if (gs.isStageUnlocked(id)) beginPlanetTravel(id);
    else ui.toast("Este planeta aún está bloqueado. Derrota al jefe del planeta anterior primero.");
  }
  if (input.wasPressed("Escape")) exitSolarMap();
}

function drawTravelFx(t: number, total: number) {
  const w = camera.viewW;
  const h = camera.viewH;
  const p = Math.min(1, t / total);
  ctx.save();
  ctx.fillStyle = "#05040c";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 40; i++) {
    const ang = (i / 40) * Math.PI * 2;
    const len = 40 + p * 260;
    const dist = 60 + i * 7;
    const x1 = cx + Math.cos(ang) * dist;
    const y1 = cy + Math.sin(ang) * dist;
    const x2 = cx + Math.cos(ang) * (dist + len);
    const y2 = cy + Math.sin(ang) * (dist + len);
    ctx.globalAlpha = 0.5 * p;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = Math.max(0, (p - 0.7) / 0.3);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function startGame() {
  loadStage(gs.data.currentStage, gs.data.playerPos);
  ui.onEquipChange = () => {
    player.visual = visualFromState(gs);
  };
  ui.onTravelToStage = (id) => loadStage(id);
  ui.onOpenSolarSystem = () => enterSolarMap();
  ui.setSolarSystemButtonVisible(gs.isStageUnlocked(PLANET_ORDER[0]));
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
      forceRocketReady: () => {
        for (const p of ROCKET_PARTS) gs.collectPuzzleItem(p.id);
        gs.collectPuzzleItem(ROCKET_ENGINE_ID);
      },
      enterSolarMap: () => enterSolarMap(),
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
