import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { REGION_ORDER, REGIONS } from "../data/regions";
import { getGroundHeight, isInsideStructureFootprint } from "./height";
import { hashString, mulberry32 } from "../utils/random";

function propGeometry(type: string): THREE.BufferGeometry {
  switch (type) {
    case "cone":
      return new THREE.ConeGeometry(1, 2.4, 6);
    case "cylinder":
      return new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
    case "crystal":
      return new THREE.OctahedronGeometry(1.3, 0);
    case "ice":
      return new THREE.ConeGeometry(1, 3, 4);
    case "cactus":
      return new THREE.CapsuleGeometry(0.5, 2, 4, 6);
    case "tree":
      return new THREE.ConeGeometry(1.4, 3.4, 7);
    case "pipe":
      return new THREE.CylinderGeometry(0.6, 0.6, 4, 8);
    case "cloudRock":
      return new THREE.IcosahedronGeometry(1.6, 0);
    case "cube":
    default:
      return new THREE.BoxGeometry(1.6, 2.4, 1.6);
  }
}

// Todos los props de una región se fusionan en una única malla para minimizar las
// llamadas de dibujo (una región puede tener decenas de decoraciones dispersas).
export function buildRegionProps(): THREE.Group {
  const group = new THREE.Group();

  for (const rid of REGION_ORDER) {
    if (rid === "hub") continue;
    const region = REGIONS[rid];
    const rng = mulberry32(hashString(region.id));
    const count = 70;
    const glow = rid === "ciudad" || rid === "laboratorio";
    const pieces: THREE.BufferGeometry[] = [];

    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = rng() * region.radius * 0.95;
      const x = region.center[0] + Math.cos(angle) * dist;
      const z = region.center[1] + Math.sin(angle) * dist;
      if (isInsideStructureFootprint(x, z)) continue;
      // deja libre una zona central de "plaza" y el pasillo hacia el estadio
      if (dist < 22) continue;

      const type = region.propTypes[Math.floor(rng() * region.propTypes.length)];
      const geo = propGeometry(type).toNonIndexed();
      // deja solo position + normal (mergeGeometries exige los mismos atributos en todas las piezas)
      const cleanGeo = new THREE.BufferGeometry();
      cleanGeo.setAttribute("position", geo.attributes.position);
      cleanGeo.setAttribute("normal", geo.attributes.normal);

      const hue = rng();
      const baseColor = new THREE.Color(region.groundColorAlt).offsetHSL((hue - 0.5) * 0.08, 0, (hue - 0.5) * 0.1);

      const colors = new Float32Array(cleanGeo.attributes.position.count * 3);
      for (let v = 0; v < cleanGeo.attributes.position.count; v++) {
        colors[v * 3] = baseColor.r;
        colors[v * 3 + 1] = baseColor.g;
        colors[v * 3 + 2] = baseColor.b;
      }
      cleanGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const h = getGroundHeight(x, z);
      const scale = 0.7 + rng() * 1.6;
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(x, h + scale * 1.2, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng() * Math.PI * 2, 0)),
        new THREE.Vector3(scale, scale, scale)
      );
      cleanGeo.applyMatrix4(matrix);
      pieces.push(cleanGeo);
    }

    if (pieces.length === 0) continue;
    const merged = mergeGeometries(pieces, false);
    if (!merged) continue;
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
      emissive: glow ? new THREE.Color(region.ambientColor) : 0x000000,
      emissiveIntensity: glow ? 0.3 : 0,
    });
    const mesh = new THREE.Mesh(merged, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
  }
  return group;
}
