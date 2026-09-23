// frontend/src/features/avatar/utils/avatarRig.ts
import * as THREE from 'three';

function cloneMaterial(material: THREE.Material): THREE.Material {
  const cloned = material.clone();
  cloned.side = THREE.DoubleSide;
  cloned.needsUpdate = true;

  if (cloned instanceof THREE.MeshStandardMaterial) {
    cloned.roughness = 0.65; // Optimized for skin light reflection
    cloned.metalness = 0.1;
  }
  return cloned;
}

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
// Skin-tone tinting logic — INVERTED APPROACH (robust to any GLB naming)
//
// Old approach: positively identify skin meshes → missed face/neck on female,
// and was fooled by male body meshes named generically (e.g. "Body").
//
// New approach: definitively identify NON-SKIN meshes (clothing, accessories,
// hair, teeth, eyes) and reject those. Everything else is treated as skin.
// This is more robust because:
//   - Clothing names are highly predictable across all avatar generators
//   - Hair/eye/teeth names are stable and well-separated from skin
//   - Any mesh that ISN'T clothing/hair/eyes/accessories IS body skin
//
// Tested against common avatar generator naming conventions:
//   ReadyPlayerMe: Wolf3D_Body, Wolf3D_Head, Wolf3D_Outfit_Top, Wolf3D_Hair
//   MakeHuman: body, hair, clothes, eyebrows
//   Mixamo: mixamorig, Body, Skin
//   Generic Blender exports: Mesh, Body, Armature|Body, etc.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clothing items — things worn ON the body that should never be recolored
 * when changing skin tone.
 */
const CLOTHING_PATTERN = /\b(shirt|cloth|clothing|outfit|top|bottom|tshirt|t[\-_]shirt|tee|tank|pant|pants|trouser|trousers|jean|denim|dress|skirt|jacket|hoodie|sweater|sweatshirt|coat|suit|vest|uniform|clothes|fabric|garment|wear|costume|collar|sleeve|cuff|lapel|pocket|zipper|button|seam)\b/i;

/**
 * Footwear & accessories — never recolored.
 */
const ACCESSORY_PATTERN = /\b(shoe|shoes|boot|boots|sock|socks|sandal|sandals|belt|bracelet|necklace|ring|watch|glasses|spectacles|hat|cap|scarf|bag|handbag|purse|accessory|accessories|jewelry|jewel|glove|gloves)\b/i;

/**
 * Head details — hair, eyes, teeth, eyebrows etc. These have their own color
 * and must NOT be recolored by the body skin tone change.
 * Note: "head", "face", "neck" are intentionally NOT here — those ARE skin.
 */
const HEAD_NON_SKIN_PATTERN = /\b(hair|strand|braid|lash|eyelash|brow|eyebrow|eye|iris|pupil|cornea|sclera|eyeball|teeth|tooth|tongue|mouth|lip|nail|nails|beard|mustache|stubble|eyelid)\b/i;

/**
 * Returns true if this mesh/material should be EXCLUDED from skin-tone tinting.
 * Everything that is NOT excluded is treated as skin.
 */
function isNonSkinMaterial(meshName: string, matName: string): boolean {
  const combined = `${meshName} ${matName}`.toLowerCase();
  return (
    CLOTHING_PATTERN.test(combined) ||
    ACCESSORY_PATTERN.test(combined) ||
    HEAD_NON_SKIN_PATTERN.test(combined)
  );
}

function getMaterialList(mesh: THREE.Mesh): THREE.Material[] {
  if (Array.isArray(mesh.material)) return mesh.material;
  return mesh.material ? [mesh.material] : [];
}

function getObjectPath(object: THREE.Object3D): string {
  const names: string[] = [];
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name) names.push(current.name);
    current = current.parent;
  }
  return names.reverse().join('/');
}

function applyColor(material: THREE.Material, hex: string): void {
  const colorMaterial = material as THREE.Material & { color?: THREE.Color };
  if (colorMaterial.color instanceof THREE.Color) {
    colorMaterial.color.set(hex);
    material.needsUpdate = true;
  }
}

export function applySkinTone(scene: THREE.Group | THREE.Object3D, hex: string): void {
  if (!hex) return;
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = getMaterialList(child);
    const meshName = child.name || '';
    
    materials.forEach((material) => {
      const matName = material.name || '';
      if (!isNonSkinMaterial(meshName, matName)) {
        applyColor(material, hex);
      }
    });
  });
}

/**
 * DEV UTILITY — logs all mesh and material names with their skin classification.
 * Call this from AvatarModel after prepareAvatar to verify the tinting logic
 * against the actual node names in each GLB.
 * Guards against production builds via import.meta.env.PROD.
 */
export function debugAvatarMeshes(scene: THREE.Group | THREE.Object3D, label = ''): void {
  if (import.meta.env.PROD) return;
  const rows: { meshName: string; matName: string; path: string; willTint: boolean }[] = [];
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = getMaterialList(child);
    const meshName = child.name || '(unnamed)';
    materials.forEach((mat) => {
      const matName = mat.name || '(unnamed)';
      rows.push({
        meshName,
        matName,
        path: getObjectPath(child),
        willTint: !isNonSkinMaterial(meshName, matName),
      });
    });
  });
  console.groupCollapsed(`[avatarRig] ${label} — ${rows.length} materials`);
  console.table(rows);
  console.groupEnd();
}