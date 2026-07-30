import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarModel } from './AvatarModel';
import { AvatarControls } from './AvatarControls';
import { useAvatarStore } from '../store/useAvatarStore';
import { CheckCircle2, AlertCircle, Ruler, Activity } from 'lucide-react';

const NotificationToast = () => {
  const { notification, notificationType } = useAvatarStore();
  return (
    <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${notification ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl text-white ${notificationType === 'error' ? 'bg-red-900' : 'bg-stone-900'}`}>
        {notificationType === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        <span className="text-sm font-medium tracking-wide">{notification}</span>
      </div>
    </div>
  );
};

const LeftHUD = () => {
  const { isConfirmed, height, weight, body_type } = useAvatarStore();
  return (
    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 left-8 transition-all duration-1000 delay-300 ${isConfirmed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-xl w-56">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-plum-600" />
          <h3 className="text-xs font-bold tracking-widest text-ink uppercase">Biometrics</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-ink/50 uppercase font-bold tracking-wider">Height</p>
            <p className="text-xl font-light text-ink">{height} <span className="text-sm">cm</span></p>
          </div>
          <div className="w-full h-px bg-stone-200" />
          <div>
            <p className="text-[10px] text-ink/50 uppercase font-bold tracking-wider">Weight</p>
            <p className="text-xl font-light text-ink">{weight} <span className="text-sm">kg</span></p>
          </div>
          <div className="w-full h-px bg-stone-200" />
          <div>
            <p className="text-[10px] text-ink/50 uppercase font-bold tracking-wider">Structure</p>
            <p className="text-lg font-light text-ink capitalize">{body_type.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RightHUD = () => {
  const { isConfirmed, chest, waist, hips } = useAvatarStore();
  return (
    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 right-8 transition-all duration-1000 delay-300 ${isConfirmed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-xl w-56">
        <div className="flex items-center gap-2 mb-6">
          <Ruler className="w-4 h-4 text-plum-600" />
          <h3 className="text-xs font-bold tracking-widest text-ink uppercase">Calibration</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <p className="text-xs text-ink/60 uppercase font-bold tracking-wider">Chest</p>
            <p className="text-lg font-light text-ink">{chest}cm</p>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-xs text-ink/60 uppercase font-bold tracking-wider">Waist</p>
            <p className="text-lg font-light text-ink">{waist}cm</p>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-xs text-ink/60 uppercase font-bold tracking-wider">Hips</p>
            <p className="text-lg font-light text-ink">{hips}cm</p>
          </div>
          <div className="pt-4 mt-4 border-t border-stone-200">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Couture Match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BottomControls = () => {
  const isConfirmed = useAvatarStore(state => state.isConfirmed);
  return (
    <div className={`absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 transition-all duration-700 delay-300 w-[90%] md:w-auto flex justify-center ${isConfirmed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
      <AvatarControls />
    </div>
  );
};

const StudioSkeleton = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 2;
  });
  return (
    <mesh ref={meshRef} position={[0, 0.8, 0]}>
      <torusGeometry args={[0.4, 0.02, 16, 100]} />
      <meshStandardMaterial color="#a21caf" emissive="#a21caf" emissiveIntensity={0.5} wireframe />
    </mesh>
  );
};

const StudioScene = () => {
  const isConfirmed = useAvatarStore((state) => state.isConfirmed);
  const groupRef = useRef<THREE.Group>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetX = isConfirmed || isMobile ? 0 : -1.2;
      
      // FIXED: damp is mathematically safe. It will never shoot the avatar off-screen.
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 5, delta);
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, -0.01, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[1.4, 1.5, 0.04, 64]} />
          <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.02, 0]} receiveShadow>
          <cylinderGeometry args={[1.55, 1.55, 0.01, 64]} />
          <meshStandardMaterial color="#e5e5ea" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      <Suspense fallback={<StudioSkeleton />}>
        <AvatarModel />
      </Suspense>
      
      <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={8} blur={2.5} far={2} resolution={1024} color="#000000" />
    </group>
  );
};

export const AvatarViewer = () => {
  const setIsInteracting = useAvatarStore(state => state.setIsInteracting);

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#f8f8f9] to-[#e8e8ed]">
      
      <NotificationToast />

      <Canvas 
        shadows 
        camera={{ position: [0, 3.5, 4.5], fov: 32 }} 
        className="w-full h-full outline-none"
        onPointerDown={() => setIsInteracting(true)}
        onPointerUp={() => setIsInteracting(false)}
        onPointerLeave={() => setIsInteracting(false)}
      >
        <Environment preset="city" />
        <ambientLight intensity={0.6} color="#ffffff" />
        <spotLight position={[3, 7, 4]} angle={0.5} penumbra={1} intensity={2.5} castShadow shadow-bias={-0.0001} color="#ffffff" />
        <spotLight position={[-5, 5, -5]} angle={0.5} penumbra={1} intensity={1.5} color="#e0e7ff" />
        
        <StudioScene />

        <OrbitControls 
          enablePan={false} 
          minDistance={2.5} 
          maxDistance={7} 
          target={[0, 0.9, 0]} 
          maxPolarAngle={Math.PI / 2} 
          autoRotate={false}           
          makeDefault
        />
        <Preload all />
      </Canvas>

      <LeftHUD />
      <RightHUD />
      <BottomControls />
      
    </div>
  );
};