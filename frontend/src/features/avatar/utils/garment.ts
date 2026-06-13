import * as THREE from "three";
import type { Gender } from "../types/avatar.types";

/**
 * Procedural Habesha garments. These are approximations built from primitives
 * (we can't author true fitted couture), draped over the avatar:
 *   • female → flared Habesha Kemis (gown)
 *   • male   → long Shemiz tunic
 * Both carry the authentic red/gold/green "Tilet" hem bands; the base fabric
 * colour is user-selectable. Built in the model's raw units so it scales with
 * the avatar group.
 */

export interface GarmentColor {
  name: string;
  hex: string;
}

export const GARMENT_COLORS: GarmentColor[] = [
  { name: "Ivory", hex: "#f4efe2" },
  { name: "Emerald", hex: "#0f7a4f" },
  { name: "Gold", hex: "#d4a017" },
  { name: "Onyx", hex: "#1f1d27" },
  { name: "Crimson", hex: "#a01b2e" },
];

const TILET_RED = 0xb01b2e;
const TILET_GOLD = 0xd9a527;
const TILET_GREEN = 0x118a52;

export function buildGarment(
  gender: Gender,
  rawHeight: number,
  hex: string,
): THREE.Group {
  const h = rawHeight || 1.7;
  const r = (f: number) => f * h;

  const group = new THREE.Group();
  const base = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: 0.78,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: TILET_GOLD,
    roughness: 0.4,
    metalness: 0.5,
  });
  group.userData.baseMats = [base];

  const tiletMats = [
    new THREE.MeshStandardMaterial({ color: TILET_RED, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: TILET_GOLD, roughness: 0.4, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: TILET_GREEN, roughness: 0.5 }),
  ];

  const female = gender === "female";

  // Skirt / body: female flares out, male hangs straight (long shemiz).
  const topR = r(0.115);
  const hemR = female ? r(0.2) : r(0.145);
  const bodyTop = r(0.84); // shoulders
  const bodyBottom = r(0.06); // ankle
  const bodyH = bodyTop - bodyBottom;

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(topR, hemR, bodyH, 48, 1, true),
    base,
  );
  body.position.y = bodyBottom + bodyH / 2;
  group.add(body);

  // Shoulder yoke + short sleeves
  const yoke = new THREE.Mesh(
    new THREE.CylinderGeometry(topR * 1.02, topR, r(0.06), 32),
    base,
  );
  yoke.position.y = bodyTop - r(0.03);
  group.add(yoke);

  const sleeveGeo = new THREE.CylinderGeometry(r(0.045), r(0.05), r(0.16), 20, 1, true);
  [-1, 1].forEach((sgn) => {
    const sleeve = new THREE.Mesh(sleeveGeo, base);
    sleeve.position.set(sgn * topR * 1.05, bodyTop - r(0.02), 0);
    sleeve.rotation.z = sgn * 1.05;
    group.add(sleeve);
  });

  // Neckline gold trim
  const collar = new THREE.Mesh(new THREE.TorusGeometry(topR * 0.7, r(0.012), 8, 32), gold);
  collar.position.y = bodyTop;
  collar.rotation.x = Math.PI / 2;
  group.add(collar);

  // Tilet hem bands (red / gold / green) near the bottom
  const bandR = hemR + r(0.004);
  [0, 1, 2].forEach((i) => {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(bandR, bandR, r(0.03), 48, 1, true),
      tiletMats[i],
    );
    band.position.y = bodyBottom + r(0.05) + i * r(0.035);
    group.add(band);
  });

  // A vertical Tilet placket down the centre-front for extra "design"
  const placket = new THREE.Mesh(
    new THREE.BoxGeometry(r(0.02), bodyH * 0.8, r(0.006)),
    tiletMats[1],
  );
  placket.position.set(0, bodyBottom + bodyH * 0.45, hemR * 0.92);
  group.add(placket);

  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
    }
  });

  return group;
}

export function recolorGarment(group: THREE.Group, hex: string) {
  const mats = group.userData.baseMats as THREE.MeshStandardMaterial[] | undefined;
  mats?.forEach((m) => m.color.set(hex));
}
