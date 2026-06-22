import { useCallback, useRef } from 'react';
import { useImageStore } from '../store/useImageStore';
import { analyzeAndGrade, reviewAndRefine, type AutoGradeResult } from '../ai/agnes/imageAnalyzer';
import { generateGradedImage } from '../ai/agnes/gradePreview';
import { useSingleHistoryStore } from '../store/useSingleHistoryStore';

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

function getReviewStage(pct: number): string {
  if (pct < 20) return '首席调色师审查中...';
  if (pct < 45) return '检测过度调整...';
  if (pct < 70) return '生成精炼方案(V2)...';
  if (pct < 90) return '对比V1差异分析...';
  return '完成第二版成品...';
}

export function useImageLoader() {
  const {
    setImage, setAnalysisResult, setLoading,
    setUploadProgress, setAnalysisProgress, setCurrentStage,
    setV1Result, setReviewing, setReviewProgress, setV2Result,
  } = useImageStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 防抖守卫 */
  const isReviewingRef = useRef(false);

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

      // 先保存V1结果到store（供复查使用，无论图片生成是否成功）
      let resultImage = '';
      try {
        resultImage = generateGradedImage(originalImageData, aiResult.commands);
      } catch (imgErr) {
        console.warn('[useImageLoader] V1效果图生成失败:', imgErr);
      }
      setV1Result(aiResult, resultImage || null);

      // 保存历史记录
      try {
        // 生成缩略图用于历史列表
        const thumbCanvas = document.createElement('canvas');
        let tw = img.naturalWidth, th = img.naturalHeight;
        if (tw > 200 || th > 200) { const s = Math.min(200 / tw, 200 / th); tw = Math.round(tw * s); th = Math.round(th * s); }
        thumbCanvas.width = tw; thumbCanvas.height = th;
        const tc = thumbCanvas.getContext('2d')!;
        tc.drawImage(img, 0, 0, tw, th);
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

        useSingleHistoryStore.getState().addEntry({
          fileName: file.name,
          thumbnail,
          analysisResult: aiResult.analysis,
          commands: aiResult.commands,
          resultImage: resultImage || undefined,
        });
      } catch (histErr) {
        console.warn('[useImageLoader] 历史记录保存失败:', histErr);
      }

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
  }, [setImage, setAnalysisResult, setLoading, setUploadProgress, setAnalysisProgress, setCurrentStage, setV1Result]);

  /**
   * 复查：将V1结果发给AI进行二次审查，生成V2精炼成品
   * 使用 getState() 获取最新值，避免闭包陷阱
   */
  const startReview = useCallback(async () => {
    if (isReviewingRef.current) return;
    // 始终从store获取最新值（不依赖闭包）
    const { v1Result: _v1, originalImageData: _orig } = useImageStore.getState();
    if (!_v1 || !_orig) {
      console.warn('[useImageLoader] 复查条件不满足: v1Result=', !!_v1, 'originalImageData=', !!_orig);
      return;
    }

    isReviewingRef.current = true;
    setReviewing(true);
    setReviewProgress(0, '准备复查数据...');

    try {
      const reviewResult = await reviewAndRefine(_orig, _v1, (loaded, total) => {
        const rawPct = Math.min(loaded / Math.max(total, 1), 1);
        setReviewProgress(Math.round(10 + rawPct * 80), getReviewStage(rawPct * 100));
      });

      // 生成V2高清效果图
      let v2Image: string;
      try {
        v2Image = generateGradedImage(_orig, reviewResult.v2Commands);
      } catch {
        v2Image = '';
      }

      setReviewProgress(100, '第二版完成');
      setV2Result(reviewResult, v2Image);
    } catch (error) {
      console.error('[useImageLoader] 复查失败:', error);
      setReviewProgress(0, '复查失败');
    } finally {
      setReviewing(false);
      isReviewingRef.current = false;
    }
  }, [setReviewing, setReviewProgress, setV2Result]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return { loadImage, startReview, triggerFileInput, fileInputRef };
}

export default useImageLoader;
