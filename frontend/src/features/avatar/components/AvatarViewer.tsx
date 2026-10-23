import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

function ResponsiveCamera() {
  const { camera, size } = useThree();
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);
  
  // Store target offset
  const targetOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const aspect = size.width / size.height;
    if (aspect < 0.75) {
      // Mobile portrait
      camera.position.set(0, 3.5, 6.5);
    } else if (aspect < 1.2) {
      // Tablet
      camera.position.set(0, 3.5, 5.5);
    } else {
      // Desktop
      camera.position.set(0, 3.5, 4.5);
    }
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useEffect(() => {
    if (!isConfirmed) {
      if (size.width > 768) {
        const formWidth = Math.max(400, size.width * 0.35);
        targetOffset.current = { x: formWidth / 2, y: 0 };
      } else {
        const formHeight = size.height * 0.60;
        targetOffset.current = { x: 0, y: -formHeight / 2 };
      }
    } else {
      targetOffset.current = { x: 0, y: 0 };
    }
  }, [isConfirmed, size]);

  useFrame((_, dt) => {
    const currentX = camera.view?.offsetX || 0;
    const currentY = camera.view?.offsetY || 0;
    
    // Safety clamp dt to avoid unstable extrapolation if tab was backgrounded
    const t = Math.min(dt * 4, 1);
    const newX = THREE.MathUtils.lerp(currentX, targetOffset.current.x, t);
    const newY = THREE.MathUtils.lerp(currentY, targetOffset.current.y, t);

    const diffX = Math.abs(newX - targetOffset.current.x);
    const diffY = Math.abs(newY - targetOffset.current.y);

    if (diffX > 0.5 || diffY > 0.5) {
      camera.setViewOffset(size.width, size.height, newX, newY, size.width, size.height);
      camera.updateProjectionMatrix();
    } else if (camera.view?.offsetX !== targetOffset.current.x || camera.view?.offsetY !== targetOffset.current.y) {
      // Snap to exact target when close
      if (targetOffset.current.x === 0 && targetOffset.current.y === 0 && isConfirmed) {
        camera.clearViewOffset();
      } else {
        camera.setViewOffset(size.width, size.height, targetOffset.current.x, targetOffset.current.y, size.width, size.height);
      }
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
import {
  OrbitControls,
  ContactShadows,
  Preload,
} from '@react-three/drei';
import * as THREE from 'three';
import { CheckCircle2, AlertCircle, Ruler, Activity } from 'lucide-react';


import { AvatarModel } from './AvatarModel';
import { AvatarControls } from './AvatarControls';
import { useAvatarStore } from '../store/useAvatarStore';

// ─────────────────────────────────────────────────────────────────────────────
// Notification toast
// ─────────────────────────────────────────────────────────────────────────────
function NotificationToast() {
  const notification = useAvatarStore((s) => s.notification);
  const notificationType = useAvatarStore((s) => s.notificationType);

  return (
    <div
      className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out pointer-events-none ${
        notification ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl text-white text-sm font-medium tracking-wide ${
          notificationType === 'error' ? 'bg-red-900' : 'bg-stone-900'
        }`}
      >
        {notificationType === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        {notification}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left HUD (biometrics)
// ─────────────────────────────────────────────────────────────────────────────
function LeftHUD() {
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);
  const height = useAvatarStore((s) => s.height);
  const weight = useAvatarStore((s) => s.weight);
  const body_type = useAvatarStore((s) => s.body_type);

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 left-1.5 sm:left-3 md:left-8 transition-all duration-1000 delay-300 pointer-events-none ${
        isConfirmed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`}
    >
      <div className="bg-white/45 backdrop-blur-md md:backdrop-blur-xl border border-white/60 p-1.5 sm:p-2 md:p-4 rounded-xl md:rounded-3xl shadow-md md:shadow-xl w-[50px] sm:w-[62px] md:w-44 text-center md:text-left">
        <div className="hidden md:flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#a21caf]" />
          <h3 className="text-[10px] font-bold tracking-widest text-[#161616] uppercase">Biometrics</h3>
        </div>
        <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
          <div>
            <p className="text-[7.5px] sm:text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">Height</p>
            <p className="text-[11px] sm:text-sm md:text-lg font-light text-[#161616] leading-none mt-0.5">
              {height}<span className="text-[7.5px] sm:text-[9px] md:text-xs text-stone-500 ml-0.5">cm</span>
            </p>
          </div>
          <div className="w-full h-px bg-stone-200/60 md:bg-stone-200" />
          <div>
            <p className="text-[7.5px] sm:text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">Weight</p>
            <p className="text-[11px] sm:text-sm md:text-lg font-light text-[#161616] leading-none mt-0.5">
              {weight}<span className="text-[7.5px] sm:text-[9px] md:text-xs text-stone-500 ml-0.5">kg</span>
            </p>
          </div>
          <div className="w-full h-px bg-stone-200/60 md:bg-stone-200" />
          <div>
            <p className="text-[7.5px] sm:text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">
              <span className="md:hidden">Body</span>
              <span className="hidden md:inline">Structure</span>
            </p>
            <p className="text-[9.5px] sm:text-xs md:text-base font-light text-[#161616] capitalize truncate leading-none mt-0.5">
              {body_type.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Right HUD (tailoring measurements)
// ─────────────────────────────────────────────────────────────────────────────
function RightHUD() {
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);
  const chest = useAvatarStore((s) => s.chest);
  const waist = useAvatarStore((s) => s.waist);
  const hips = useAvatarStore((s) => s.hips);

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 right-1.5 sm:right-3 md:right-8 transition-all duration-1000 delay-300 pointer-events-none ${
        isConfirmed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      <div className="bg-white/45 backdrop-blur-md md:backdrop-blur-xl border border-white/60 p-1.5 sm:p-2 md:p-4 rounded-xl md:rounded-3xl shadow-md md:shadow-xl w-[50px] sm:w-[62px] md:w-44 text-center md:text-left">
        <div className="hidden md:flex items-center gap-2 mb-4">
          <Ruler className="w-4 h-4 text-[#a21caf]" />
          <h3 className="text-[10px] font-bold tracking-widest text-[#161616] uppercase">Calibration</h3>
        </div>
        <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
          {[
            { label: 'Chest', value: chest },
            { label: 'Waist', value: waist },
            { label: 'Hips', value: hips },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col md:flex-row md:justify-between md:items-end">
              <p className="text-[7.5px] sm:text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">{label}</p>
              <p className="text-[11px] sm:text-sm md:text-lg font-light text-[#161616] leading-none mt-0.5">
                {value}<span className="text-[7.5px] sm:text-[9px] md:text-xs text-stone-500 ml-0.5">cm</span>
              </p>
            </div>
          ))}
          <div className="hidden md:block pt-4 mt-2 border-t border-stone-200">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Couture Match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom controls bar
// ─────────────────────────────────────────────────────────────────────────────
function BottomControls() {
  return (
    <div className="absolute bottom-[max(1.75rem,calc(env(safe-area-inset-bottom)+1rem))] md:bottom-10 left-1/2 -translate-x-1/2 z-20 transition-all duration-500">
      <AvatarControls />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading spinner shown inside Canvas while the GLB loads
// ─────────────────────────────────────────────────────────────────────────────
function StudioSkeleton() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 2;
  });
  return (
    <group position={[0, 0.9, 0]}>
      <mesh ref={ref}>
        <torusGeometry args={[0.45, 0.015, 16, 100]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.6} wireframe />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Studio pedestal + avatar — always centred at x=0.
// The calibration form is a CSS overlay; it never moves the 3D scene.
// Translating the group to x=-1.2 caused everything to slide outside the
// narrow 32° FOV frustum (±1.29 units wide) → Three.js culled it all.
// ─────────────────────────────────────────────────────────────────────────────
function StudioScene() {
  return (
    <group>
      {/* Premium platform */}
      <group position={[0, -0.01, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[1.4, 1.5, 0.04, 64]} />
          <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.025, 0]} receiveShadow>
          <cylinderGeometry args={[1.55, 1.55, 0.01, 64]} />
          <meshStandardMaterial color="#e5e5ea" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      <Suspense fallback={<StudioSkeleton />}>
        <AvatarModel />
      </Suspense>

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.6}
        scale={8}
        blur={2.5}
        far={2}
        resolution={512}
        color="#000000"
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AvatarViewer — the full-screen 3D studio
// ─────────────────────────────────────────────────────────────────────────────
export function AvatarViewer() {
  const setIsInteracting = useAvatarStore((s) => s.setIsInteracting);
  const [isTabVisible, setIsTabVisible] = useState(() => (typeof document !== 'undefined' ? !document.hidden : true));

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#f8f8f9] to-[#e8e8ed]">

      <NotificationToast />

      {/*
        FIX: This is the ONLY Canvas in the avatar route.
        HeroModel (home page) has its own Canvas that is unmounted when
        we navigate here via React Router — no concurrent renderers.
      */}
      <Canvas
        id="avatar-canvas"
        shadows
        frameloop={isTabVisible ? 'always' : 'never'}
        camera={{ position: [0, 3.5, 4.5], fov: 40 }}
        className="w-full h-full outline-none"
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 2, 2)]}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        onPointerDown={() => setIsInteracting(true)}
        onPointerUp={() => setIsInteracting(false)}
        onPointerLeave={() => setIsInteracting(false)}
      >
        {/* Balanced Studio Lighting — illuminates evenly with natural skin warmth from frame 0 */}
        <ambientLight intensity={1.15} color="#ffffff" />
        <directionalLight
          position={[3.5, 5.5, 4.5]}
          intensity={1.65}
          color="#fffaf2"
          castShadow
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-3.5, 5.0, 4.2]} intensity={1.5} color="#fff7ed" />
        <directionalLight position={[0, 1.6, 4.0]} intensity={0.85} color="#ffffff" />
        <directionalLight position={[0, 6.0, -3.5]} intensity={0.8} color="#faf5ff" />
        <spotLight position={[0, 8, 2.5]} angle={0.5} penumbra={1} intensity={0.8} color="#ffffff" />

        <ResponsiveCamera />

        <StudioScene />

        <OrbitControls
          enablePan={false}
          minDistance={2.5}
          maxDistance={7}
          target={[0, 0.9, 0]}
          maxPolarAngle={Math.PI / 2}
          makeDefault
        />
        <Preload all />
      </Canvas>

      <LeftHUD />
      <RightHUD />
      <BottomControls />
    </div>
  );
}
