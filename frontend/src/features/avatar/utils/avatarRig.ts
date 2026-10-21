// frontend/src/features/avatar/utils/avatarRig.ts
import * as THREE from 'three';

function cloneMaterial(material: THREE.Material): THREE.Material {
  const cloned = material.clone();
  cloned.side = THREE.DoubleSide;
  cloned.needsUpdate = true;

  if (cloned instanceof THREE.MeshStandardMaterial) {
    cloned.roughness = 0.58; // Optimized for skin and fabric light reflection
    cloned.metalness = 0.0; // Non-metallic (prevents dark absorption in shadows)
  }

  cloned.userData = {
    ...cloned.userData,
    originalTransparent: material.transparent,
    originalOpacity: material.opacity,
    originalDepthWrite: material.depthWrite,
  };

  return cloned;
}

export function prepareAvatar(scene: THREE.Group | THREE.Object3D): void {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    
    // Crucial: recompute true surface vertex normals to eliminate warped or inverted
    // normals from Draco compression / 3D model export that cause dark shading on limbs
    if (child.geometry) {
      child.geometry.computeVertexNormals();
    }

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
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clothing items — things worn ON the body that should never be recolored
 * when changing skin tone.
 */
const CLOTHING_PATTERN = /\b(shirt|cloth|clothing|outfit|top|bottom|tshirt|tee|tank|pant|pants|trouser|trousers|jean|jeans|denim|dress|dresses|skirt|skirts|jacket|jackets|hoodie|hoodies|sweater|sweaters|sweatshirt|coat|coats|suit|suits|vest|vests|uniform|uniforms|fabric|garment|garments|wear|costume|collar|sleeve|sleeves|cuff|cuffs|lapel|pocket|pockets|zipper|button|buttons|seam)\b/i;

/**
 * Footwear & accessories — never recolored.
 */
const ACCESSORY_PATTERN = /\b(shoe|shoes|boot|boots|sock|socks|sandal|sandals|belt|belts|bracelet|bracelets|necklace|necklaces|ring|rings|watch|watches|glasses|spectacles|hat|hats|cap|caps|scarf|scarves|bag|bags|handbag|handbags|purse|purses|accessory|accessories|jewelry|jewel|jewels|glove|gloves)\b/i;

/**
 * Head details — hair, eyes, teeth, eyebrows etc. These have their own color
 * and must NOT be recolored by the body skin tone change.
 * Note: "head", "face", "neck" are intentionally NOT here — those ARE skin.
 */
const HEAD_NON_SKIN_PATTERN = /\b(hair|scalp|strand|strands|braid|braids|lash|lashes|eyelash|eyelashes|brow|brows|eyebrow|eyebrows|eye|eyes|iris|pupil|pupils|cornea|sclera|eyeball|eyeballs|teeth|tooth|tongue|mouth|cavity|lip|lips|nail|nails|fingernail|fingernails|beard|beards|mustache|stubble|eyelid|eyelids)\b/i;

/**
 * Returns true if this mesh/material should be EXCLUDED from skin-tone tinting.
 * Everything that is NOT excluded is treated as skin.
 */
export function isNonSkinMaterial(meshName: string, matName: string): boolean {
  // Normalize node/material names by converting underscores, hyphens, and dots to spaces
  const combined = `${meshName} ${matName}`.toLowerCase().replace(/[_.-]/g, ' ');
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
        if (material instanceof THREE.MeshStandardMaterial) {
          material.metalness = 0.0;
          material.roughness = 0.58;
        }
        applyColor(material, hex);
      }
    });
  });
}

/**
 * Calibrates skin meshes with radiant, healthy human skin warmth.
 * Eliminates muddy, grayish or bruised undertones under studio lighting.
 */
export function applyNaturalSkinWarmth(scene: THREE.Group | THREE.Object3D, tintHex = '#fff4eb'): void {
  applySkinTone(scene, tintHex);
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