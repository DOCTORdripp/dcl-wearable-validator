import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/useStore';

// Simple model component that just renders the model
const SimpleModel = ({ model }: { model: THREE.Object3D }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (groupRef.current && model) {
      // Clone the model to avoid modifying the original
      const clonedModel = model.clone();
      
      // Disable frustum culling for all meshes
      clonedModel.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
          child.frustumCulled = false;
        }
      });
      
      // Clear existing children and add the cloned model
      groupRef.current.clear();
      groupRef.current.add(clonedModel);
    }
  }, [model]);

  return <group ref={groupRef} />;
};

// Component to handle camera positioning and centering
const CameraController = ({ model }: { model: THREE.Object3D | null }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const hasPositioned = useRef(false);

  useEffect(() => {
    if (!model || hasPositioned.current) return;

    // Reset positioning flag when model changes
    hasPositioned.current = false;

    // Wait for the model to be added to the scene
    const timer = setTimeout(() => {
      try {
        const box = new THREE.Box3();
        let hasMeshes = false;
        
        // Get all meshes in the model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
            if (child.geometry) {
              hasMeshes = true;
              // Ensure bounding box is computed
              if (!child.geometry.boundingBox) {
                child.geometry.computeBoundingBox();
              }
              if (child.geometry.boundingBox) {
                // Apply the child's world matrix to get world-space bounding box
                const childBox = child.geometry.boundingBox.clone();
                childBox.applyMatrix4(child.matrixWorld);
                box.union(childBox);
              }
            }
          }
        });

        if (hasMeshes && !box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // Calculate distance to fit the model in view with less margin for more zoom
          const distance = Math.max(maxDim * 3, 1.5);
          
          // Position camera straight ahead, front-facing view, 1m higher
          camera.position.set(0, center.y + 1, distance + 1);
          
          // Look at a point 1m higher than the model's center to maintain 90-degree angle
          const targetPoint = new THREE.Vector3(center.x, center.y + 1, center.z);
          camera.lookAt(targetPoint);
          camera.updateProjectionMatrix();
          
          // Set up orbit controls to target the elevated point
          if (controlsRef.current) {
            controlsRef.current.target.copy(targetPoint);
            controlsRef.current.minDistance = distance * 0.1;
            controlsRef.current.maxDistance = distance * 10;
            controlsRef.current.update();
          }
          
          hasPositioned.current = true;
        } else {
          // Fallback: look at the model's position if we can't calculate bounding box
          const modelCenter = model.position.clone();
          camera.position.set(5, 5, 5);
          camera.lookAt(modelCenter);
          camera.updateProjectionMatrix();
          
          if (controlsRef.current) {
            controlsRef.current.target.copy(modelCenter);
            controlsRef.current.update();
          }
          
          hasPositioned.current = true;
        }
      } catch (error) {
        console.warn('Error positioning camera:', error);
        // Fallback positioning
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        hasPositioned.current = true;
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [model, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={0.1}
      maxDistance={1000}
    />
  );
};

const SimpleViewer: React.FC = () => {
  const { model, isDarkMode, modelStats } = useStore();

  return (
    <div className="relative w-full h-full bg-gray-900">
      <Canvas
        camera={{ 
          position: [5, 5, 5], 
          fov: 50,
          near: 0.01,
          far: 1000
        }}
        className="w-full h-full"
        onCreated={({ camera, scene }) => {
          // Ensure we have a good default setup
          camera.position.set(5, 5, 5);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
        }}
      >
        {/* Optimized lighting for better visibility */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1.5}
          castShadow={false}
        />
        <directionalLight 
          position={[-10, 10, -5]} 
          intensity={1.2}
        />
        <directionalLight 
          position={[0, 10, 0]} 
          intensity={1.0}
        />
        <directionalLight 
          position={[5, 5, 10]} 
          intensity={0.8}
        />
        <directionalLight 
          position={[-5, 5, 10]} 
          intensity={0.8}
        />

        {/* Grid for reference */}
        <gridHelper args={[20, 20]} position={[0, 0, 0]} />

        {/* Model */}
        {model && (
          <>
            <SimpleModel model={model} />
            <CameraController model={model} />
          </>
        )}
      </Canvas>

      {/* Model Stats Overlay */}
      {model && modelStats && (
        <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm text-white p-3 rounded-lg text-sm font-mono border border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse"></div>
          <div className="space-y-1 relative">
            <div><strong className="text-cyan-400">Triangles:</strong> <span className="text-white">{modelStats.triangleCount.toLocaleString()}</span></div>
            <div><strong className="text-pink-400">Materials:</strong> <span className="text-white">{modelStats.materialCountExclAvatarSkin}</span></div>
            <div><strong className="text-purple-400">Textures:</strong> <span className="text-white">{modelStats.usedTextureCount}</span></div>
            <div><strong className="text-green-400">Size:</strong> <span className="text-white">{modelStats.bbox.width.toFixed(2)} × {modelStats.bbox.height.toFixed(2)} × {modelStats.bbox.depth.toFixed(2)}</span></div>
            <div><strong className="text-yellow-400">File Size:</strong> <span className="text-white">{(modelStats.fileSizeBytes / 1024).toFixed(1)} KB</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleViewer;
