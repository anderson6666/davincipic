import type { AnalysisResult } from '../../types';
import { agnesClient } from '../../api/client';
import type { AgnesAPIResponse, AgnesAPIError } from '../../api/types';

/** 调色命令（从 API 返回） */
export interface GradingCommand {
  nodeType: string;
  params: Record<string, any>;
  confidence: number;
  description: string;
}

/**
 * 将 ImageData 转换为压缩后的 base64 data URI（AI 分析用）
 * - 最大边长限制为 1024px（保持宽高比）
 * - 使用 JPEG 0.82 质量压缩（远小于原始 PNG）
 */
function imageDataToBase64(imageData: ImageData): string {
  const MAX_SIZE = 1024;
  const { width: origW, height: origH } = imageData;

  // 计算缩放尺寸（等比）
  let drawW = origW;
  let drawH = origH;
  if (origW > MAX_SIZE || origH > MAX_SIZE) {
    const scale = Math.min(MAX_SIZE / origW, MAX_SIZE / origH);
    drawW = Math.round(origW * scale);
    drawH = Math.round(origH * scale);
  }

  // 先把原图放入临时 canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  srcCtx.putImageData(imageData, 0, 0);

  // 输出 canvas 用缩放后尺寸，JPEG 压缩
  const outCanvas = document.createElement('canvas');
  outCanvas.width = drawW;
  outCanvas.height = drawH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.drawImage(srcCanvas, 0, 0, drawW, drawH);

  return outCanvas.toDataURL('image/jpeg', 0.82);
}

/**
 * 将 API 响应的 ImageAnalysis 转换为内部 AnalysisResult 格式
 */
function mapAnalysis(response: AgnesAPIResponse): AnalysisResult {
  const analysis = response.analysis;
  
  if (!analysis) {
    return {
      sceneType: 'other',
      dominantColors: ['#888888', '#666666', '#444444'],
      brightness: 'normal',
      contrastLevel: 'medium',
      suggestions: response.suggestions?.length 
        ? response.suggestions 
        : ['图像已加载，AI 正在分析...'],
    };
  }

  const validSceneTypes = ['portrait', 'landscape', 'interior', 'night', 'other'] as const;
  const safeSceneType = validSceneTypes.includes(analysis.sceneType as any) ? analysis.sceneType : 'other';

  const validBrightness = ['dark', 'normal', 'bright'] as const;
  const safeBrightness = validBrightness.includes(analysis.brightness as any) ? analysis.brightness : 'normal';

  const validContrast = ['low', 'medium', 'high'] as const;
  const safeContrast = validContrast.includes(analysis.contrastLevel as any) ? analysis.contrastLevel : 'medium';

  return {
    sceneType: safeSceneType,
    dominantColors: Array.isArray(analysis.dominantColors) && analysis.dominantColors.length > 0
      ? analysis.dominantColors.slice(0, 5)
      : ['#888888'],
    brightness: safeBrightness,
    contrastLevel: safeContrast,
    suggestions: Array.isArray(response.suggestions) && response.suggestions.length > 0
      ? response.suggestions.slice(0, 6)
      : ['分析完成'],
  };
}

/** 合法节点类型集合 */
const VALID_NODE_TYPES: Set<string> = new Set([
  'primary', 'colorWheel', 'curves', 'secondary',
  'qualifier', 'powerWindow', 'tracking', 'rgbMixer',
  'lut', 'colorMatch', 'noiseReduce'
]);

function isValidNodeType(type: string): type is import('../../types').NodeType {
  return VALID_NODE_TYPES.has(type);
}

/**
 * 从 API 响应中提取调色命令
 */
function extractCommands(response: AgnesAPIResponse): GradingCommand[] {
  if (!response.commands || !Array.isArray(response.commands)) return [];

  return response.commands
    .filter(cmd => cmd.nodeType && isValidNodeType(cmd.nodeType))
    .map(cmd => ({
      nodeType: cmd.nodeType,
      params: cmd.params || {},
      confidence: typeof cmd.confidence === 'number' ? Math.max(0, Math.min(1, cmd.confidence)) : 0.7,
      description: cmd.description || `${cmd.nodeType} 调整`,
    }));
}

/**
 * AI 分析 + 自动调色决策的完整结果
 */
export interface AutoGradeResult {
  /** 图像分析结果（用于展示给用户） */
  analysis: AnalysisResult;
  /** AI 自动生成的调色命令（用于自动创建节点） */
  commands: GradingCommand[];
  /** AI 的推理过程 */
  reasoning?: string;
}

/**
 * 核心方法：通过 Agnes AI API 分析图像并获取自动调色方案
 *
 * 用户上传图片后自动调用此方法：
 * 1. 发送图片给 Agnes AI
 * 2. AI 自主分析图片 + 决策调色方案
 * 3. 返回分析结果 + 可执行的调色命令数组
 *
 * @param imageData - 待分析的图像
 * @param onProgress - 可选的下载进度回调 (loaded, total) => void
 * @returns 分析结果 + AI 自动生成的调色命令
 */
export async function analyzeAndGrade(
  imageData: ImageData,
  onProgress?: (loaded: number, total: number) => void,
): Promise<AutoGradeResult> {
  try {
    // 1. 图片转 base64
    const imageBase64 = imageDataToBase64(imageData);

    // 2. 调用 Agnes AI API (系统指令要求AI自主决策调色方案并返回commands)
    const response: AgnesAPIResponse = await agnesClient.analyzeImage(imageBase64, onProgress);

    // 3. 分别提取分析结果和调色命令
    const analysis = mapAnalysis(response);
    const commands = extractCommands(response);

    console.log(`[Agnes AI] 自动调色决策完成: ${commands.length} 条命令`);
    if (response.reasoning) {
      console.log(`[Agnes AI] 推理: ${response.reasoning}`);
    }

    return { analysis, commands, reasoning: response.reasoning };

  } catch (error) {
    if (error instanceof Error && error.name === 'AgnesAPIError') {
      console.error('[Agnes AI] 自动调色失败:', error.message);
      // 返回降级结果：有分析信息但无调色命令
      return {
        analysis: {
          sceneType: 'other',
          dominantColors: ['#888888'],
          brightness: 'normal',
          contrastLevel: 'medium',
          suggestions: [
            `AI 暂时不可用 (${error.message})`,
            '您可以手动添加调色节点或在 Prompt 中描述需求',
          ],
        },
        commands: [],
        reasoning: undefined,
      };
    }
    throw error;
  }
}

/**
 * 仅分析图像（不生成调色命令），用于兼容旧接口
 * @deprecated 建议使用 analyzeAndGrade()
 */
export async function analyzeImage(imageData: ImageData): Promise<AnalysisResult> {
  const result = await analyzeAndGrade(imageData);
  return result.analysis;
}
