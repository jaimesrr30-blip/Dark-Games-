import * as THREE from "three";
import "./style.css";
import { GameState } from "./state/GameState";
import { UIManager } from "./ui/UIManager";
import { World } from "./world/World";
import { Input } from "./core/Input";
import { PlayerController } from "./entities/PlayerController";
import { NpcInstance } from "./entities/NPC";
import { NPCS } from "./data/npcs";
import { ARENAS, PORTALS } from "./data/spawns";
import { MISSIONS } from "./data/missions";
import { MatchManager, bossNameFor } from "./match/MatchManager";
import { REGIONS } from "./data/regions";
import type { RegionId } from "./data/regions";

const PORTAL_LOOKUP = new Map(PORTALS.map((p) => [p.id, p]));

const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const gs = new GameState();
const uiRoot = document.getElementById("ui-root") as HTMLElement;
const ui = new UIManager(uiRoot, gs);

const input = new Input(canvas);
const worldCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
const clock = new THREE.Clock(false);

let world: World;
let player: PlayerController;
let npcInstances: NpcInstance[] = [];
let match: MatchManager | null = null;
let mode: "world" | "match" = "world";
let lastRegionId: string | null = null;

const SPAWN_POS: [number, number] = [0, 5];

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  worldCamera.aspect = w / h;
  worldCamera.updateProjectionMatrix();
  if (match) {
    match.camera.aspect = w / h;
    match.camera.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resize);

function buildArenaMarkers() {
  for (const a of ARENAS) {
    const region = REGIONS[a.region];
    const color = a.isBossArena ? 0xff3b3b : 0x66ccff;
    const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.7, 10, 24), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(a.worldPos[0], 7, a.worldPos[1]);
    world.scene.add(ring);

    const baseMat = new THREE.MeshStandardMaterial({ color: region.groundColorAlt, roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(11, 12, 2, 20), baseMat);
    base.position.set(a.worldPos[0], 1, a.worldPos[1]);
    base.receiveShadow = true;
    world.scene.add(base);

    const light = new THREE.PointLight(color, 1.4, 26);
    light.position.set(a.worldPos[0], 8, a.worldPos[1]);
    world.scene.add(light);
  }
}

function npcHasContent(def: (typeof NPCS)[number]): boolean {
  if (!def.missionIds) return false;
  return def.missionIds.some((id) => {
    const m = MISSIONS.find((mm) => mm.id === id);
    if (!m) return false;
    if (!gs.isMissionAvailable(m)) return false;
    return !gs.getMissionProgress(id).completed;
  });
}

function talkToNpc(npc: NpcInstance) {
  ui.openDialogue(npc.def.name, npc.def.dialogue, () => {
    gs.notifyEvent("hablarCon", npc.def.id, 1);
    if (npc.def.shopId) {
      ui.openShopModal(`Tienda de ${npc.def.name}`);
    }
  });
}

function enterArena(arena: (typeof ARENAS)[number]) {
  if (arena.isBossArena) {
    const boss = bossNameFor(arena.region);
    ui.showBossIntro(boss.name, boss.title, () => beginMatch(arena, "boss"));
  } else {
    beginMatch(arena, "normal");
  }
}

function beginMatch(arena: (typeof ARENAS)[number], modeType: "normal" | "boss") {
  match = new MatchManager(gs, input, modeType, modeType === "boss" ? arena.region : undefined, REGIONS[arena.region].arenaTheme);
  match.camera.aspect = window.innerWidth / window.innerHeight;
  match.camera.updateProjectionMatrix();
  mode = "match";
  ui.showMatchHUD();
}

function endMatch() {
  if (!match || !match.result) return;
  const r = match.result;
  const rewardsText = r.won
    ? r.mode === "boss"
      ? "+800 monedas · +25 diamantes · +400 XP · Nueva región desbloqueada"
      : "+250 monedas · +5 diamantes · +150 XP"
    : "Sin recompensas esta vez. ¡Inténtalo de nuevo!";
  ui.hideMatchHUD();
  ui.showMatchEnd(r.won, r.scoreA, r.scoreB, rewardsText, () => {
    match?.dispose();
    match = null;
    mode = "world";
  });
}

function findNearestInteraction(): { label: string; run: () => void } | null {
  const p = player.car.position;
  let best: { dist: number; label: string; run: () => void } | null = null;

  for (const npc of npcInstances) {
    const d = p.distanceTo(npc.worldPos);
    if (d < 4.5 && (!best || d < best.dist)) {
      best = { dist: d, label: `Hablar con ${npc.def.name}`, run: () => talkToNpc(npc) };
    }
  }

  for (const it of world.interactables) {
    if (!it.isAvailable(gs)) continue;
    const pos = it.object3d.position;
    const d = Math.hypot(p.x - pos.x, p.z - pos.z);
    if (d < 4 && (!best || d < best.dist)) {
      best = {
        dist: d,
        label: it.promptLabel,
        run: () => {
          const result = it.interact(gs);
          if (result.type === "portal") {
            const portalDef = PORTAL_LOOKUP.get(it.id);
            if (portalDef) player.car.setPosition(portalDef.targetPos[0], portalDef.targetPos[1]);
          }
          ui.toast(result.message, result.rarity);
        },
      };
    }
  }

  for (const a of ARENAS) {
    const d = Math.hypot(p.x - a.worldPos[0], p.z - a.worldPos[1]);
    if (d < 13 && (!best || d < best.dist)) {
      const prereq = REGIONS[a.region].requiresBossDefeated;
      const locked = a.isBossArena && !!prereq && !gs.isBossDefeated(prereq);
      best = {
        dist: d,
        label: locked ? `Bloqueado (derrota antes a ${REGIONS[prereq as RegionId].bossName})` : `Entrar a ${a.name}`,
        run: () => {
          if (locked) {
            ui.toast("Aún no puedes entrar aquí.");
            return;
          }
          enterArena(a);
        },
      };
    }
  }

  return best ? { label: best.label, run: best.run } : null;
}

function startGame() {
  world = new World(gs);
  player = new PlayerController(gs, worldCamera, input);
  player.car.setPosition(SPAWN_POS[0], SPAWN_POS[1]);
  world.scene.add(player.car.group);

  npcInstances = NPCS.map((def) => {
    const inst = new NpcInstance(def, def.pos[0], def.pos[1]);
    world.scene.add(inst.group);
    return inst;
  });

  buildArenaMarkers();
  ui.hideLoading();
  ui.onEquipChange = () => player.refreshVisual(gs);
  resize();
  clock.start();
  requestAnimationFrame(loop);

  if (import.meta.env.DEV) {
    (window as unknown as { __game: unknown }).__game = { gs, world, player, ui, get match() { return match; } };
  }
}

function loop() {
  const dt = Math.min(0.05, clock.getDelta());

  if (mode === "world") {
    const modalOpen = ui.anyModalOpen();
    if (!modalOpen) {
      player.update(dt, gs);
    }
    world.update(dt, player.car.position);
    for (const npc of npcInstances) npc.update(dt, npcHasContent(npc.def));

    if (world.currentRegion.id !== lastRegionId) {
      lastRegionId = world.currentRegion.id;
      if (!gs.isRegionUnlocked(world.currentRegion.id)) {
        gs.unlockRegion(world.currentRegion.id);
        ui.toast(`Nueva región descubierta: ${world.currentRegion.name}`);
      }
    }

    if (!modalOpen) {
      const nearest = findNearestInteraction();
      ui.setInteractPrompt(nearest?.label ?? null);
      if (nearest && input.wasPressed("KeyE")) {
        nearest.run();
      }
    } else {
      ui.setInteractPrompt(null);
    }

    if (ui.isGarageOpen()) ui.renderGarageFrame(dt);
    ui.renderMinimap(player.car.position, world.currentRegion, { inMatch: false });

    renderer.render(world.scene, worldCamera);
  } else if (match) {
    match.update(dt);
    ui.updateMatchHUD(match.scoreA, match.scoreB, match.timeLeft, match.playerCar.car.boostFuel);
    ui.renderMinimap(match.playerCar.car.position, world.currentRegion, { inMatch: true });
    renderer.render(match.scene, match.camera);
    if (match.finished) {
      endMatch();
    }
  }

  input.consumeFrame();
  requestAnimationFrame(loop);
}

ui.hideLoading();
ui.showMainMenu(
  !!localStorage.getItem("openworld_carball_save_v1"),
  () => {
    gs.resetSave();
    startGame();
  },
  () => {
    startGame();
  }
);
