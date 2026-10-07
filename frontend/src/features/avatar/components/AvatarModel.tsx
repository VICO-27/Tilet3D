// frontend/src/features/avatar/components/AvatarModel.tsx
import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { useAvatarStore } from '../store/useAvatarStore';
import { prepareAvatar, applySkinTone, debugAvatarMeshes } from '../utils/avatarRig';
import type { Gender } from '../types/avatar.types';

export const DRACO_URL = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/';
const MALE_GLB = '/models/maleAvatar.glb';
const FEMALE_GLB = '/models/femaleAvatar.glb';

import type { SkinTone } from '../types/avatar.types';

const SKIN_HEX: Record<SkinTone, string> = {
  ivory: '#fff6ee',
  fair: '#fdf0ea',
  light: '#f1c27d',
  honey: '#dba463',
  medium: '#b18a66',
  caramel: '#9c7148',
  tan: '#8d5524',
  chestnut: '#74421f',
  rich: '#5c3816',
  espresso: '#452710',
  deep: '#2d1606',
  ebony: '#180b03',
};
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ─────────────────────────────────────────────────────────────────────────────
// One instance per gender, ALWAYS mounted (mirrors HeroModel.tsx's pattern).
// Switching gender toggles visibility via scale — it never changes which
// path useGLTF points at, so React never re-suspends this component after
// the initial mount. That's what was causing the flash-then-blank: before,
// a single AvatarModel switched its useGLTF path on gender change, forcing
// React to unmount it and show the Suspense fallback mid-session.
//
// FIX (double-load / flash):
// useMemo falls back to `new THREE.Group()` while the GLB is loading.
// Running prepareAvatar on that empty group is harmless but the memo
// recomputes when the real scene arrives, creating a new object reference.
// This caused useAnimations + skin-tone effects to re-fire → visible flash.
//
// Guard: only clone when `scene.children.length > 0` (i.e. the GLB has
// actually resolved). Return null until ready so nothing is mounted into
// the Three.js scene graph — eliminates the empty→real swap flash.
// Track preparation state with a ref to avoid double-runs.
// ─────────────────────────────────────────────────────────────────────────────
function SingleGenderAvatar({ gender, active }: { gender: Gender; active: boolean }) {
  const { scene, animations } = useGLTF(gender === 'male' ? MALE_GLB : FEMALE_GLB, DRACO_URL);

  // Only clone when the real scene has loaded (children > 0).
  // Returns null while the GLB is still in the cache/network — the caller
  // renders nothing until this resolves, preventing the empty→full swap flash.
  // Clone the scene once. SkeletonUtils.clone is required so we can have independent
  // skeletons/materials for male and female at the same time if needed.
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return SkeletonUtils.clone(scene);
  }, [scene]);

  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, group);

  // Ref-tracked flag: prepareAvatar must run exactly once per cloned scene
  // instance. Using a ref (not state) avoids triggering a re-render.
  const preparedRef = useRef<THREE.Object3D | null>(null);

  const height = useAvatarStore((s) => s.height);
  const weight = useAvatarStore((s) => s.weight);
  const skin_tone = useAvatarStore((s) => s.skin_tone);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);
  const isInteracting = useAvatarStore((s) => s.isInteracting);

  // Prepare the avatar (shadows, material clone, frustum cull off) — only
  // once per unique cloned scene. The ref comparison prevents double-runs.
  useEffect(() => {
    if (!clonedScene || preparedRef.current === clonedScene) return;
    prepareAvatar(clonedScene);
    debugAvatarMeshes(clonedScene, `${gender} avatar`);
    preparedRef.current = clonedScene;
  }, [clonedScene, gender]);

  // Apply skin tone whenever the selection changes or a new scene is ready.
  useEffect(() => {
    if (!clonedScene) return;
    applySkinTone(clonedScene, SKIN_HEX[skin_tone] ?? SKIN_HEX.medium);
  }, [skin_tone, clonedScene]);

  // Start / switch animations — only when the scene is ready and active.
  useEffect(() => {
    if (!clonedScene || !active || !names.length) return;
    const find = (kw: string) => {
      const n = names.find((x) => x.toLowerCase().includes(kw));
      return n ? actions[n] : null;
    };
    const idle = find('idle') ?? actions[names[0]];
    const walk = find('walk') ?? actions[names[1]] ?? idle;
    const target = currentAnimation === 'walk' ? walk : idle;
    if (target) {
      Object.values(actions).forEach((a) => a?.fadeOut(0.4));
      target.reset().fadeIn(0.4).play();
    }
  }, [currentAnimation, actions, names, active, clonedScene]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const h = isFinite(height) && height > 0 ? height : 170;
    const w = isFinite(weight) && weight > 0 ? weight : 70;
    const targetSy = active ? clamp(h / 170, 0.5, 2.0) : 0.001;
    const targetSxz = active ? clamp(0.85 + w / 120, 0.5, 2.0) : 0.001;

    // Same butter-smooth lerp dissolve HeroModel uses when swapping genders.
    // Clamp the interpolation factor to 1 to prevent exploding scale on large delta (e.g. after Suspense resolves)
    const t = Math.min(delta * 7, 1);
    group.current.scale.lerp(new THREE.Vector3(targetSxz, targetSy, targetSxz), t);

    if (active) {
      if (currentAnimation === 'spin') {
        group.current.rotation.y += 0.02;
      } else if (currentAnimation === 'idle' && !isInteracting) {
        group.current.rotation.y += 0.0015;
      }
    }
  });

  // KEY FIX: Do NOT render the group until the cloned scene is ready.
  if (!clonedScene) return null;

  return (
    <group 
      ref={group} 
      scale={0.001} 
      // Only hide completely when inactive AND fully shrunk down, so the shrink animation is visible
      visible={active || (group.current ? group.current.scale.y > 0.01 : false)}
    >
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
}

export function AvatarModel() {
  const gender = useAvatarStore((s) => s.gender);

  return (
    <>
      <SingleGenderAvatar gender="male" active={gender === 'male'} />
      <SingleGenderAvatar gender="female" active={gender === 'female'} />
    </>
  );
}

useGLTF.preload(MALE_GLB, DRACO_URL);
useGLTF.preload(FEMALE_GLB, DRACO_URL);