import * as THREE from 'three';

const cloneMaterial = (
  material: THREE.Material
): THREE.Material => {
  const clonedMaterial = material.clone();

  clonedMaterial.side = THREE.DoubleSide;
  clonedMaterial.needsUpdate = true;

  if (
    clonedMaterial instanceof
    THREE.MeshStandardMaterial
  ) {
    clonedMaterial.roughness = 0.8;
    clonedMaterial.metalness = 0.1;
  }

  return clonedMaterial;
};

export const prepareAvatar = (
  scene: THREE.Group | THREE.Object3D
): void => {
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;

    /*
     * Clone materials before modifying them. GLTF materials may be cached
     * and shared across model instances.
     */
    if (Array.isArray(child.material)) {
      child.material =
        child.material.map(cloneMaterial);
    } else if (child.material) {
      child.material = cloneMaterial(
        child.material
      );
    }
  });
};

const isSkinMesh = (meshName: string): boolean => {
  const name = meshName.toLowerCase();

  const skinKeywords =
    /skin|body|head|face|hand|arm|leg|torso/;

  const excludedKeywords =
    /hair|eye|eyebrow|eyelash|teeth|tongue|shirt|cloth|outfit|pant|trouser|dress|shoe|boot|accessory|jacket|hoodie/;

  return (
    skinKeywords.test(name) &&
    !excludedKeywords.test(name)
  );
};

const applyColorToMaterial = (
  material: THREE.Material,
  colorCode: string
): void => {
  if (
    material instanceof
    THREE.MeshStandardMaterial
  ) {
    material.color.set(colorCode);
    material.needsUpdate = true;
  }
};

export const applySkinTone = (
  scene: THREE.Group | THREE.Object3D,
  colorCode: string
): void => {
  if (!colorCode) {
    return;
  }

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    if (!isSkinMesh(child.name)) {
      return;
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        applyColorToMaterial(
          material,
          colorCode
        );
      });
    } else if (child.material) {
      applyColorToMaterial(
        child.material,
        colorCode
      );
    }
  });
};