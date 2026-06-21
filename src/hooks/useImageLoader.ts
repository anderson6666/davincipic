import { useCallback, useRef } from 'react';
import { useImageStore } from '../store/useImageStore';
import { analyzeAndGrade, type AutoGradeResult } from '../ai/agnes/imageAnalyzer';

export interface ImageLoadResult {
  /** AI 分析结果 */
  analysis: AutoGradeResult['analysis'];
  /** AI 自动生成的调色命令（调用方用于自动创建节点） */
  commands: AutoGradeResult['commands'];
  /** AI 推理过程 */
  reasoning?: string;
}

/** 根据下载进度百分比返回对应的阶段描述 */
function getAnalysisStage(pct: number): string {
  if (pct < 15) return '正在连接 Agnes AI...';
  if (pct < 35) return 'AI 正在分析图像内容...';
  if (pct < 60) return 'AI 正在识别场景与色彩...';
  if (pct < 85) return '正在生成调色方案...';
  return '正在整理分析结果...';
}

export function useImageLoader() {
  const {
    setImage, setAnalysisResult, setLoading,
    setUploadProgress, setAnalysisProgress, setCurrentStage,
  } = useImageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 加载图片 + 触发 AI 自动分析调色
   *
   * 进度分配：
   *   0 - 30%   读取图片文件（FileReader onprogress 真实字节进度）
   *   30 - 40%  图片解码 & 提取像素数据
   *   40 - 95%  AI 分析（ReadableStream 真实网络下载进度）
   *   95 - 100% 解析响应 & 完成
   */
  const loadImage = useCallback(async (file: File): Promise<ImageLoadResult> => {
    const fallbackResult: ImageLoadResult = {
      analysis: {
        sceneType: 'other',
        dominantColors: ['#888888'],
        brightness: 'normal',
        contrastLevel: 'medium',
        suggestions: ['图片已加载，等待 AI 分析...'],
      },
      commands: [],
    };

    setLoading(true);
    setUploadProgress(0);
    setAnalysisProgress(0);
    setCurrentStage('正在读取图片...');

    try {
      // ========== 阶段 1: 读取图片文件 (0-30%, FileReader 真实进度) ==========
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadProgress(30);
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.onprogress = (e: ProgressEvent) => {
          if (e.lengthComputable && e.total > 0) {
            const pct = Math.round((e.loaded / e.total) * 30); // 映射到 0-30%
            setUploadProgress(pct);
            if (pct > 5) setCurrentStage(`正在读取图片 ${pct}%`);
          }
        };
        reader.readAsDataURL(file);
      });

      // ========== 阶段 2: 解码图片 (30-40%) ==========
      setCurrentStage('正在解码图片...');
      setUploadProgress(35);

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => { setUploadProgress(40); resolve(image); };
        image.onerror = reject;
        image.src = dataUrl;
      });

      // 绘制到 canvas 获取 ImageData
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // 保存图像数据到 store（立即显示预览）
      setImage({
        originalImageData,
        currentImageData,
        width: canvas.width,
        height: canvas.height,
        fileName: file.name,
      });

      setUploadProgress(100); // 上传阶段完成

      // ========== 阶段 3: AI 分析 (40-95%, ReadableStream 真实网络进度) ==========
      setCurrentStage('正在连接 Agnes AI...');
      setAnalysisProgress(42);

      // 创建 onProgress 回调：将 (loaded/total) 映射到 40-95% 区间
      const onProgress = (loaded: number, total: number) => {
        const rawPct = Math.min(loaded / Math.max(total, 1), 1); // 0-1 原始比例
        // 映射到 42%-93%，留首尾空间给"连接中"和"完成"
        const mappedPct = 42 + rawPct * 51; // 42 → 93
        setAnalysisProgress(Math.round(mappedPct));
        setCurrentStage(getAnalysisStage(rawPct * 100));
      };

      // 调用 API（内部通过 ReadableStream 读取响应体，逐 chunk 触发 onProgress）
      const aiResult: AutoGradeResult = await analyzeAndGrade(originalImageData, onProgress);

      // ========== 阶段 4: 完成 (95-100%) ==========
      setAnalysisProgress(96);
      setCurrentStage('正在解析结果...');
      // 微小延迟让用户看到"解析中"状态
      await new Promise(r => setTimeout(r, 80));
      setAnalysisProgress(100);
      setCurrentStage('分析完成');

      // 保存分析结果到 store
      setAnalysisResult(aiResult.analysis);

      return {
        analysis: aiResult.analysis,
        commands: aiResult.commands,
        reasoning: aiResult.reasoning,
      };

    } catch (error) {
      console.error('[useImageLoader] 图片加载或分析失败:', error);

      setAnalysisResult({
        sceneType: 'other',
        dominantColors: ['#888888'],
        brightness: 'normal',
        contrastLevel: 'medium',
        suggestions: [
          '图片加载成功，但 AI 分析失败',
          error instanceof Error ? error.message : '未知错误',
          '您可以手动添加调色节点',
        ],
      });

      return fallbackResult;

    } finally {
      setLoading(false);
    }
  }, [setImage, setAnalysisResult, setLoading, setUploadProgress, setAnalysisProgress, setCurrentStage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return { loadImage, triggerFileInput, fileInputRef };
}

export default useImageLoader;
