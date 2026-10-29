import { Suspense, useMemo, useRef, useEffect, useState, createContext, useContext, useCallback, Component } from "react";
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

// Preload ONLY the first hero model on script evaluation.
// The others are downloaded after the first avatar is on screen (see HeroModel below),
// so the first avatar gets the full network bandwidth.
if (typeof window !== "undefined") {
  useGLTF.preload(HERO_MODELS[0].path, DRACO_URL);
}

// Spin starts this long after the first avatar is on screen
const SPIN_START_DELAY_MS = 500;

/**
 * Collect every unique texture from a scene's materials.
 */
function collectTextures(scene: THREE.Object3D): THREE.Texture[] {
  const out: THREE.Texture[] = [];
  const texKeys = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap"];
  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of mats) {
      if (!mat) continue;
      for (const key of texKeys) {
        const tex = (mat as unknown as Record<string, unknown>)[key];
        if (
          tex &&
          typeof tex === "object" &&
          (tex as { isTexture?: boolean }).isTexture &&
          !out.includes(tex as THREE.Texture)
        ) {
          out.push(tex as THREE.Texture);
        }
      }
    }
  });
  return out;
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
 * Cinematic Theatrical Followspot (unchanged visually).
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

  const spotPosition = useMemo<[number, number, number]>(
    () => [-2.5, isMobile ? 4.3 : 3.9, 2.3],
    [isMobile]
  );
  const spotVec = useMemo(() => new THREE.Vector3(...spotPosition), [spotPosition]);

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

    if (activeAvatarGroupRef.current) {
      activeAvatarGroupRef.current.localToWorld(_headWorldVec.set(0, 1.48, 0.08));
    } else {
      _headWorldVec.set(0, isMobile ? 1.86 : 1.76, 0.08);
    }

    smoothedTarget.current.lerp(_headWorldVec, 1 - Math.exp(-7.5 * safeDelta));

    targetObj.position.copy(smoothedTarget.current);
    targetObj.updateMatrixWorld();

    if (faceKickerRef.current) {
      _spotToTargetDir.subVectors(smoothedTarget.current, spotVec).normalize();
      _faceKickerPos.copy(smoothedTarget.current).addScaledVector(_spotToTargetDir, -1.4);
      faceKickerRef.current.position.copy(_faceKickerPos);
    }

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

      <pointLight
        ref={faceKickerRef}
        position={spotPosition}
        intensity={isMobile ? 0.70 : 0.85}
        distance={2.4}
        decay={1.0}
        color="#ede9fe"
      />

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
    const aspect = size.width / size.height;
    const isMobile = (typeof window !== "undefined" && window.innerWidth < 768) || aspect < 0.85;

    if (aspect < 0.6) {
      camera.position.set(0, 1.15, 4.9);
    } else if (isMobile) {
      camera.position.set(0, 1.18, 4.6);
    } else if (aspect < 1.15) {
      camera.position.set(0, 1.20, 4.1);
    } else {
      camera.position.set(0, 1.24, 3.4);
    }
    camera.updateProjectionMatrix();
    const orbitTarget =
      controls && "target" in controls
        ? (controls as { target?: { set: (x: number, y: number, z: number) => void } }).target
        : null;
    if (orbitTarget) {
      orbitTarget.set(0, isMobile ? 1.14 : 1.16, 0);
    }
    if (controls && "update" in controls && typeof (controls as { update?: () => void }).update === "function") {
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
  spinEnabled = true,
  nextReady = true,
  onCycleNext,
  isUserInteracting,
  rotateRef,
  isMobile,
  reducedMotion = false,
}: {
  children: React.ReactNode;
  activeModelId?: string;
  is3DReady?: boolean;
  spinEnabled?: boolean;
  nextReady?: boolean;
  onCycleNext?: () => void;
  isUserInteracting: boolean;
  rotateRef?: React.MutableRefObject<number>;
  isMobile: boolean;
  reducedMotion?: boolean;
}) {
  const spinAngleRef = useRef<number>(0);
  const transitionAngleRef = useRef<number>(0);
  const showcaseTimerRef = useRef<number>(0);
  const rampRef = useRef<number>(0);
  const prevModelIdRef = useRef(activeModelId);
  const onCycleNextRef = useRef(onCycleNext);
  const nextReadyRef = useRef(nextReady);

  // Exactly 8.5 seconds for 1 full 360° showcase cycle
  const SPIN_DURATION = 8.5;
  const ANGULAR_SPEED = (Math.PI * 2) / SPIN_DURATION;
  // Spin eases in over this many seconds so the start feels smooth
  const RAMP_SECONDS = 0.8;

  useEffect(() => {
    onCycleNextRef.current = onCycleNext;
  }, [onCycleNext]);

  useEffect(() => {
    nextReadyRef.current = nextReady;
  }, [nextReady]);

  useEffect(() => {
    if (prevModelIdRef.current !== activeModelId) {
      prevModelIdRef.current = activeModelId;
      transitionAngleRef.current = spinAngleRef.current;
      showcaseTimerRef.current = 0;
    }
  }, [activeModelId]);

  useFrame((_, delta) => {
    // Mobile touch manual swipe rotation (always allowed)
    if (rotateRef && rotateRef.current !== 0) {
      spinAngleRef.current += rotateRef.current;
      rotateRef.current = 0;
    }

    if (!is3DReady) {
      showcaseTimerRef.current = 0;
      spinAngleRef.current = 0;
      rampRef.current = 0;
      return;
    }

    if (reducedMotion) return;

    if (!spinEnabled) {
      showcaseTimerRef.current = 0;
      rampRef.current = 0;
      return;
    }

    const safeDelta = Math.min(delta, 0.1);

    if (!isUserInteracting) {
      // Smooth ease-in of the spin speed
      rampRef.current = Math.min(1, rampRef.current + safeDelta / RAMP_SECONDS);
      const r = rampRef.current;
      const eased = r * r * (3 - 2 * r);

      // Angle and timer use the same eased step, so one cycle is always exactly one full 360°
      spinAngleRef.current += ANGULAR_SPEED * safeDelta * eased;
      showcaseTimerRef.current += safeDelta * eased;

      // Only switch avatar when the next one is GPU-ready (keeps the transition lag-free)
      if (showcaseTimerRef.current >= SPIN_DURATION && nextReadyRef.current) {
        showcaseTimerRef.current = 0;
        transitionAngleRef.current = spinAngleRef.current;
        onCycleNextRef.current?.();
      }
    } else {
      showcaseTimerRef.current = 0;
      rampRef.current = 0;
    }
  });

  const contextValue = useMemo(() => ({ spinAngleRef, transitionAngleRef }), []);

  return (
    <TurntableContext.Provider value={contextValue}>
      <group position={[0, isMobile ? 0.48 : 0.38, 0]}>{children}</group>
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

const posedScenes = new WeakSet<THREE.Group>();

/** CPU-only avatar prep. Idempotent. */
function ensureScenePrepared(scene: THREE.Group) {
  if (posedScenes.has(scene)) return;
  prepareAvatar(scene);
  applyNaturalSkinWarmth(scene);
  posedScenes.add(scene);
}

interface ModelTransform {
  scale: number;
  position: [number, number, number];
}

const transformCache = new WeakMap<THREE.Group, ModelTransform>();

function getModelTransform(scene: THREE.Group): ModelTransform {
  const cached = transformCache.get(scene);
  if (cached) return cached;

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const standardHeight = 1.716;
  const effectiveHeight = Math.min(size.y || standardHeight, standardHeight);
  const scaleFactor = 1.6;
  const s = scaleFactor / effectiveHeight;

  const transform: ModelTransform = {
    scale: s,
    position: [-center.x * s, -box.min.y * s, -center.z * s],
  };
  transformCache.set(scene, transform);
  return transform;
}

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
  onRendered?: (id: string) => void;
  onExitComplete?: () => void;
}) {
  const { scene } = useGLTF(modelItem.path, DRACO_URL);
  const groupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);

  const smoothedPointerRef = useRef({ x: 0, y: 0 });

  const turntable = useContext(TurntableContext);
  const currentSpinAngleRef = useRef(0);

  const enterProgressRef = useRef(isEntering && !reducedMotion ? 0 : 1);
  const exitProgressRef = useRef(0);
  const exitNotifiedRef = useRef(false);

  // "Rendered" is reported only after real frames have been drawn with this model
  const framesSeenRef = useRef(0);
  const reportedRef = useRef(false);

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

  const restQuatsRef = useRef<Map<THREE.Bone, THREE.Quaternion>>(new Map());
  useEffect(() => {
    if (bones) {
      const map = restQuatsRef.current;
      map.clear();
      const list = [bones.spine1, bones.spine2, bones.neck, bones.head, bones.leftShoulder, bones.rightShoulder];
      for (const bone of list) {
        if (bone) map.set(bone, bone.quaternion.clone());
      }
    }
  }, [bones]);

  // Prep happens BEFORE the scene is attached/rendered. For warmed models this is a no-op.
  const transform = useMemo(() => {
    ensureScenePrepared(scene);
    return getModelTransform(scene);
  }, [scene]);

  const xTravel = isMobile ? 1.65 : 1.45;
  const zRecede = isMobile ? 0 : 0.4;

  const isIncoming = isEntering && !reducedMotion;
  const initialX = isIncoming ? -direction * xTravel : 0;
  const initialZ = isIncoming ? -zRecede : 0;

  useEffect(() => {
    if (groupRef.current) {
      if (isEntering && !reducedMotion) {
        const startX = -direction * xTravel;
        const startZ = -zRecede;
        groupRef.current.position.set(startX, 0, startZ);
        groupRef.current.scale.set(1, 1, 1);
      } else if (!isExiting && enterProgressRef.current >= 1) {
        groupRef.current.position.set(0, 0, 0);
        groupRef.current.scale.set(1, 1, 1);
      }
      groupRef.current.visible = true;

      if (!isExiting && activeAvatarGroupRef && innerGroupRef.current) {
        activeAvatarGroupRef.current = innerGroupRef.current;
      }
    }
  }, [isEntering, isExiting, direction, reducedMotion, activeAvatarGroupRef, isMobile, xTravel, zRecede]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (!isExiting && !reportedRef.current) {
      framesSeenRef.current += 1;
      if (framesSeenRef.current >= 3) {
        reportedRef.current = true;
        onRendered?.(modelItem.id);
      }
    }

    if (
      !isExiting &&
      activeAvatarGroupRef &&
      innerGroupRef.current &&
      activeAvatarGroupRef.current !== innerGroupRef.current
    ) {
      activeAvatarGroupRef.current = innerGroupRef.current;
    }

    const safeDelta = Math.min(delta, 0.1);
    const speed = safeDelta * 2.8; // ~350ms runway transition

    let p = 1;
    if (enterProgressRef.current < 1) {
      enterProgressRef.current = Math.min(1, enterProgressRef.current + speed);
      p = enterProgressRef.current;
    } else if (isExiting) {
      exitProgressRef.current = Math.min(1, exitProgressRef.current + speed);
      p = exitProgressRef.current;
      if (p >= 1) {
        if (!exitNotifiedRef.current) {
          exitNotifiedRef.current = true;
          onExitComplete?.();
        }
        return;
      }
    }

    const eased = 0.5 - 0.5 * Math.cos(Math.PI * p);

    let worldCircleX = 0;
    let worldCircleZ = 0;
    let runwayBanking = 0;

    if (isExiting) {
      worldCircleX = reducedMotion ? 0 : direction * eased * xTravel;
      worldCircleZ = reducedMotion ? 0 : -Math.pow(eased, 1.2) * zRecede;
      runwayBanking = reducedMotion ? 0 : direction * eased * 0.12;
    } else if (p < 1) {
      const enterRemain = 1 - eased;
      worldCircleX = reducedMotion ? 0 : -direction * enterRemain * xTravel;
      worldCircleZ = reducedMotion ? 0 : -Math.pow(enterRemain, 1.2) * zRecede;
      runwayBanking = reducedMotion ? 0 : -direction * enterRemain * 0.12;
    }

    groupRef.current.renderOrder = isExiting ? 0 : 1;

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
          _euler.set(-0.005 * breath, 0.003 * twistY, 0.005 * swayZ, "YXZ");
          _offsetQuat.setFromEuler(_euler);
          spine1.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      if (spine2) {
        const rest = restMap.get(spine2);
        if (rest) {
          _euler.set(
            -0.01 * breath - 0.015 * currentPointerY,
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
          _euler.set(0.004 * breath - 0.02 * currentPointerY, 0.035 * currentPointerX, 0, "YXZ");
          _offsetQuat.setFromEuler(_euler);
          neck.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }
      if (head) {
        const rest = restMap.get(head);
        if (rest) {
          _euler.set(
            0.006 * breath - 0.025 * currentPointerY,
            -0.003 * Math.cos(postureSecondary + 0.3) * motionFactor + 0.06 * currentPointerX,
            -0.004 * Math.sin(posturePhase + 0.4) * motionFactor - 0.012 * currentPointerX,
            "YXZ"
          );
          _offsetQuat.setFromEuler(_euler);
          head.quaternion.copy(rest).multiply(_offsetQuat);
        }
      }

      groupRef.current.position.set(worldCircleX, 0, worldCircleZ);
      groupRef.current.rotation.set(0, baseModelYaw, 0);
      groupRef.current.scale.set(1, 1, 1);
    } else {
      // ─── Female Avatar Grounded Motion ─────────────────────────────
      const femalePitch = -0.004 * breath - 0.012 * currentPointerY;
      const femaleRoll = 0.0035 * swayZ - 0.008 * currentPointerX;
      const femaleYaw = 0.0025 * twistY + 0.055 * currentPointerX + baseModelYaw;

      const thoracicScaleY = 1 + 0.003 * breath;

      groupRef.current.position.set(worldCircleX, 0, worldCircleZ);
      groupRef.current.rotation.set(femalePitch, femaleYaw, femaleRoll);
      groupRef.current.scale.set(1, thoracicScaleY, 1);
    }
  });

  return (
    <group ref={groupRef} position={[initialX, 0, initialZ]} renderOrder={isExiting ? 0 : 1}>
      <group ref={innerGroupRef} position={transform.position} scale={transform.scale}>
        <primitive object={scene} dispose={null} />
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

    const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
    gradient.addColorStop(0, "rgba(20, 10, 36, 0.72)");
    gradient.addColorStop(0.28, "rgba(35, 12, 60, 0.50)");
    gradient.addColorStop(0.6, "rgba(59, 15, 95, 0.22)");
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

  const groundY = isMobile ? 0.478 : 0.378;

  return (
    <group position={[0, groundY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[2.2, 1.8]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.1, 0.75, 1]} renderOrder={-1}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

class PreloadErrorBoundary extends Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[HeroModel] Preloader error:", error);
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Fully warms one model on the GPU, spread over many frames so no single frame is heavy:
 *   1. CPU prep (pose + skin warmth)
 *   2. upload textures, ONE per frame
 *   3. compile shader programs asynchronously (non-blocking when supported)
 *   4. render the model for a few frames at ~zero size so geometry buffers are uploaded too
 * After this, showing the model costs nothing: no upload, no compile, no first-frame hitch.
 */
function ModelWarmer({
  modelItem,
  onDone,
}: {
  modelItem: HeroModelItem;
  onDone: (id: string) => void;
}) {
  const { scene } = useGLTF(modelItem.path, DRACO_URL);
  const { gl, camera, scene: rootScene } = useThree();

  const [attached, setAttached] = useState(false);
  const stageRef = useRef<"prepare" | "textures" | "compile" | "render" | "done">("prepare");
  const texturesRef = useRef<THREE.Texture[]>([]);
  const texIdxRef = useRef(0);
  const framesRef = useRef(0);
  const aliveRef = useRef(true);
  const attachedRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // While attached, make sure nothing gets frustum-culled so everything is really drawn (and uploaded)
  useEffect(() => {
    if (!attached) return;
    const saved: Array<[THREE.Object3D, boolean]> = [];
    scene.traverse((o) => {
      saved.push([o, o.frustumCulled]);
      o.frustumCulled = false;
    });
    attachedRef.current = true;
    return () => {
      attachedRef.current = false;
      for (const [o, v] of saved) o.frustumCulled = v;
    };
  }, [attached, scene]);

  useFrame(() => {
    switch (stageRef.current) {
      case "prepare": {
        ensureScenePrepared(scene);
        getModelTransform(scene); // compute while the scene is still detached
        texturesRef.current = collectTextures(scene);
        stageRef.current = "textures";
        break;
      }
      case "textures": {
        const tex = texturesRef.current[texIdxRef.current];
        texIdxRef.current += 1;
        if (tex) {
          try {
            gl.initTexture(tex);
          } catch {
            /* headless */
          }
        } else {
          stageRef.current = "compile";
          const r = gl as THREE.WebGLRenderer & {
            compileAsync?: (s: THREE.Object3D, c: THREE.Camera, t?: THREE.Scene) => Promise<unknown>;
          };
          let job: Promise<unknown>;
          try {
            job = r.compileAsync
              ? r.compileAsync(scene, camera, rootScene)
              : Promise.resolve(gl.compile(scene, camera, rootScene));
          } catch {
            job = Promise.resolve();
          }
          job
            .catch(() => undefined)
            .then(() => {
              if (!aliveRef.current) return;
              stageRef.current = "render";
              setAttached(true);
            });
        }
        break;
      }
      case "render": {
        if (attachedRef.current) {
          framesRef.current += 1;
          if (framesRef.current >= 3) {
            stageRef.current = "done";
            onDone(modelItem.id);
          }
        }
        break;
      }
      default:
        break;
    }
  });

  if (!attached) return null;

  return (
    <group position={[0, 0.5, 0]} scale={0.0001}>
      <primitive object={scene} dispose={null} />
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
  const currentId = activeModelId || HERO_MODELS.find((m) => m.gender === gender)?.id || HERO_MODELS[0].id;

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768 || ("ontouchstart" in window && window.innerWidth < 1024);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || ("ontouchstart" in window && window.innerWidth < 1024));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep parent callbacks stable (HeroSection passes new inline functions every render)
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const onInteractionChangeRef = useRef(onInteractionChange);
  useEffect(() => {
    onInteractionChangeRef.current = onInteractionChange;
  }, [onInteractionChange]);

  // Transition state
  const [activeId, setActiveId] = useState(currentId);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [transitionDir, setTransitionDir] = useState<-1 | 1>(direction);

  // Models that are fully GPU-ready (per Canvas instance)
  const [readyIds, setReadyIds] = useState<string[]>([]);
  const markReady = useCallback((id: string) => {
    setReadyIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const firstModelReady = readyIds.length > 0;

  // Start downloading the other avatars only AFTER the first one is on screen,
  // so the first avatar gets the full network bandwidth.
  useEffect(() => {
    if (!firstModelReady) return;
    const id = setTimeout(() => {
      HERO_MODELS.forEach((m) => preloadHeroModel(m.path));
    }, 150);
    return () => clearTimeout(id);
  }, [firstModelReady]);

  // Spin unlocks as soon as the NEXT avatar is GPU-ready (or after a short give-up timer),
  // then stays unlocked. Remaining avatars keep warming in the background.
  const nextInCycleId = useMemo(() => {
    const idx = HERO_MODELS.findIndex((m) => m.id === activeId);
    return HERO_MODELS[(idx + 1) % HERO_MODELS.length].id;
  }, [activeId]);

  const [spinUnlocked, setSpinUnlocked] = useState(false);
  useEffect(() => {
    if (!firstModelReady) return;
    const timer = setTimeout(() => setSpinUnlocked(true), SPIN_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [firstModelReady]);
  const spinEnabled = spinUnlocked;
  const nextReady = readyIds.includes(nextInCycleId);

  // Immediate handoff during render when the requested model is already GPU-ready
  const [prevCurrentId, setPrevCurrentId] = useState(currentId);
  if (currentId !== prevCurrentId) {
    setPrevCurrentId(currentId);
    if (readyIds.includes(currentId)) {
      setExitingId(activeId);
      setActiveId(currentId);
      setTransitionDir(direction);
    }
  }

  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const directionRef = useRef(direction);
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const handleTargetReady = useCallback((readyId: string) => {
    if (readyId === activeIdRef.current) return;
    setExitingId(activeIdRef.current);
    setActiveId(readyId);
    setTransitionDir(directionRef.current);
  }, []);

  // Handoff as soon as the target becomes ready (or after a long fallback)
  useEffect(() => {
    if (currentId === activeId) return;
    if (readyIds.includes(currentId)) {
      handleTargetReady(currentId);
      return;
    }
    const timer = setTimeout(() => handleTargetReady(currentId), 10000);
    return () => clearTimeout(timer);
  }, [currentId, activeId, readyIds, handleTargetReady]);

  const handleExitComplete = useCallback((id: string) => {
    setExitingId((prev) => (prev === id ? null : prev));
  }, []);

  // Which model should the background warmer work on right now?
  //  - the requested target first (user clicked something not ready)
  //  - otherwise the closest upcoming model that isn't warm yet
  //  - never during an active transition
  const targetId = currentId !== activeId ? currentId : null;
  let warmId: string | null = null;
  if (firstModelReady) {
    if (targetId && !readyIds.includes(targetId)) {
      warmId = targetId;
    } else if (!exitingId) {
      const activeIdx = HERO_MODELS.findIndex((m) => m.id === activeId);
      warmId =
        HERO_MODELS.map((_, o) => HERO_MODELS[(activeIdx + 1 + o) % HERO_MODELS.length]).find(
          (m) => !readyIds.includes(m.id) && m.id !== activeId
        )?.id ?? null;
    }
  }
  const warmModel = useMemo(
    () => (warmId ? HERO_MODELS.find((m) => m.id === warmId) || null : null),
    [warmId]
  );

  const activeModel = useMemo(() => HERO_MODELS.find((m) => m.id === activeId) || HERO_MODELS[0], [activeId]);
  const exitingModel = useMemo(
    () => (exitingId ? HERO_MODELS.find((m) => m.id === exitingId) || null : null),
    [exitingId]
  );

  const reportedReadyRef = useRef(false);
  const handleActiveModelRendered = useCallback(
    (id: string) => {
      markReady(id);
      if (!reportedReadyRef.current) {
        reportedReadyRef.current = true;
        onReadyRef.current?.();
      }
    },
    [markReady]
  );

  const [isTabVisible, setIsTabVisible] = useState(() =>
    typeof document !== "undefined" ? !document.hidden : true
  );
  const [isOrbitInteracting, setIsOrbitInteracting] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleInteractionStart = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setIsOrbitInteracting(true);
    onInteractionChangeRef.current?.(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsOrbitInteracting(false);
      onInteractionChangeRef.current?.(false);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const activeAvatarGroupRef = useRef<THREE.Group | null>(null);
  const userInteracting = isInteracting || isOrbitInteracting;

  return (
    <Canvas
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
          },
          false
        );
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
      dpr={isMobile ? [1, 1.25] : [1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1.5, 1.5)]}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      {/* Balanced Studio Lighting (no real-time shadow pass: the floor contact shadow is baked) */}
      <ambientLight intensity={0.48} color="#f8f6ff" />
      <directionalLight position={[3.5, 6.0, 4.5]} intensity={0.95} color="#fffaf2" />
      <directionalLight position={[-3.5, 5.0, 4.2]} intensity={0.35} color="#ede9fe" />
      <directionalLight position={[0, 1.6, 4.0]} intensity={0.45} color="#ffffff" />
      <directionalLight position={[0, 6.0, -3.5]} intensity={1.05} color="#faf5ff" />

      <CinematicFollowspot activeAvatarGroupRef={activeAvatarGroupRef} isMobile={isMobile} />
      <ResponsiveCamera />

      <AvatarFloorShadow isMobile={isMobile} />

      <TurntableGroup
        activeModelId={activeId}
        is3DReady={is3DReady}
        spinEnabled={spinEnabled}
        onCycleNext={onCycleNext}
        isUserInteracting={userInteracting}
        rotateRef={rotateRef}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        nextReady={nextReady}
      >
        {/* Each avatar has its own Suspense so one loading never hides the other */}
        <Suspense key={activeModel.id} fallback={null}>
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

        {exitingModel && exitingModel.id !== activeModel.id && (
          <Suspense key={exitingModel.id} fallback={null}>
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

        {/* Background GPU warmer: one model at a time, spread across frames */}
        {warmModel && warmModel.id !== activeId && !readyIds.includes(warmModel.id) && (
          <PreloadErrorBoundary key={`warm-${warmModel.id}`} onError={() => markReady(warmModel.id)}>
            <Suspense fallback={null}>
              <ModelWarmer modelItem={warmModel} onDone={markReady} />
            </Suspense>
          </PreloadErrorBoundary>
        )}
      </TurntableGroup>

      <OrbitControls
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