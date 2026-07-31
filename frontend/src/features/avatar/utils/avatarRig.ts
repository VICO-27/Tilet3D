// frontend/src/features/avatar/utils/avatarRig.ts
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Material helpers
// ─────────────────────────────────────────────────────────────────────────────
function cloneMaterial(mat: THREE.Material): THREE.Material {
  const m = mat.clone();
  m.side = THREE.DoubleSide;
  m.needsUpdate = true;
  if (m instanceof THREE.MeshStandardMaterial) {
    m.roughness = 0.8;
    m.metalness = 0.1;
  }
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// prepareAvatar — run once on a CLONED scene to configure shadows & materials.
// NOTE: Do NOT call this on the raw cached GLTF scene; always clone first.
// ─────────────────────────────────────────────────────────────────────────────
export function prepareAvatar(scene: THREE.Group | THREE.Object3D): void {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;

    if (Array.isArray(child.material)) {
      child.material = child.material.map(cloneMaterial);
    } else if (child.material) {
      child.material = cloneMaterial(child.material);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Skin tone
//
// FIX: Some avatar exports (e.g. Sketchfab/Mixamo male rig) leave the body
// mesh completely unnamed while only clothing/hair pieces are named. An
// "include" list that requires a body-ish keyword silently matches nothing
// on those models. Switched to an "exclude" list — everything is treated as
// skin UNLESS it's recognizably clothing, hair, eyes, or an accessory. This
// correctly classifies unnamed body meshes as skin on both models.
// ─────────────────────────────────────────────────────────────────────────────
const NON_SKIN =
  /hair|eyebrow|eyelash|eye|teeth|tongue|mouth|nail|shirt|cloth|outfit|pant|trouser|dress|skirt|shoe|boot|sock|jacket|hoodie|sweater|sweatshirt|bracelet|necklace|ring|watch|glasses|hat|cap|scarf|belt|accessory/i;

function isSkinMesh(name: string): boolean {
  return !NON_SKIN.test(name);
}

function applyColor(mat: THREE.Material, hex: string) {
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.color.set(hex);
    mat.needsUpdate = true;
  }
}

export function applySkinTone(scene: THREE.Group | THREE.Object3D, hex: string): void {
  if (!hex) return;
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !isSkinMesh(child.name)) return;
    if (Array.isArray(child.material)) {
      child.material.forEach((m) => applyColor(m, hex));
    } else if (child.material) {
      applyColor(child.material, hex);
    }
  });
}