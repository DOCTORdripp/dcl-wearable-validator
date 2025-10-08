// src/lib/runValidation.ts

import type { 
  ModelStats, 
  UserSelection, 
  ValidationReport, 
  RuleResult, 
  RuleSeverity 
} from './types';
import { computeTriangleBudget, getBudgetConfig } from './budgets';

/**
 * Run validation rules against model statistics
 */
export function runValidation(
  modelStats: ModelStats,
  userSelection: UserSelection,
  fileName: string
): ValidationReport {
  const results: RuleResult[] = [];
  
  // Calculate applied budget
  const appliedTriangleBudget = computeTriangleBudget(userSelection);
  const budgetConfig = getBudgetConfig(userSelection.targetSlot);
  
  // Geometry rules
  results.push(validateTriangles(modelStats, appliedTriangleBudget));
  
  // Materials rules
  results.push(validateMaterials(modelStats, budgetConfig.maxMaterials));
  
  // Textures rules
  results.push(validateTextures(modelStats, budgetConfig.maxTextures));
  results.push(validateTextureSizes(modelStats));
  results.push(validateTextureSquare(modelStats));
  
  // Map usage rules
  results.push(validateNormalMaps(modelStats));
  results.push(validateMetallicRoughnessMaps(modelStats));
  
  // Normals rules - DISABLED due to inaccurate results
  // results.push(validateInvertedNormals(modelStats));
  
  // Skin weights rules
  if (modelStats.skinning) {
    results.push(validateSkinWeights(modelStats));
  }
  
  // Dimensions rules
  results.push(validateDimensions(modelStats));
  
  // File integrity rules
  results.push(validateFileIntegrity(modelStats));
  results.push(validateFileSize(modelStats));
  
  // Calculate overall result
  const overall = calculateOverallResult(results);
  
  // Generate notes
  const notes = generateNotes(modelStats, userSelection);
  
  return {
    overall,
    targetSlot: userSelection.targetSlot,
    appliedTriangleBudget,
    maxMaterials: budgetConfig.maxMaterials,
    maxTextures: budgetConfig.maxTextures,
    results,
    notes,
    fileName,
    modelStats,
  };
}

function validateTriangles(modelStats: ModelStats, maxTriangles: number): RuleResult {
  const actual = modelStats.triangleCount;
  const result: RuleSeverity = actual <= maxTriangles ? 'PASS' : 'FAIL';
  
  return {
    id: 'triangles',
    category: 'Geometry',
    expected: `≤ ${maxTriangles.toLocaleString()} triangles`,
    actual: `${actual.toLocaleString()} triangles`,
    result,
    tip: result === 'FAIL' 
      ? `Reduce triangles by ${Math.ceil(((actual - maxTriangles) / actual) * 100)}%`
      : undefined,
  };
}

function validateMaterials(modelStats: ModelStats, maxMaterials: number): RuleResult {
  const actual = modelStats.materialCountExclAvatarSkin;
  const result: RuleSeverity = actual <= maxMaterials ? 'PASS' : 'FAIL';
  
  return {
    id: 'materials',
    category: 'Materials',
    expected: `≤ ${maxMaterials} materials`,
    actual: `${actual} materials`,
    result,
    tip: result === 'FAIL' 
      ? `Remove ${actual - maxMaterials} material(s) or combine similar materials`
      : undefined,
  };
}

function validateTextures(modelStats: ModelStats, maxTextures: number): RuleResult {
  const actual = modelStats.usedTextureCount;
  const result: RuleSeverity = actual <= maxTextures ? 'PASS' : 'FAIL';
  
  return {
    id: 'textures',
    category: 'Textures/Maps',
    expected: `≤ ${maxTextures} textures`,
    actual: `${actual} textures`,
    result,
    tip: result === 'FAIL' 
      ? `Remove ${actual - maxTextures} texture(s) or combine similar textures`
      : undefined,
  };
}

function validateTextureSizes(modelStats: ModelStats): RuleResult {
  const oversizedTextures = modelStats.textures.filter(t => 
    t.width > 1024 || t.height > 1024
  );
  
  const result: RuleSeverity = oversizedTextures.length === 0 ? 'PASS' : 'FAIL';
  
  return {
    id: 'texture-sizes',
    category: 'Textures/Maps',
    expected: 'All textures ≤ 1024×1024',
    actual: oversizedTextures.length === 0 
      ? 'All textures within size limit'
      : `${oversizedTextures.length} texture(s) exceed 1024×1024`,
    result,
    tip: result === 'FAIL' 
      ? `Resize ${oversizedTextures.map(t => t.name).join(', ')} to 1024×1024 or smaller`
      : undefined,
  };
}

function validateTextureSquare(modelStats: ModelStats): RuleResult {
  const nonSquareTextures = modelStats.textures.filter(t => t.width !== t.height);
  
  const result: RuleSeverity = nonSquareTextures.length === 0 ? 'PASS' : 'WARN';
  
  return {
    id: 'texture-square',
    category: 'Textures/Maps',
    expected: 'All textures are square (recommended)',
    actual: nonSquareTextures.length === 0 
      ? 'All textures are square'
      : `${nonSquareTextures.length} texture(s) are not square`,
    result,
    tip: result === 'WARN' 
      ? `Make ${nonSquareTextures.map(t => t.name).join(', ')} square for better performance (optional)`
      : undefined,
  };
}

function validateNormalMaps(modelStats: ModelStats): RuleResult {
  const result: RuleSeverity = !modelStats.hasNormalMaps ? 'PASS' : 'WARN';
  
  return {
    id: 'normal-maps',
    category: 'Textures/Maps',
    expected: 'No normal maps (DCL uses toon shader)',
    actual: modelStats.hasNormalMaps ? 'Normal maps detected' : 'No normal maps',
    result,
    tip: result === 'WARN' 
      ? 'Remove normal maps - DCL uses toon shader that doesn\'t benefit from normal maps'
      : undefined,
  };
}

function validateMetallicRoughnessMaps(modelStats: ModelStats): RuleResult {
  const result: RuleSeverity = !modelStats.hasMetallicRoughnessMaps ? 'PASS' : 'WARN';
  
  return {
    id: 'metallic-roughness-maps',
    category: 'Textures/Maps',
    expected: 'No metallic/roughness maps (DCL uses toon shader)',
    actual: modelStats.hasMetallicRoughnessMaps ? 'Metallic/roughness maps detected' : 'No metallic/roughness maps',
    result,
    tip: result === 'WARN' 
      ? 'Remove metallic/roughness maps - DCL uses toon shader that doesn\'t benefit from PBR maps'
      : undefined,
  };
}


// Normals validation disabled due to inaccurate results
// function validateInvertedNormals(modelStats: ModelStats): RuleResult { ... }

function validateSkinWeights(modelStats: ModelStats): RuleResult {
  if (!modelStats.skinning) {
    return {
      id: 'skin-weights',
      category: 'Skin Weights',
      expected: 'Valid skin weights',
      actual: 'No skinning data',
      result: 'PASS',
    };
  }
  
  const { totalVertices, badWeightVertices } = modelStats.skinning;
  const badRatio = badWeightVertices / totalVertices;
  
  let result: RuleSeverity;
  let tip: string | undefined;
  
  if (badRatio > 0.03) {
    result = 'FAIL';
    tip = 'Fix skin weights - more than 3% of vertices have invalid weights';
  } else if (badRatio > 0.005) {
    result = 'WARN';
    tip = 'Some vertices have invalid skin weights - check weight painting';
  } else {
    result = 'PASS';
  }
  
  return {
    id: 'skin-weights',
    category: 'Skin Weights',
    expected: '≤ 0.5% vertices with bad weights',
    actual: `${badWeightVertices}/${totalVertices} vertices (${(badRatio * 100).toFixed(2)}%)`,
    result,
    tip,
  };
}

function validateDimensions(modelStats: ModelStats): RuleResult {
  const { width, height, depth } = modelStats.bbox;
  const maxWidth = 2.42;
  const maxHeight = 2.42;
  const maxDepth = 1.4;
  
  const exceedsWidth = width > maxWidth;
  const exceedsHeight = height > maxHeight;
  const exceedsDepth = depth > maxDepth;
  
  const result: RuleSeverity = (exceedsWidth || exceedsHeight || exceedsDepth) ? 'FAIL' : 'PASS';
  
  return {
    id: 'dimensions',
    category: 'Dimensions',
    expected: `≤ ${maxWidth}m × ${maxHeight}m × ${maxDepth}m`,
    actual: `${width.toFixed(2)}m × ${height.toFixed(2)}m × ${depth.toFixed(2)}m`,
    result,
    tip: result === 'FAIL' 
      ? `Scale down model to fit within ${maxWidth}m × ${maxHeight}m × ${maxDepth}m bounds`
      : undefined,
  };
}

function validateFileIntegrity(modelStats: ModelStats): RuleResult {
  // Basic integrity checks
  const hasZeroTriangles = modelStats.triangleCount === 0;
  const hasNoMaterials = modelStats.materialCountExclAvatarSkin === 0;
  
  const issues: string[] = [];
  if (hasZeroTriangles) issues.push('No triangles found');
  if (hasNoMaterials) issues.push('No materials found');
  
  const result: RuleSeverity = issues.length === 0 ? 'PASS' : 'FAIL';
  
  return {
    id: 'file-integrity',
    category: 'File Integrity',
    expected: 'Valid model structure',
    actual: issues.length === 0 ? 'Model structure is valid' : issues.join(', '),
    result,
    tip: result === 'FAIL' 
      ? 'Check model export - ensure it contains geometry and materials'
      : undefined,
  };
}

function validateFileSize(modelStats: ModelStats): RuleResult {
  const fileSizeMB = modelStats.fileSizeBytes / (1024 * 1024);
  const maxSizeMB = 3; // 3MB hard limit
  const recommendedSizeMB = 1; // 1MB soft recommendation
  
  let result: RuleSeverity;
  let tip: string | undefined;
  
  if (fileSizeMB > maxSizeMB) {
    result = 'FAIL';
    tip = `File size exceeds DCL limit of ${maxSizeMB}MB. Reduce file size by optimizing textures or simplifying geometry.`;
  } else if (fileSizeMB > recommendedSizeMB) {
    result = 'WARN';
    tip = `File size is ${fileSizeMB.toFixed(2)}MB. For best performance, keep single items under ${recommendedSizeMB}MB (can be up to 2MB if thumbnail is under 1MB).`;
  } else {
    result = 'PASS';
  }
  
  return {
    id: 'file-size',
    category: 'File Integrity',
    expected: `≤ ${maxSizeMB}MB (recommended: ≤ ${recommendedSizeMB}MB)`,
    actual: `${fileSizeMB.toFixed(2)}MB`,
    result,
    tip,
  };
}

function calculateOverallResult(results: RuleResult[]): RuleSeverity {
  const hasFail = results.some(r => r.result === 'FAIL');
  const hasWarn = results.some(r => r.result === 'WARN');
  
  if (hasFail) return 'FAIL';
  if (hasWarn) return 'WARN';
  return 'PASS';
}

function generateNotes(_modelStats: ModelStats, userSelection: UserSelection): string[] {
  const notes: string[] = [];
  
  // Helmet special rule note
  if (userSelection.targetSlot === 'helmet' && 
      userSelection.hiddenSlots.length > 0) {
    notes.push('Helmet with hidden slots: triangle budget combines hidden slot budgets.');
  }
  
  // Hand accessory note
  if (userSelection.targetSlot === 'hands' && userSelection.handHidesBase) {
    notes.push('Hand accessory hides base hand: triangle budget increased to 1.5k.');
  }
  
  return notes;
}
