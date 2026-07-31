import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { useAvatarStore } from '../store/useAvatarStore';
import { prepareAvatar, applySkinTone } from '../utils/avatarRig';

// ─────────────────────────────────────────────────────────────────────────────
// Constants — DRACO URL must be identical everywhere useGLTF is called so that
// all calls share the same cache entry and load the GLB only once.
// ─────────────────────────────────────────────────────────────────────────────
export const DRACO_URL = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/';
const MALE_GLB = '/models/maleAvatar.glb';
const FEMALE_GLB = '/models/femaleAvatar.glb';

const SKIN_HEX: Record<string, string> = {
  fair: '#fdf0ea',
  light: '#f1c27d',
  medium: '#b18a66',
  tan: '#8d5524',
  rich: '#5c3816',
  deep: '#2d1606',
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ─────────────────────────────────────────────────────────────────────────────
// AvatarModel
// ─────────────────────────────────────────────────────────────────────────────
export function AvatarModel() {
  // Subscribe to individual slices — prevents full re-render on every set()
  const gender = useAvatarStore((s) => s.gender);
  const height = useAvatarStore((s) => s.height);
  const weight = useAvatarStore((s) => s.weight);
  const skin_tone = useAvatarStore((s) => s.skin_tone);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);
  const isInteracting = useAvatarStore((s) => s.isInteracting);

  const path = gender === 'male' ? MALE_GLB : FEMALE_GLB;

  // FIX: Pass DRACO_URL so this call shares the same cache key as the
  // preloads in main.tsx — prevents a second GLB download.
  const { scene, animations } = useGLTF(path, DRACO_URL);

  // FIX: SkeletonUtils.clone on the raw cached scene is safe here because we
  // immediately break the parent link. The memo key on `scene` means we only
  // re-clone when the gender changes (different scene object).
  const clonedScene = useMemo(() => {
    return scene ? SkeletonUtils.clone(scene) : new THREE.Group();
  }, [scene]);

  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, group);

  // Prepare materials once per clone
  useEffect(() => {
    if (clonedScene) prepareAvatar(clonedScene);
  }, [clonedScene]);

  // Apply skin tone whenever it changes
  useEffect(() => {
    if (clonedScene) {
      applySkinTone(clonedScene, SKIN_HEX[skin_tone] ?? SKIN_HEX.medium);
    }
  }, [skin_tone, clonedScene]);

  // Animation control
  useEffect(() => {
    if (!names.length) return;
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
  }, [currentAnimation, actions, names]);

  // Per-frame: scale from measurements + rotation
  useFrame(() => {
    if (!group.current) return;
    const h = isFinite(height) && height > 0 ? height : 170;
    const w = isFinite(weight) && weight > 0 ? weight : 70;
    const sy = clamp(h / 170, 0.5, 2.0);
    const sxz = clamp(0.85 + w / 120, 0.5, 2.0);
    group.current.scale.set(sxz, sy, sxz);

    if (currentAnimation === 'spin') {
      group.current.rotation.y += 0.02;
    } else if (currentAnimation === 'idle' && !isInteracting) {
      group.current.rotation.y += 0.0015;
    }
  });

  return (
    <group ref={group}>
      {/* dispose={null} prevents R3F from disposing our clone on unmount */}
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
}

// Preload with the same DRACO_URL used in useGLTF above
useGLTF.preload(MALE_GLB, DRACO_URL);
useGLTF.preload(FEMALE_GLB, DRACO_URL);
