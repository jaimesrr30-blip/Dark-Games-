import * as THREE from "three";

export interface ArenaBounds {
  halfW: number;
  halfL: number;
  wallH: number;
  goalHalfWidth: number;
  goalBottom: number;
  goalTop: number;
}

export const ARENA_BOUNDS: ArenaBounds = {
  halfW: 34,
  halfL: 55,
  wallH: 12,
  goalHalfWidth: 8,
  goalBottom: 1.6,
  goalTop: 9,
};

export interface ArenaTheme {
  name: string;
  floorColor: number;
  floorColorAlt: number;
  wallColor: number;
  accentColor: number;
  skyTop: number;
  skyBottom: number;
  fogColor: number;
}

export function buildArena(theme: ArenaTheme): THREE.Scene {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(theme.fogColor, 70, 220);
  scene.background = new THREE.Color(theme.fogColor);

  const b = ARENA_BOUNDS;

  const floorGeo = new THREE.PlaneGeometry(b.halfW * 2, b.halfL * 2, 20, 30);
  floorGeo.rotateX(-Math.PI / 2);
  const colors = new Float32Array(floorGeo.attributes.position.count * 3);
  const c1 = new THREE.Color(theme.floorColor);
  const c2 = new THREE.Color(theme.floorColorAlt);
  const posAttr = floorGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const checker = (Math.floor(x / 6) + Math.floor(z / 6)) % 2 === 0;
    const col = checker ? c1 : c2;
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  floorGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: theme.wallColor, roughness: 0.6, transparent: true, opacity: 0.85 });
  const goalGlowMat = new THREE.MeshStandardMaterial({ color: theme.accentColor, emissive: theme.accentColor, emissiveIntensity: 1.2 });

  function buildEndWall(z: number) {
    const group = new THREE.Group();
    const totalW = b.halfW * 2;
    const sideW = (totalW - b.goalHalfWidth * 2) / 2;

    const left = new THREE.Mesh(new THREE.BoxGeometry(sideW, b.wallH, 0.6), wallMat);
    left.position.set(-(b.goalHalfWidth + sideW / 2), b.wallH / 2, z);
    group.add(left);
    const right = left.clone();
    right.position.x = b.goalHalfWidth + sideW / 2;
    group.add(right);

    const below = new THREE.Mesh(new THREE.BoxGeometry(b.goalHalfWidth * 2, b.goalBottom, 0.6), wallMat);
    below.position.set(0, b.goalBottom / 2, z);
    group.add(below);
    const above = new THREE.Mesh(new THREE.BoxGeometry(b.goalHalfWidth * 2, b.wallH - b.goalTop, 0.6), wallMat);
    above.position.set(0, b.goalTop + (b.wallH - b.goalTop) / 2, z);
    group.add(above);

    const frameGeo = new THREE.BoxGeometry(0.35, b.goalTop - b.goalBottom, 0.35);
    const leftFrame = new THREE.Mesh(frameGeo, goalGlowMat);
    leftFrame.position.set(-b.goalHalfWidth, (b.goalTop + b.goalBottom) / 2, z);
    group.add(leftFrame);
    const rightFrame = leftFrame.clone();
    rightFrame.position.x = b.goalHalfWidth;
    group.add(rightFrame);
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(b.goalHalfWidth * 2, 0.35, 0.35), goalGlowMat);
    topFrame.position.set(0, b.goalTop, z);
    group.add(topFrame);
    const bottomFrame = topFrame.clone();
    bottomFrame.position.y = b.goalBottom;
    group.add(bottomFrame);

    scene.add(group);
  }
  buildEndWall(-b.halfL);
  buildEndWall(b.halfL);

  const sideWallMat = wallMat;
  const sideWallGeo = new THREE.BoxGeometry(0.6, b.wallH, b.halfL * 2);
  const leftWall = new THREE.Mesh(sideWallGeo, sideWallMat);
  leftWall.position.set(-b.halfW, b.wallH / 2, 0);
  scene.add(leftWall);
  const rightWall = leftWall.clone();
  rightWall.position.x = b.halfW;
  scene.add(rightWall);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.3);
  sun.position.set(30, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.camera.far = 200;
  scene.add(sun);

  const skyGeo = new THREE.SphereGeometry(300, 16, 12);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color(theme.skyTop) }, bottom: { value: new THREE.Color(theme.skyBottom) } },
    vertexShader: `varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vPos; void main() { float t = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, t), 1.0); }`,
    side: THREE.BackSide,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  return scene;
}

export const ARENA_THEMES: Record<string, ArenaTheme> = {
  "Estadio Central": { name: "Estadio Central", floorColor: 0x3d5a80, floorColorAlt: 0x4a6b96, wallColor: 0x1c2b3a, accentColor: 0x66ccff, skyTop: 0x8fc7ff, skyBottom: 0xdcefff, fogColor: 0x9fb4c7 },
  "Estadio Galáctico": { name: "Estadio Galáctico", floorColor: 0x1c1233, floorColorAlt: 0x261a45, wallColor: 0x0d0820, accentColor: 0xff2fd1, skyTop: 0x120a2e, skyBottom: 0x3a1e63, fogColor: 0x1b1233 },
  "Estadio del Oasis": { name: "Estadio del Oasis", floorColor: 0xd8b168, floorColorAlt: 0xe4c580, wallColor: 0x6b4a2a, accentColor: 0x2fbfff, skyTop: 0xffb066, skyBottom: 0xffe2a8, fogColor: 0xf0d9a0 },
  "Estadio del Bosque": { name: "Estadio del Bosque", floorColor: 0x2f5d3a, floorColorAlt: 0x3a7048, wallColor: 0x1c3a24, accentColor: 0x9dffb0, skyTop: 0x0c2b1a, skyBottom: 0x1f5c3c, fogColor: 0x1c3a24 },
  "Estadio del Volcán": { name: "Estadio del Volcán", floorColor: 0x3a1414, floorColorAlt: 0x4a1c1c, wallColor: 0x1a0808, accentColor: 0xff5500, skyTop: 0x1a0505, skyBottom: 0x5c1a0a, fogColor: 0x2a0d0d },
  "Estadio Glaciar": { name: "Estadio Glaciar", floorColor: 0xd8ecf5, floorColorAlt: 0xc2e0ee, wallColor: 0x7fa7bb, accentColor: 0x66e0ff, skyTop: 0x8fd3ff, skyBottom: 0xe8fbff, fogColor: 0xe8f6ff },
  "Estadio del Cielo": { name: "Estadio del Cielo", floorColor: 0x4a7a5a, floorColorAlt: 0x5a8f6a, wallColor: 0x2a4a3a, accentColor: 0xdfffea, skyTop: 0x3d7fff, skyBottom: 0xbfe6ff, fogColor: 0xbfe6ff },
  "Estadio Submarino": { name: "Estadio Submarino", floorColor: 0x2a2f33, floorColorAlt: 0x373f45, wallColor: 0x121618, accentColor: 0x4dffe0, skyTop: 0x0a0e12, skyBottom: 0x1f2a33, fogColor: 0x1a1d1f },
  "Estadio Celestial": { name: "Estadio Celestial", floorColor: 0xfff2c2, floorColorAlt: 0xffe08a, wallColor: 0xd8b95a, accentColor: 0xfff6cc, skyTop: 0xffe9a8, skyBottom: 0xfffdf2, fogColor: 0xfff6da },
};
