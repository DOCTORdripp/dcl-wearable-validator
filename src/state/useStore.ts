// src/state/useStore.ts

import { create } from 'zustand';
import type { AppState, AppActions } from '../lib/types';

const initialState: AppState = {
  // File state
  file: null,
  model: null,
  modelStats: null,
  isLoading: false,
  error: null,

  // User selections
  targetSlot: null,
  hiddenSlots: [],
  handHidesBase: false,

  // UI state
  isDarkMode: false,
  showWireframe: false,
  materialView: 'none',
  showResults: false,

  // Results
  validationReport: null,
};

export const useStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  setFile: (file) => set({ file }),
  
  setModel: (model) => set({ model }),
  
  setModelStats: (stats) => set({ modelStats: stats }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setTargetSlot: (slot) => {
    set({ targetSlot: slot });
    // Clear hidden slots that conflict with new target slot
    const currentHiddenSlots = get().hiddenSlots;
    const newHiddenSlots = slot 
      ? currentHiddenSlots.filter(s => s !== slot)
      : currentHiddenSlots;
    set({ hiddenSlots: newHiddenSlots });
  },
  
  setHiddenSlots: (slots) => set({ hiddenSlots: slots }),
  
  setHandHidesBase: (hides) => set({ handHidesBase: hides }),
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  setShowWireframe: (show) => set({ showWireframe: show }),
  
  setMaterialView: (view) => set({ materialView: view }),
  
  setShowResults: (show) => set({ showResults: show }),
  
  setValidationReport: (report) => set({ validationReport: report }),
  
  reset: () => set(initialState),
}));
