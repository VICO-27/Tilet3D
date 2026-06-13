import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";
import { prepareAvatar } from "../../avatar/utils/avatarRig";
import type { Gender } from "../../avatar/types/avatar.types";

const MALE = "/models/maleAvatar.glb";
const FEMALE = "/models/femaleAvatar.glb";
useGLTF.preload(MALE);
useGLTF.preload(FEMALE);

function AvatarModel({ gender }: { gender: Gender }) {
  const url = gender === "male" ? MALE : FEMALE;
  const { scene } = useGLTF(url);

  const transform = useMemo(() => {
    // Face camera + A-pose once per cached scene.
    if (!scene.userData.posed) {
      prepareAvatar(scene, gender);
      scene.userData.posed = true;
    }
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    
    // FIXED: Reduced scale factor from 2.05 to 1.8 to fit head and feet perfectly within frame
    const scaleFactor = 1.8;
    const s = scaleFactor / (size.y || scaleFactor);
    
    return {
      scale: s,
      position: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene, gender]);

  return (
    <group scale={transform.scale} position={transform.position}>
      <primitive object={scene} />
    </group>
  );
}

function IdleRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.35; // continuous turntable
    ref.current.position.y = Math.sin(t * 1.4) * 0.03; // breathing
    ref.current.rotation.z = Math.sin(t * 0.8) * 0.02; // micro sway
  });
  return <group ref={ref}>{children}</group>;
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin-slow rounded-full border-2 border-plum-200 border-t-plum-600" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-plum-500">
          Loading
        </span>
      </div>
    </Html>
  );
}

const HeroModel = ({ gender }: { gender: Gender }) => {
  return (
    <Canvas
      camera={{ position: [0, 1.05, 3.4], fov: 34 }} // FIXED: Pulled camera slightly back (3.15 -> 3.4) for dynamic framing safety
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 7, 5]} intensity={2.4} color="#fff6ec" />
      <directionalLight position={[-5, 4, -3]} intensity={1.5} color="#b98cff" />
      <directionalLight position={[0, 2, 6]} intensity={0.6} />
      <spotLight position={[0, 8, 2]} angle={0.5} penumbra={1} intensity={1.1} />

      <Suspense fallback={<Loader />}>
        <IdleRig>
          <AvatarModel gender={gender} />
        </IdleRig>
        <ContactShadows position={[0, 0, 0]} opacity={0.42} scale={6} blur={2.6} far={4} color="#4c1d95" />
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