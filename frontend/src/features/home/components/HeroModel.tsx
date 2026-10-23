import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { prepareAvatar, applyNaturalSkinWarmth } from "../../avatar/utils/avatarRig";
import type { Gender } from "../../avatar/types/avatar.types";

const MALE = "/models/maleAvatar.glb";
const FEMALE = "/models/femaleAvatar.glb";
const DRACO_URL = "/draco/";

// Enable Three.js file-level caching across loaders
THREE.Cache.enabled = true;

// Preload both hero 3D models and Draco decoder immediately on script evaluation
if (typeof window !== "undefined") {
  useGLTF.preload(FEMALE, DRACO_URL);
  useGLTF.preload(MALE, DRACO_URL);
}

// Reusable math singletons to guarantee 0 GC allocation in 60fps render loop
const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const _offsetQuat = new THREE.Quaternion();

export interface PointerTracker {
  x: number;
  y: number;
  active: boolean;
}

export interface HeroModelProps {
  gender: Gender;
  direction?: -1 | 1;
  isInView?: boolean;
  reducedMotion?: boolean;
  pointerRef?: { current: PointerTracker };
  rotateRef?: React.MutableRefObject<number>;
  onReady?: () => void;
  onInteractionChange?: (isInteracting: boolean) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export function preloadGender(gender: Gender) {
  useGLTF.preload(gender === "male" ? MALE : FEMALE, DRACO_URL);
}

function ResponsiveCamera() {
  const { camera, size, controls } = useThree();
  
  useEffect(() => {
    // Determine screen aspect and form factor
    const aspect = size.width / size.height;
    const isMobile = (typeof window !== "undefined" && window.innerWidth < 768) || aspect < 0.85;

    if (aspect < 0.6) {
      // Ultra-narrow phone (e.g. 20:9 / 20.5:9 Tecno, Infinix, Xperia)
      camera.position.set(0, 0.92, 4.9);
    } else if (isMobile) {
      // Standard mobile portrait (e.g. iPhone, Galaxy) - moved up slightly for mobile
      camera.position.set(0, 0.94, 4.6);
    } else if (aspect < 1.15) {
      // Tablet / square viewports
      camera.position.set(0, 0.98, 4.1);
    } else {
      // Desktop widescreen
      camera.position.set(0, 1.02, 3.4);
    }
    camera.updateProjectionMatrix();
    if (controls && 'target' in controls && (controls as any).target) {
      (controls as any).target.set(0, isMobile ? 0.94 : 0.95, 0);
    }
    if (controls && 'update' in controls && typeof (controls as { update?: () => void }).update === 'function') {
      (controls as { update: () => void }).update();
    }
  }, [camera, size, controls]);

  return null;
}

function TurntableGroup({
  children,
  isUserInteracting,
  rotateRef,
  isMobile,
  reducedMotion = false,
}: {
  children: React.ReactNode;
  isUserInteracting: boolean;
  rotateRef?: React.MutableRefObject<number>;
  isMobile: boolean;
  reducedMotion?: boolean;
}) {
  const spinGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!spinGroupRef.current) return;
    const safeDelta = Math.min(delta, 0.05);

    // 1. Mobile touch manual swipe rotation
    if (rotateRef && rotateRef.current !== 0) {
      spinGroupRef.current.rotation.y += rotateRef.current * 1.5;
      rotateRef.current = 0;
      return;
    }

    // 2. Continuous slow 360° circular spin when idle (desktop & mobile)
    if (!isUserInteracting && !reducedMotion) {
      spinGroupRef.current.rotation.y += 0.40 * safeDelta;
    }
  });

  return (
    <group 
      ref={spinGroupRef} 
      position={[0, isMobile ? 0.12 : 0, 0]}
    >
      {children}
    </group>
  );
}

interface MaleBones {
  spine1: THREE.Bone | null;
  spine2: THREE.Bone | null;
  neck: THREE.Bone | null;
  head: THREE.Bone | null;
  leftShoulder: THREE.Bone | null;
  rightShoulder: THREE.Bone | null;
}

// Use a WeakSet to track posed scenes safely without violating React immutability linter rules
const posedScenes = new WeakSet<THREE.Group>();

function AvatarModel({ 
  gender, 
  active, 
  direction = 1,
  reducedMotion = false,
  pointerRef,
  isUserInteracting = false,
  onRendered 
}: { 
  gender: Gender; 
  active: boolean; 
  direction?: -1 | 1;
  reducedMotion?: boolean;
  pointerRef?: { current: PointerTracker };
  isUserInteracting?: boolean;
  onRendered?: () => void 
}) {
  const { scene } = useGLTF(gender === "male" ? MALE : FEMALE, DRACO_URL);
  const { gl, camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const reportedRef = useRef(false);
  const materialsRef = useRef<THREE.Material[]>([]);

  // Damped pointer coordinates ref to avoid any React re-renders or allocations
  const smoothedPointerRef = useRef({ x: 0, y: 0 });



  // Continuous progress tracking: 1 when active, 0 when inactive
  const progressRef = useRef(active ? 1 : 0);

  // Direction captured at transition initiation to keep trajectory invariant throughout motion
  const activeDirectionRef = useRef<-1 | 1>(direction);
  const prevActiveRef = useRef(active);


  // Locate Mixamo upper-body articulation bones (male avatar)
  const bones = useMemo<MaleBones | null>(() => {
    if (gender !== "male") return null;
    let spine1: THREE.Bone | null = null;
    let spine2: THREE.Bone | null = null;
    let neck: THREE.Bone | null = null;
    let head: THREE.Bone | null = null;
    let leftShoulder: THREE.Bone | null = null;
    let rightShoulder: THREE.Bone | null = null;

    scene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        switch (child.name) {
          case "mixamorig_Spine1_03":
            spine1 = child;
            break;
          case "mixamorig_Spine2_04":
            spine2 = child;
            break;
          case "mixamorig_Neck_05":
            neck = child;
            break;
          case "mixamorig_Head_06":
            head = child;
            break;
          case "mixamorig_LeftShoulder_010":
            leftShoulder = child;
            break;
          case "mixamorig_RightShoulder_034":
            rightShoulder = child;
            break;
        }
      }
    });

    return { spine1, spine2, neck, head, leftShoulder, rightShoulder };
  }, [scene, gender]);

  // Capture baseline rest quaternions once to prevent cumulative transform drift
  const restQuatsRef = useRef<Map<THREE.Bone, THREE.Quaternion>>(new Map());
  useEffect(() => {
    if (bones) {
      const map = restQuatsRef.current;
      map.clear();
      const list = [
        bones.spine1,
        bones.spine2,
        bones.neck,
        bones.head,
        bones.leftShoulder,
        bones.rightShoulder,
      ];
      for (const bone of list) {
        if (bone) {
          map.set(bone, bone.quaternion.clone());
        }
      }
    }
  }, [bones]);

  useEffect(() => {
    if (!posedScenes.has(scene)) {
      prepareAvatar(scene);
      applyNaturalSkinWarmth(scene);
      posedScenes.add(scene);

      // Pre-compile shaders on the GPU to eliminate first-switch frame drop
      try {
        gl.compile(scene, camera);
      } catch {
        // Fallback for headless/mock environments
      }
    }

    // Collect all cloned materials for this avatar
    const mats = new Set<THREE.Material>();
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => mats.add(m));
        } else if (child.material) {
          mats.add(child.material);
        }
      }
    });
    materialsRef.current = Array.from(mats);
  }, [scene, gl, camera]);

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

  // Set initial visibility on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.visible = active;
    }
  }, [active]);

  useEffect(() => {
    if (active !== prevActiveRef.current) {
      prevActiveRef.current = active;
      activeDirectionRef.current = direction;
      // Pre-position incoming avatar at offstage starting point immediately
      if (active && groupRef.current && !reducedMotion) {
        const startX = transform.position[0] + direction * 1.8;
        const startZ = transform.position[2] - 0.4;
        groupRef.current.position.set(startX, transform.position[1], startZ);
        groupRef.current.rotation.set(0, direction * 0.25, 0);
        groupRef.current.visible = true;
      }
    }
  }, [active, direction, reducedMotion, transform]);

  // Combined render loop: cinematic transition cross-dissolve + grounded natural breathing
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Guard against large delta spikes on tab re-activation or GC hitches (capped to 50ms)
    const safeDelta = Math.min(delta, 0.05);

    const target = active ? 1 : 0;
    const current = progressRef.current;

    if (current !== target) {
      // 400ms duration for high-fashion runway motion (safeDelta * 2.5 => ~0.4s)
      const step = safeDelta * 2.5;
      if (active) {
        progressRef.current = Math.min(1, current + step);
      } else {
        progressRef.current = Math.max(0, current - step);
      }
    }

    const p = progressRef.current;

    // Visibility culling: completely hide fully exited models to save draw calls
    if (p <= 0.0001) {
      if (groupRef.current && groupRef.current.visible) {
        groupRef.current.visible = false;

        // Cleanly restore bones to baseline rest pose when hidden
        if (gender === "male" && bones) {
          const restMap = restQuatsRef.current;
          const list = [
            bones.spine1,
            bones.spine2,
            bones.neck,
            bones.head,
            bones.leftShoulder,
            bones.rightShoulder,
          ];
          for (const bone of list) {
            if (bone) {
              const rest = restMap.get(bone);
              if (rest) bone.quaternion.copy(rest);
            }
          }
        }
        groupRef.current.position.set(transform.position[0], transform.position[1], transform.position[2]);
        groupRef.current.rotation.set(0, 0, 0);
        groupRef.current.scale.set(transform.scale, transform.scale, transform.scale);
      }
      return;
    } else {
      if (groupRef.current && !groupRef.current.visible) {
        groupRef.current.visible = true;
      }
    }

    groupRef.current.renderOrder = active ? 1 : 0;

    // Cubic ease-in-out curve for runway motion
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

    // ─── 3D Directional Runway Slide Dynamics ──────────────────────────
    // Models stay 100% solid and opaque (no material transparency sorting glitches)
    const slideProgress = 1 - eased;
    const dirSign = active ? 1 : -1;
    const slideX = reducedMotion ? 0 : dirSign * activeDirectionRef.current * slideProgress * 1.8;
    const slideZ = reducedMotion ? 0 : -slideProgress * 0.4;
    const turnY = reducedMotion ? 0 : dirSign * activeDirectionRef.current * slideProgress * 0.25;

    // ─── Damped Pointer Tracking ────────────────────────────────────
    const isTrackingDisabled = reducedMotion || isUserInteracting || !pointerRef?.current?.active;
    const targetX = isTrackingDisabled ? 0 : (pointerRef?.current?.x ?? 0);
    const targetY = isTrackingDisabled ? 0 : (pointerRef?.current?.y ?? 0);

    // Frame-rate independent exponential damping (~4.5 decay rate for organic, responsive awareness)
    const damp = 1 - Math.exp(-4.5 * safeDelta);
    smoothedPointerRef.current.x += (targetX - smoothedPointerRef.current.x) * damp;
    smoothedPointerRef.current.y += (targetY - smoothedPointerRef.current.y) * damp;

    const currentPointerX = smoothedPointerRef.current.x;
    const currentPointerY = smoothedPointerRef.current.y;

    // ─── Grounded Procedural Idle & Natural Breathing ───────────────
    const motionFactor = reducedMotion ? 0.0 : 1.0;
    const t = state.clock.elapsedTime;

    // Alert, living human resting breathing cycle (~3.9s period)
    const breathPhase = t * 1.6;
    const breath = Math.sin(breathPhase) * motionFactor;

    // Low-frequency gentle living postural weight shifting (~9s & ~12s periods)
    const posturePhase = t * 0.68;
    const postureSecondary = t * 0.52;
    const swayZ = Math.sin(posturePhase) * motionFactor;
    const twistY = Math.cos(postureSecondary) * motionFactor;

    if (gender === "male" && bones) {
      const restMap = restQuatsRef.current;
      const { spine1, spine2, leftShoulder, rightShoulder, neck, head } = bones;

      // 1. Lower Spine: subtle breathing pitch + lateral postural sway roll (anchored base)
      if (spine1) {
        const rest = restMap.get(spine1);
        if (rest) {
          _euler.set(
            -0.005 * breath, // pitch forward/back
            0.003 * twistY,  // gentle yaw
            0.005 * swayZ,   // lateral roll
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          spine1.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      // 2. Thoracic Chest: primary breathing expansion + subtle body follow
      if (spine2) {
        const rest = restMap.get(spine2);
        if (rest) {
          _euler.set(
            -0.010 * breath - 0.015 * currentPointerY, // thoracic expansion + gentle pitch follow
            0.004 * twistY + 0.025 * currentPointerX,  // postural yaw + upper torso yaw follow
            0.003 * swayZ,
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          spine2.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      // 3. Shoulders / Clavicles: gentle rise during inhalation
      if (leftShoulder) {
        const rest = restMap.get(leftShoulder);
        if (rest) {
          _euler.set(0, 0, 0.006 * breath, "YXZ");
          _offsetQuat.setFromEuler(_euler);
          leftShoulder.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }
      if (rightShoulder) {
        const rest = restMap.get(rightShoulder);
        if (rest) {
          _euler.set(0, 0, -0.006 * breath, "YXZ");
          _offsetQuat.setFromEuler(_euler);
          rightShoulder.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      // 4. Neck & Head: gaze stabilization counter-pitch + pointer attention hierarchy
      if (neck) {
        const rest = restMap.get(neck);
        if (rest) {
          _euler.set(
            0.004 * breath - 0.020 * currentPointerY, // counter-pitch + neck pitch follow
            0.035 * currentPointerX,                  // neck supporting yaw
            0,
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          neck.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }
      if (head) {
        const rest = restMap.get(head);
        if (rest) {
          _euler.set(
            0.006 * breath - 0.025 * currentPointerY,                                           // gaze pitch
            -0.003 * Math.cos(postureSecondary + 0.3) * motionFactor + 0.060 * currentPointerX, // head primary yaw
            -0.004 * Math.sin(posturePhase + 0.4) * motionFactor - 0.012 * currentPointerX,     // subtle anatomical head roll
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          head.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      // Root position combines baseline centering with runway slide offsets
      groupRef.current.position.set(
        transform.position[0] + slideX,
        transform.position[1],
        transform.position[2] + slideZ
      );
      groupRef.current.rotation.set(0, turnY, 0);
      groupRef.current.scale.set(transform.scale, transform.scale, transform.scale);
    } else {
      // ─── Female Avatar Grounded Motion ─────────────────────────────
      // Anchor sole level strictly at y = 0.
      // Apply anchored sagittal breathing tilt, gentle lateral roll, and grounded thoracic Y-stretch.
      // Compose with restrained whole-group pointer attention.
      const femalePitch = -0.004 * breath - 0.012 * currentPointerY;
      const femaleRoll = 0.0035 * swayZ - 0.008 * currentPointerX;
      const femaleYaw = 0.0025 * twistY + 0.055 * currentPointerX + turnY;

      // Subtle thoracic stretch anchored at feet (scale.y stretches upward from sole level y = 0)
      const thoracicScaleY = transform.scale * (1 + 0.003 * breath);

      groupRef.current.position.set(
        transform.position[0] + slideX,
        transform.position[1],
        transform.position[2] + slideZ
      );
      groupRef.current.rotation.set(femalePitch, femaleYaw, femaleRoll);
      groupRef.current.scale.set(transform.scale, thoracicScaleY, transform.scale);
    }

    // Confirm first usable rendered frame immediately
    if (active && !reportedRef.current && p > 0.1) {
      reportedRef.current = true;
      onRendered?.();
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={transform.position} 
      scale={transform.scale} 
      renderOrder={active ? 1 : 0}
    >
      <primitive object={scene} />
    </group>
  );
}

const HeroModel = ({ 
  gender, 
  direction = 1,
  isInView = true,
  reducedMotion = false,
  pointerRef,
  rotateRef,
  onReady, 
  onInteractionChange,
}: HeroModelProps) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initially mount active gender; warm up alternate gender in background after frame 1
  const [mountedGenders, setMountedGenders] = useState<Record<Gender, boolean>>({
    male: gender === "male",
    female: gender === "female",
  });

  // Ensure requested gender is mounted during render without useEffect cascading setStates
  if (!mountedGenders[gender]) {
    setMountedGenders((prev) => ({ ...prev, [gender]: true }));
  }

  // ContactShadows baking lifecycle state:
  // Dynamically bakes during initial mount/warm-up (900ms) and gender cross-dissolve (950ms),
  // then cleanly freezes to frames={1} to eliminate ongoing GPU shadow render costs during idle.
  const [isShadowBaking, setIsShadowBaking] = useState(true);

  // Initial mount shadow bake: keep active for 900ms until avatar renders and settles, then freeze
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShadowBaking(false);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  // Background warm-up of alternate gender shortly after initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountedGenders({ male: true, female: true });
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const [isTabVisible, setIsTabVisible] = useState(() => (typeof document !== "undefined" ? !document.hidden : true));
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const onInteractionChangeRef = useRef(onInteractionChange);
  useEffect(() => {
    onInteractionChangeRef.current = onInteractionChange;
  }, [onInteractionChange]);

  const handleInteractionStart = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setIsUserInteracting(true);
    onInteractionChangeRef.current?.(true);
  };

  const handleInteractionEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
      onInteractionChangeRef.current?.(false);
    }, 1000);
  };

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.addEventListener("start", handleInteractionStart);
    controls.addEventListener("end", handleInteractionEnd);

    return () => {
      controls.removeEventListener("start", handleInteractionStart);
      controls.removeEventListener("end", handleInteractionEnd);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const prevGenderRef = useRef(gender);
  useEffect(() => {
    if (prevGenderRef.current !== gender) {
      prevGenderRef.current = gender;
      setIsShadowBaking(true);
      const endTimer = setTimeout(() => {
        setIsShadowBaking(false);
      }, 950);

      return () => {
        clearTimeout(endTimer);
      };
    }
  }, [gender]);

  return (
    <Canvas
      id="hero-canvas"
      frameloop={isInView && isTabVisible ? "always" : "never"}
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
      {/* Balanced Studio Lighting — illuminates both left and right evenly with natural skin warmth */}
      <ambientLight intensity={1.15} color="#ffffff" />
      {/* Key Light (Front-Right): warm primary studio illumination */}
      <directionalLight position={[3.5, 5.5, 4.5]} intensity={1.65} color="#fffaf2" />
      {/* Fill Light (Front-Left): directly eliminates shadows on the left arm, hand, and leg */}
      <directionalLight position={[-3.5, 5.0, 4.2]} intensity={1.5} color="#fff7ed" />
      {/* Front-Center Low Fill: lifts shadows on lower body and legs */}
      <directionalLight position={[0, 1.6, 4.0]} intensity={0.85} color="#ffffff" />
      {/* Soft Upper Rim: clean backlight halo without purple discoloration */}
      <directionalLight position={[0, 6.0, -3.5]} intensity={0.8} color="#faf5ff" />
      {/* Top Hair & Shoulder Accent */}
      <spotLight position={[0, 8, 2.5]} angle={0.5} penumbra={1} intensity={0.8} color="#ffffff" />
      <ResponsiveCamera />

      <TurntableGroup
        isUserInteracting={isUserInteracting}
        rotateRef={rotateRef}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
      >
        <Suspense fallback={null}>
          {mountedGenders.female && (
            <AvatarModel
              gender="female"
              active={gender === "female"}
              direction={direction}
              reducedMotion={reducedMotion}
              pointerRef={pointerRef}
              isUserInteracting={isUserInteracting}
              onRendered={onReady}
            />
          )}
        </Suspense>
        <Suspense fallback={null}>
          {mountedGenders.male && (
            <AvatarModel
              gender="male"
              active={gender === "male"}
              direction={direction}
              reducedMotion={reducedMotion}
              pointerRef={pointerRef}
              isUserInteracting={isUserInteracting}
              onRendered={onReady}
            />
          )}
        </Suspense>
      </TurntableGroup>

      <Suspense fallback={null}>
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.3}
          scale={5.5}
          blur={2.0}
          far={3.5}
          frames={isShadowBaking ? Infinity : 1}
          color="#3b0764"
        />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!isMobile}
        target={isMobile ? [0, 0.84, 0] : [0, 0.95, 0]}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.8}
        enableDamping={true}
        dampingFactor={0.06}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.38}
        maxPolarAngle={Math.PI * 0.58}
        onStart={handleInteractionStart}
        onEnd={handleInteractionEnd}
      />
    </Canvas>
  );
};

export default HeroModel;