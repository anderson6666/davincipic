import type { AnalysisResult } from '../../types';
import { agnesClient } from '../../api/client';
import type { AgnesAPIResponse } from '../../api/types';
import { SYSTEM_PROMPTS } from '../../api/prompts';
import { generateGradedImage } from './gradePreview';

/** 调色命令（从 API 返回） */
export interface GradingCommand {
  nodeType: string;
  params: Record<string, unknown>;
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
  const safeSceneType = validSceneTypes.includes(analysis.sceneType as typeof validSceneTypes[number]) ? analysis.sceneType : 'other';

  const validBrightness = ['dark', 'normal', 'bright'] as const;
  const safeBrightness = validBrightness.includes(analysis.brightness as typeof validBrightness[number]) ? analysis.brightness : 'normal';

  const validContrast = ['low', 'medium', 'high'] as const;
  const safeContrast = validContrast.includes(analysis.contrastLevel as typeof validContrast[number]) ? analysis.contrastLevel : 'medium';

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

// ========== 复查/精炼阶段 ==========

/** 复查结果中的审查意见 */
export interface ReviewVerdict {
  overallScore: number;
  issues: string[];
  strengths: string[];
  verdict: string;
}

/** 复查精炼后的完整结果（第二版成品） */
export interface ReviewResult {
  /** 审查意见 */
  review: ReviewVerdict;
  /** 第二版分析结果 */
  v2Analysis: AnalysisResult;
  /** 第二版调色建议 */
  v2Suggestions: string[];
  /** 第二版精炼调色命令 */
  v2Commands: GradingCommand[];
  /** V2 推理过程（对比V1的差异） */
  v2Reasoning?: string;
}

/**
 * 将第一轮 AI 调色结果发给 AI 进行专业复查与精炼
 *
 * 流程：
 * 1. 基于原图 + V1命令 渲染出调色后效果图
 * 2. 将 **原图 + 调色后效果** 两张图 + V1方案文本一起发送给 AI
 * 3. AI 以"首席调色总监"身份对比两张图，审查第一轮方案
 * 4. 输出审查意见 + 精炼后的第二版成品方案（基于原图重新生成）
 *
 * @param imageData - 原始图像
 * @param v1Result - 第一轮的完整结果
 * @param onProgress - 可选进度回调
 * @returns 审查意见 + 第二版精炼方案
 */
export async function reviewAndRefine(
  imageData: ImageData,
  v1Result: AutoGradeResult,
  onProgress?: (loaded: number, total: number) => void,
): Promise<ReviewResult> {
  // 1. 原图转 base64
  const originalBase64 = imageDataToBase64(imageData);

  // 2. 基于 V1 命令渲染调色后效果图
  let gradedBase64: string;
  try {
    gradedBase64 = generateGradedImage(imageData, v1Result.commands);
    console.log('[Agnes AI] 调色预览图生成成功');
  } catch (err) {
    console.warn('[Agnes AI] 调色预览图生成失败，仅使用原图:', err);
    gradedBase64 = originalBase64;
  }

  // 3. 构建用户消息：V1 结果摘要文本
  const v1Summary = JSON.stringify({
    analysis: v1Result.analysis,
    commandCount: v1Result.commands.length,
    commands: v1Result.commands.map((cmd) => ({
      nodeType: cmd.nodeType,
      params: cmd.params,
      confidence: cmd.confidence,
      description: cmd.description,
    })),
    reasoning: v1Result.reasoning || '',
  }, null, 2);

  const userMessage = `请仔细审查以下第一轮调色方案，并输出精炼的第二版方案。

## 第一轮调色方案（待审查）
${v1Summary}

**重要提示**：
- 图1 是原始照片（调色前的素材）
- 图2 是应用了上述「第一轮调色方案」后的实际调色效果
- 请**对比两张图片**来评估调色质量，特别关注：是否过度/不足/偏色/失真

请基于以上信息，输出你的审查结论和基于原图重新生成的精炼第二版方案。`;

  try {
    // 4. 调用 Agnes AI API（使用复查系统提示词）—— 发送两张图
    const rawResponse = await agnesClient.chat(
      [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: originalBase64, detail: 'low' } },
          { type: 'image_url', image_url: { url: gradedBase64, detail: 'low' } },
          { type: 'text', text: userMessage },
        ],
      }],
      SYSTEM_PROMPTS.reviewGrading,
      true,
      onProgress,
    );

    // 5. 解析复查响应
    const parsed = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

    const review: ReviewVerdict = {
      overallScore: parsed.review?.overallScore ?? 5,
      issues: Array.isArray(parsed.review?.issues) ? parsed.review.issues : ['无法获取审查意见'],
      strengths: Array.isArray(parsed.review?.strengths) ? parsed.review.strengths : [],
      verdict: parsed.review?.verdict ?? '需要修改',
    };

    const v2Analysis = mapAnalysis({
      analysis: parsed.v2Analysis,
      suggestions: parsed.v2Suggestions,
      commands: parsed.v2Commands,
      reasoning: parsed.v2Reasoning,
    });

    const v2Commands = extractCommands({
      commands: parsed.v2Commands,
    });

    console.log(`[Agnes AI] 复查完成: V1评分=${review.overallScore}/10, V2命令数=${v2Commands.length}`);

    return {
      review,
      v2Analysis,
      v2Suggestions: Array.isArray(parsed.v2Suggestions) ? parsed.v2Suggestions : [],
      v2Commands,
      v2Reasoning: parsed.v2Reasoning,
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AgnesAPIError') {
      console.error('[Agnes AI] 复查失败:', error.message);
      return {
        review: {
          overallScore: 0,
          issues: [`复查阶段AI不可用: ${error.message}`],
          strengths: [],
          verdict: '复查失败',
        },
        v2Analysis: v1Result.analysis,
        v2Suggestions: [`复查失败，沿用V1结果 (${error.message})`],
        v2Commands: v1Result.commands,
        v2Reasoning: undefined,
      };
    }
    throw error;
  }
}
