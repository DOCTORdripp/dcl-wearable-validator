// src/tests/computeBudget.test.ts

import { describe, it, expect } from 'vitest';
import { computeTriangleBudget } from '../lib/budgets';
import type { UserSelection } from '../lib/types';

describe('computeTriangleBudget', () => {
  it('should handle edge case with empty hidden slots', () => {
    const selection: UserSelection = {
      targetSlot: 'mask',
      hiddenSlots: [],
      handHidesBase: false,
    };
    
    expect(computeTriangleBudget(selection)).toBe(500);
  });

  it('should handle edge case with many hidden slots', () => {
    const selection: UserSelection = {
      targetSlot: 'upper_body',
      hiddenSlots: ['lower_body', 'feet', 'hat', 'mask'],
      handHidesBase: false,
    };
    
    // upper_body (1500) + lower_body (1500) + feet (1500) + hat (1500) + mask (500) = 6500
    expect(computeTriangleBudget(selection)).toBe(6500);
  });

  it('should handle hands without base hand hidden', () => {
    const selection: UserSelection = {
      targetSlot: 'hands',
      hiddenSlots: [],
      handHidesBase: false,
    };
    
    expect(computeTriangleBudget(selection)).toBe(1000);
  });

  it('should handle hands with base hand hidden', () => {
    const selection: UserSelection = {
      targetSlot: 'hands',
      hiddenSlots: [],
      handHidesBase: true,
    };
    
    expect(computeTriangleBudget(selection)).toBe(1500);
  });

  it('should handle helmet with partial head slots hidden', () => {
    const selection: UserSelection = {
      targetSlot: 'helmet',
      hiddenSlots: ['head', 'earring', 'eyewear'], // missing some head slots
      handHidesBase: false,
    };
    
    // helmet (1500) + head (500) + earring (500) + eyewear (500) = 3000
    expect(computeTriangleBudget(selection)).toBe(3000);
  });

  it('should handle helmet with all head slots hidden', () => {
    const selection: UserSelection = {
      targetSlot: 'helmet',
      hiddenSlots: ['head', 'earring', 'eyewear', 'tiara', 'hat', 'facial_hair', 'hair', 'top_head'],
      handHidesBase: false,
    };
    
    expect(computeTriangleBudget(selection)).toBe(4000);
  });

  it('should handle skin slot with hidden slots (no special combining)', () => {
    const selection: UserSelection = {
      targetSlot: 'skin',
      hiddenSlots: ['hat', 'mask'],
      handHidesBase: false,
    };
    
    // skin (5000) + hat (1500) + mask (500) = 7000
    expect(computeTriangleBudget(selection)).toBe(7000);
  });

  it('should handle complex combination with multiple slot types', () => {
    const selection: UserSelection = {
      targetSlot: 'upper_body',
      hiddenSlots: ['lower_body', 'feet', 'hat', 'mask', 'eyewear'],
      handHidesBase: false,
    };
    
    // upper_body (1500) + lower_body (1500) + feet (1500) + hat (1500) + mask (500) + eyewear (500) = 7000
    expect(computeTriangleBudget(selection)).toBe(7000);
  });
});
