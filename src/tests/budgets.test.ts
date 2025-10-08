// src/tests/budgets.test.ts

import { describe, it, expect } from 'vitest';
import { 
  computeTriangleBudget, 
  getBudgetConfig, 
  getAvailableTargetSlots,
  getAvailableHiddenSlots,
  isHelmetSpecialRule,
  getSkinRequiredHiddenSlots
} from '../lib/budgets';
import type { UserSelection } from '../lib/types';

describe('Budget Calculations', () => {
  describe('computeTriangleBudget', () => {
    it('should return base budget for single slot', () => {
      const selection: UserSelection = {
        targetSlot: 'hat',
        hiddenSlots: [],
        handHidesBase: false,
      };
      
      expect(computeTriangleBudget(selection)).toBe(1500);
    });

    it('should combine budgets for hidden slots', () => {
      const selection: UserSelection = {
        targetSlot: 'upper_body',
        hiddenSlots: ['lower_body', 'feet'],
        handHidesBase: false,
      };
      
      // upper_body (1500) + lower_body (1500) + feet (1500) = 4500
      expect(computeTriangleBudget(selection)).toBe(4500);
    });

    it('should handle hands with base hand hidden', () => {
      const selection: UserSelection = {
        targetSlot: 'hands',
        hiddenSlots: [],
        handHidesBase: true,
      };
      
      expect(computeTriangleBudget(selection)).toBe(1500);
    });

    it('should apply helmet special rule when all head slots are hidden', () => {
      const selection: UserSelection = {
        targetSlot: 'helmet',
        hiddenSlots: ['head', 'earring', 'eyewear', 'tiara', 'hat', 'facial_hair', 'hair', 'top_head'],
        handHidesBase: false,
      };
      
      expect(computeTriangleBudget(selection)).toBe(4000);
    });

    it('should not apply helmet special rule when not all head slots are hidden', () => {
      const selection: UserSelection = {
        targetSlot: 'helmet',
        hiddenSlots: ['head', 'earring', 'eyewear'], // missing some head slots
        handHidesBase: false,
      };
      
      // helmet (1500) + head (500) + earring (500) + eyewear (500) = 3000
      expect(computeTriangleBudget(selection)).toBe(3000);
    });

    it('should handle skin slot with no hidden slots', () => {
      const selection: UserSelection = {
        targetSlot: 'skin',
        hiddenSlots: [],
        handHidesBase: false,
      };
      
      expect(computeTriangleBudget(selection)).toBe(5000);
    });

    it('should handle skin slot with hidden slots - always returns 5000', () => {
      const selection: UserSelection = {
        targetSlot: 'skin',
        hiddenSlots: ['hat', 'helmet', 'upper_body', 'lower_body'],
        handHidesBase: false,
      };
      
      // Skin always returns 5000 regardless of hidden slots
      expect(computeTriangleBudget(selection)).toBe(5000);
    });
  });

  describe('getBudgetConfig', () => {
    it('should return correct config for hat', () => {
      const config = getBudgetConfig('hat');
      expect(config.baseTriangles).toBe(1500);
      expect(config.maxMaterials).toBe(2);
      expect(config.maxTextures).toBe(2);
    });

    it('should return correct config for skin', () => {
      const config = getBudgetConfig('skin');
      expect(config.baseTriangles).toBe(5000);
      expect(config.maxMaterials).toBe(2);
      expect(config.maxTextures).toBe(5);
    });

    it('should return helmet config with special rule', () => {
      const config = getBudgetConfig('helmet');
      expect(config.baseTriangles).toBe(1500);
      expect(config.maxMaterials).toBe(2);
      expect(config.maxTextures).toBe(2);
      expect(config.helmetAllHeadHiddenTriangles).toBe(4000);
    });
  });

  describe('getAvailableTargetSlots', () => {
    it('should return all available target slots', () => {
      const slots = getAvailableTargetSlots();
      expect(slots).toContain('hat');
      expect(slots).toContain('helmet');
      expect(slots).toContain('skin');
      expect(slots).toContain('hands');
      expect(slots).not.toContain('head'); // head is not a valid target slot
    });
  });

  describe('getAvailableHiddenSlots', () => {
    it('should return all slots except target slot', () => {
      const slots = getAvailableHiddenSlots('hat');
      expect(slots).not.toContain('hat');
      expect(slots).toContain('helmet');
      expect(slots).toContain('skin');
    });

    it('should return empty array when no target slot', () => {
      const slots = getAvailableHiddenSlots(null);
      expect(slots).toEqual([]);
    });
  });

  describe('isHelmetSpecialRule', () => {
    it('should return true for helmet with all head slots hidden', () => {
      const selection: UserSelection = {
        targetSlot: 'helmet',
        hiddenSlots: ['head', 'earring', 'eyewear', 'tiara', 'hat', 'facial_hair', 'hair', 'top_head'],
        handHidesBase: false,
      };
      
      expect(isHelmetSpecialRule(selection)).toBe(true);
    });

    it('should return false for non-helmet slot', () => {
      const selection: UserSelection = {
        targetSlot: 'hat',
        hiddenSlots: ['head', 'earring', 'eyewear', 'tiara', 'hat', 'facial_hair', 'hair', 'top_head'],
        handHidesBase: false,
      };
      
      expect(isHelmetSpecialRule(selection)).toBe(false);
    });

    it('should return false when not all head slots are hidden', () => {
      const selection: UserSelection = {
        targetSlot: 'helmet',
        hiddenSlots: ['head', 'earring'], // missing some head slots
        handHidesBase: false,
      };
      
      expect(isHelmetSpecialRule(selection)).toBe(false);
    });
  });

  describe('getSkinRequiredHiddenSlots', () => {
    it('should return all slots except skin', () => {
      const requiredSlots = getSkinRequiredHiddenSlots();
      const allSlots = getAvailableTargetSlots();
      
      expect(requiredSlots).not.toContain('skin');
      expect(requiredSlots).toHaveLength(allSlots.length - 1);
      expect(requiredSlots).toContain('hat');
      expect(requiredSlots).toContain('helmet');
      expect(requiredSlots).toContain('upper_body');
      expect(requiredSlots).toContain('lower_body');
      expect(requiredSlots).toContain('feet');
      expect(requiredSlots).toContain('hair');
      expect(requiredSlots).toContain('hands');
    });
  });
});
