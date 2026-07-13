import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows, Html, Preload } from "@react-three/drei";
import * as THREE from "three";
import { prepareAvatar } from "../../avatar/utils/avatarRig";
import type { Gender } from "../../avatar/types/avatar.types";

const MALE = "/models/maleAvatar.glb";
const FEMALE = "/models/femaleAvatar.glb";

// Draco Decoder CDN - This is the key to ultra-fast 3D loading
const DRACO_URL = "https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/";

// Preload both with Draco enabled
useGLTF.preload(MALE, DRACO_URL);
useGLTF.preload(FEMALE, DRACO_URL);

function AvatarModel({ gender, active }: { gender: Gender; active: boolean }) {
  // We load the scene. useGLTF handles caching automatically.
  const { scene } = useGLTF(gender === "male" ? MALE : FEMALE, DRACO_URL);

  const transform = useMemo(() => {
    // Clone the scene so we don't conflict with other instances if needed, 
    // but prepareAvatar once per unique scene reference.
    if (!scene.userData.posed) {
      prepareAvatar(scene, gender);
      scene.userData.posed = true;
    }
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    
    const scaleFactor = 1.8;
    const s = scaleFactor / (size.y || scaleFactor);
    
    return {
      scale: s,
      position: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene, gender]);

  // Toggle visibility instead of unmounting to keep the model in GPU memory
  return (
    <group 
      scale={transform.scale} 
      position={transform.position} 
      visible={active}
    >
      <primitive object={scene} />
    </group>
  );
}

function IdleRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.35;
    ref.current.position.y = Math.sin(t * 1.4) * 0.03;
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.02;
  });
  return <group ref={ref}>{children}</group>;
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin-slow rounded-full border-2 border-plum-200 border-t-plum-600" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-plum-500">
          Syncing 3D
        </span>
      </div>
    </Html>
  );
}

const HeroModel = ({ gender }: { gender: Gender }) => {
  return (
    <Canvas
      camera={{ position: [0, 1.05, 3.4], fov: 34 }}
      gl={{ 
        alpha: true, 
        antialias: true, 
        powerPreference: "high-performance",
        preserveDrawingBuffer: false // Optimization for memory
      }}
      dpr={[1, 1.5]} // Performance: limit resolution on high-dpi screens
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 7, 5]} intensity={2.4} color="#fff6ec" />
      <directionalLight position={[-5, 4, -3]} intensity={1.5} color="#b98cff" />
      <spotLight position={[0, 8, 2]} angle={0.5} penumbra={1} intensity={1.1} />

      <Suspense fallback={<Loader />}>
        <IdleRig>
          {/* 
             OPTIMIZATION: We render BOTH models immediately. 
             Only one is 'visible'. This keeps both loaded in the GPU
             so the switch is instant after the first load.
          */}
          <AvatarModel gender="female" active={gender === "female"} />
          <AvatarModel gender="male" active={gender === "male"} />
        </IdleRig>
        
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.4} 
          scale={6} 
          blur={2.5} 
          far={4} 
          color="#4c1d95" 
        />
        {/* Preload assets into the cache as soon as the canvas starts */}
        <Preload all />
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, 0.95, 0]}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI * 0.4}
        maxPolarAngle={Math.PI * 0.58}
      />
    </Canvas>
  );
};

export default HeroModel;