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

const SKIN_NAME_PATTERN = /skin|body|human|head|face|facial|neck|ear|earlobe|arm|forearm|upperarm|hand|finger|leg|thigh|calf|foot|feet|toe|torso|chest|shoulder|hip/i;
const SKIN_MATERIAL_PATTERN = /skin|body|human|flesh|head|face|facial|neck|arm|hand|leg|foot|torso/i;
const CLOTHING_NAME_PATTERN = /shirt|cloth|clothing|outfit|top|bottom|tshirt|t-shirt|tee|tank|pant|pants|trouser|trousers|jean|denim|dress|skirt|jacket|hoodie|sweater|sweatshirt|coat|suit|vest|uniform|clothes|fabric/i;
const ACCESSORY_NAME_PATTERN = /shoe|shoes|boot|boots|sock|socks|belt|bracelet|necklace|ring|watch|glasses|hat|cap|scarf|bag|handbag|accessory/i;
const HEAD_DETAIL_PATTERN = /hair|eyebrow|eyelash|eye|iris|pupil|cornea|teeth|tooth|tongue|mouth|lip|nail/i;

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

function isDefinitelyClothing(text: string): boolean {
  return CLOTHING_NAME_PATTERN.test(text) || ACCESSORY_NAME_PATTERN.test(text);
}

function isDefinitelyHeadDetail(text: string): boolean {
  return HEAD_DETAIL_PATTERN.test(text);
}

// FIXED: Prioritize Material Name over Mesh Name to prevent clothes changing color
function isSkinMaterial(mesh: THREE.Mesh, material: THREE.Material): boolean {
  const matName = (material.name || '').toLowerCase();
  const meshName = (mesh.name || '').toLowerCase();

  // 1. Strict Material Check (Protects clothes and head details)
  if (isDefinitelyClothing(matName) || isDefinitelyHeadDetail(matName)) return false;
  if (SKIN_MATERIAL_PATTERN.test(matName)) return true;

  // 2. Strict Mesh Check (Only evaluated if material name was ambiguous)
  if (isDefinitelyClothing(meshName) || isDefinitelyHeadDetail(meshName)) return false;
  if (SKIN_MATERIAL_PATTERN.test(meshName)) return true;

  // 3. Fallback to full path check
  const fullPath = [getObjectPath(mesh), meshName, matName].join(' ').toLowerCase();
  if (isDefinitelyClothing(fullPath) || isDefinitelyHeadDetail(fullPath)) return false;
  if (SKIN_NAME_PATTERN.test(fullPath)) return true;

  return false;
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
    
    materials.forEach((material) => {
      if (isSkinMaterial(child, material)) {
        applyColor(material, hex);
      }
    });
  });
}