import type { Camera2D } from "../core/Camera2D";
import { roundRect } from "../entities/Car2D";
import { CHESTS, PET_SPAWNS } from "../data/spawns";
import { RARITIES, rollRarity, type Rarity } from "../data/rarity";
import { rollNewPet } from "../data/pets";
import type { GameState } from "../state/GameState";
import type { StageId } from "../data/stages";

export interface InteractResult {
  message: string;
  rarity?: Rarity;
}

export interface Interactable2D {
  id: string;
  kind: "chest" | "pet";
  x: number;
  y: number;
  promptLabel: string;
  isAvailable(gs: GameState): boolean;
  interact(gs: GameState): InteractResult;
  draw(ctx: CanvasRenderingContext2D, camera: Camera2D, t: number): void;
}

export function buildInteractables2D(stage: StageId): Interactable2D[] {
  const list: Interactable2D[] = [];

  for (const c of CHESTS.filter((c) => c.stage === stage)) {
    const color = RARITIES[c.minRarity].color;
    list.push({
      id: c.id,
      kind: "chest",
      x: c.pos[0],
      y: c.pos[1],
      promptLabel: "Abrir cofre",
      isAvailable: (gs) => !gs.data.chests.collected[c.id],
      interact: (gs) => {
        gs.collectChest(c.id);
        const rarity = rollRarity();
        const info = RARITIES[rarity];
        const monedas = 50 + info.order * 60;
        gs.addCurrency(monedas, info.order >= 5 ? Math.round(info.order * 1.5) : 0);
        gs.notifyEvent("recogerCofres", c.stage, 1);
        return { message: `Cofre abierto: +${monedas} monedas (${info.label})`, rarity };
      },
      draw(ctx, camera, t) {
        if (!camera.isVisible(this.x, this.y)) return;
        const [sx, sy] = camera.worldToScreen(this.x, this.y);
        const bob = Math.sin(t * 2 + this.x) * 2;
        ctx.save();
        ctx.translate(sx, sy + bob);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(0, 14, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6b4a2a";
        roundRect(ctx, -16, -6, 32, 18, 4);
        ctx.fill();
        ctx.fillStyle = color;
        roundRect(ctx, -17, -14, 34, 10, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 2;
        roundRect(ctx, -16, -6, 32, 18, 4);
        ctx.stroke();
        ctx.restore();
      },
    });
  }

  for (const p of PET_SPAWNS.filter((p) => p.stage === stage)) {
    list.push({
      id: p.id,
      kind: "pet",
      x: p.pos[0],
      y: p.pos[1],
      promptLabel: "Recoger mascota",
      isAvailable: (gs) => !gs.data.petsCollected[p.id],
      interact: (gs) => {
        gs.collectPetSpawn(p.id);
        const pet = rollNewPet();
        gs.addPet(pet);
        gs.notifyEvent("recogerMascotas", p.stage, 1);
        return { message: `¡Nueva mascota! Rareza: ${RARITIES[pet.rarity].label}`, rarity: pet.rarity };
      },
      draw(ctx, camera, t) {
        if (!camera.isVisible(this.x, this.y)) return;
        const [sx, sy] = camera.worldToScreen(this.x, this.y);
        const bob = Math.sin(t * 2.4 + this.x) * 4;
        ctx.save();
        ctx.translate(sx, sy + bob);
        ctx.fillStyle = "rgba(153,204,255,0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#99ccff";
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 11);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      },
    });
  }

  return list;
}
