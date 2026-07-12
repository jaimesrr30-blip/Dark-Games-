import * as THREE from "three";
import { buildTerrain } from "./Terrain";
import { buildRegionProps } from "./Props";
import { SkyDome } from "./Sky";
import { WeatherSystem } from "./Weather";
import { buildInteractables, type Interactable } from "./Interactables";
import { regionAt, type RegionDef } from "../data/regions";
import type { GameState } from "../state/GameState";

export class World {
  scene = new THREE.Scene();
  sky: SkyDome;
  weather: WeatherSystem;
  interactables: Interactable[];
  currentRegion: RegionDef;
  private fog: THREE.Fog;

  constructor(gs: GameState) {
    this.scene.add(buildTerrain());
    this.scene.add(buildRegionProps());
    this.sky = new SkyDome(this.scene);
    this.weather = new WeatherSystem(this.scene);
    this.interactables = buildInteractables(this.scene, gs);
    this.currentRegion = regionAt(0, 0);
    this.fog = new THREE.Fog(this.currentRegion.fogColor, this.currentRegion.fogNear, this.currentRegion.fogFar);
    this.scene.fog = this.fog;
  }

  update(dt: number, playerPos: THREE.Vector3) {
    this.currentRegion = regionAt(playerPos.x, playerPos.z);
    this.sky.update(dt, playerPos, {
      top: this.currentRegion.skyTop,
      bottom: this.currentRegion.skyBottom,
      ambient: this.currentRegion.ambientColor,
    });
    if (this.weather.currentType !== this.currentRegion.weather) {
      this.weather.setWeather(this.currentRegion.weather);
    }
    this.weather.update(dt, playerPos);

    this.fog.color.set(this.currentRegion.fogColor);
    this.fog.near = this.currentRegion.fogNear;
    this.fog.far = this.currentRegion.fogFar;
    this.scene.background = this.fog.color;

    for (const it of this.interactables) it.update?.(dt, playerPos);
  }
}
