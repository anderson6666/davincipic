import { create } from 'zustand';
import type { BaseNode, EdgeData } from '../types';
import type { HistoryEntry } from '../types';

interface HistoryState {
  history: HistoryEntry[];
  currentIndex: number;
  maxHistory: number;
}

interface HistoryActions {
  pushHistory: (nodes: BaseNode[], edges: EdgeData[], description: string, thumbnail?: string) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
  goToIndex: (index: number) => HistoryEntry | null;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function generateEntryId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useHistoryStore = create<HistoryState & HistoryActions>()((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistory: 50,

  pushHistory: (nodes, edges, description, thumbnail) => {
    const { history, currentIndex, maxHistory } = get();

    const entry: HistoryEntry = {
      id: generateEntryId(),
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      description,
      thumbnail,
    };

    // 如果当前不在最新位置，截断后续历史
    let newHistory = currentIndex >= 0
      ? history.slice(0, currentIndex + 1)
      : [...history];
    newHistory.push(entry);

    // 限制最大历史条数
    if (newHistory.length > maxHistory) {
      newHistory = newHistory.slice(newHistory.length - maxHistory);
    }

    set({
      history: newHistory,
      currentIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { currentIndex, history } = get();
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    set({ currentIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { currentIndex, history } = get();
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    set({ currentIndex: newIndex });
    return history[newIndex];
  },

  goToIndex: (index) => {
    const { history } = get();
    if (index < 0 || index >= history.length) return null;
    set({ currentIndex: index });
    return history[index];
  },

  clearHistory: () => set({ history: [], currentIndex: -1 }),

  canUndo: () => get().currentIndex > 0,
  canRedo: () => get().currentIndex < get().history.length - 1,
}));
