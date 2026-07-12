import * as THREE from "three";
import { UI_TEMPLATE } from "./template";
import { GarageScene } from "./GarageScene";
import type { GameState } from "../state/GameState";
import { xpForLevel } from "../state/GameState";
import { RARITIES, type Rarity } from "../data/rarity";
import { ITEMS, itemsBySlot, getItem, type ItemSlot } from "../data/items";
import { MISSIONS, type MissionType } from "../data/missions";
import { REGIONS, type RegionDef } from "../data/regions";
import { NPCS } from "../data/npcs";
import { CHESTS, PET_SPAWNS, ARENAS } from "../data/spawns";
import { PET_ARCHETYPES } from "../data/pets";
import { visualConfigFromState } from "../entities/PlayerController";

function qs<T extends HTMLElement>(sel: string): T {
  const el = document.querySelector(sel) as T | null;
  if (!el) throw new Error(`No se encontró el elemento ${sel}`);
  return el;
}

const SLOT_TABS: { slot: ItemSlot; label: string }[] = [
  { slot: "color", label: "Color" },
  { slot: "rueda", label: "Ruedas" },
  { slot: "turbo", label: "Turbo" },
  { slot: "explosionGol", label: "Gol" },
  { slot: "estela", label: "Estela" },
  { slot: "antena", label: "Antena" },
  { slot: "bocina", label: "Bocina" },
  { slot: "balon", label: "Balón" },
];

export class UIManager {
  root: HTMLElement;
  gs: GameState;
  garageScene: GarageScene | null = null;
  private currentMissionTab: MissionType = "principal";
  private currentInventoryTab: "cosmeticos" | "mascotas" | "titulos" = "cosmeticos";
  private currentGarageSlot: ItemSlot = "color";
  private minimapCtx: CanvasRenderingContext2D;
  onEquipChange: (() => void) | null = null;

  constructor(root: HTMLElement, gs: GameState) {
    this.root = root;
    this.gs = gs;
    root.innerHTML = UI_TEMPLATE;
    this.minimapCtx = qs<HTMLCanvasElement>("#minimap-canvas").getContext("2d")!;
    this.wireStaticEvents();
    gs.onChange(() => this.refreshHUD());
    this.refreshHUD();
  }

  private wireStaticEvents() {
    document.querySelectorAll<HTMLElement>("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        qs(`#${btn.dataset.close}`).classList.remove("show");
      });
    });
    qs("#btn-open-missions").addEventListener("click", () => this.openMissionsModal());
    qs("#btn-open-inventory").addEventListener("click", () => this.openInventoryModal());
    qs("#btn-open-garage").addEventListener("click", () => this.openGarageModal());

    document.querySelectorAll<HTMLElement>("[data-mtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentMissionTab = btn.dataset.mtab as MissionType;
        document.querySelectorAll("[data-mtab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderMissionList();
      });
    });
    document.querySelectorAll<HTMLElement>("[data-itab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentInventoryTab = btn.dataset.itab as "cosmeticos" | "mascotas" | "titulos";
        document.querySelectorAll("[data-itab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderInventoryList();
      });
    });

    const garageTabs = qs("#garage-tabs");
    for (const t of SLOT_TABS) {
      const btn = document.createElement("button");
      btn.className = "tab-btn interactive" + (t.slot === this.currentGarageSlot ? " active" : "");
      btn.textContent = t.label;
      btn.addEventListener("click", () => {
        this.currentGarageSlot = t.slot;
        garageTabs.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderGarageSlotList();
      });
      garageTabs.appendChild(btn);
    }
  }

  hideLoading() {
    qs("#loading-screen").classList.add("hidden");
  }

  showMainMenu(hasSave: boolean, onNew: () => void, onContinue: () => void) {
    const menu = qs("#main-menu");
    menu.classList.remove("hide");
    const continueBtn = qs<HTMLButtonElement>("#btn-continue-game");
    continueBtn.disabled = !hasSave;
    qs("#btn-new-game").onclick = () => {
      menu.classList.add("hide");
      onNew();
    };
    continueBtn.onclick = () => {
      if (!hasSave) return;
      menu.classList.add("hide");
      onContinue();
    };
  }

  // ---------- HUD ----------
  refreshHUD() {
    const d = this.gs.data;
    qs("#hud-coins").textContent = Math.floor(d.monedas).toLocaleString("es-ES");
    qs("#hud-diamonds").textContent = Math.floor(d.diamantes).toLocaleString("es-ES");
    qs("#hud-level").textContent = `Nivel ${d.level}`;
    const need = xpForLevel(d.level);
    qs("#hud-xp-label").textContent = `${Math.floor(d.xp)} / ${need} XP`;
    qs<HTMLElement>("#xp-bar-fill").style.width = `${Math.min(100, (d.xp / need) * 100)}%`;
    this.renderMissionTracker();
  }

  private renderMissionTracker() {
    const id = this.gs.data.activeMissionId;
    const titleEl = qs("#mission-title");
    const descEl = qs("#mission-desc");
    const objEl = qs("#mission-objectives");
    if (!id) {
      titleEl.textContent = "Sin misión activa";
      descEl.textContent = "Abre el registro de misiones para elegir un objetivo.";
      objEl.innerHTML = "";
      return;
    }
    const def = MISSIONS.find((m) => m.id === id);
    if (!def) return;
    const prog = this.gs.getMissionProgress(id);
    titleEl.textContent = def.title;
    descEl.textContent = def.description;
    objEl.innerHTML = def.objectives
      .map((o, i) => {
        const cur = prog.progress[i] ?? 0;
        const done = cur >= o.count;
        return `<div class="${done ? "objective-done" : ""}">• ${o.description} (${cur}/${o.count})</div>`;
      })
      .join("");
  }

  setInteractPrompt(label: string | null) {
    const el = qs("#interact-prompt");
    if (label) {
      qs("#interact-label").textContent = label;
      el.classList.add("show");
    } else {
      el.classList.remove("show");
    }
  }

  toast(message: string, rarity?: Rarity) {
    const container = qs("#toast-container");
    const el = document.createElement("div");
    el.className = "toast panel";
    if (rarity) {
      el.style.borderLeftColor = RARITIES[rarity].color;
      el.innerHTML = `<span class="rarity-tag r-${rarity}">${RARITIES[rarity].label}</span> &nbsp;${message}`;
    } else {
      el.textContent = message;
    }
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Minimapa ----------
  renderMinimap(playerPos: THREE.Vector3, region: RegionDef, extra: { inMatch: boolean }) {
    const ctx = this.minimapCtx;
    const size = 300;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0a0d14";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    qs("#minimap-region-label").textContent = extra.inMatch ? "En partido" : region.name;
    if (extra.inMatch) return;

    const scale = 0.16;
    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    for (const rid of Object.keys(REGIONS) as (keyof typeof REGIONS)[]) {
      const r = REGIONS[rid];
      const rx = cx + (r.center[0] - playerPos.x) * scale;
      const ry = cy + (r.center[1] - playerPos.z) * scale;
      ctx.fillStyle = `#${r.groundColor.toString(16).padStart(6, "0")}`;
      ctx.beginPath();
      ctx.arc(rx, ry, r.radius * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffd76633";
    for (const c of CHESTS) {
      if (this.gs.data.chests.collected[c.id]) continue;
      const px = cx + (c.pos[0] - playerPos.x) * scale;
      const py = cy + (c.pos[1] - playerPos.z) * scale;
      ctx.fillStyle = "#ffcc33";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of PET_SPAWNS) {
      if (this.gs.data.petsCollected[p.id]) continue;
      const px = cx + (p.pos[0] - playerPos.x) * scale;
      const py = cy + (p.pos[1] - playerPos.z) * scale;
      ctx.fillStyle = "#99ccff";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const npc of NPCS) {
      const px = cx + (npc.pos[0] - playerPos.x) * scale;
      const py = cy + (npc.pos[1] - playerPos.z) * scale;
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 4, py + 3);
      ctx.lineTo(px - 4, py + 3);
      ctx.fill();
    }
    for (const a of ARENAS) {
      const px = cx + (a.worldPos[0] - playerPos.x) * scale;
      const py = cy + (a.worldPos[1] - playerPos.z) * scale;
      ctx.strokeStyle = a.isBossArena ? "#ff3b3b" : "#66ccff";
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 4, py - 4, 8, 8);
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ---------- Diálogo ----------
  openDialogue(name: string, lines: string[], onFinish: () => void) {
    const box = qs("#dialogue-box");
    let idx = 0;
    box.classList.add("show");
    qs("#dialogue-name").textContent = name;
    const textEl = qs("#dialogue-text");
    const nextBtn = qs<HTMLButtonElement>("#btn-dialogue-next");
    const render = () => {
      textEl.textContent = lines[idx];
      nextBtn.innerHTML = idx < lines.length - 1 ? `Continuar <span class="arrow-icon">➤</span>` : `Cerrar <span class="arrow-icon">➤</span>`;
    };
    nextBtn.onclick = () => {
      idx++;
      if (idx >= lines.length) {
        box.classList.remove("show");
        onFinish();
        return;
      }
      render();
    };
    render();
  }

  closeDialogue() {
    qs("#dialogue-box").classList.remove("show");
  }

  // ---------- Misiones ----------
  openMissionsModal() {
    qs("#modal-missions").classList.add("show");
    this.renderMissionList();
  }

  private renderMissionList() {
    const list = qs("#mission-list");
    const missions = MISSIONS.filter((m) => m.type === this.currentMissionTab && this.gs.isMissionAvailable(m));
    if (missions.length === 0) {
      list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">Nada por aquí todavía. ¡Sigue explorando!</div>`;
      return;
    }
    list.innerHTML = missions
      .map((m) => {
        const prog = this.gs.getMissionProgress(m.id);
        const isActive = this.gs.data.activeMissionId === m.id;
        return `
        <div class="mission-card ${prog.completed ? "completed" : ""}" data-mission="${m.id}">
          <div class="mtype">${m.type} · ${REGIONS[m.region].name}</div>
          <div style="font-weight:800;margin:2px 0;">${m.title}</div>
          <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">${m.description}</div>
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">
            ${m.objectives.map((o, i) => `${o.description}: ${prog.progress[i] ?? 0}/${o.count}`).join(" · ")}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:11px;color:var(--gold);">+${m.rewardMonedas} monedas · +${m.rewardDiamantes} diamantes · +${m.rewardXp} XP</span>
            ${!prog.completed ? `<button class="btn-arrow small interactive" data-set-active="${m.id}">${isActive ? "Activa" : "Marcar"}</button>` : ""}
          </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll<HTMLElement>("[data-set-active]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.gs.data.activeMissionId = btn.dataset.setActive!;
        this.gs.save();
        this.gs.emit();
        this.renderMissionList();
      });
    });
  }

  // ---------- Inventario ----------
  openInventoryModal() {
    qs("#modal-inventory").classList.add("show");
    this.renderInventoryList();
  }

  private renderInventoryList() {
    const list = qs("#inventory-list");
    if (this.currentInventoryTab === "mascotas") {
      if (this.gs.data.pets.length === 0) {
        list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">Aún no tienes mascotas. ¡Explora el mundo para encontrarlas!</div>`;
        return;
      }
      list.innerHTML = this.gs.data.pets
        .map((p) => {
          const arche = PET_ARCHETYPES.find((a) => a.id === p.archetypeId);
          const active = this.gs.data.activePetUid === p.uid;
          return `
          <div class="item-card">
            <div class="item-swatch" style="background:${RARITIES[p.rarity].color};"></div>
            <div class="item-info">
              <div class="item-name">${arche?.name ?? p.archetypeId} <span class="rarity-tag r-${p.rarity}">${RARITIES[p.rarity].label}</span></div>
              <div class="item-desc">${arche?.description ?? ""}</div>
            </div>
            <div class="item-actions">
              <button class="btn-arrow small interactive" data-pet="${p.uid}">${active ? "Activa ✓" : "Usar"}</button>
            </div>
          </div>`;
        })
        .join("");
      list.querySelectorAll<HTMLElement>("[data-pet]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.gs.setActivePet(btn.dataset.pet!);
          this.renderInventoryList();
        });
      });
      return;
    }

    const slotFilter: ItemSlot[] = this.currentInventoryTab === "titulos" ? ["titulo"] : SLOT_TABS.map((s) => s.slot);
    const owned = ITEMS.filter((i) => slotFilter.includes(i.slot) && this.gs.ownsItem(i.id));
    if (owned.length === 0) {
      list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">Nada aquí todavía.</div>`;
      return;
    }
    list.innerHTML = owned
      .map((i) => {
        const equipped = this.gs.data.equipped[i.slot] === i.id;
        return `
        <div class="item-card">
          <div class="item-swatch" style="background:${i.colorHex !== undefined ? "#" + i.colorHex.toString(16).padStart(6, "0") : "#333"};"></div>
          <div class="item-info">
            <div class="item-name">${i.name} <span class="rarity-tag r-${i.rarity}">${RARITIES[i.rarity].label}</span></div>
            <div class="item-desc">${i.description}</div>
          </div>
          <div class="item-actions">
            <button class="btn-arrow small interactive" data-equip="${i.id}" data-slot="${i.slot}">${equipped ? "Equipado ✓" : "Equipar"}</button>
          </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll<HTMLElement>("[data-equip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.gs.equip(btn.dataset.slot!, btn.dataset.equip!);
        this.renderInventoryList();
        this.onEquipChange?.();
      });
    });
  }

  // ---------- Garaje ----------
  openGarageModal() {
    qs("#modal-garage").classList.add("show");
    if (!this.garageScene) {
      this.garageScene = new GarageScene(qs<HTMLCanvasElement>("#garage-canvas"));
    }
    this.garageScene.setCar(visualConfigFromState(this.gs));
    this.renderGarageSlotList();
  }

  isGarageOpen(): boolean {
    return qs("#modal-garage").classList.contains("show");
  }

  renderGarageFrame(dt: number) {
    this.garageScene?.render(dt);
  }

  private renderGarageSlotList() {
    const list = qs("#garage-slot-list");
    const items = itemsBySlot(this.currentGarageSlot);
    list.innerHTML = `<div class="slot-grid">${items
      .map((i) => {
        const owned = this.gs.ownsItem(i.id);
        const equipped = this.gs.data.equipped[i.slot] === i.id;
        const bg = i.colorHex !== undefined ? "#" + i.colorHex.toString(16).padStart(6, "0") : RARITIES[i.rarity].color;
        return `<button class="swatch-btn interactive ${owned ? "owned" : ""} ${equipped ? "equipped" : ""}" style="background:${bg};" data-item="${i.id}" title="${i.name}"></button>`;
      })
      .join("")}</div>
      <div id="garage-item-detail" style="padding:10px 4px;color:var(--text-dim);font-size:13px;"></div>`;

    const detail = qs("#garage-item-detail");
    const showDetail = (item: (typeof items)[number]) => {
      const owned = this.gs.ownsItem(item.id);
      detail.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:800;color:var(--text);">${item.name} <span class="rarity-tag r-${item.rarity}">${RARITIES[item.rarity].label}</span></div>
            <div>${item.description}</div>
          </div>
          <div>
            ${
              owned
                ? `<button class="btn-arrow small interactive" id="btn-equip-current">Equipar</button>`
                : `<button class="btn-arrow small gold interactive" id="btn-buy-current">Comprar (${item.price} ${item.currency === "monedas" ? "monedas" : "diamantes"})</button>`
            }
          </div>
        </div>`;
      const equipBtn = document.getElementById("btn-equip-current");
      equipBtn?.addEventListener("click", () => {
        this.gs.equip(item.slot, item.id);
        this.garageScene?.setCar(visualConfigFromState(this.gs));
        this.onEquipChange?.();
        this.renderGarageSlotList();
      });
      const buyBtn = document.getElementById("btn-buy-current");
      buyBtn?.addEventListener("click", () => {
        if (this.gs.buyItem(item.id)) {
          this.gs.equip(item.slot, item.id);
          this.garageScene?.setCar(visualConfigFromState(this.gs));
          this.onEquipChange?.();
          this.renderGarageSlotList();
        } else {
          this.toast("No tienes suficiente saldo.");
        }
      });
    };
    if (items.length) showDetail(items[0]);

    list.querySelectorAll<HTMLElement>("[data-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = items.find((i) => i.id === btn.dataset.item)!;
        showDetail(item);
      });
    });
  }

  // ---------- Tienda ----------
  openShopModal(shopName: string) {
    qs("#modal-shop").classList.add("show");
    qs("#shop-title").textContent = shopName;
    this.renderShopList();
  }

  private renderShopList() {
    const list = qs("#shop-list");
    const items = ITEMS.filter((i) => !this.gs.ownsItem(i.id) && i.price > 0);
    if (items.length === 0) {
      list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">¡Ya tienes todo lo disponible aquí!</div>`;
      return;
    }
    list.innerHTML = items
      .map((i) => {
        const afford = this.gs.canAfford(i.price, i.currency);
        return `
        <div class="item-card">
          <div class="item-swatch" style="background:${i.colorHex !== undefined ? "#" + i.colorHex.toString(16).padStart(6, "0") : "#333"};"></div>
          <div class="item-info">
            <div class="item-name">${i.name} <span class="rarity-tag r-${i.rarity}">${RARITIES[i.rarity].label}</span></div>
            <div class="item-desc">${i.description}</div>
          </div>
          <div class="item-actions">
            <span class="price-tag">${i.price} ${i.currency === "monedas" ? "monedas" : "diamantes"}</span>
            <button class="btn-arrow small interactive" data-buy="${i.id}" ${afford ? "" : "disabled"}>Comprar</button>
          </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll<HTMLElement>("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = getItem(btn.dataset.buy!)!;
        if (this.gs.buyItem(item.id)) {
          this.toast(`Comprado: ${item.name}`, item.rarity);
          this.renderShopList();
        }
      });
    });
  }

  // ---------- Partido ----------
  showMatchHUD() {
    qs("#match-hud").classList.add("show");
    qs("#hud-bottom-left").classList.add("hidden");
    qs("#hud-bottom-right").classList.add("hidden");
    qs("#hud-menu-buttons").classList.add("hidden");
  }
  hideMatchHUD() {
    qs("#match-hud").classList.remove("show");
    qs("#hud-bottom-left").classList.remove("hidden");
    qs("#hud-bottom-right").classList.remove("hidden");
    qs("#hud-menu-buttons").classList.remove("hidden");
  }
  updateMatchHUD(scoreA: number, scoreB: number, timeLeft: number, boostFuel: number) {
    qs("#score-a").textContent = String(scoreA);
    qs("#score-b").textContent = String(scoreB);
    const m = Math.max(0, Math.floor(timeLeft / 60));
    const s = Math.max(0, Math.floor(timeLeft % 60));
    qs("#match-timer").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    qs<HTMLElement>("#boost-bar-fill").style.width = `${Math.max(0, boostFuel * 100)}%`;
  }

  showMatchEnd(won: boolean, scoreA: number, scoreB: number, rewardsText: string, onContinue: () => void) {
    const screen = qs("#match-end-screen");
    screen.classList.add("show");
    const title = qs("#end-title");
    title.textContent = won ? "¡VICTORIA!" : "DERROTA";
    title.className = `end-title ${won ? "win" : "lose"}`;
    qs("#end-score").textContent = `${scoreA} - ${scoreB}`;
    qs("#end-rewards").textContent = rewardsText;
    qs<HTMLButtonElement>("#btn-end-continue").onclick = () => {
      screen.classList.remove("show");
      onContinue();
    };
  }

  showBossIntro(name: string, title: string, onStart: () => void) {
    const screen = qs("#boss-intro");
    screen.classList.add("show");
    qs("#boss-intro-name").textContent = name;
    qs("#boss-intro-title").textContent = title;
    qs<HTMLButtonElement>("#btn-boss-start").onclick = () => {
      screen.classList.remove("show");
      onStart();
    };
  }

  anyModalOpen(): boolean {
    return Array.from(document.querySelectorAll(".modal-backdrop")).some((m) => m.classList.contains("show"))
      || qs("#dialogue-box").classList.contains("show")
      || qs("#match-end-screen").classList.contains("show")
      || qs("#boss-intro").classList.contains("show")
      || !qs("#main-menu").classList.contains("hide");
  }

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("show"));
  }
}
