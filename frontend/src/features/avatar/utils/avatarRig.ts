import * as THREE from "three";
import type { Gender } from "../types/avatar.types";

/**
 * Shared rigging helpers for the GLB avatars (used by both the Fitting Room
 * studio and the home hero). The male mesh is a Mixamo-rigged T-pose that faces
 * away from camera; these utilities turn it to face the viewer and lower the
 * arms into a natural A-pose. All rotations use world-axis math so they work
 * regardless of each bone's local orientation.
 */

export interface WalkBones {
  leftThigh?: THREE.Object3D;
  rightThigh?: THREE.Object3D;
  leftShin?: THREE.Object3D;
  rightShin?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  leftForeArm?: THREE.Object3D;
  rightForeArm?: THREE.Object3D;
}

/** The male scan faces −Z (away); turn it to face the camera. Female faces +Z. */
export function facingFor(gender: Gender): number {
  return gender === "male" ? Math.PI : 0;
}

export function discoverBones(root: THREE.Object3D): WalkBones {
  const b: WalkBones = {};
  root.traverse((o) => {
    const n = o.name.toLowerCase();
    const isL = n.includes("left");
    const isR = n.includes("right");

    if (n.includes("upleg") || n.includes("thigh") || n.includes("upperleg")) {
      if (isL && !b.leftThigh) b.leftThigh = o;
      else if (isR && !b.rightThigh) b.rightThigh = o;
    } else if (
      (n.includes("leg") || n.includes("shin") || n.includes("calf") || n.includes("knee")) &&
      !n.includes("upleg")
    ) {
      if (isL && !b.leftShin) b.leftShin = o;
      else if (isR && !b.rightShin) b.rightShin = o;
    }

    if (n.includes("forearm")) {
      if (isL && !b.leftForeArm) b.leftForeArm = o;
      else if (isR && !b.rightForeArm) b.rightForeArm = o;
    } else if (n.includes("arm")) {
      if (isL && !b.leftArm) b.leftArm = o;
      else if (isR && !b.rightArm) b.rightArm = o;
    }
  });
  return b;
}

export function isRigged(b: WalkBones): boolean {
  return !!(b.leftThigh && b.rightThigh);
}

const DOWN = new THREE.Vector3(0, -1, 0);

/**
 * Rotate the (horizontal, T-pose) upper arms down toward the body.
 * Uses a parent-aware world rotation — `rotateOnWorldAxis` assumes an
 * un-rotated parent, which is false for skeleton bones and was sending the
 * arms UP instead of down.
 */
export function applyAPose(b: WalkBones, amount = 0.85): void {
  const lower = (arm?: THREE.Object3D, fore?: THREE.Object3D) => {
    if (!arm || !arm.parent) return;
    arm.updateWorldMatrix(true, false);
    const child = fore ?? arm.children[0];
    if (!child) return;
    child.updateWorldMatrix(true, false);
    const a = new THREE.Vector3().setFromMatrixPosition(arm.matrixWorld);
    const c = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld);
    const dir = c.sub(a);
    if (dir.lengthSq() < 1e-6) return;
    dir.normalize();
    const axisWorld = dir.clone().cross(DOWN);
    if (axisWorld.lengthSq() < 1e-6) return;
    axisWorld.normalize();
    const angle = dir.angleTo(DOWN) * amount;
    // Convert the world swing axis into the bone's parent frame, then apply.
    const pwq = new THREE.Quaternion();
    arm.parent.getWorldQuaternion(pwq);
    const axisLocal = axisWorld.clone().applyQuaternion(pwq.invert()).normalize();
    const dq = new THREE.Quaternion().setFromAxisAngle(axisLocal, angle);
    arm.quaternion.premultiply(dq);
    arm.updateWorldMatrix(true, false);
  };
  lower(b.leftArm, b.leftForeArm);
  lower(b.rightArm, b.rightForeArm);
}

/** Face the camera + A-pose in one call. Returns discovered bones. */
export function prepareAvatar(root: THREE.Object3D, gender: Gender): WalkBones {
  root.rotation.y = facingFor(gender);
  root.updateMatrixWorld(true);
  const bones = discoverBones(root);
  applyAPose(bones);
  return bones;
}
