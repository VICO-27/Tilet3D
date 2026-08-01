// frontend/src/features/avatar/components/AvatarModel.tsx
import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { useAvatarStore } from '../store/useAvatarStore';
import { prepareAvatar, applySkinTone } from '../utils/avatarRig';
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
// ─────────────────────────────────────────────────────────────────────────────
function SingleGenderAvatar({ gender, active }: { gender: Gender; active: boolean }) {
  const { scene, animations } = useGLTF(gender === 'male' ? MALE_GLB : FEMALE_GLB, DRACO_URL);

  const clonedScene = useMemo(() => {
    return scene ? SkeletonUtils.clone(scene) : new THREE.Group();
  }, [scene]);

  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, group);

  const height = useAvatarStore((s) => s.height);
  const weight = useAvatarStore((s) => s.weight);
  const skin_tone = useAvatarStore((s) => s.skin_tone);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);
  const isInteracting = useAvatarStore((s) => s.isInteracting);

  useEffect(() => {
    if (clonedScene) prepareAvatar(clonedScene);
  }, [clonedScene]);

  useEffect(() => {
    if (clonedScene) applySkinTone(clonedScene, SKIN_HEX[skin_tone] ?? SKIN_HEX.medium);
  }, [skin_tone, clonedScene]);

  useEffect(() => {
    if (!active || !names.length) return;
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
  }, [currentAnimation, actions, names, active]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const h = isFinite(height) && height > 0 ? height : 170;
    const w = isFinite(weight) && weight > 0 ? weight : 70;
    const targetSy = active ? clamp(h / 170, 0.5, 2.0) : 0;
    const targetSxz = active ? clamp(0.85 + w / 120, 0.5, 2.0) : 0;

    // Same butter-smooth lerp dissolve HeroModel uses when swapping genders.
    group.current.scale.lerp(new THREE.Vector3(targetSxz, targetSy, targetSxz), delta * 7);

    if (active) {
      if (currentAnimation === 'spin') {
        group.current.rotation.y += 0.02;
      } else if (currentAnimation === 'idle' && !isInteracting) {
        group.current.rotation.y += 0.0015;
      }
    }
  });

  return (
    <group ref={group} scale={0}>
      {/* dispose={null} prevents R3F from disposing our clone on unmount */}
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