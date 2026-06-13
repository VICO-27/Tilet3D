import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2, SlidersHorizontal, Footprints } from "lucide-react";
import type { AvatarProfile, BodyMorphs } from "../types/avatar.types";
import { SKIN_TONE_HEX } from "../utils/skinTones";
import {
  prepareAvatar,
  isRigged,
  facingFor,
  type WalkBones,
} from "../utils/avatarRig";
import { buildGarment, recolorGarment, GARMENT_COLORS } from "../utils/garment";

interface Props {
  profile: AvatarProfile;
  morphs: BodyMorphs;
  garmentColor: string;
  onGarmentColorChange: (hex: string) => void;
  onEditClick: () => void;
}

const TARGET_HEIGHT = 1.75;
const SKIN_RE = /skin|body|head|face|neck|arm|leg|hand|torso|skn/i;
const STEP_DIST = 0.1;
const TOTAL_STEPS = 3;
const WORLD_X = new THREE.Vector3(1, 0, 0);
const BONE_KEYS: (keyof WalkBones)[] = [
  "leftThigh",
  "rightThigh",
  "leftShin",
  "rightShin",
  "leftArm",
  "rightArm",
];

export const AvatarStudio: React.FC<Props> = ({
  profile,
  morphs,
  garmentColor,
  onGarmentColorChange,
  onEditClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const fitScaleRef = useRef(1);
  const bonesRef = useRef<WalkBones>({});
  const riggedRef = useRef(false);
  const garmentRef = useRef<THREE.Group | null>(null);
  const garmentColorRef = useRef(garmentColor);
  garmentColorRef.current = garmentColor;
  const restRef = useRef<Partial<Record<keyof WalkBones, THREE.Quaternion>>>({});
  const axisRef = useRef<Partial<Record<keyof WalkBones, THREE.Vector3>>>({});
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameRef = useRef(0);
  const clockRef = useRef(new THREE.Clock());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const walk = useRef({ active: false, phase: 0, steps: 0, dir: 1 as 1 | -1, speed: 0 });

  const [isWalking, setIsWalking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [canWalkLegs, setCanWalkLegs] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const applySkinTone = useCallback((group: THREE.Object3D, tone: string) => {
    const color = new THREE.Color(SKIN_TONE_HEX[tone] || SKIN_TONE_HEX.medium);
    let touched = false;
    const mats: THREE.MeshStandardMaterial[] = [];
    group.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return;
        mats.push(m);
        if (SKIN_RE.test(`${o.name} ${m.name}`)) {
          m.color.set(color);
          m.needsUpdate = true;
          touched = true;
        }
      });
    });
    if (!touched && mats.length) {
      mats[0].color.set(color);
      mats[0].needsUpdate = true;
    }
  }, []);

  const applyMorphs = useCallback((m: BodyMorphs) => {
    const g = avatarGroupRef.current;
    if (!g) return;
    const fit = fitScaleRef.current;
    g.scale.set(fit * m.build, fit * m.height, fit * m.build);
  }, []);

  /** Capture each bone's rest pose + its local axis that maps to world-X (swing). */
  const setupRig = useCallback((group: THREE.Object3D) => {
    group.updateMatrixWorld(true);
    const rest: typeof restRef.current = {};
    const axis: typeof axisRef.current = {};
    BONE_KEYS.forEach((k) => {
      const bone = bonesRef.current[k];
      if (!bone || !bone.parent) return;
      rest[k] = bone.quaternion.clone();
      const pwq = new THREE.Quaternion();
      bone.parent.getWorldQuaternion(pwq);
      axis[k] = WORLD_X.clone().applyQuaternion(pwq.invert()).normalize();
    });
    restRef.current = rest;
    axisRef.current = axis;
  }, []);

  const buildFallback = useCallback(
    (scene: THREE.Scene, tone: string) => {
      const group = new THREE.Group();
      const skin = new THREE.MeshStandardMaterial({
        color: new THREE.Color(SKIN_TONE_HEX[tone] || SKIN_TONE_HEX.medium),
        roughness: 0.6,
      });
      const cloth = new THREE.MeshStandardMaterial({ color: 0xece8f7, roughness: 0.8 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 32), skin);
      head.position.y = 1.6;
      group.add(head);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 8, 24), cloth);
      torso.position.y = 1.15;
      group.add(torso);
      const mkLimb = (x: number, y: number, len: number, r: number) => {
        const j = new THREE.Group();
        j.position.set(x, y, 0);
        const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), skin);
        m.position.y = -len / 2;
        j.add(m);
        group.add(j);
        return j;
      };
      bonesRef.current = {
        leftThigh: mkLimb(-0.1, 0.85, 0.7, 0.07),
        rightThigh: mkLimb(0.1, 0.85, 0.7, 0.07),
        leftArm: mkLimb(-0.26, 1.35, 0.5, 0.05),
        rightArm: mkLimb(0.26, 1.35, 0.5, 0.05),
      };
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      scene.add(group);
      avatarGroupRef.current = group;
      fitScaleRef.current = 1;
      riggedRef.current = true;
      setupRig(group);
      setCanWalkLegs(true);
      applyMorphs(morphs);
      setUsingFallback(true);
      setIsLoading(false);
    },
    [applyMorphs, morphs, setupRig],
  );

  // ── Scene bootstrap ─────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth || 800;
    const H = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xefeafa, 7, 22);

    const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
    camera.position.set(0, 1.35, 4.7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.95, 0);
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 8;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.86;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const pause = () => {
      controls.autoRotate = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    const resumeSoon = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => (controls.autoRotate = true), 3000);
    };
    controls.addEventListener("start", pause);
    controls.addEventListener("end", resumeSoon);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe7e0f5, 0.85));
    const key = new THREE.DirectionalLight(0xfff6ee, 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0008;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 25;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb98cff, 1.3);
    rim.position.set(-5, 4, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-2, 2, 5);
    scene.add(fill);

    // White luxury floor + grid + podium rings + glow
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(16, 64),
      new THREE.MeshStandardMaterial({ color: 0xf4f1fb, roughness: 0.55, metalness: 0.1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(40, 40, 0xb9a9e6, 0xe2dbf3);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    grid.position.y = 0.002;
    scene.add(grid);

    const glowTex = makeRadialTexture("rgba(168,139,250,0.5)", "rgba(168,139,250,0)");
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.85, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.004;
    scene.add(glow);

    [1.0, 1.45, 1.95].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + (i === 0 ? 0.05 : 0.012), 96),
        new THREE.MeshBasicMaterial({
          color: i === 0 ? 0x8b5cf6 : 0xb9a9e6,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: i === 0 ? 0.8 : 0.4,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.006;
      scene.add(ring);
    });

    const shadowTex = makeRadialTexture("rgba(40,20,70,0.45)", "rgba(40,20,70,0)");
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.008;
    scene.add(contact);

    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = Math.random() * 4.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0xa78bfa,
        size: 0.022,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    scene.add(particles);
    particlesRef.current = particles;

    // Load model
    setIsLoading(true);
    setProgress(0);
    setUsingFallback(false);
    walk.current = { active: false, phase: 0, steps: 0, dir: 1, speed: 0 };
    setIsWalking(false);

    const modelPath =
      profile.gender === "male" ? "/models/maleAvatar.glb" : "/models/femaleAvatar.glb";
    const loader = new GLTFLoader();
    let disposed = false;

    loader.load(
      modelPath,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            o.frustumCulled = false;
          }
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= box.min.y;
        fitScaleRef.current = TARGET_HEIGHT / (size.y || TARGET_HEIGHT);

        const group = new THREE.Group();
        group.add(model);
        scene.add(group);
        avatarGroupRef.current = group;

        // Face camera + lower arms to a natural A-pose.
        const bones = prepareAvatar(model, profile.gender);
        bonesRef.current = bones;
        riggedRef.current = isRigged(bones);
        setCanWalkLegs(riggedRef.current);
        setupRig(group);

        // Drape the procedural Habesha garment over the avatar.
        const garment = buildGarment(profile.gender, size.y, garmentColorRef.current);
        group.add(garment);
        garmentRef.current = garment;

        applyMorphs(morphs);
        applySkinTone(group, profile.skinTone);
        setIsLoading(false);
      },
      (e) => {
        if (e.lengthComputable && e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      },
      (err) => {
        console.warn("GLB failed, procedural fallback:", err);
        if (!disposed) buildFallback(scene, profile.skinTone);
      },
    );

    // Gait helper — rotate a bone about world-X on top of its rest pose.
    const _dq = new THREE.Quaternion();
    const swing = (k: keyof WalkBones, angle: number) => {
      const bone = bonesRef.current[k];
      const rest = restRef.current[k];
      const axis = axisRef.current[k];
      if (!bone || !rest || !axis) return;
      _dq.setFromAxisAngle(axis, angle);
      bone.quaternion.copy(rest).premultiply(_dq);
    };

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      const t = clockRef.current.getElapsedTime();
      if (particlesRef.current) {
        particlesRef.current.rotation.y = t * 0.02;
        particlesRef.current.position.y = Math.sin(t * 0.3) * 0.1;
      }

      const g = avatarGroupRef.current;
      const w = walk.current;
      if (g) {
        w.speed += ((w.active ? 1 : 0) - w.speed) * 0.08;
        if (w.speed > 0.002) {
          // Rigged male strides at a normal cadence; the unrigged female glides slowly.
          const cad = riggedRef.current ? 3.2 : 1.7;
          w.phase += delta * cad * w.speed;
          const newSteps = Math.floor(w.phase / Math.PI);
          if (newSteps !== w.steps) {
            w.steps = newSteps;
            if (w.dir === 1 && w.steps >= TOTAL_STEPS) {
              w.dir = -1;
              w.phase = 0;
              w.steps = 0;
            } else if (w.dir === -1 && w.steps >= TOTAL_STEPS) {
              w.active = false;
              setIsWalking(false);
            }
          }
          const s = Math.sin(w.phase) * w.speed;
          if (riggedRef.current) {
            // alternating legs (natural stride) + counter-swinging arms + knee bend
            swing("leftThigh", s * 0.24);
            swing("rightThigh", -s * 0.24);
            swing("leftShin", Math.max(0, -Math.sin(w.phase)) * 0.45 * w.speed);
            swing("rightShin", Math.max(0, Math.sin(w.phase)) * 0.45 * w.speed);
            swing("leftArm", -s * 0.16);
            swing("rightArm", s * 0.16);
          } else {
            // static mesh: a gentle body sway makes the slow glide read as walking
            g.rotation.z = Math.sin(w.phase) * 0.02 * w.speed;
          }
          g.position.z += w.dir * delta * cad * w.speed * STEP_DIST;
          g.position.y = Math.abs(Math.sin(w.phase)) * 0.018 * w.speed;
        } else {
          // settle to rest pose + return to centre
          BONE_KEYS.forEach((k) => {
            const bone = bonesRef.current[k];
            const rest = restRef.current[k];
            if (bone && rest) bone.quaternion.slerp(rest, 0.18);
          });
          g.position.z = THREE.MathUtils.lerp(g.position.z, 0, 0.1);
          g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, 0.1);
          g.position.y = Math.sin(t * 1.4) * 0.004;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = mount.clientWidth || 800;
      const h = mount.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      controls.removeEventListener("start", pause);
      controls.removeEventListener("end", resumeSoon);
      controls.dispose();
      avatarGroupRef.current = null;
      garmentRef.current = null;
      bonesRef.current = {};
      restRef.current = {};
      axisRef.current = {};
      glowTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.gender]);

  useEffect(() => {
    applyMorphs(morphs);
  }, [morphs, applyMorphs]);

  useEffect(() => {
    if (avatarGroupRef.current) applySkinTone(avatarGroupRef.current, profile.skinTone);
  }, [profile.skinTone, applySkinTone]);

  useEffect(() => {
    if (garmentRef.current) recolorGarment(garmentRef.current, garmentColor);
  }, [garmentColor]);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  }, []);

  const toggleWalk = useCallback(() => {
    const w = walk.current;
    if (w.active) {
      w.active = false;
      setIsWalking(false);
    } else {
      w.active = true;
      w.phase = 0;
      w.steps = 0;
      w.dir = 1;
      setIsWalking(true);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 22%, #ffffff 0%, #f3effc 52%, #e6def5 100%)",
      }}
    >
      <div ref={mountRef} className="h-full w-full" />

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            style={{ background: "radial-gradient(circle at 50% 35%, #ffffff, #ece6f8 75%)" }}
          >
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-2 border-plum-200" />
              <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-plum-600" />
            </div>
            <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-plum-700">
              Entering Studio
            </p>
            <div className="mt-3 h-[3px] w-44 overflow-hidden rounded-full bg-plum-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-plum-500 to-plum-700"
                animate={{ width: `${Math.max(progress, 6)}%` }}
                transition={{ ease: "easeOut", duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-[10px] tabular-nums text-ink/40">{progress}%</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute left-6 top-6 z-10"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-plum-600">
            Tilet3D Studio
          </p>
          <p className="display mt-1 text-xl font-semibold capitalize text-ink">
            {profile.nickname}
          </p>
          <p className="text-[11px] font-medium capitalize text-ink/45">
            {profile.gender} · {profile.bodyType} · {profile.height}cm
          </p>
        </motion.div>
      )}

      {!isLoading && (
        <div className="absolute right-6 top-6 z-10 flex gap-2">
          <GlassButton onClick={onEditClick} label="Edit body">
            <SlidersHorizontal className="h-4 w-4" />
          </GlassButton>
          <GlassButton onClick={toggleFullscreen} label="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </GlassButton>
        </div>
      )}

      {/* Fabric colour picker */}
      {!isLoading && (
        <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/75 px-3 py-2 shadow-sm backdrop-blur-md">
            <span className="pl-1 pr-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/45">
              Fabric
            </span>
            {GARMENT_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => onGarmentColorChange(c.hex)}
                title={c.name}
                aria-label={c.name}
                className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                  garmentColor.toLowerCase() === c.hex.toLowerCase()
                    ? "border-plum-600 ring-2 ring-plum-300"
                    : "border-ink/15"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 px-6">
          <div className="flex items-center justify-center gap-3">
            <span className="hidden rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-[10px] font-medium tracking-wide text-ink/60 backdrop-blur-md sm:inline">
              Drag to orbit · scroll to zoom
            </span>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleWalk}
              className={`flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-colors ${
                isWalking
                  ? "border-ink/15 bg-ink text-white"
                  : "border-plum-300 bg-plum-600 text-white hover:bg-plum-500"
              }`}
            >
              <Footprints className="h-4 w-4" />
              {isWalking ? "Stop" : "Walk"}
            </motion.button>
          </div>
        </div>
      )}

      {usingFallback && !isLoading && (
        <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full border border-amber-300/60 bg-amber-50/90 px-4 py-1.5 text-[10px] font-semibold text-amber-700 backdrop-blur-md">
          Preview mannequin (model asset unavailable)
        </div>
      )}
    </div>
  );
};

const GlassButton: React.FC<{
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, label, children }) => (
  <motion.button
    whileHover={{ scale: 1.06 }}
    whileTap={{ scale: 0.94 }}
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink/75 backdrop-blur-md transition-colors hover:bg-white hover:text-plum-600"
  >
    {children}
  </motion.button>
);

function makeRadialTexture(inner: string, outer: string): THREE.Texture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.55, inner.replace(/[\d.]+\)$/, "0.18)"));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
