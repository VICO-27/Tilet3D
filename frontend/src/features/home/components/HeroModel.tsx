import { Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows, Preload } from "@react-three/drei";
import * as THREE from "three";
import { prepareAvatar } from "../../avatar/utils/avatarRig";
import type { Gender } from "../../avatar/types/avatar.types";

const MALE = "/models/maleAvatar.glb";
const FEMALE = "/models/femaleAvatar.glb";
const DRACO_URL = "https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/";

useGLTF.preload(MALE, DRACO_URL);
useGLTF.preload(FEMALE, DRACO_URL);

function ResponsiveCamera() {
  const { camera, size } = useThree();
  
  useEffect(() => {
    // If screen is narrow (mobile), pull the camera back so the avatar isn't huge/cut-off
    const aspect = size.width / size.height;
    if (aspect < 0.75) {
      // Mobile portrait
      camera.position.set(0, 1.1, 5.5);
    } else if (aspect < 1.2) {
      // Tablet / small square
      camera.position.set(0, 1.05, 4.2);
    } else {
      // Desktop
      camera.position.set(0, 1.05, 3.4);
    }
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

// Use a WeakSet to track posed scenes safely without violating React immutability linter rules
const posedScenes = new WeakSet<THREE.Group>();

function AssetManager({ onReady }: { onReady: () => void }) {
  useGLTF(MALE, DRACO_URL);
  useGLTF(FEMALE, DRACO_URL);

  useEffect(() => {
    const timer = setTimeout(onReady, 250);
    return () => clearTimeout(timer);
  }, [onReady]);

  return null;
}

function AvatarModel({ gender, active }: { gender: Gender; active: boolean }) {
  const { scene } = useGLTF(gender === "male" ? MALE : FEMALE, DRACO_URL);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!posedScenes.has(scene)) {
      prepareAvatar(scene);
      posedScenes.add(scene);
    }
  }, [scene]);

  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const scaleFactor = 1.6;
    const s = scaleFactor / (size.y || scaleFactor);

    return {
      scale: s,
      position: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene]);

  // Apple-grade butter-smooth scale and opacity dissolve transition
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = active ? transform.scale : 0.001;
    const targetY = active ? transform.position[1] : transform.position[1] - 0.1;

    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 7);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 7);
  });

  return (
    <group ref={groupRef} position={transform.position} scale={0.001} visible={active}>
      <primitive object={scene} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IdleRig — drives the ambient continuous rotation + breathing of the hero.
//
// Motion design:
//   • Slow continuous rotation: ~0.285 rad/s ≈ 22 s per full revolution.
//   • Speed varies subtly: ±15% modulation via sin() so it doesn't feel
//     mechanical. This reads as more alive without being distracting.
//   • Gentle vertical bob (unchanged from original).
//   • Micro breathing scale pulse (±0.5%) for premium "alive" feel.
//
// Performance:
//   • Paused via IntersectionObserver when the Canvas is not in viewport.
//   • Paused when document is backgrounded (visibilitychange).
//   • Delta-time driven — frame-rate independent at any refresh rate.
// ─────────────────────────────────────────────────────────────────────────────
function IdleRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const isPausedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Set up pause signals: IntersectionObserver + page visibility.
  useEffect(() => {
    // Find the Canvas element (nearest ancestor canvas from the group ref's DOM).
    // R3F mounts the canvas as a sibling of the group's DOM parent.
    const canvas = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
    canvasRef.current = canvas;

    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let observer: IntersectionObserver | null = null;
    if (canvas) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isPausedRef.current = !entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      observer.observe(canvas);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      observer?.disconnect();
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current || isPausedRef.current) return;
    const t = state.clock.elapsedTime;

    // Slow continuous rotation with ±15% speed modulation for organic feel.
    // Base speed 0.285 rad/s ≈ 1 revolution per 22 seconds.
    const speed = 0.285 * (1 + 0.15 * Math.sin(t * 0.4));
    ref.current.rotation.y += speed * delta;

    // Gentle vertical bob — unchanged from original.
    ref.current.position.y = Math.sin(t * 1.0) * 0.02;

    // Micro breathing scale pulse (±0.5%) — subtle premium "alive" effect.
    const breathe = 1 + 0.005 * Math.sin(t * 0.7);
    ref.current.scale.setScalar(breathe);
  });

  return <group ref={ref}>{children}</group>;
}

const HeroModel = ({ gender, onReady }: { gender: Gender; onReady: () => void }) => {
  return (
    <Canvas
      id="hero-canvas"
      camera={{ position: [0, 1.05, 3.4], fov: 32 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2)]}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <ambientLight intensity={0.9} color="#fafaf9" />
      <directionalLight position={[4, 8, 5]} intensity={2.2} color="#fff8f0" />
      <directionalLight position={[-4, 5, -3]} intensity={1.3} color="#d8b4fe" />
      <spotLight position={[0, 9, 3]} angle={0.4} penumbra={1} intensity={1.1} color="#ffffff" />
      <ResponsiveCamera />

      <Suspense fallback={null}>
        <AssetManager onReady={onReady} />
        <IdleRig>
          <AvatarModel gender="female" active={gender === "female"} />
          <AvatarModel gender="male" active={gender === "male"} />
        </IdleRig>
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.3}
          scale={5.5}
          blur={3.0}
          far={3.5}
          color="#3b0764"
        />
        <Preload all />
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, 0.95, 0]}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.4}
        minPolarAngle={Math.PI * 0.42}
        maxPolarAngle={Math.PI * 0.56}
      />
    </Canvas>
  );
};

export default HeroModel;