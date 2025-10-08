// src/lib/budgets.ts

import type { Slot, BudgetConfig, UserSelection } from './types';

// Base triangle budgets per slot
export const BASE_TRI_BUDGET: Record<Slot, number> = {
  hat: 1500,
  helmet: 1500,
  upper_body: 1500,
  lower_body: 1500,
  feet: 1500,
  hair: 1500,
  mask: 500,
  eyewear: 500,
  earring: 500,
  tiara: 500,
  top_head: 500,
  facial_hair: 500,
  hands: 1000,
  skin: 5000,
  head: 500, // Not typically used as target, but included for completeness
};

// Helmet special case: slots that can be hidden by helmet
export const HELMET_HIDE_SET: Slot[] = [
  'head',
  'earring',
  'eyewear',
  'tiara',
  'hat',
  'facial_hair',
  'hair',
  'top_head',
];

// Base budget configurations
export const BASE_BUDGET_CONFIG: Record<Slot, BudgetConfig> = {
  hat: { baseTriangles: 1500, maxMaterials: 2, maxTextures: 2 },
  helmet: { 
    baseTriangles: 1500, 
    maxMaterials: 2, 
    maxTextures: 2,
    helmetAllHeadHiddenTriangles: 4000 
  },
  upper_body: { baseTriangles: 1500, maxMaterials: 2, maxTextures: 2 },
  lower_body: { baseTriangles: 1500, maxMaterials: 2, maxTextures: 2 },
  feet: { baseTriangles: 1500, maxMaterials: 2, maxTextures: 2 },
  hair: { baseTriangles: 1500, maxMaterials: 2, maxTextures: 2 },
  mask: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
  eyewear: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
  earring: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
  tiara: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
  top_head: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
  facial_hair: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
  hands: { baseTriangles: 1000, maxMaterials: 2, maxTextures: 2 },
  skin: { baseTriangles: 5000, maxMaterials: 2, maxTextures: 5 },
  head: { baseTriangles: 500, maxMaterials: 2, maxTextures: 2 },
};

/**
 * Compute the triangle budget for a given user selection
 */
export function computeTriangleBudget(selection: UserSelection): number {
  const { targetSlot, hiddenSlots, handHidesBase } = selection;

  // Special case: skin - always 5000 triangles, no combining with hidden slots
  if (targetSlot === 'skin') {
    return 5000;
  }

  // Special case: hands with base hand hidden
  if (targetSlot === 'hands' && handHidesBase) {
    return 1500;
  }

  // Get base budget for target slot
  const baseBudget = BASE_TRI_BUDGET[targetSlot];
  
  // Add budgets for hidden slots
  let combinedBudget = baseBudget + hiddenSlots.reduce((sum, slot) => {
    return sum + (BASE_TRI_BUDGET[slot] || 0);
  }, 0);

  // Helmet special case: if target is helmet AND all head slots are hidden
  if (targetSlot === 'helmet') {
    const allHeadHidden = HELMET_HIDE_SET.every(slot => hiddenSlots.includes(slot));
    if (allHeadHidden) {
      combinedBudget = 4000; // Override with helmet special budget
    }
  }

  return combinedBudget;
}

/**
 * Get the budget configuration for a slot
 */
export function getBudgetConfig(slot: Slot): BudgetConfig {
  return BASE_BUDGET_CONFIG[slot];
}

/**
 * Get available slots for target selection
 */
export function getAvailableTargetSlots(): Slot[] {
  return [
    'hat',
    'helmet', 
    'upper_body',
    'lower_body',
    'feet',
    'hair',
    'mask',
    'eyewear',
    'earring',
    'tiara',
    'top_head',
    'facial_hair',
    'hands',
    'skin',
  ];
}

/**
 * Get available slots for hidden selection (excludes target slot)
 */
export function getAvailableHiddenSlots(targetSlot: Slot | null): Slot[] {
  if (!targetSlot) return [];
  
  const allSlots = getAvailableTargetSlots();
  return allSlots.filter(slot => slot !== targetSlot);
}

/**
 * Check if helmet special rule applies
 */
export function isHelmetSpecialRule(selection: UserSelection): boolean {
  return selection.targetSlot === 'helmet' && 
         HELMET_HIDE_SET.every(slot => selection.hiddenSlots.includes(slot));
}

/**
 * Get all slots that should be auto-selected for skin target
 * For skin, all other slots must be hidden
 */
export function getSkinRequiredHiddenSlots(): Slot[] {
  return getAvailableTargetSlots().filter(slot => slot !== 'skin');
}
