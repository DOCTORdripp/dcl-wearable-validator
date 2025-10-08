// src/lib/gltfUtils.ts

import * as THREE from 'three';
import type { ModelStats } from './types';

/**
 * Traverse a Three.js object and collect mesh data
 */
export function traverseMeshes(
  object: THREE.Object3D,
  callback: (mesh: THREE.Mesh | THREE.SkinnedMesh) => void
): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
      callback(child);
    }
  });
}

/**
 * Get triangle count from a mesh
 */
export function getTriangleCount(mesh: THREE.Mesh | THREE.SkinnedMesh): number {
  const geometry = mesh.geometry;
  
  if (geometry.index) {
    return geometry.index.count / 3;
  } else {
    const position = geometry.getAttribute('position');
    return position ? position.count / 3 : 0;
  }
}

/**
 * Get bounding box of an object in world space
 */
export function getWorldBoundingBox(object: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  box.setFromObject(object);
  return box;
}

/**
 * Convert Box3 to dimensions in meters
 */
export function box3ToDimensions(box: THREE.Box3): { width: number; height: number; depth: number } {
  const size = box.getSize(new THREE.Vector3());
  return {
    width: size.x,
    height: size.y,
    depth: size.z,
  };
}

/**
 * Extract texture information from a material
 */
export function extractTextureInfo(material: THREE.Material): {
  textures: Array<{ name: string; width: number; height: number }>;
  hasNormalMaps: boolean;
  hasMetallicRoughnessMaps: boolean;
} {
  const textures: Array<{ name: string; width: number; height: number }> = [];
  let hasNormalMaps = false;
  let hasMetallicRoughnessMaps = false;

  // Check for various texture types
  const textureTypes = [
    { prop: 'map', name: 'baseColor' },
    { prop: 'emissiveMap', name: 'emission' },
    { prop: 'normalMap', name: 'normal' },
    { prop: 'metalnessMap', name: 'metallic' },
    { prop: 'roughnessMap', name: 'roughness' },
    { prop: 'aoMap', name: 'ao' },
    { prop: 'displacementMap', name: 'displacement' },
  ];

  for (const { prop, name } of textureTypes) {
    const texture = (material as any)[prop] as THREE.Texture | undefined;
    if (texture && texture.image) {
      const image = texture.image as HTMLImageElement;
      textures.push({
        name,
        width: image.width,
        height: image.height,
      });

      if (name === 'normal') hasNormalMaps = true;
      if (name === 'metallic' || name === 'roughness') hasMetallicRoughnessMaps = true;
    }
  }

  // Check for PBR textures - only if they actually have textures assigned
  if (material instanceof THREE.MeshStandardMaterial) {
    if ((material.metalnessMap && material.metalnessMap.image) || 
        (material.roughnessMap && material.roughnessMap.image)) {
      hasMetallicRoughnessMaps = true;
    }
  }

  return { textures, hasNormalMaps, hasMetallicRoughnessMaps };
}

/**
 * Get alpha mode from material
 */
export function getAlphaMode(material: THREE.Material): 'OPAQUE' | 'MASK' | 'BLEND' {
  if (material.transparent) {
    return material.alphaTest > 0 ? 'MASK' : 'BLEND';
  }
  return 'OPAQUE';
}

/**
 * Analyze a Three.js model and extract statistics
 */
export function analyzeModel(model: THREE.Object3D, fileSizeBytes: number = 0): ModelStats {
  let triangleCount = 0;
  const materials = new Set<THREE.Material>();
  const textures: Array<{ name: string; width: number; height: number }> = [];
  let hasNormalMaps = false;
  let hasMetallicRoughnessMaps = false;
  const alphaModes: Array<'OPAQUE' | 'MASK' | 'BLEND'> = [];
  let totalVertices = 0;
  let badWeightVertices = 0;

  // Traverse all meshes
  traverseMeshes(model, (mesh) => {
    // Count triangles
    triangleCount += getTriangleCount(mesh);

    // Collect materials
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => materials.add(mat));
    } else {
      materials.add(mesh.material);
    }

    // Extract texture info
    const materialArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materialArray.forEach((material) => {
      const textureInfo = extractTextureInfo(material);
      textures.push(...textureInfo.textures);
      if (textureInfo.hasNormalMaps) hasNormalMaps = true;
      if (textureInfo.hasMetallicRoughnessMaps) hasMetallicRoughnessMaps = true;
      alphaModes.push(getAlphaMode(material));
    });

    // Check skinning data
    if (mesh instanceof THREE.SkinnedMesh) {
      const skinningData = analyzeSkinning(mesh);
      totalVertices += skinningData.totalVertices;
      badWeightVertices += skinningData.badWeightVertices;
    }
  });

  // Count materials excluding AvatarSkin_MAT
  const materialCountExclAvatarSkin = Array.from(materials).filter(
    mat => mat.name !== 'AvatarSkin_MAT'
  ).length;

  // Get bounding box
  const bbox = getWorldBoundingBox(model);
  const dimensions = box3ToDimensions(bbox);

  // Analyze normals
  const normalsData = analyzeNormals(model);

  // Count unique textures
  const uniqueTextures = new Set(textures.map(t => `${t.name}-${t.width}-${t.height}`));
  const usedTextureCount = uniqueTextures.size;

  return {
    triangleCount,
    materialCountExclAvatarSkin,
    textures,
    usedTextureCount,
    hasNormalMaps,
    hasMetallicRoughnessMaps,
    alphaModes,
    bbox: dimensions,
    normals: normalsData,
    skinning: totalVertices > 0 ? {
      totalVertices,
      badWeightVertices,
    } : undefined,
    fileSizeBytes,
  };
}

/**
 * Analyze skinning data for a skinned mesh
 */
function analyzeSkinning(mesh: THREE.SkinnedMesh): { totalVertices: number; badWeightVertices: number } {
  const geometry = mesh.geometry;
  const skinIndex = geometry.getAttribute('skinIndex') as THREE.BufferAttribute;
  const skinWeight = geometry.getAttribute('skinWeight') as THREE.BufferAttribute;
  
  if (!skinIndex || !skinWeight) {
    return { totalVertices: 0, badWeightVertices: 0 };
  }

  const totalVertices = skinIndex.count;
  let badWeightVertices = 0;

  for (let i = 0; i < totalVertices; i++) {
    const weights = [
      skinWeight.getX(i),
      skinWeight.getY(i),
      skinWeight.getZ(i),
      skinWeight.getW(i),
    ];

    const indices = [
      skinIndex.getX(i),
      skinIndex.getY(i),
      skinIndex.getZ(i),
      skinIndex.getW(i),
    ];

    // Check for invalid weights
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    const hasInvalidWeights = weights.some(w => isNaN(w) || w < 0) ||
                            weightSum < 0.98 || weightSum > 1.02;

    // Check for invalid joint indices
    const hasInvalidIndices = indices.some(idx => 
      isNaN(idx) || idx < 0 || idx >= (mesh.skeleton?.bones.length || 0)
    );

    if (hasInvalidWeights || hasInvalidIndices) {
      badWeightVertices++;
    }
  }

  return { totalVertices, badWeightVertices };
}

/**
 * Analyze normals for inverted face detection
 * DISABLED - This feature has been removed due to inaccurate results
 */
function analyzeNormals(_model: THREE.Object3D): { invertedVertexRatio: number; invertedFaceRatio: number } {
  // Return zero values to disable normals checking
  return {
    invertedVertexRatio: 0,
    invertedFaceRatio: 0,
  };
}
