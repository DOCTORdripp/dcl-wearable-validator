// src/components/TopFocus.tsx
import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
// import type { OrbitControls as OrbitControlsImpl } from '@react-three/drei';

function validSize(size?: { width: number; height: number }) {
  return !!size && size.width > 2 && size.height > 2;
}

/** Re-aims OrbitControls at the TOP of the model (box.max.y) and positions the camera above/behind it. */
const TopFocus: React.FC<{
  targetRef: React.RefObject<THREE.Object3D>;
  controlsRef: React.RefObject<any>;
  deps: any[];
}> = ({ targetRef, controlsRef, deps }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    let cancelled = false;
    let tries = 0;

    const attempt = () => {
      if (cancelled) return;
      const obj = targetRef.current;
      if (!obj || !validSize(size)) {
        if (tries++ < 30) requestAnimationFrame(attempt);
        return;
      }

      // Measure with world transforms applied
      obj.updateWorldMatrix(true, true);
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) {
        if (tries++ < 30) requestAnimationFrame(attempt);
        return;
      }

      const center = box.getCenter(new THREE.Vector3());
      const top = new THREE.Vector3(center.x, box.max.y, center.z);
      const diag = box.getSize(new THREE.Vector3()).length();

      // Keep current distance if reasonable; otherwise pick a sensible one
      const currentTarget = (controlsRef.current && (controlsRef.current as any).target) || center;
      const currentDist = camera.position.distanceTo(currentTarget);
      const dist = Number.isFinite(currentDist) && currentDist > 0 ? currentDist : Math.max(diag * 0.8, 0.5);

      // A nice "above & back" view direction (tweak y for more/less top-down)
      const dir = new THREE.Vector3(0.35, 0.7, 1).normalize();
      const pos = top.clone().add(dir.multiplyScalar(dist));

      camera.position.copy(pos);
      camera.up.set(0, 1, 0);
      camera.lookAt(top);
      camera.near = Math.max(0.01, dist * 0.01);
      camera.far = Math.max(camera.near + 1, dist * 10);
      camera.updateProjectionMatrix();

      if (controlsRef.current) {
        controlsRef.current.target.copy(top);
        controlsRef.current.update();
      }
    };

    // defer one frame so Bounds/Center have applied their transforms
    requestAnimationFrame(attempt);
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return null;
};

export default TopFocus;
