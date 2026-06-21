import { create } from 'zustand';
import type { AnalysisResult } from '../types';
import type { GradingCommand, AutoGradeResult, ReviewVerdict } from '../ai/agnes/imageAnalyzer';

/** 批量任务状态 */
export type TaskStatus = 'idle' | 'loading' | 'analyzing' | 'completed' | 'error'
  | 'reviewing' | 'reviewed' | 'review_error';

/** 单个批量任务（10个任务共享同一张源图片） */
export interface BatchTask {
  id: string;
  /** 任务编号 (1-10) */
  slotIndex: number;
  /** 任务标签名 */
  label: string;
  /** 状态 */
  status: TaskStatus;
  /** 上传/读取进度 0-100 */
  uploadProgress: number;
  /** AI 分析进度 0-100 */
  analysisProgress: number;
  /** 当前阶段描述 */
  currentStage: string;
  /** 错误信息 */
  error?: string;
  // ===== 第一版成品 (V1) =====
  /** V1 分析结果 */
  analysisResult?: AnalysisResult;
  /** V1 调色命令 */
  commands?: GradingCommand[];
  /** V1 处理耗时 (ms) */
  duration?: number;
  /** 开始处理时间 */
  startTime?: number;
  /** V1 完整结果（复查阶段需要） */
  v1Result?: AutoGradeResult;
  /** V1 高清效果图 (JPEG base64, 用于展示和下载) */
  v1ResultImage?: string;
  // ===== 第二版成品 (V2 - 复查精炼后) =====
  /** 复查进度 0-100 */
  reviewProgress: number;
  /** 复查阶段描述 */
  reviewStage: string;
  /** 审查意见 */
  reviewVerdict?: ReviewVerdict;
  /** V2 分析结果 */
  v2AnalysisResult?: AnalysisResult;
  /** V2 调色建议 */
  v2Suggestions?: string[];
  /** V2 精炼调色命令 */
  v2Commands?: GradingCommand[];
  /** V2 推理过程 */
  v2Reasoning?: string;
  /** V2 处理耗时 (ms) */
  v2Duration?: number;
  /** V2 高清效果图 (JPEG base64, 最终成品，用于展示和下载) */
  v2ResultImage?: string;
}

/** 历史记录条目 */
export interface BatchHistoryEntry {
  id: string;
  timestamp: number;
  /** 源文件名 */
  sourceFileName: string;
  /** 源图缩略图 */
  sourceThumbnail: string;
  /** 10个任务的结果 */
  tasks: BatchTask[];
  totalDuration: number;
}

interface BatchState {
  /** 当前批次的任务列表（固定10个槽位） */
  tasks: BatchTask[];
  /** 源图片 File 对象 */
  sourceFile: File | null;
  /** 源图片缩略图 (dataURL) */
  sourceThumbnail: string | null;
  /** 是否正在批量处理中（含复查阶段） */
  isProcessing: boolean;
  /** 是否处于复查阶段 */
  isReviewing: boolean;
  /** 已完成任务数（V1阶段） */
  completedCount: number;
  /** 已完成复查数（V2阶段） */
  reviewedCount: number;
  /** 历史记录 */
  history: BatchHistoryEntry[];
}

interface BatchActions {
  /** 设置源图片并初始化10个任务槽位 */
  setSourceImage: (file: File) => Promise<void>;
  /** 移除单个任务（重置为idle） */
  resetTask: (taskId: string) => void;
  /** 清空所有任务和源图 */
  clearAll: () => void;
  /** 更新任务状态 */
  updateTask: (taskId: string, updates: Partial<BatchTask>) => void;
  /** 设置处理状态 */
  setProcessing: (processing: boolean) => void;
  /** 设置复查阶段状态 */
  setReviewing: (reviewing: boolean) => void;
  /** 标记批次完成，存入历史 */
  finishBatch: () => void;
  /** 清空历史 */
  clearHistory: () => void;
  /** 从历史恢复到当前列表 */
  restoreFromHistory: (historyId: string) => void;
}

function generateTaskId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 10个任务的预设标签（用序号） */
const TASK_LABELS = Array.from({ length: 10 }, (_, i) => `图片${i + 1}`);

/** 创建缩略图 (最大边长 200px) */
function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 200;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const scale = Math.min(MAX_SIZE / w, MAX_SIZE / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 初始化10个空闲任务槽位 */
function createEmptyTasks(): BatchTask[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: generateTaskId(),
    slotIndex: i,
    label: TASK_LABELS[i] || `方案${i + 1}`,
    status: 'idle' as TaskStatus,
    uploadProgress: 0,
    analysisProgress: 0,
    currentStage: '',
    reviewProgress: 0,
    reviewStage: '',
  }));
}

export const useBatchStore = create<BatchState & BatchActions>()((set, get) => ({
  tasks: [],
  sourceFile: null,
  sourceThumbnail: null,
  isProcessing: false,
  isReviewing: false,
  completedCount: 0,
  reviewedCount: 0,
  history: [],

  /** 上传一张源图片，初始化10个任务槽位 */
  setSourceImage: async (file: File) => {
    const thumbnail = await createThumbnail(file).catch(() => '');
    set({
      sourceFile: file,
      sourceThumbnail: thumbnail,
      tasks: createEmptyTasks(),
      isProcessing: false,
      isReviewing: false,
      completedCount: 0,
      reviewedCount: 0,
    });
  },

  resetTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? {
          ...t,
          status: 'idle' as TaskStatus,
          uploadProgress: 0,
          analysisProgress: 0,
          currentStage: '',
          error: undefined,
          duration: undefined,
          startTime: undefined,
          v1Result: undefined,
          v1ResultImage: undefined,
          analysisResult: undefined,
          commands: undefined,
          reviewProgress: 0,
          reviewStage: '',
          reviewVerdict: undefined,
          v2AnalysisResult: undefined,
          v2Suggestions: undefined,
          v2Commands: undefined,
          v2Reasoning: undefined,
          v2Duration: undefined,
          v2ResultImage: undefined,
        } : t
      ),
    })),

  clearAll: () =>
    set({
      tasks: [],
      sourceFile: null,
      sourceThumbnail: null,
      isProcessing: false,
      isReviewing: false,
      completedCount: 0,
      reviewedCount: 0,
    }),

  updateTask: (taskId, updates) =>
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      );
      return {
        tasks: newTasks,
        completedCount: newTasks.filter((t) => t.status === 'completed' || t.status === 'error').length,
        reviewedCount: newTasks.filter((t) => t.status === 'reviewed' || t.status === 'review_error').length,
      };
    }),

  setProcessing: (processing) => set({ isProcessing: processing }),
  setReviewing: (reviewing) => set({ isReviewing: reviewing }),

  finishBatch: () => {
    const { tasks, sourceFile, sourceThumbnail, history } = get();
    const finishedTasks = tasks.filter((t) =>
      t.status === 'reviewed' || t.status === 'review_error' ||
      (!get().isReviewing && (t.status === 'completed' || t.status === 'error'))
    );
    if (finishedTasks.length === 0) return;

    const now = Date.now();
    const entry: BatchHistoryEntry = {
      id: generateHistoryId(),
      timestamp: now,
      sourceFileName: sourceFile?.name ?? '未知',
      sourceThumbnail: sourceThumbnail ?? '',
      tasks: JSON.parse(JSON.stringify(finishedTasks)),
      totalDuration: now - (tasks[0]?.startTime || now),
    };

    const newHistory = [entry, ...history].slice(0, 50);

    set({
      history: newHistory,
      isProcessing: false,
      isReviewing: false,
      completedCount: 0,
      reviewedCount: 0,
    });
  },

  clearHistory: () => set({ history: [] }),

  restoreFromHistory: (historyId) => {
    const { history } = get();
    const entry = history.find((h) => h.id === historyId);
    if (!entry) return;

    // 从历史恢复时重新生成ID但保留结果数据
    const restoredTasks: BatchTask[] = entry.tasks.map((t) => ({
      ...t,
      id: generateTaskId(),
    }));

    set({
      tasks: restoredTasks,
      sourceThumbnail: entry.sourceThumbnail,
      sourceFile: null, // 历史恢复没有原始File对象
    });
  },
}));
