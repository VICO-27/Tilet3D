import React, { Suspense, useRef, useEffect } from 'react';
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
        const formHeight = size.height * 0.55;
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
  Environment,
  Preload,
} from '@react-three/drei';
import * as THREE from 'three';
import { CheckCircle2, AlertCircle, Ruler, Activity, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


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
      className={`absolute top-1/2 -translate-y-1/2 left-3 md:left-8 transition-all duration-1000 delay-300 pointer-events-none ${
        isConfirmed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
      }`}
    >
      <div className="bg-white/40 backdrop-blur-md md:backdrop-blur-xl border border-white/60 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-lg md:shadow-xl w-[84px] md:w-44">
        <div className="hidden md:flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#a21caf]" />
          <h3 className="text-[10px] font-bold tracking-widest text-[#161616] uppercase">Biometrics</h3>
        </div>
        <div className="space-y-2 md:space-y-3">
          <div>
            <p className="text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">Height</p>
            <p className="text-sm md:text-lg font-light text-[#161616]">{height} <span className="text-[9px] md:text-xs">cm</span></p>
          </div>
          <div className="w-full h-px bg-stone-200/60 md:bg-stone-200" />
          <div>
            <p className="text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">Weight</p>
            <p className="text-sm md:text-lg font-light text-[#161616]">{weight} <span className="text-[9px] md:text-xs">kg</span></p>
          </div>
          <div className="w-full h-px bg-stone-200/60 md:bg-stone-200" />
          <div>
            <p className="text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">Structure</p>
            <p className="text-sm md:text-base font-light text-[#161616] capitalize truncate">{body_type.replace('_', ' ')}</p>
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
      className={`absolute top-1/2 -translate-y-1/2 right-3 md:right-8 transition-all duration-1000 delay-300 pointer-events-none ${
        isConfirmed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
    >
      <div className="bg-white/40 backdrop-blur-md md:backdrop-blur-xl border border-white/60 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-lg md:shadow-xl w-[84px] md:w-44">
        <div className="hidden md:flex items-center gap-2 mb-4">
          <Ruler className="w-4 h-4 text-[#a21caf]" />
          <h3 className="text-[10px] font-bold tracking-widest text-[#161616] uppercase">Calibration</h3>
        </div>
        <div className="space-y-2 md:space-y-3">
          {[
            { label: 'Chest', value: chest },
            { label: 'Waist', value: waist },
            { label: 'Hips', value: hips },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col md:flex-row md:justify-between md:items-end">
              <p className="text-[9px] md:text-[10px] text-[#161616]/60 uppercase font-bold tracking-wider">{label}</p>
              <p className="text-sm md:text-lg font-light text-[#161616]">{value}<span className="text-[9px] md:hidden">cm</span><span className="hidden md:inline">cm</span></p>
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
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);
  return (
    <div
      className={`absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 ${
        isConfirmed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
    >
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
    <mesh ref={ref} position={[0, 0.9, 0]}>
      <torusGeometry args={[0.4, 0.02, 16, 100]} />
      <meshStandardMaterial color="#a21caf" emissive="#a21caf" emissiveIntensity={0.5} wireframe />
    </mesh>
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
// Top controls (Collections)
// ─────────────────────────────────────────────────────────────────────────────
function TopHUD() {
  const navigate = useNavigate();
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);

  return (
    <div
      className={`absolute top-20 md:top-24 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-500 z-10 ${
        isConfirmed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
      }`}
    >
      <button
        onClick={() => navigate('/products')}
        className="group flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 bg-plum-600 hover:bg-plum-700 backdrop-blur-xl text-white rounded-full text-xs font-semibold tracking-wide shadow-lg shadow-plum-600/30 transition-all duration-300 hover:scale-105"
      >
        <ShoppingBag size={14} className="text-white/80 group-hover:text-white transition-colors" />
        <span className="uppercase tracking-widest text-[10px] md:text-xs">Shop Collection</span>
        <ArrowRight size={14} className="ml-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AvatarViewer — the full-screen 3D studio
// ─────────────────────────────────────────────────────────────────────────────
export function AvatarViewer() {
  const setIsInteracting = useAvatarStore((s) => s.setIsInteracting);

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
        camera={{ position: [0, 3.5, 4.5], fov: 40 }}
        className="w-full h-full outline-none"
        gl={{ powerPreference: 'high-performance', antialias: true }}
        dpr={[1, 1.5]}
        onPointerDown={() => setIsInteracting(true)}
        onPointerUp={() => setIsInteracting(false)}
        onPointerLeave={() => setIsInteracting(false)}
      >
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
        <ambientLight intensity={0.6} color="#ffffff" />
        <spotLight
          position={[3, 7, 4]}
          angle={0.5}
          penumbra={1}
          intensity={2.5}
          castShadow
          shadow-bias={-0.0001}
          color="#ffffff"
        />
        <spotLight
          position={[-5, 5, -5]}
          angle={0.5}
          penumbra={1}
          intensity={1.5}
          color="#e0e7ff"
        />
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

      <TopHUD />
      <LeftHUD />
      <RightHUD />
      <BottomControls />
    </div>
  );
}
