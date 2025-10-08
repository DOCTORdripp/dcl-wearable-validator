// src/lib/types.ts

export type Slot =
  | 'hat'
  | 'helmet'
  | 'upper_body'
  | 'lower_body'
  | 'feet'
  | 'hair'
  | 'mask'
  | 'eyewear'
  | 'earring'
  | 'tiara'
  | 'top_head'
  | 'facial_hair'
  | 'hands'
  | 'skin'
  | 'head';

export interface BudgetConfig {
  baseTriangles: number;
  maxMaterials: number;
  maxTextures: number;
  helmetAllHeadHiddenTriangles?: number; // 4000 when condition met
}

export interface UserSelection {
  targetSlot: Slot;
  hiddenSlots: Slot[]; // multi-select
  handHidesBase?: boolean;
}

export interface ModelStats {
  triangleCount: number; // sum across all mesh primitives
  materialCountExclAvatarSkin: number;
  textures: Array<{ name: string; width: number; height: number }>;
  usedTextureCount: number;
  hasNormalMaps: boolean;
  hasMetallicRoughnessMaps: boolean;
  alphaModes: Array<'OPAQUE' | 'MASK' | 'BLEND'>;
  bbox: { width: number; height: number; depth: number };
  normals: { invertedVertexRatio: number; invertedFaceRatio: number };
  skinning?: {
    totalVertices: number;
    badWeightVertices: number; // sum not ~1, NaN, negative, or joint index OOB
  };
  fileSizeBytes: number; // size of the uploaded file in bytes
}

export type RuleSeverity = 'PASS' | 'WARN' | 'FAIL';

export interface RuleResult {
  id: string;
  category:
    | 'Geometry'
    | 'Materials'
    | 'Textures/Maps'
    | 'Normals'
    | 'Skin Weights'
    | 'Dimensions'
    | 'File Integrity';
  expected: string;
  actual: string;
  result: RuleSeverity;
  tip?: string;
}

export interface ValidationReport {
  overall: RuleSeverity;
  targetSlot: Slot;
  appliedTriangleBudget: number;
  maxMaterials: number;
  maxTextures: number;
  results: RuleResult[];
  notes?: string[];
  fileName: string;
  modelStats: ModelStats;
}

export interface AppState {
  // File state
  file: File | null;
  model: THREE.Object3D | null;
  modelStats: ModelStats | null;
  isLoading: boolean;
  error: string | null;

  // User selections
  targetSlot: Slot | null;
  hiddenSlots: Slot[];
  handHidesBase: boolean;

  // UI state
  isDarkMode: boolean;
  showWireframe: boolean;
  materialView: 'none' | 'baseColor' | 'emission' | 'alpha';
  showResults: boolean;

  // Results
  validationReport: ValidationReport | null;
}

export interface AppActions {
  setFile: (file: File | null) => void;
  setModel: (model: THREE.Object3D | null) => void;
  setModelStats: (stats: ModelStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTargetSlot: (slot: Slot | null) => void;
  setHiddenSlots: (slots: Slot[]) => void;
  setHandHidesBase: (hides: boolean) => void;
  toggleDarkMode: () => void;
  setShowWireframe: (show: boolean) => void;
  setMaterialView: (view: 'none' | 'baseColor' | 'emission' | 'alpha') => void;
  setShowResults: (show: boolean) => void;
  setValidationReport: (report: ValidationReport | null) => void;
  reset: () => void;
}
