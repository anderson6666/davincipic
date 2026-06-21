import { create } from 'zustand';
import type { AnalysisResult } from '../types';

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
    }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setCurrentStage: (stage) => set({ currentStage: stage }),
}));
