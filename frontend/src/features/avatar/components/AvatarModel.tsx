import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useAvatarStore } from '../store/useAvatarStore';
import { prepareAvatar, applySkinTone } from '../utils/avatarRig';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

const SKIN_COLORS: Record<string, string> = {
  fair: '#fdf0ea', light: '#f1c27d', medium: '#b18a66',
  tan: '#8d5524', rich: '#5c3816', deep: '#2d1606'
};

const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};

// ADDED: The missing DRACO_URL that matches main.tsx and HeroModel.tsx
const DRACO_URL = "https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/";

export const AvatarModel = () => {
  const gender = useAvatarStore((s) => s.gender);
  const height = useAvatarStore((s) => s.height);
  const weight = useAvatarStore((s) => s.weight);
  const skin_tone = useAvatarStore((s) => s.skin_tone);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);
  const isInteracting = useAvatarStore((s) => s.isInteracting);
  
  const modelPath = gender === 'male' ? '/models/maleAvatar.glb' : '/models/femaleAvatar.glb';
  
  // ADDED: Passing the DRACO_URL into the hook to prevent the double-load crash
  const { scene, animations } = useGLTF(modelPath, DRACO_URL);
  
  const clonedScene = useMemo(() => {
    return scene ? SkeletonUtils.clone(scene) : new THREE.Group();
  }, [scene]);
  
  const group = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (clonedScene) prepareAvatar(clonedScene);
  }, [clonedScene]);

  useEffect(() => {
    if (clonedScene) applySkinTone(clonedScene, SKIN_COLORS[skin_tone] || SKIN_COLORS.medium);
  }, [skin_tone, clonedScene]);

  useEffect(() => {
    const getAction = (keyword: string) => {
      const name = names.find(n => n.toLowerCase().includes(keyword));
      return name ? actions[name] : null;
    };

    const idleAnim = getAction('idle') || actions[names[0]];
    const walkAnim = getAction('walk') || actions[names[1]] || idleAnim;
    const activeAnim = currentAnimation === 'walk' ? walkAnim : idleAnim;

    if (activeAnim) {
      Object.values(actions).forEach(a => a?.fadeOut(0.5));
      activeAnim.reset().fadeIn(0.5).play();
    }
  }, [currentAnimation, actions, names]);

  useFrame(() => {
    if (group.current) {
      const safeHeight = (typeof height === 'number' && Number.isFinite(height) && height > 0) ? height : 170;
      const safeWeight = (typeof weight === 'number' && Number.isFinite(weight) && weight > 0) ? weight : 70;

      const rawScaleY = safeHeight / 170;
      const rawScaleXZ = 0.85 + (safeWeight / 120);

      const scaleY = clamp(Number.isFinite(rawScaleY) ? rawScaleY : 1, 0.4, 2.5);
      const scaleXZ = clamp(Number.isFinite(rawScaleXZ) ? rawScaleXZ : 1, 0.4, 2.5);

      group.current.scale.set(scaleXZ, scaleY, scaleXZ);
      
      if (currentAnimation === 'spin') {
        group.current.rotation.y += 0.02; 
      } else if (currentAnimation === 'idle' && !isInteracting) {
        group.current.rotation.y += 0.0015; 
      }
    }
  });

  return (
    <group ref={group}>
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
};

// ADDED: Preloads MUST have the DRACO_URL too!
useGLTF.preload('/models/maleAvatar.glb', DRACO_URL);
useGLTF.preload('/models/femaleAvatar.glb', DRACO_URL);