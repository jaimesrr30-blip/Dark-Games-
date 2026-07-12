import * as THREE from "three";

const VERT = `
varying vec3 vWorldPos;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const FRAG = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPos;
void main() {
  float h = normalize(vWorldPos + vec3(0.0, offset, 0.0)).y;
  float t = max(pow(max(h, 0.0), exponent), 0.0);
  gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
}
`;

export class SkyDome {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  sun: THREE.DirectionalLight;
  sunPivot: THREE.Object3D;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  timeOfDay = 0.3; // 0..1, 0 = medianoche, 0.25 = amanecer, 0.5 = mediodía, 0.75 = atardecer
  dayLengthSec = 480; // 8 minutos por ciclo completo

  constructor(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(900, 24, 16);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x8fc7ff) },
        bottomColor: { value: new THREE.Color(0xdcefff) },
        offset: { value: 20 },
        exponent: { value: 0.7 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    scene.add(this.mesh);

    this.sunPivot = new THREE.Object3D();
    scene.add(this.sunPivot);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sun.position.set(0, 400, 0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -140;
    this.sun.shadow.camera.right = 140;
    this.sun.shadow.camera.top = 140;
    this.sun.shadow.camera.bottom = -140;
    this.sun.shadow.camera.far = 1200;
    this.sun.shadow.bias = -0.0015;
    this.sunPivot.add(this.sun);
    this.sunPivot.add(this.sun.target);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(this.ambient);
    this.hemi = new THREE.HemisphereLight(0xbcd7ff, 0x3a2f28, 0.6);
    scene.add(this.hemi);
  }

  update(dt: number, focusPos: THREE.Vector3, regionSky: { top: number; bottom: number; ambient: number }) {
    this.timeOfDay = (this.timeOfDay + dt / this.dayLengthSec) % 1;
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const dist = 500;
    const sunHeight = Math.sin(angle);
    this.sunPivot.position.copy(focusPos);
    this.sun.position.set(Math.cos(angle) * dist, Math.max(sunHeight, -0.15) * dist, Math.sin(angle * 0.6) * dist * 0.4);
    this.sun.target.position.copy(focusPos);

    const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.25) / 1.0, 0, 1);
    const duskFactor = 1 - Math.min(1, Math.abs(sunHeight) / 0.35);

    this.sun.intensity = THREE.MathUtils.lerp(0.08, 1.6, dayFactor);
    const sunColorDay = new THREE.Color(0xfff3d6);
    const sunColorDusk = new THREE.Color(0xff8a4d);
    const sunColorNight = new THREE.Color(0x33549e);
    let sunColor = sunColorNight.clone().lerp(sunColorDay, dayFactor);
    sunColor = sunColor.lerp(sunColorDusk, duskFactor * 0.6);
    this.sun.color.copy(sunColor);

    this.ambient.intensity = THREE.MathUtils.lerp(0.18, 0.6, dayFactor);
    this.hemi.intensity = THREE.MathUtils.lerp(0.15, 0.7, dayFactor);

    const regionTop = new THREE.Color(regionSky.top);
    const regionBottom = new THREE.Color(regionSky.bottom);
    const nightTint = new THREE.Color(0x030310);
    const topMix = regionTop.clone().lerp(nightTint, 1 - dayFactor).lerp(sunColorDusk, duskFactor * 0.35);
    const bottomMix = regionBottom.clone().lerp(new THREE.Color(0x0a0a1a), 1 - dayFactor).lerp(sunColorDusk, duskFactor * 0.25);
    (this.material.uniforms.topColor.value as THREE.Color).copy(topMix);
    (this.material.uniforms.bottomColor.value as THREE.Color).copy(bottomMix);

    this.mesh.position.copy(focusPos);
  }

  get isNight(): boolean {
    return Math.sin(this.timeOfDay * Math.PI * 2 - Math.PI / 2) < -0.05;
  }
}
