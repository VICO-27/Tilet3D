import { Suspense, useMemo, useRef, useEffect, useState, createContext, useContext, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { prepareAvatar, applyNaturalSkinWarmth } from "../../avatar/utils/avatarRig";
import type { Gender } from "../../avatar/types/avatar.types";

const DRACO_URL = "/draco/";

export interface HeroModelItem {
  id: string;
  name: string;
  subtitle: string;
  gender: "female" | "male";
  path: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const HERO_MODELS: HeroModelItem[] = [
  {
    id: "female-white-dress",
    name: "White & Gold",
    subtitle: "Royal Champagne Kemis",
    gender: "female",
    path: "/models/female-white-dress.glb",
  },
  {
    id: "female-oromo-red",
    name: "Oromo Red",
    subtitle: "Handcrafted Beadwork & Cape",
    gender: "female",
    path: "/models/female-oromo-red.glb",
  },
  {
    id: "female-green-dress",
    name: "Emerald Gown",
    subtitle: "Gold Tilet Formal Bodice",
    gender: "female",
    path: "/models/female-green-dress.glb",
  },
  {
    id: "female-blue-dress",
    name: "Royal Blue",
    subtitle: "Cross Embroidery Couture",
    gender: "female",
    path: "/models/female-blue-dress.glb",
  },
  {
    id: "female-oromo-white",
    name: "Oromo White",
    subtitle: "Ceremonial Wedding Attire",
    gender: "female",
    path: "/models/female-oromo-white.glb",
  },
];

// Enable Three.js file-level caching across loaders
THREE.Cache.enabled = true;

// Preload initial hero 3D model immediately on script evaluation
if (typeof window !== "undefined") {
  useGLTF.preload(HERO_MODELS[0].path, DRACO_URL);
}

// Reusable math singletons to guarantee 0 GC allocation in 60fps render loop
const _euler = new THREE.Euler(0, 0, 0, "YXZ");
const _offsetQuat = new THREE.Quaternion();
const _headWorldVec = new THREE.Vector3();
const _dirVec = new THREE.Vector3();
const _midVec = new THREE.Vector3();
const _unitDown = new THREE.Vector3(0, -1, 0);
const _beamQuat = new THREE.Quaternion();

export interface PointerTracker {
  x: number;
  y: number;
  active: boolean;
}

export interface HeroModelProps {
  gender?: Gender;
  activeModelId?: string;
  direction?: -1 | 1;
  isInView?: boolean;
  reducedMotion?: boolean;
  pointerRef?: { current: PointerTracker };
  rotateRef?: React.MutableRefObject<number>;
  is3DReady?: boolean;
  isInteracting?: boolean;
  onCycleNext?: () => void;
  onReady?: () => void;
  onInteractionChange?: (isInteracting: boolean) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export function preloadHeroModel(pathOrId: string) {
  const item = HERO_MODELS.find((m) => m.id === pathOrId || m.path === pathOrId);
  useGLTF.preload(item ? item.path : pathOrId, DRACO_URL);
}

// eslint-disable-next-line react-refresh/only-export-components
export function preloadGender(gender: Gender) {
  const match = HERO_MODELS.find((m) => m.gender === gender) || HERO_MODELS[0];
  if (match) useGLTF.preload(match.path, DRACO_URL);
}

const _faceKickerPos = new THREE.Vector3();
const _spotToTargetDir = new THREE.Vector3();

/**
 * Cinematic Theatrical Followspot:
 * - Positioned off-screen upper-left, angling down toward the avatar's face.
 * - Dynamically tracks head position in world coordinates (turntable rotation, breathing, pointer tilt).
 * - Soft circular pool of illumination with gentle feathered penumbra.
 * - Radiant complementary face kicker for luminous skin definition and gold Habesha embroidery sparkle.
 * - Ultra-lightweight gossamer beam cone with additive blending and 0 runtime GC overhead.
 */
function CinematicFollowspot({
  activeAvatarGroupRef,
  isMobile,
}: {
  activeAvatarGroupRef: React.MutableRefObject<THREE.Group | null>;
  isMobile: boolean;
}) {
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const haloLightRef = useRef<THREE.SpotLight>(null);
  const faceKickerRef = useRef<THREE.PointLight>(null);
  const targetObj = useMemo(() => new THREE.Object3D(), []);
  const smoothedTarget = useRef(new THREE.Vector3(0, isMobile ? 1.96 : 1.86, 0.08));
  const beamMeshRef = useRef<THREE.Mesh>(null);

  // Spotlight position: off-screen upper-left
  const spotPosition = useMemo<[number, number, number]>(
    () => [-2.5, isMobile ? 4.3 : 3.9, 2.3],
    [isMobile]
  );
  const spotVec = useMemo(() => new THREE.Vector3(...spotPosition), [spotPosition]);

  // Gossamer atmospheric beam material: smooth feathering at source, body, and target (desktop only)
  const beamMaterial = useMemo(() => {
    if (isMobile) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color("#d8b4fe") },
        uOpacity: { value: 0.28 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          float fadeIn = smoothstep(0.42, 0.72, vUv.y);
          float fadeOut = 1.0 - smoothstep(0.70, 1.0, vUv.y);
          float longitudinal = fadeIn * fadeOut;

          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float rim = abs(dot(viewDir, normal));
          float edgeFeather = pow(rim, 1.25);

          float alpha = longitudinal * edgeFeather * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }, [isMobile]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);

    // 1. Calculate active avatar's head world coordinate
    if (activeAvatarGroupRef.current) {
      activeAvatarGroupRef.current.localToWorld(_headWorldVec.set(0, 1.48, 0.08));
    } else {
      _headWorldVec.set(0, isMobile ? 1.86 : 1.76, 0.08);
    }

    // 2. Smoothly track with interpolation (lerp)
    smoothedTarget.current.lerp(_headWorldVec, 1 - Math.exp(-7.5 * safeDelta));

    // 3. Update target Object3D
    targetObj.position.copy(smoothedTarget.current);
    targetObj.updateMatrixWorld();

    // 4. Update complementary face kicker light position along beam vector
    if (faceKickerRef.current) {
      _spotToTargetDir.subVectors(smoothedTarget.current, spotVec).normalize();
      _faceKickerPos.copy(smoothedTarget.current).addScaledVector(_spotToTargetDir, -1.4);
      faceKickerRef.current.position.copy(_faceKickerPos);
    }

    // 5. Update atmospheric beam cone orientation & scale (desktop only)
    if (!isMobile && beamMeshRef.current) {
      _dirVec.subVectors(smoothedTarget.current, spotVec);
      const dist = _dirVec.length();
      _dirVec.normalize();

      _midVec.addVectors(spotVec, smoothedTarget.current).multiplyScalar(0.5);
      beamMeshRef.current.position.copy(_midVec);
      _beamQuat.setFromUnitVectors(_unitDown, _dirVec);
      beamMeshRef.current.quaternion.copy(_beamQuat);
      beamMeshRef.current.scale.set(1, dist, 1);
    }
  });

  return (
    <>
      <primitive object={targetObj} />

      {/* Primary Theatrical Followspot: focused illumination pool on face & upper shoulders */}
      <spotLight
        ref={spotLightRef}
        target={targetObj}
        position={spotPosition}
        intensity={isMobile ? 6.2 : 6.8}
        angle={0.30}
        penumbra={0.88}
        distance={9.5}
        decay={0.8}
        color="#f3e8ff"
      />

      {/* Secondary halo spotlight: warm lilac backlight separation */}
      <spotLight
        ref={haloLightRef}
        target={targetObj}
        position={spotPosition}
        intensity={isMobile ? 1.3 : 2.0}
        angle={0.46}
        penumbra={0.96}
        distance={9.5}
        decay={1.2}
        color="#c084fc"
      />

      {/* Complementary face kicker for high-definition facial radiance on both mobile & desktop */}
      <pointLight
        ref={faceKickerRef}
        position={spotPosition}
        intensity={isMobile ? 0.70 : 0.85}
        distance={2.4}
        decay={1.0}
        color="#ede9fe"
      />

      {/* Desktop-only atmospheric gossamer beam cone */}
      {!isMobile && beamMaterial && (
        <mesh ref={beamMeshRef} material={beamMaterial} renderOrder={2}>
          <cylinderGeometry args={[0.04, 0.76, 1, 28, 1, true]} />
        </mesh>
      )}
    </>
  );
}

function ResponsiveCamera() {
  const { camera, size, controls } = useThree();
  
  useEffect(() => {
    // Determine screen aspect and form factor
    const aspect = size.width / size.height;
    const isMobile = (typeof window !== "undefined" && window.innerWidth < 768) || aspect < 0.85;

    if (aspect < 0.6) {
      // Ultra-narrow phone (e.g. 20:9 / 20.5:9 Tecno, Infinix, Xperia)
      camera.position.set(0, 1.15, 4.9);
    } else if (isMobile) {
      // Standard mobile portrait (e.g. iPhone, Galaxy) - moved up slightly for mobile
      camera.position.set(0, 1.18, 4.6);
    } else if (aspect < 1.15) {
      // Tablet / square viewports
      camera.position.set(0, 1.20, 4.1);
    } else {
      // Desktop widescreen
      camera.position.set(0, 1.24, 3.4);
    }
    camera.updateProjectionMatrix();
    const orbitTarget = controls && 'target' in controls ? (controls as { target?: { set: (x: number, y: number, z: number) => void } }).target : null;
    if (orbitTarget) {
      orbitTarget.set(0, isMobile ? 1.14 : 1.16, 0);
    }
    if (controls && 'update' in controls && typeof (controls as { update?: () => void }).update === 'function') {
      (controls as { update: () => void }).update();
    }
  }, [camera, size, controls]);

  return null;
}

interface TurntableContextValue {
  spinAngleRef: React.MutableRefObject<number>;
  transitionAngleRef: React.MutableRefObject<number>;
}

const TurntableContext = createContext<TurntableContextValue | null>(null);

function TurntableGroup({
  children,
  activeModelId,
  is3DReady = true,
  onCycleNext,
  isUserInteracting,
  rotateRef,
  isMobile,
  reducedMotion = false,
}: {
  children: React.ReactNode;
  activeModelId?: string;
  is3DReady?: boolean;
  onCycleNext?: () => void;
  isUserInteracting: boolean;
  rotateRef?: React.MutableRefObject<number>;
  isMobile: boolean;
  reducedMotion?: boolean;
}) {
  const spinAngleRef = useRef<number>(0);
  const transitionAngleRef = useRef<number>(0);
  const showcaseTimerRef = useRef<number>(0);
  const prevModelIdRef = useRef(activeModelId);
  const onCycleNextRef = useRef(onCycleNext);

  // Exactly 8.5 seconds for 1 full 360° showcase cycle
  const SPIN_DURATION = 8.5;
  const ANGULAR_SPEED = (Math.PI * 2) / SPIN_DURATION; // ~0.7392 rad/s

  useEffect(() => {
    onCycleNextRef.current = onCycleNext;
  }, [onCycleNext]);

  // When active model switches, snapshot transition angle and reset showcase timer
  useEffect(() => {
    if (prevModelIdRef.current !== activeModelId) {
      prevModelIdRef.current = activeModelId;
      transitionAngleRef.current = spinAngleRef.current;
      showcaseTimerRef.current = 0;
    }
  }, [activeModelId]);

  useFrame((_, delta) => {
    // 1. Mobile touch manual swipe rotation
    if (rotateRef && rotateRef.current !== 0) {
      spinAngleRef.current += rotateRef.current;
      rotateRef.current = 0;
    }

    // Freeze rotation and keep at 0 while 3D is preparing or hidden under brand animation
    if (!is3DReady) {
      showcaseTimerRef.current = 0;
      spinAngleRef.current = 0;
      return;
    }

    if (reducedMotion) {
      return;
    }

    const safeDelta = Math.min(delta, 0.1);

    // Continuous, silky smooth uninterrupted turntable rotation
    if (!isUserInteracting) {
      spinAngleRef.current += ANGULAR_SPEED * safeDelta;

      // Track showcase duration for this model
      showcaseTimerRef.current += safeDelta;
      if (showcaseTimerRef.current >= SPIN_DURATION) {
        showcaseTimerRef.current = 0;
        transitionAngleRef.current = spinAngleRef.current;
        onCycleNextRef.current?.();
      }
    } else {
      // While user is inspecting, keep showcase timer reset so avatar doesn't switch mid-view
      showcaseTimerRef.current = 0;
    }
  });

  const contextValue = useMemo(() => ({ spinAngleRef, transitionAngleRef }), []);

  return (
    <TurntableContext.Provider value={contextValue}>
      <group position={[0, isMobile ? 0.48 : 0.38, 0]}>
        {children}
      </group>
    </TurntableContext.Provider>
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
  modelItem, 
  isEntering = false,
  isExiting = false,
  direction = 1,
  reducedMotion = false,
  pointerRef,
  isUserInteracting = false,
  activeAvatarGroupRef,
  isMobile = false,
  onRendered,
  onExitComplete,
}: { 
  modelItem: HeroModelItem; 
  isEntering?: boolean;
  isExiting?: boolean;
  direction?: -1 | 1;
  reducedMotion?: boolean;
  pointerRef?: { current: PointerTracker };
  isUserInteracting?: boolean;
  activeAvatarGroupRef?: React.MutableRefObject<THREE.Group | null>;
  isMobile?: boolean;
  onRendered?: () => void;
  onExitComplete?: () => void;
}) {
  const { scene } = useGLTF(modelItem.path, DRACO_URL);
  const { gl, camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  const reportedRef = useRef(false);
  const materialsRef = useRef<THREE.Material[]>([]);

  // Damped pointer coordinates ref
  const smoothedPointerRef = useRef({ x: 0, y: 0 });

  // Turntable showcase angle tracking
  const turntable = useContext(TurntableContext);
  const currentSpinAngleRef = useRef(0);

  // Transition progress tracking: 0 -> 1
  const enterProgressRef = useRef(isEntering ? 0 : 1);
  const exitProgressRef = useRef(0);

  // Locate Mixamo upper-body articulation bones (male avatar)
  const bones = useMemo<MaleBones | null>(() => {
    if (modelItem.gender !== "male") return null;
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
  }, [scene, modelItem.gender]);

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

      // Pre-compile shaders on the GPU to eliminate frame drop
      try {
        gl.compile(scene, camera);
      } catch {
        // Fallback for headless/mock environments
      }
    }

    // Collect all cloned materials and enable shadows for this avatar
    const mats = new Set<THREE.Material>();
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
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

  // Calibrated screen-space trajectory bounds:
  // On mobile (narrow screen ~1.22m width at depth), 0.78m puts avatar just past viewport boundary
  // On desktop widescreen, 1.45m gives grand runway clearance
  const xTravel = isMobile ? 0.78 : 1.45;
  const zRecede = isMobile ? 0.22 : 0.40;

  // Set initial position on mount
  useEffect(() => {
    if (groupRef.current) {
      if (isEntering && !reducedMotion) {
        const startX = -direction * xTravel;
        const startZ = -zRecede;
        const startScale = 1 - 0.15;
        groupRef.current.position.set(startX, 0, startZ);
        groupRef.current.scale.set(startScale, startScale, startScale);
      } else if (!isExiting) {
        groupRef.current.position.set(0, 0, 0);
        groupRef.current.scale.set(1, 1, 1);
      }
      groupRef.current.visible = true;

      if (!isExiting && activeAvatarGroupRef && innerGroupRef.current) {
        activeAvatarGroupRef.current = innerGroupRef.current;
      }
    }
  }, [isEntering, isExiting, direction, reducedMotion, activeAvatarGroupRef, isMobile, xTravel, zRecede]);

  // Combined render loop: runway carousel glide + grounded natural breathing
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!isExiting && activeAvatarGroupRef && innerGroupRef.current && activeAvatarGroupRef.current !== innerGroupRef.current) {
      activeAvatarGroupRef.current = innerGroupRef.current;
    }

    const safeDelta = Math.min(delta, 0.1);
    const speed = safeDelta * 2.8; // ~350ms snappy runway transition

    let p = 1;
    if (isEntering) {
      enterProgressRef.current = Math.min(1, enterProgressRef.current + speed);
      p = enterProgressRef.current;
    } else if (isExiting) {
      exitProgressRef.current = Math.min(1, exitProgressRef.current + speed);
      p = exitProgressRef.current;
      if (p >= 1) {
        onExitComplete?.();
        return;
      }
    }

    // Cosine ease-in-out curve for runway motion
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * p);

    let worldCircleX = 0;
    let worldCircleZ = 0;
    let circleScale = 1;
    let runwayBanking = 0;

    if (isExiting) {
      // Exiting model: glides out from center stage (0, 0) to offscreen (+direction * xTravel)
      worldCircleX = reducedMotion ? 0 : direction * eased * xTravel;
      worldCircleZ = reducedMotion ? 0 : -Math.pow(eased, 1.2) * zRecede;
      circleScale = reducedMotion ? 1 : (1 - 0.15 * Math.pow(eased, 1.2));
      runwayBanking = reducedMotion ? 0 : direction * eased * 0.12;
    } else if (isEntering) {
      // Incoming model: glides in from offscreen (-direction * xTravel) to center stage (0, 0)
      const enterRemain = 1 - eased;
      worldCircleX = reducedMotion ? 0 : -direction * enterRemain * xTravel;
      worldCircleZ = reducedMotion ? 0 : -Math.pow(enterRemain, 1.2) * zRecede;
      circleScale = reducedMotion ? 1 : (1 - 0.15 * Math.pow(enterRemain, 1.2));
      runwayBanking = reducedMotion ? 0 : -direction * enterRemain * 0.12;
    }

    groupRef.current.renderOrder = isExiting ? 0 : 1;

    // Live continuous turntable showcase spin
    const spinAngle = turntable?.spinAngleRef.current ?? 0;
    currentSpinAngleRef.current = spinAngle;
    const baseModelYaw = spinAngle + runwayBanking;

    // ─── Damped Pointer Tracking ────────────────────────────────────
    const isTrackingDisabled = reducedMotion || isUserInteracting || !pointerRef?.current?.active;
    const targetX = isTrackingDisabled ? 0 : (pointerRef?.current?.x ?? 0);
    const targetY = isTrackingDisabled ? 0 : (pointerRef?.current?.y ?? 0);

    const damp = 1 - Math.exp(-4.5 * safeDelta);
    smoothedPointerRef.current.x += (targetX - smoothedPointerRef.current.x) * damp;
    smoothedPointerRef.current.y += (targetY - smoothedPointerRef.current.y) * damp;

    const currentPointerX = smoothedPointerRef.current.x;
    const currentPointerY = smoothedPointerRef.current.y;

    // ─── Grounded Procedural Idle & Natural Breathing ───────────────
    const motionFactor = reducedMotion ? 0.0 : 1.0;
    const t = state.clock.elapsedTime;

    const breathPhase = t * 1.6;
    const breath = Math.sin(breathPhase) * motionFactor;

    const posturePhase = t * 0.68;
    const postureSecondary = t * 0.52;
    const swayZ = Math.sin(posturePhase) * motionFactor;
    const twistY = Math.cos(postureSecondary) * motionFactor;

    if (modelItem.gender === "male" && bones) {
      const restMap = restQuatsRef.current;
      const { spine1, spine2, leftShoulder, rightShoulder, neck, head } = bones;

      if (spine1) {
        const rest = restMap.get(spine1);
        if (rest) {
          _euler.set(
            -0.005 * breath,
            0.003 * twistY,
            0.005 * swayZ,
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          spine1.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      if (spine2) {
        const rest = restMap.get(spine2);
        if (rest) {
          _euler.set(
            -0.010 * breath - 0.015 * currentPointerY,
            0.004 * twistY + 0.025 * currentPointerX,
            0.003 * swayZ,
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          spine2.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

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

      if (neck) {
        const rest = restMap.get(neck);
        if (rest) {
          _euler.set(
            0.004 * breath - 0.020 * currentPointerY,
            0.035 * currentPointerX,
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
            0.006 * breath - 0.025 * currentPointerY,
            -0.003 * Math.cos(postureSecondary + 0.3) * motionFactor + 0.060 * currentPointerX,
            -0.004 * Math.sin(posturePhase + 0.4) * motionFactor - 0.012 * currentPointerX,
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          head.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      groupRef.current.position.set(worldCircleX, 0, worldCircleZ);
      groupRef.current.rotation.set(0, baseModelYaw, 0);
      groupRef.current.scale.set(circleScale, circleScale, circleScale);
    } else {
      // ─── Female Avatar Grounded Motion ─────────────────────────────
      const femalePitch = -0.004 * breath - 0.012 * currentPointerY;
      const femaleRoll = 0.0035 * swayZ - 0.008 * currentPointerX;
      const femaleYaw = 0.0025 * twistY + 0.055 * currentPointerX + baseModelYaw;

      const currentScale = circleScale;
      const thoracicScaleY = currentScale * (1 + 0.003 * breath);

      groupRef.current.position.set(worldCircleX, 0, worldCircleZ);
      groupRef.current.rotation.set(femalePitch, femaleYaw, femaleRoll);
      groupRef.current.scale.set(currentScale, thoracicScaleY, currentScale);
    }

    // Confirm first usable rendered frame immediately
    if (!isExiting && !reportedRef.current) {
      reportedRef.current = true;
      onRendered?.();
    }
  });

  return (
    <group 
      ref={groupRef} 
      renderOrder={isExiting ? 0 : 1}
    >
      <group ref={innerGroupRef} position={transform.position} scale={transform.scale}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function AvatarFloorShadow({ isMobile }: { isMobile: boolean }) {
  const shadowTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Multi-tier grounded shadow: dark contact core beneath feet + soft ambient falloff
    const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
    gradient.addColorStop(0, "rgba(20, 10, 36, 0.72)");
    gradient.addColorStop(0.28, "rgba(35, 12, 60, 0.50)");
    gradient.addColorStop(0.60, "rgba(59, 15, 95, 0.22)");
    gradient.addColorStop(0.85, "rgba(76, 29, 149, 0.06)");
    gradient.addColorStop(1, "rgba(76, 29, 149, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  if (!shadowTexture) return null;

  // Ground plane sits directly at the feet/dress bottom level (y = 0.48 on mobile, 0.38 on desktop)
  const groundY = isMobile ? 0.478 : 0.378;

  return (
    <group position={[0, groundY, 0]}>
      {/* Broad soft ambient shadow puddle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[2.2, 1.8]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Concentrated core directly under the dress base/soles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.1, 0.75, 1]} renderOrder={-1}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.7}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

const HeroModel = ({ 
  gender, 
  activeModelId,
  direction = 1,
  isInView = true,
  reducedMotion = false,
  pointerRef,
  rotateRef,
  is3DReady = true,
  isInteracting = false,
  onCycleNext,
  onReady, 
  onInteractionChange,
}: HeroModelProps) => {
  const currentId = activeModelId || HERO_MODELS.find(m => m.gender === gender)?.id || HERO_MODELS[0].id;

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

  // Transition state: active avatar and exiting avatar
  const [activeId, setActiveId] = useState(currentId);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [transitionDir, setTransitionDir] = useState<-1 | 1>(direction);
  const [firstModelReady, setFirstModelReady] = useState(false);

  useEffect(() => {
    if (currentId !== activeId) {
      setExitingId(activeId);
      setActiveId(currentId);
      setTransitionDir(direction);
    }
  }, [currentId, activeId, direction]);

  const handleExitComplete = useCallback((id: string) => {
    setExitingId((prev) => (prev === id ? null : prev));
  }, []);

  const activeModel = useMemo(
    () => HERO_MODELS.find((m) => m.id === activeId) || HERO_MODELS[0],
    [activeId]
  );
  const exitingModel = useMemo(
    () => (exitingId ? HERO_MODELS.find((m) => m.id === exitingId) : null),
    [exitingId]
  );

  // Sequential graceful cache warmup:
  // Starts after the first model is fully rendered on screen, preloading one model every 1.2s
  // This guarantees zero network or CPU bottlenecks on mobile, while ensuring every model
  // is pre-cached long before auto-cycle or manual interaction!
  useEffect(() => {
    if (!firstModelReady) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    HERO_MODELS.slice(1).forEach((m, idx) => {
      timers.push(
        setTimeout(() => {
          preloadHeroModel(m.path);
        }, 150 + idx * 1200)
      );
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [firstModelReady]);

  const handleActiveModelRendered = useCallback(() => {
    if (!firstModelReady) {
      setFirstModelReady(true);
    }
    onReady?.();
  }, [firstModelReady, onReady]);

  const [isTabVisible, setIsTabVisible] = useState(() => (typeof document !== "undefined" ? !document.hidden : true));
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const [isOrbitInteracting, setIsOrbitInteracting] = useState(false);
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
    setIsOrbitInteracting(true);
    onInteractionChangeRef.current?.(true);
  };

  const handleInteractionEnd = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsOrbitInteracting(false);
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

  const activeAvatarGroupRef = useRef<THREE.Group | null>(null);
  const userInteracting = isInteracting || isOrbitInteracting;

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
        }, false);
      }}
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
      {/* Balanced Studio Lighting */}
      <ambientLight intensity={0.48} color="#f8f6ff" />
      <directionalLight 
        castShadow
        position={[3.5, 6.0, 4.5]} 
        intensity={0.95} 
        color="#fffaf2" 
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-1.5}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-3.5, 5.0, 4.2]} intensity={0.35} color="#ede9fe" />
      <directionalLight position={[0, 1.6, 4.0]} intensity={0.45} color="#ffffff" />
      <directionalLight position={[0, 6.0, -3.5]} intensity={1.05} color="#faf5ff" />

      {/* Theatrical Followspot & Face Kicker */}
      <CinematicFollowspot activeAvatarGroupRef={activeAvatarGroupRef} isMobile={isMobile} />
      <ResponsiveCamera />

      {/* Ground Contact Shadow */}
      <AvatarFloorShadow isMobile={isMobile} />

      <TurntableGroup
        activeModelId={activeId}
        is3DReady={is3DReady}
        onCycleNext={onCycleNext}
        isUserInteracting={userInteracting}
        rotateRef={rotateRef}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
      >
        <Suspense fallback={null}>
          <AvatarModel
            key={activeModel.id}
            modelItem={activeModel}
            isEntering={Boolean(exitingId)}
            direction={transitionDir}
            reducedMotion={reducedMotion}
            pointerRef={pointerRef}
            isUserInteracting={userInteracting}
            activeAvatarGroupRef={activeAvatarGroupRef}
            isMobile={isMobile}
            onRendered={handleActiveModelRendered}
          />
        </Suspense>

        {exitingModel && (
          <Suspense fallback={null}>
            <AvatarModel
              key={exitingModel.id}
              modelItem={exitingModel}
              isExiting
              direction={transitionDir}
              reducedMotion={reducedMotion}
              pointerRef={pointerRef}
              isUserInteracting={userInteracting}
              activeAvatarGroupRef={activeAvatarGroupRef}
              isMobile={isMobile}
              onExitComplete={() => handleExitComplete(exitingModel.id)}
            />
          </Suspense>
        )}
      </TurntableGroup>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!isMobile}
        target={isMobile ? [0, 1.24, 0] : [0, 1.26, 0]}
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