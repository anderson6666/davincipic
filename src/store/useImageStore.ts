import { create } from 'zustand';
import type { AnalysisResult } from '../types';
import type { AutoGradeResult, ReviewResult } from '../ai/agnes/imageAnalyzer';

interface ImageState {
  originalImageData: ImageData | null;
  currentImageData: ImageData | null;
  width: number;
  height: number;
  fileName: string;
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
  compareMode: 'split' | 'overlay';
  /** 上传/读取图片进度 0-100 */
  uploadProgress: number;
  /** AI 分析进度 0-100 */
  analysisProgress: number;
  /** 当前处理阶段描述 */
  currentStage: string;
  /* ===== 复查(V2)相关 ===== */
  /** V1 完整结果（复查时需要发送给AI） */
  v1Result: AutoGradeResult | null;
  /** V1 高清效果图 base64 */
  v1ResultImage: string | null;
  /** 是否正在复查 */
  isReviewing: boolean;
  /** 复查进度 0-100 */
  reviewProgress: number;
  /** 复查阶段描述 */
  reviewStage: string;
  /** V2 复查结果 */
  v2Result: ReviewResult | null;
  /** V2 高清效果图 base64 */
  v2ResultImage: string | null;
}

interface ImageActions {
  setImage: (data: {
    originalImageData: ImageData;
    currentImageData: ImageData;
    width: number;
    height: number;
    fileName: string;
  }) => void;
  setCurrentImageData: (data: ImageData) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setLoading: (loading: boolean) => void;
  toggleCompareMode: () => void;
  reset: () => void;
  setUploadProgress: (progress: number) => void;
  setAnalysisProgress: (progress: number) => void;
  setCurrentStage: (stage: string) => void;
  /* 复查 actions */
  setV1Result: (result: AutoGradeResult | null, image?: string | null) => void;
  setReviewing: (v: boolean) => void;
  setReviewProgress: (pct: number, stage?: string) => void;
  setV2Result: (result: ReviewResult | null, image?: string | null) => void;
}

export const useImageStore = create<ImageState & ImageActions>()((set) => ({
  originalImageData: null,
  currentImageData: null,
  width: 0,
  height: 0,
  fileName: '',
  analysisResult: null,
  isLoading: false,
  compareMode: 'split',
  uploadProgress: 0,
  analysisProgress: 0,
  currentStage: '',
  v1Result: null,
  v1ResultImage: null,
  isReviewing: false,
  reviewProgress: 0,
  reviewStage: '',
  v2Result: null,
  v2ResultImage: null,

  setImage: (data) => set({
    originalImageData: data.originalImageData,
    currentImageData: data.currentImageData,
    width: data.width,
    height: data.height,
    fileName: data.fileName,
  }),

  setCurrentImageData: (data) => set({ currentImageData: data }),

  setAnalysisResult: (result) => set({ analysisResult: result }),

  setLoading: (loading) => set({ isLoading: loading }),

  toggleCompareMode: () =>
    set((state) => ({
      compareMode: state.compareMode === 'split' ? 'overlay' : 'split',
    })),

  reset: () =>
    set({
      originalImageData: null,
      currentImageData: null,
      width: 0,
      height: 0,
      fileName: '',
      analysisResult: null,
      isLoading: false,
      compareMode: 'split',
      uploadProgress: 0,
      analysisProgress: 0,
      currentStage: '',
      v1Result: null,
      v1ResultImage: null,
      isReviewing: false,
      reviewProgress: 0,
      reviewStage: '',
      v2Result: null,
      v2ResultImage: null,
    }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setCurrentStage: (stage) => set({ currentStage: stage }),

  /* 复查 actions */
  setV1Result: (result, image) => set({ v1Result: result, v1ResultImage: image ?? null }),
  setReviewing: (v) => set({ isReviewing: v }),
  setReviewProgress: (pct, stage) => set({ reviewProgress: pct, ...(stage ? { reviewStage: stage } : {}) }),
  setV2Result: (result, image) => set({ v2Result: result, v2ResultImage: image ?? null }),
}));
