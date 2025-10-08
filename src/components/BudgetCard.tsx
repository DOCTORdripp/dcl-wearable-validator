// src/components/BudgetCard.tsx

import React from 'react';
import { useStore } from '../state/useStore';
import { computeTriangleBudget, getBudgetConfig } from '../lib/budgets';

const BudgetCard: React.FC = () => {
  const { targetSlot, hiddenSlots, handHidesBase } = useStore();

  if (!targetSlot) return null;

  const userSelection = {
    targetSlot,
    hiddenSlots,
    handHidesBase,
  };

  const appliedTriangleBudget = computeTriangleBudget(userSelection);
  const budgetConfig = getBudgetConfig(targetSlot);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
        Current Budget
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-700 dark:text-blue-300">Triangles:</span>
          <span className="font-mono text-blue-900 dark:text-blue-100">
            {appliedTriangleBudget.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-700 dark:text-blue-300">Materials:</span>
          <span className="font-mono text-blue-900 dark:text-blue-100">
            ≤ {budgetConfig.maxMaterials}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-blue-700 dark:text-blue-300">Textures:</span>
          <span className="font-mono text-blue-900 dark:text-blue-100">
            ≤ {budgetConfig.maxTextures}
          </span>
        </div>
      </div>

      {hiddenSlots.length > 0 && (
        <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
          <div className="text-xs text-blue-600 dark:text-blue-400">
            + Hidden slots: {hiddenSlots.map(s => s.replace('_', ' ')).join(', ')}
          </div>
        </div>
      )}

      {targetSlot === 'hands' && handHidesBase && (
        <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
          <div className="text-xs text-blue-600 dark:text-blue-400">
            + Hand hides base hand (+500 triangles)
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCard;
