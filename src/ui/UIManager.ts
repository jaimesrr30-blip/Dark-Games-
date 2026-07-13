import { UI_TEMPLATE } from "./template";
import { GaragePreview2D } from "./GaragePreview2D";
import type { GameState } from "../state/GameState";
import { xpForLevel } from "../state/GameState";
import { RARITIES, type Rarity } from "../data/rarity";
import { ITEMS, itemsBySlot, getItem, type ItemSlot } from "../data/items";
import { shopCatalog } from "../data/shops";
import { MISSIONS, type MissionType } from "../data/missions";
import { STAGES, STAGE_ORDER, type StageId } from "../data/stages";
import { NPCS, guardiansForStage, type NpcDef } from "../data/npcs";
import { CHESTS, PET_SPAWNS } from "../data/spawns";
import { PET_ARCHETYPES, petSellPrice } from "../data/pets";
import { visualFromState } from "../entities/carVisual";
import type { Stage2D } from "../stage/Stage2D";

function qs<T extends HTMLElement>(sel: string): T {
  const el = document.querySelector(sel) as T | null;
  if (!el) throw new Error(`No se encontró el elemento ${sel}`);
  return el;
}

const SLOT_TABS: { slot: ItemSlot; label: string }[] = [
  { slot: "color", label: "Color" },
  { slot: "rueda", label: "Borde" },
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
  garagePreview: GaragePreview2D | null = null;
  private currentMissionTab: MissionType = "principal";
  private currentMissionStage: StageId | "all" = "all";
  private currentInventoryTab: "cosmeticos" | "mascotas" | "titulos" | "llaves" = "cosmeticos";
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
      btn.addEventListener("click", () => qs(`#${btn.dataset.close}`).classList.remove("show"));
    });
    qs("#btn-open-missions").addEventListener("click", () => this.openMissionsModal());
    qs("#btn-open-inventory").addEventListener("click", () => this.openInventoryModal());
    qs("#btn-open-garage").addEventListener("click", () => this.openGarageModal());
    qs("#btn-open-map").addEventListener("click", () => this.openMapModal());

    document.querySelectorAll<HTMLElement>("[data-mtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentMissionTab = btn.dataset.mtab as MissionType;
        document.querySelectorAll("[data-mtab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderMissionList();
      });
    });

    const stageFilter = qs<HTMLSelectElement>("#mission-stage-filter");
    stageFilter.innerHTML =
      `<option value="all">Todas las etapas</option>` + STAGE_ORDER.map((id) => `<option value="${id}">${STAGES[id].name}</option>`).join("");
    stageFilter.addEventListener("change", () => {
      this.currentMissionStage = stageFilter.value as StageId | "all";
      this.renderMissionList();
    });
    document.querySelectorAll<HTMLElement>("[data-itab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentInventoryTab = btn.dataset.itab as "cosmeticos" | "mascotas" | "titulos" | "llaves";
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

  showIntroStory(onDone: () => void) {
    const screen = qs("#intro-story");
    const lines = [
      "Hace mucho tiempo, ocho mundos vivían en equilibrio, cada uno gobernado por un gran luchador.",
      "Un día, el equilibrio se rompió. Cada luchador se encerró en su mundo, protegido por guardianes y llaves imposibles de robar.",
      "Tú eres un piloto más, con un coche sencillo y un sueño enorme: <b>recorrer los ocho mundos, reunir sus llaves y vencer a todos los luchadores.</b>",
      "Se dice que quien lo consiga encontrará, en el último mundo, las piezas de una máquina capaz de viajar más allá de todo lo conocido...",
      "Tu aventura empieza ahora.",
    ];
    const textEl = qs("#intro-story-text");
    textEl.innerHTML = lines.map((l, i) => `<p style="animation-delay:${i * 1.1}s">${l}</p>`).join("");
    const btn = qs<HTMLButtonElement>("#btn-intro-skip");
    btn.style.animationDelay = `${lines.length * 1.1}s`;
    screen.classList.add("show");
    btn.onclick = () => {
      screen.classList.remove("show");
      onDone();
    };
  }

  showEnding(onClose: () => void) {
    const screen = qs("#ending-screen");
    qs("#ending-text").innerHTML = `
      <p>Con las 4 piezas reunidas y el motor arrancado del <b>Campeón Eterno</b>, tu cohete cobra vida.</p>
      <p>Has recorrido los ocho mundos, reunido sus llaves y vencido a sus luchadores. Eres, oficialmente, <b>el mejor piloto del mundo.</b></p>
      <p>Pero mientras el cohete se eleva sobre las nubes, algo se ve a lo lejos: un cielo lleno de puntos de luz, cada uno... un mundo entero.</p>
      <p><b>El sistema solar te espera. Esto no ha hecho más que empezar.</b></p>`;
    screen.classList.add("show");
    qs<HTMLButtonElement>("#btn-ending-close").onclick = () => {
      screen.classList.remove("show");
      onClose();
    };
  }

  // ---------- Selector con flechita ----------
  private positionArrow(arrowEl: HTMLElement, cardEl: HTMLElement | null, containerEl: HTMLElement) {
    if (!cardEl) {
      arrowEl.classList.remove("show");
      return;
    }
    const containerRect = containerEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const left = cardRect.left - containerRect.left + cardRect.width / 2 - 11;
    const top = cardRect.top - containerRect.top - 22;
    arrowEl.style.left = `${left}px`;
    arrowEl.style.top = `${top}px`;
    arrowEl.classList.add("show");
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

  // ---------- Minimapa (radar de la etapa actual) ----------
  renderMinimap(playerX: number, playerY: number, stage: Stage2D, inMatch: boolean) {
    const ctx = this.minimapCtx;
    const size = 300;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#0a0d14";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    qs("#minimap-region-label").textContent = inMatch ? "En partido" : stage.def.name;
    if (inMatch) return;

    const b = stage.bounds;
    const scale = Math.min((size - 20) / (b.maxX - b.minX), (size - 20) / (b.maxY - b.minY));
    const cx = size / 2;
    const cy = size / 2;
    const toMap = (x: number, y: number): [number, number] => [cx + x * scale, cy + y * scale];

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = stage.def.accentColor;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    const [rx0, ry0] = toMap(b.minX, b.minY);
    ctx.strokeRect(rx0, ry0, (b.maxX - b.minX) * scale, (b.maxY - b.minY) * scale);
    ctx.globalAlpha = 1;

    for (const c of CHESTS.filter((c) => c.stage === stage.def.id)) {
      if (this.gs.data.chests.collected[c.id]) continue;
      const [px, py] = toMap(c.pos[0], c.pos[1]);
      ctx.fillStyle = "#ffcc33";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of PET_SPAWNS.filter((p) => p.stage === stage.def.id)) {
      if (this.gs.data.petsCollected[p.id]) continue;
      const [px, py] = toMap(p.pos[0], p.pos[1]);
      ctx.fillStyle = "#99ccff";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const npc of NPCS.filter((n) => n.stage === stage.def.id)) {
      const [px, py] = toMap(npc.pos[0], npc.pos[1]);
      ctx.fillStyle = "#ffe066";
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 4, py + 3);
      ctx.lineTo(px - 4, py + 3);
      ctx.fill();
    }
    if (stage.def.id !== "hub") {
      const [gx, gy] = toMap(stage.bossGatePos[0], stage.bossGatePos[1]);
      ctx.strokeStyle = "#ff3b3b";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx - 5, gy - 5, 10, 10);
    }
    const [tx, ty] = toMap(stage.trainingFieldPos[0], stage.trainingFieldPos[1]);
    ctx.strokeStyle = "#66ccff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx, ty, 5, 0, Math.PI * 2);
    ctx.stroke();

    const [px, py] = toMap(playerX, playerY);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
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

  // ---------- Mapa de etapas ----------
  openMapModal() {
    qs("#modal-map").classList.add("show");
    this.renderMapGrid();
  }

  private renderMapGrid() {
    const grid = qs("#map-grid");
    const arrow = qs<HTMLElement>("#arrow-map");
    grid.querySelectorAll(".pick-card").forEach((el) => el.remove());

    let currentCard: HTMLElement | null = null;
    for (const id of STAGE_ORDER) {
      const def = STAGES[id];
      const unlocked = this.gs.isStageUnlocked(id);
      const defeated = this.gs.isBossDefeated(id);
      const isCurrent = this.gs.data.currentStage === id;
      const card = document.createElement("button");
      card.className = `pick-card stage-card interactive ${!unlocked ? "locked" : ""} ${isCurrent ? "selected" : ""} ${defeated ? "defeated" : ""}`;
      const gate = id === "hub" ? null : this.gs.stageKeysStatus(id);
      let reqHtml = "";
      if (id === "hub") reqHtml = `<div class="pick-req ok">Plaza inicial</div>`;
      else if (defeated) reqHtml = `<div class="pick-req ok">Jefe derrotado ✓</div>`;
      else if (unlocked && gate) {
        reqHtml = `<div class="pick-req ${gate.ready ? "ok" : ""}">🔑 Llaves ${gate.have}/${gate.required}</div>`;
      } else {
        reqHtml = `<div class="pick-req">Bloqueado</div>`;
      }
      card.innerHTML = `
        <span class="pick-icon" style="background:${def.accentColor};">${unlocked ? "" : "🔒"}</span>
        <span class="pick-info">
          <span class="pick-name">${def.name}</span>
          <span class="pick-sub">${def.bossName || "Zona inicial"}</span>
          ${reqHtml}
        </span>`;
      if (unlocked) {
        card.addEventListener("click", () => {
          qs("#modal-map").classList.remove("show");
          this.onTravelToStage?.(id);
        });
      }
      grid.appendChild(card);
      if (isCurrent) currentCard = card;
    }
    requestAnimationFrame(() => this.positionArrow(arrow, currentCard, grid));
  }

  onTravelToStage: ((id: StageId) => void) | null = null;

  // ---------- Misiones ----------
  openMissionsModal() {
    qs("#modal-missions").classList.add("show");
    this.renderMissionList();
  }

  private renderMissionList() {
    const list = qs("#mission-list");
    const missions = MISSIONS.filter(
      (m) =>
        m.type === this.currentMissionTab &&
        (this.currentMissionStage === "all" || m.stage === this.currentMissionStage) &&
        this.gs.isMissionAvailable(m)
    );
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
          <div class="mtype">${m.type} · ${STAGES[m.stage].name}</div>
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
    if (this.currentInventoryTab === "llaves") {
      this.renderKeysList();
      return;
    }
    if (this.currentInventoryTab === "mascotas") {
      if (this.gs.data.pets.length === 0) {
        list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">Aún no tienes mascotas. ¡Explora las etapas para encontrarlas!</div>`;
        return;
      }
      list.innerHTML = `<div class="pick-grid" id="pet-pick-grid"><div class="select-arrow" id="arrow-pets"><svg viewBox="0 0 22 20"><polygon points="11,20 0,0 22,0" fill="#ff3b3b" stroke="#fff" stroke-width="1.5"/></svg></div></div>`;
      const grid = qs("#pet-pick-grid");
      const arrow = qs<HTMLElement>("#arrow-pets");
      let activeCard: HTMLElement | null = null;
      for (const p of this.gs.data.pets) {
        const arche = PET_ARCHETYPES.find((a) => a.id === p.archetypeId);
        const active = this.gs.data.activePetUid === p.uid;
        const card = document.createElement("button");
        card.className = `pick-card interactive ${active ? "selected" : ""}`;
        card.innerHTML = `
          <span class="pick-icon" style="background:${RARITIES[p.rarity].color};">🐾</span>
          <span class="pick-info">
            <span class="pick-name">${arche?.name ?? p.archetypeId}</span>
            <span class="pick-sub"><span class="rarity-tag r-${p.rarity}">${RARITIES[p.rarity].label}</span></span>
            <span class="pick-sub">${arche?.description ?? ""}</span>
          </span>`;
        card.addEventListener("click", () => {
          this.gs.setActivePet(p.uid);
          this.renderInventoryList();
        });
        grid.appendChild(card);
        if (active) activeCard = card;
      }
      requestAnimationFrame(() => this.positionArrow(arrow, activeCard, grid));
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
          <div class="item-swatch" style="background:${i.colorHex ?? "#333"};"></div>
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

  private renderKeysList() {
    const list = qs("#inventory-list");
    const stagesWithGuardians = STAGE_ORDER.filter((id) => id !== "hub");
    let html = "";
    for (const stageId of stagesWithGuardians) {
      const stageDef = STAGES[stageId];
      const guardians = guardiansForStage(stageId);
      if (guardians.length === 0) continue;
      const have = guardians.filter((g) => g.guardian && this.gs.hasKey(g.guardian.keyId)).length;
      html += `
        <div class="keys-stage-group">
          <div class="keys-stage-header" style="border-color:${stageDef.accentColor};">
            <span class="keys-stage-name">${stageDef.name}</span>
            <span class="keys-stage-progress">${have}/${guardians.length}</span>
          </div>
          <div class="keys-grid">
            ${guardians
              .map((g) => {
                const got = !!(g.guardian && this.gs.hasKey(g.guardian.keyId));
                return `
                <div class="key-card ${got ? "obtained" : "locked"}">
                  <span class="key-icon">${got ? "🗝️" : "🔒"}</span>
                  <span class="key-info">
                    <span class="key-name">${got ? `Llave de ${stageDef.name}` : "Llave desconocida"}</span>
                    <span class="key-sub">Custodia: ${g.name}</span>
                  </span>
                </div>`;
              })
              .join("")}
          </div>
        </div>`;
    }
    list.innerHTML =
      html || `<div style="color:var(--text-dim);padding:20px;text-align:center;">Aún no has encontrado a ningún guardián.</div>`;
  }

  // ---------- Garaje ----------
  openGarageModal() {
    qs("#modal-garage").classList.add("show");
    if (!this.garagePreview) {
      this.garagePreview = new GaragePreview2D(qs<HTMLCanvasElement>("#garage-canvas"));
    }
    this.garagePreview.setCar(visualFromState(this.gs));
    this.renderGarageSlotList();
  }

  isGarageOpen(): boolean {
    return qs("#modal-garage").classList.contains("show");
  }

  renderGarageFrame(dt: number) {
    this.garagePreview?.render(dt);
  }

  private renderGarageSlotList() {
    const grid = qs("#garage-slot-list");
    const arrow = qs<HTMLElement>("#arrow-garage");
    grid.querySelectorAll(".pick-card").forEach((el) => el.remove());
    const items = itemsBySlot(this.currentGarageSlot);
    const detail = qs("#garage-item-detail");

    const showDetail = (item: (typeof items)[number]) => {
      const owned = this.gs.ownsItem(item.id);
      detail.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;">
          <div>
            <div style="font-weight:800;color:var(--text);">${item.name} <span class="rarity-tag r-${item.rarity}">${RARITIES[item.rarity].label}</span></div>
            <div style="color:var(--text-dim);font-size:13px;">${item.description}</div>
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
        this.garagePreview?.setCar(visualFromState(this.gs));
        this.onEquipChange?.();
        this.renderGarageSlotList();
      });
      const buyBtn = document.getElementById("btn-buy-current");
      buyBtn?.addEventListener("click", () => {
        if (this.gs.buyItem(item.id)) {
          this.gs.equip(item.slot, item.id);
          this.garagePreview?.setCar(visualFromState(this.gs));
          this.onEquipChange?.();
          this.renderGarageSlotList();
        } else {
          this.toast("No tienes suficiente saldo.");
        }
      });
    };

    let equippedCard: HTMLElement | null = null;
    for (const item of items) {
      const owned = this.gs.ownsItem(item.id);
      const equipped = this.gs.data.equipped[item.slot] === item.id;
      const card = document.createElement("button");
      card.className = `pick-card interactive ${!owned ? "locked" : ""} ${equipped ? "selected" : ""}`;
      card.innerHTML = `
        <span class="pick-icon" style="background:${item.colorHex ?? RARITIES[item.rarity].color};">${owned ? "" : "🔒"}</span>
        <span class="pick-info">
          <span class="pick-name">${item.name}</span>
          <span class="pick-sub"><span class="rarity-tag r-${item.rarity}">${RARITIES[item.rarity].label}</span></span>
        </span>`;
      card.addEventListener("click", () => {
        if (owned) {
          this.gs.equip(item.slot, item.id);
          this.garagePreview?.setCar(visualFromState(this.gs));
          this.onEquipChange?.();
          this.renderGarageSlotList();
        } else {
          showDetail(item);
        }
      });
      grid.appendChild(card);
      if (equipped) equippedCard = card;
    }
    if (items.length) showDetail(items[0]);
    requestAnimationFrame(() => this.positionArrow(arrow, equippedCard, grid));
  }

  // ---------- Tienda ----------
  private currentShopId: string | null = null;

  openShopModal(shopName: string, shopId: string) {
    qs("#modal-shop").classList.add("show");
    qs("#shop-title").textContent = shopName;
    this.currentShopId = shopId;
    this.renderShopList();
  }

  private renderShopList() {
    const list = qs("#shop-list");
    const catalog = shopCatalog(this.currentShopId ?? "");
    const items = ITEMS.filter((i) => catalog.includes(i.id) && !this.gs.ownsItem(i.id));
    if (items.length === 0) {
      list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">¡Ya tienes todo lo disponible aquí!</div>`;
      return;
    }
    list.innerHTML = items
      .map((i) => {
        const afford = this.gs.canAfford(i.price, i.currency);
        return `
        <div class="item-card">
          <div class="item-swatch" style="background:${i.colorHex ?? "#333"};"></div>
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

  // ---------- Negociación con guardianes ----------
  openGuardianModal(npc: NpcDef, onAction: (action: "pay" | "match" | "leave") => void) {
    const g = npc.guardian!;
    qs("#modal-guardian").classList.add("show");
    qs("#guardian-title").textContent = npc.name;
    qs("#guardian-text").textContent = `Puedo darte mi llave si me pagas ${g.priceCoins} monedas, o si me ganas un partido. Tú decides.`;
    qs("#guardian-pay-label").textContent = `Pagar ${g.priceCoins} monedas`;
    const payBtn = qs<HTMLButtonElement>("#btn-guardian-pay");
    payBtn.disabled = !this.gs.canAfford(g.priceCoins, "monedas");
    payBtn.onclick = () => {
      qs("#modal-guardian").classList.remove("show");
      onAction("pay");
    };
    qs<HTMLButtonElement>("#btn-guardian-match").onclick = () => {
      qs("#modal-guardian").classList.remove("show");
      onAction("match");
    };
    qs<HTMLButtonElement>("#btn-guardian-leave").onclick = () => {
      qs("#modal-guardian").classList.remove("show");
      onAction("leave");
    };
  }

  // ---------- Venta de mascotas ----------
  openPetSellModal(npcName: string, onSell: (uid: string) => void) {
    qs("#modal-sellpet").classList.add("show");
    qs("#sellpet-title").textContent = npcName;
    this.renderSellPetList(onSell);
  }

  private renderSellPetList(onSell: (uid: string) => void) {
    const list = qs("#sellpet-list");
    if (this.gs.data.pets.length === 0) {
      list.innerHTML = `<div style="color:var(--text-dim);padding:20px;text-align:center;">No tienes mascotas para vender todavía.</div>`;
      return;
    }
    list.innerHTML = this.gs.data.pets
      .map((p) => {
        const arche = PET_ARCHETYPES.find((a) => a.id === p.archetypeId);
        const price = petSellPrice(p);
        return `
        <div class="item-card">
          <div class="item-swatch" style="background:${RARITIES[p.rarity].color};"></div>
          <div class="item-info">
            <div class="item-name">${arche?.name ?? p.archetypeId} <span class="rarity-tag r-${p.rarity}">${RARITIES[p.rarity].label}</span></div>
            <div class="item-desc">${arche?.description ?? ""}</div>
          </div>
          <div class="item-actions">
            <span class="price-tag">${price} monedas</span>
            <button class="btn-arrow small gold interactive" data-sell="${p.uid}">Vender</button>
          </div>
        </div>`;
      })
      .join("");
    list.querySelectorAll<HTMLElement>("[data-sell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        onSell(btn.dataset.sell!);
        this.renderSellPetList(onSell);
      });
    });
  }

  // ---------- Interior secreto ----------
  hideWorldMenus() {
    qs("#hud-menu-buttons").classList.add("hidden");
    qs("#control-hint").classList.add("hidden");
  }
  showWorldMenus() {
    qs("#hud-menu-buttons").classList.remove("hidden");
    qs("#control-hint").classList.remove("hidden");
  }

  // ---------- Partido ----------
  showMatchHUD() {
    qs("#match-hud").classList.add("show");
    qs("#hud-bottom-left").classList.add("hidden");
    qs("#hud-bottom-right").classList.add("hidden");
    qs("#hud-menu-buttons").classList.add("hidden");
    qs("#control-hint").classList.add("hidden");
  }
  hideMatchHUD() {
    qs("#match-hud").classList.remove("show");
    qs("#hud-bottom-left").classList.remove("hidden");
    qs("#hud-bottom-right").classList.remove("hidden");
    qs("#hud-menu-buttons").classList.remove("hidden");
    qs("#control-hint").classList.remove("hidden");
  }
  updateMatchHUD(scoreA: number, scoreB: number, timeLeft: number, boostFuel: number, touches: number, turboBoostActive = false) {
    qs("#score-a").textContent = String(scoreA);
    qs("#score-b").textContent = String(scoreB);
    const m = Math.max(0, Math.floor(timeLeft / 60));
    const s = Math.max(0, Math.floor(timeLeft % 60));
    qs("#match-timer").textContent = `${m}:${s.toString().padStart(2, "0")}`;
    qs<HTMLElement>("#boost-bar-fill").style.width = `${Math.max(0, boostFuel * 100)}%`;
    qs("#match-touches").textContent = String(touches);
    qs("#match-turbo-pct").textContent = `${Math.round(Math.max(0, boostFuel) * 100)}%`;
    qs("#match-turbo-spark").classList.toggle("hidden", !turboBoostActive);
  }

  setMatchPetBadge(badge: { name: string; power: string } | null) {
    const el = qs("#match-pet-badge");
    if (!badge) {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    qs("#match-pet-name").textContent = badge.name;
    qs("#match-pet-power").textContent = badge.power;
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

  showBossIntro(stage: StageId, onStart: () => void) {
    const def = STAGES[stage];
    const screen = qs("#boss-intro");
    screen.classList.add("show");
    qs("#boss-intro-name").textContent = def.bossName;
    qs("#boss-intro-title").textContent = def.bossTitle;
    qs("#boss-intro-requirements").textContent = "Objetivo: marca 5 goles antes que tu rival en una arena laberíntica llena de monedas.";
    qs<HTMLButtonElement>("#btn-boss-start").onclick = () => {
      screen.classList.remove("show");
      onStart();
    };
  }

  anyModalOpen(): boolean {
    return (
      Array.from(document.querySelectorAll(".modal-backdrop")).some((m) => m.classList.contains("show")) ||
      qs("#dialogue-box").classList.contains("show") ||
      qs("#match-end-screen").classList.contains("show") ||
      qs("#boss-intro").classList.contains("show") ||
      !qs("#main-menu").classList.contains("hide")
    );
  }

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("show"));
  }
}
