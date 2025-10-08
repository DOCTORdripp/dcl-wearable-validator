// src/tests/runValidation.test.ts

import { describe, it, expect } from 'vitest';
import { runValidation } from '../lib/runValidation';
import type { ModelStats, UserSelection } from '../lib/types';

describe('Validation Rules', () => {
  const createMockModelStats = (overrides: Partial<ModelStats> = {}): ModelStats => ({
    triangleCount: 1000,
    materialCountExclAvatarSkin: 2,
    textures: [
      { name: 'baseColor', width: 512, height: 512 },
      { name: 'emission', width: 256, height: 256 },
    ],
    usedTextureCount: 2,
    hasNormalMaps: false,
    hasMetallicRoughnessMaps: false,
    alphaModes: ['OPAQUE', 'MASK'],
    bbox: { width: 1.0, height: 2.0, depth: 0.5 },
    normals: { invertedVertexRatio: 0.005, invertedFaceRatio: 0.01 },
    fileSizeBytes: 500 * 1024, // 500KB default
    ...overrides,
  });

  const createMockUserSelection = (overrides: Partial<UserSelection> = {}): UserSelection => ({
    targetSlot: 'hat',
    hiddenSlots: [],
    handHidesBase: false,
    ...overrides,
  });

  describe('Triangle validation', () => {
    it('should PASS when triangle count is within budget', () => {
      const modelStats = createMockModelStats({ triangleCount: 1000 });
      const userSelection = createMockUserSelection({ targetSlot: 'hat' });
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const triangleRule = report.results.find(r => r.id === 'triangles');
      expect(triangleRule?.result).toBe('PASS');
    });

    it('should FAIL when triangle count exceeds budget', () => {
      const modelStats = createMockModelStats({ triangleCount: 2000 });
      const userSelection = createMockUserSelection({ targetSlot: 'hat' });
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const triangleRule = report.results.find(r => r.id === 'triangles');
      expect(triangleRule?.result).toBe('FAIL');
      expect(triangleRule?.tip).toContain('Reduce triangles');
    });
  });

  describe('Material validation', () => {
    it('should PASS when material count is within limit', () => {
      const modelStats = createMockModelStats({ materialCountExclAvatarSkin: 2 });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const materialRule = report.results.find(r => r.id === 'materials');
      expect(materialRule?.result).toBe('PASS');
    });

    it('should FAIL when material count exceeds limit', () => {
      const modelStats = createMockModelStats({ materialCountExclAvatarSkin: 3 });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const materialRule = report.results.find(r => r.id === 'materials');
      expect(materialRule?.result).toBe('FAIL');
    });
  });

  describe('Texture validation', () => {
    it('should PASS when texture count is within limit', () => {
      const modelStats = createMockModelStats({ usedTextureCount: 2 });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const textureRule = report.results.find(r => r.id === 'textures');
      expect(textureRule?.result).toBe('PASS');
    });

    it('should FAIL when texture count exceeds limit', () => {
      const modelStats = createMockModelStats({ usedTextureCount: 3 });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const textureRule = report.results.find(r => r.id === 'textures');
      expect(textureRule?.result).toBe('FAIL');
    });

    it('should PASS when texture size is 1024x1024', () => {
      const modelStats = createMockModelStats({
        textures: [
          { name: 'baseColor', width: 1024, height: 1024 },
        ],
        usedTextureCount: 1,
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const textureSizeRule = report.results.find(r => r.id === 'texture-sizes');
      expect(textureSizeRule?.result).toBe('PASS');
    });

    it('should FAIL when texture size exceeds 1024x1024', () => {
      const modelStats = createMockModelStats({
        textures: [
          { name: 'baseColor', width: 2048, height: 2048 },
        ],
        usedTextureCount: 1,
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const textureSizeRule = report.results.find(r => r.id === 'texture-sizes');
      expect(textureSizeRule?.result).toBe('FAIL');
    });

    it('should WARN when textures are not square', () => {
      const modelStats = createMockModelStats({
        textures: [
          { name: 'baseColor', width: 512, height: 256 },
        ],
        usedTextureCount: 1,
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const textureSquareRule = report.results.find(r => r.id === 'texture-square');
      expect(textureSquareRule?.result).toBe('WARN');
    });
  });

  describe('Map usage validation', () => {
    it('should WARN when normal maps are present', () => {
      const modelStats = createMockModelStats({ hasNormalMaps: true });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const normalMapRule = report.results.find(r => r.id === 'normal-maps');
      expect(normalMapRule?.result).toBe('WARN');
    });

    it('should WARN when metallic/roughness maps are present', () => {
      const modelStats = createMockModelStats({ hasMetallicRoughnessMaps: true });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const metallicRule = report.results.find(r => r.id === 'metallic-roughness-maps');
      expect(metallicRule?.result).toBe('WARN');
    });

    it('should WARN when BLEND alpha mode is used', () => {
      const modelStats = createMockModelStats({ alphaModes: ['BLEND'] });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const alphaRule = report.results.find(r => r.id === 'alpha-mode');
      expect(alphaRule?.result).toBe('WARN');
    });
  });

  // Normals validation disabled due to inaccurate results
  // describe('Normals validation', () => { ... });

  describe('Skin weights validation', () => {
    it('should PASS when skin weights are valid', () => {
      const modelStats = createMockModelStats({
        skinning: { totalVertices: 1000, badWeightVertices: 5 },
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const skinRule = report.results.find(r => r.id === 'skin-weights');
      expect(skinRule?.result).toBe('PASS');
    });

    it('should WARN when skin weights have moderate issues', () => {
      const modelStats = createMockModelStats({
        skinning: { totalVertices: 1000, badWeightVertices: 10 },
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const skinRule = report.results.find(r => r.id === 'skin-weights');
      expect(skinRule?.result).toBe('WARN');
    });

    it('should FAIL when skin weights have severe issues', () => {
      const modelStats = createMockModelStats({
        skinning: { totalVertices: 1000, badWeightVertices: 50 },
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const skinRule = report.results.find(r => r.id === 'skin-weights');
      expect(skinRule?.result).toBe('FAIL');
    });
  });

  describe('Dimensions validation', () => {
    it('should PASS when dimensions are within limits', () => {
      const modelStats = createMockModelStats({
        bbox: { width: 1.0, height: 2.0, depth: 1.0 },
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const dimensionsRule = report.results.find(r => r.id === 'dimensions');
      expect(dimensionsRule?.result).toBe('PASS');
    });

    it('should FAIL when dimensions exceed limits', () => {
      const modelStats = createMockModelStats({
        bbox: { width: 3.0, height: 3.0, depth: 2.0 },
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const dimensionsRule = report.results.find(r => r.id === 'dimensions');
      expect(dimensionsRule?.result).toBe('FAIL');
    });
  });

  describe('File size validation', () => {
    it('should PASS when file size is under 1MB', () => {
      const modelStats = createMockModelStats({
        fileSizeBytes: 500 * 1024, // 500KB
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const fileSizeRule = report.results.find(r => r.id === 'file-size');
      expect(fileSizeRule?.result).toBe('PASS');
    });

    it('should WARN when file size is between 1MB and 3MB', () => {
      const modelStats = createMockModelStats({
        fileSizeBytes: 1.5 * 1024 * 1024, // 1.5MB
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const fileSizeRule = report.results.find(r => r.id === 'file-size');
      expect(fileSizeRule?.result).toBe('WARN');
      expect(fileSizeRule?.tip).toContain('For best performance');
    });

    it('should FAIL when file size exceeds 3MB', () => {
      const modelStats = createMockModelStats({
        fileSizeBytes: 4 * 1024 * 1024, // 4MB
      });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      
      const fileSizeRule = report.results.find(r => r.id === 'file-size');
      expect(fileSizeRule?.result).toBe('FAIL');
      expect(fileSizeRule?.tip).toContain('exceeds DCL limit');
    });
  });

  describe('Overall result calculation', () => {
    it('should return FAIL when any rule fails', () => {
      const modelStats = createMockModelStats({ triangleCount: 2000 });
      const userSelection = createMockUserSelection({ targetSlot: 'hat' });
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      expect(report.overall).toBe('FAIL');
    });

    it('should return WARN when no failures but warnings exist', () => {
      const modelStats = createMockModelStats({ hasNormalMaps: true });
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      expect(report.overall).toBe('WARN');
    });

    it('should return PASS when all rules pass', () => {
      const modelStats = createMockModelStats();
      const userSelection = createMockUserSelection();
      
      const report = runValidation(modelStats, userSelection, 'test.glb');
      expect(report.overall).toBe('PASS');
    });
  });
});
