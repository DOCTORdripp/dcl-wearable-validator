// src/components/ControlsPanel.tsx

import React from 'react';
import { useStore } from '../state/useStore';
import { getAvailableTargetSlots, getAvailableHiddenSlots, getSkinRequiredHiddenSlots } from '../lib/budgets';
import BudgetCard from './BudgetCard';

const ControlsPanel: React.FC = () => {
  const {
    targetSlot,
    setTargetSlot,
    hiddenSlots,
    setHiddenSlots,
    handHidesBase,
    setHandHidesBase,
    model,
    validationReport,
    setValidationReport,
  } = useStore();

  const availableTargetSlots = getAvailableTargetSlots();
  const availableHiddenSlots = getAvailableHiddenSlots(targetSlot);

  const handleTargetSlotChange = (slot: string) => {
    const newTargetSlot = slot as any;
    setTargetSlot(newTargetSlot);
    
    // Special case for skin: auto-select all hidden slots
    if (newTargetSlot === 'skin') {
      const skinRequiredSlots = getSkinRequiredHiddenSlots();
      setHiddenSlots(skinRequiredSlots);
    }
  };

  const handleHiddenSlotToggle = (slot: string) => {
    // Prevent unchecking hidden slots when target is skin
    if (targetSlot === 'skin' && hiddenSlots.includes(slot as any)) {
      return; // Do nothing - cannot uncheck when skin is selected
    }
    
    const newHiddenSlots = hiddenSlots.includes(slot as any)
      ? hiddenSlots.filter(s => s !== slot)
      : [...hiddenSlots, slot as any];
    setHiddenSlots(newHiddenSlots);
  };

  const handleAnalyze = async () => {
    if (!model || !targetSlot) return;

    // Import validation function dynamically to avoid circular imports
    const { runValidation } = await import('../lib/runValidation');
    const { analyzeModel } = await import('../lib/gltfUtils');
    
    // Get file size from the store
    const file = useStore.getState().file;
    const fileSizeBytes = file ? file.size : 0;
    
    const modelStats = analyzeModel(model, fileSizeBytes);
    const userSelection = {
      targetSlot,
      hiddenSlots,
      handHidesBase,
    };
    
    const report = runValidation(modelStats, userSelection, file?.name || 'model.glb');
    setValidationReport(report);
  };

  return (
    <div className="space-y-6">
      {/* Target Slot Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Target Slot
        </label>
        <select
          value={targetSlot || ''}
          onChange={(e) => handleTargetSlotChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
        >
          <option value="">Select target slot...</option>
          {availableTargetSlots.map(slot => (
            <option key={slot} value={slot}>
              {slot.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Hidden Slots Selection */}
      {targetSlot && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Hidden Slots (Multi-select)
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableHiddenSlots.map(slot => {
              const isChecked = hiddenSlots.includes(slot as any);
              const isDisabled = targetSlot === 'skin' && isChecked;
              
              return (
                <label key={slot} className={`flex items-center space-x-2 ${isDisabled ? 'opacity-60' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleHiddenSlotToggle(slot)}
                    disabled={isDisabled}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">
                    {slot.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {isDisabled && ' (required for skin)'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Hand Accessory Special Option */}
      {targetSlot === 'hands' && (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={handHidesBase}
              onChange={(e) => setHandHidesBase(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-300">
              This hand accessory hides base hand
            </span>
          </label>
        </div>
      )}

      {/* Budget Card */}
      {targetSlot && (
        <BudgetCard />
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!model || !targetSlot}
        className={`
          w-full px-4 py-2 rounded-md font-medium transition-colors
          ${model && targetSlot
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {validationReport ? 'Re-analyze' : 'Analyze'}
      </button>
    </div>
  );
};

export default ControlsPanel;
