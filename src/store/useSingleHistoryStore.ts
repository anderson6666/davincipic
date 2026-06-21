import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AnalysisResult } from '../types';
import type { GradingCommand } from '../ai/agnes/imageAnalyzer';

/** 单张模式历史记录条目 */
export interface SingleHistoryEntry {
  id: string;
  timestamp: number;
  /** 源文件名 */
  fileName: string;
  /** 源图缩略图 */
  thumbnail: string;
  /** 分析结果 */
  analysisResult?: AnalysisResult;
  /** 调色命令 */
  commands?: GradingCommand[];
  /** 高清效果图 (JPEG base64) */
  resultImage?: string;
}

interface SingleHistoryState {
  /** 历史记录列表（最多30条） */
  entries: SingleHistoryEntry[];
}

interface SingleHistoryActions {
  /** 添加一条记录 */
  addEntry: (entry: Omit<SingleHistoryEntry, 'id' | 'timestamp'>) => void;
  /** 删除一条记录 */
  removeEntry: (id: string) => void;
  /** 清空全部 */
  clearAll: () => void;
}

function genId() {
  return `single_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSingleHistoryStore = create<SingleHistoryState & SingleHistoryActions>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => ({
          entries: [{ ...entry, id: genId(), timestamp: Date.now() }, ...state.entries].slice(0, 30),
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'single-history',
      partialize: (state) => ({ entries: state.entries }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
