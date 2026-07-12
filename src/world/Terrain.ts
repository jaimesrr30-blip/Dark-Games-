import * as THREE from "three";
import { regionAt } from "../data/regions";
import { getGroundHeight, STRUCTURES } from "./height";

const WORLD_HALF = 820;
const SEGMENTS = 140;

// Cuña (prisma triangular) para rampas: base plana en z=0 (altura 0) que sube hasta
// altura `height` en z=length. Local: x en [-width/2, width/2], z en [0, length].
function buildWedgeGeometry(width: number, length: number, height: number): THREE.BufferGeometry {
  const hw = width / 2;
  const v = {
    frontBottomL: [-hw, 0, 0],
    frontBottomR: [hw, 0, 0],
    backBottomL: [-hw, 0, length],
    backBottomR: [hw, 0, length],
    backTopL: [-hw, height, length],
    backTopR: [hw, height, length],
  };
  const positions: number[] = [
    // rampa (cara superior inclinada)
    ...v.frontBottomL, ...v.frontBottomR, ...v.backTopR,
    ...v.frontBottomL, ...v.backTopR, ...v.backTopL,
    // base
    ...v.frontBottomL, ...v.backBottomL, ...v.backBottomR,
    ...v.frontBottomL, ...v.backBottomR, ...v.frontBottomR,
    // pared trasera vertical
    ...v.backBottomL, ...v.backTopL, ...v.backTopR,
    ...v.backBottomL, ...v.backTopR, ...v.backBottomR,
    // lateral izquierdo
    ...v.frontBottomL, ...v.backTopL, ...v.backBottomL,
    // lateral derecho
    ...v.frontBottomR, ...v.backBottomR, ...v.backTopR,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

export function buildTerrain(): THREE.Group {
  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, SEGMENTS, SEGMENTS);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = getGroundHeight(x, z);
    pos.setY(i, h);

    const region = regionAt(x, z);
    const checker = (Math.floor(x / 8) + Math.floor(z / 8)) % 2 === 0;
    color.set(checker ? region.groundColor : region.groundColorAlt);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0.02 });
  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  group.add(ground);

  for (const s of STRUCTURES) {
    const region = regionAt(s.x, s.z);
    const mat2 = new THREE.MeshStandardMaterial({ color: region.groundColorAlt, roughness: 0.8 });
    if (s.type === "platform") {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(s.width, s.height, s.depth), mat2);
      mesh.position.set(s.x, s.height / 2, s.z);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      group.add(mesh);
    } else if (s.type === "ramp") {
      const wedge = new THREE.Mesh(buildWedgeGeometry(s.width, s.length, s.height), mat2);
      wedge.position.set(s.x, 0, s.z);
      wedge.rotation.y = s.rotationY;
      wedge.castShadow = true;
      wedge.receiveShadow = true;
      group.add(wedge);
    }
  }

  return group;
}
