import * as THREE from "three";
import { CarBody, buildCarMesh, DEFAULT_WORLD_PHYSICS, type CarPhysicsOptions } from "./Car";
import { Input } from "../core/Input";
import { getItem } from "../data/items";
import type { GameState } from "../state/GameState";
import { petPowerValue } from "../data/pets";

export function visualConfigFromState(gs: GameState) {
  const wheel = getItem(gs.data.equipped.rueda);
  const turbo = getItem(gs.data.equipped.turbo);
  const antena = getItem(gs.data.equipped.antena);
  return {
    bodyColor: gs.data.carColor,
    wheelColor: wheel?.colorHex ?? 0x222222,
    turboColor: turbo?.colorHex ?? 0x66ccff,
    antenna: !!antena && antena.id !== "antena_ninguna",
    trail: true,
  };
}

export class PlayerController {
  car: CarBody;
  camera: THREE.PerspectiveCamera;
  cameraDistance = 8.5;
  cameraHeight = 3.4;
  input: Input;

  constructor(gs: GameState, camera: THREE.PerspectiveCamera, input: Input, physics: CarPhysicsOptions = DEFAULT_WORLD_PHYSICS) {
    this.car = new CarBody(visualConfigFromState(gs), physics);
    this.camera = camera;
    this.input = input;
  }

  refreshVisual(gs: GameState) {
    const parent = this.car.group.parent;
    const pos = this.car.group.position.clone();
    const heading = this.car.heading;
    if (parent) parent.remove(this.car.group);
    this.car.group = buildCarMesh(visualConfigFromState(gs));
    this.car.group.position.copy(pos);
    this.car.group.rotation.y = heading;
    if (parent) parent.add(this.car.group);
  }

  update(dt: number, gs: GameState) {
    const activePet = gs.getActivePet();
    this.car.boostRegenMult = 1;
    let jumpBoost = 0;
    if (activePet) {
      const power = petPowerValue(activePet);
      const archetype = activePet.archetypeId;
      if (archetype === "chispa") this.car.boostRegenMult = 1 + power * 3;
      if (archetype === "saltarin") jumpBoost = power * 12;
    }

    this.car.update(
      dt,
      {
        throttle: this.input.throttle,
        steer: this.input.steer,
        boost: this.input.boost,
        jumpPressed: this.input.jump,
      },
      9 + jumpBoost
    );

    const behind = new THREE.Vector3(Math.sin(this.car.heading + Math.PI), 0, Math.cos(this.car.heading + Math.PI));
    const desiredPos = this.car.position
      .clone()
      .add(behind.multiplyScalar(this.cameraDistance))
      .add(new THREE.Vector3(0, this.cameraHeight, 0));
    const smoothing = 1 - Math.pow(0.0005, dt);
    this.camera.position.lerp(desiredPos, smoothing);
    const lookTarget = this.car.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.camera.lookAt(lookTarget);
  }
}
