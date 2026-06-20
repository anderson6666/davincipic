import { create } from 'zustand';

interface UIState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  aiPanelExpanded: boolean;
  activeTab: string;
  exportModalOpen: boolean;
}

interface UIActions {
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleAIPanel: () => void;
  setActiveTab: (tab: string) => void;
  setExportModalOpen: (open: boolean) => void;
  resetUI: () => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  aiPanelExpanded: false,
  activeTab: 'nodes',
  exportModalOpen: false,

  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  toggleAIPanel: () => set((state) => ({ aiPanelExpanded: !state.aiPanelExpanded })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),

  resetUI: () =>
    set({
      leftPanelOpen: true,
      rightPanelOpen: true,
      aiPanelExpanded: false,
      activeTab: 'nodes',
      exportModalOpen: false,
    }),
}));
