import type { AnalysisResult, NodeType } from '../../types';

export interface SuggestionItem {
  id: string;
  title: string;
  description: string;
  icon: string;         // lucide 图标名
  nodes: Array<{
    type: NodeType;
    params: Record<string, any>;
  }>;
  quickPrompt: string;  // 可快速填入 prompt 的文本
}

/**
 * 根据图像分析结果生成调色建议
 * 返回 4-6 个智能推荐卡片，每个包含可一键应用的节点配置和对应的自然语言 prompt
 */
export function generateSuggestions(analysis: AnalysisResult): SuggestionItem[] {
  const suggestions: SuggestionItem[] = [];

  // 1. 自动校正建议 - 基于亮度/对比度的智能校正
  suggestions.push(createAutoCorrectionSuggestion(analysis));

  // 2. 增强色彩建议 - 提升饱和度和对比度
  suggestions.push(createEnhanceColorSuggestion(analysis));

  // 3. 电影质感建议 - 应用电影 LUT + 曲线
  suggestions.push(createCinematicSuggestion(analysis));

  // 4. 清新明亮建议 - 适用于偏暗或对比度低的图像
  if (analysis.brightness === 'dark' || analysis.contrastLevel === 'low') {
    suggestions.push(createFreshBrightSuggestion(analysis));
  }

  // 5. 温暖氛围建议 - 暖色调调整
  if (analysis.sceneType === 'interior' || analysis.sceneType === 'portrait') {
    suggestions.push(createWarmAtmosphereSuggestion(analysis));
  }

  // 6. 专业降噪建议 - 针对夜景或高噪点场景
  if (analysis.brightness === 'dark' || analysis.contrastLevel === 'low') {
    suggestions.push(createNoiseReductionSuggestion(analysis));
  }

  // 确保至少返回 4 个建议（如果上面的条件不满足，添加通用建议）
  while (suggestions.length < 4) {
    const genericSuggestions = [
      createVintageSuggestion(analysis),
      createSoftLightSuggestion(analysis),
      createCoolToneSuggestion(analysis)
    ];
    const nextSuggestion = genericSuggestions[suggestions.length - 4];
    if (nextSuggestion) {
      suggestions.push(nextSuggestion);
    } else {
      break; // 防止无限循环
    }
  }

  return suggestions.slice(0, 6); // 限制最多返回 6 条建议
}

/**
 * 创建"自动校正"建议卡片
 * 基于分析结果自动调整曝光、对比度等基础参数
 */
function createAutoCorrectionSuggestion(analysis: AnalysisResult): SuggestionItem {
  const params: Record<string, any> = { exposure: 0, contrast: 0, saturation: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0 };

  // 根据亮度调整曝光
  switch (analysis.brightness) {
    case 'dark':
      params.exposure = 0.35;
      params.shadows = 0.25;
      break;
    case 'bright':
      params.exposure = -0.15;
      params.highlights = -0.2;
      break;
    default:
      params.exposure = 0.05; // 微调优化
  }

  // 根据对比度调整
  switch (analysis.contrastLevel) {
    case 'low':
      params.contrast = 0.2;
      break;
    case 'high':
      params.contrast = -0.1;
      params.whites = -0.15;
      break;
  }

  // 场景特定调整
  if (analysis.sceneType === 'night') {
    params.shadows = Math.max(params.shadows, 0.3);
    params.blacks = 0.1;
  }

  return {
    id: 'auto-correction',
    title: '自动校正',
    description: `基于画面${analysis.brightness === 'dark' ? '偏暗' : analysis.brightness === 'bright' ? '偏亮' : '正常'}、${analysis.contrastLevel === 'low' ? '对比度低' : analysis.contrastLevel === 'high' ? '对比度高' : '对比度适中'}的特点进行智能校正`,
    icon: 'Sparkles',
    nodes: [{ type: 'primary', params }],
    quickPrompt: `自动校正${analysis.brightness === 'dark' ? '并提亮' : analysis.brightness === 'bright' ? '并压暗' : ''}画面`
  };
}

/**
 * 创建"增强色彩"建议卡片
 * 提升饱和度和色彩表现力
 */
function createEnhanceColorSuggestion(analysis: AnalysisResult): SuggestionItem {
  const intensity = analysis.contrastLevel === 'low' ? 0.8 : 0.5;

  return {
    id: 'enhance-color',
    title: '增强色彩',
    description: '提升色彩饱和度和鲜艳度，让画面更加生动活泼',
    icon: 'Palette',
    nodes: [
      {
        type: 'primary',
        params: {
          saturation: 0.25 * intensity,
          contrast: 0.12 * intensity,
          exposure: 0,
          highlights: 0,
          shadows: 0,
          whites: 0.05 * intensity,
          blacks: 0
        }
      },
      {
        type: 'colorWheel',
        params: {
          gain: { h: 0, s: 10 * intensity },
          gamma: { h: 0, s: 5 * intensity },
          lift: { h: 0, s: 3 * intensity },
          liftMaster: 0,
          gammaMaster: 0,
          gainMaster: 5 * intensity
        }
      }
    ],
    quickPrompt: '增加饱和度，让画面更鲜艳'
  };
}

/**
 * 创建"电影质感"建议卡片
 * 应用电影 LUT 和 S 曲线
 */
function createCinematicSuggestion(analysis: AnalysisResult): SuggestionItem {
  const intensity = analysis.sceneType === 'night' ? 0.85 : 0.7;

  return {
    id: 'cinematic',
    title: '电影质感',
    description: '应用专业电影色调 LUT 配合 S 形曲线，营造大片级视觉效果',
    icon: 'Clapperboard',
    nodes: [
      {
        type: 'lut',
        params: { lutName: 'cinematic', intensity: intensity }
      },
      {
        type: 'curves',
        params: {
          master: [
            { x: 0, y: 0 },
            { x: 0.15, y: 0.08 },
            { x: 0.35, y: 0.32 },
            { x: 0.5, y: 0.5 },
            { x: 0.68, y: 0.65 },
            { x: 0.85, y: 0.92 },
            { x: 1, y: 1 }
          ],
          red: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
          green: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
          blue: [{ x: 0, y: 0 }, { x: 1, y: 1 }]
        }
      },
      {
        type: 'primary',
        params: {
          exposure: -0.05,
          contrast: 0.15,
          saturation: 0.1,
          highlights: -0.15,
          shadows: 0.1,
          whites: -0.1,
          blacks: 0.05
        }
      }
    ],
    quickPrompt: '电影感色调，S曲线增强层次'
  };
}

/**
 * 创建"清新明亮"建议卡片
 * 适用于偏暗或需要提亮的场景
 */
function createFreshBrightSuggestion(analysis: AnalysisResult): SuggestionItem {
  const brightnessBoost = analysis.brightness === 'dark' ? 0.45 : 0.25;

  return {
    id: 'fresh-bright',
    title: '清新明亮',
    description: '提亮整体画面，配合冷色调营造清爽通透的视觉感受',
    icon: 'Sun',
    nodes: [
      {
        type: 'primary',
        params: {
          exposure: brightnessBoost,
          contrast: 0.18,
          saturation: 0.15,
          highlights: -0.1,
          shadows: 0.25,
          whites: 0.1,
          blacks: 0.08
        }
      },
      {
        type: 'colorWheel',
        params: {
          gain: { h: 200, s: 8 },
          gamma: { h: 205, s: 5 },
          lift: { h: 210, s: 3 },
          liftMaster: 0,
          gammaMaster: 0,
          gainMaster: 3
        }
      }
    ],
    quickPrompt: '提亮画面，加一点冷色调，清新明亮的感觉'
  };
}

/**
 * 创建"温暖氛围"建议卡片
 * 添加暖色调，适合室内和人像场景
 */
function createWarmAtmosphereSuggestion(analysis: AnalysisResult): SuggestionItem {
  const warmthIntensity = analysis.sceneType === 'portrait' ? 0.7 : 0.55;

  return {
    id: 'warm-atmosphere',
    title: '温暖氛围',
    description: '添加暖黄色调，营造温馨舒适的氛围感，特别适合室内和人像照片',
    icon: 'SunMedium',
    nodes: [
      {
        type: 'colorWheel',
        params: {
          gain: { h: 40, s: 18 * warmthIntensity },
          gamma: { h: 35, s: 12 * warmthIntensity },
          lift: { h: 30, s: 8 * warmthIntensity },
          liftMaster: 0,
          gammaMaster: 0,
          gainMaster: 8 * warmthIntensity }
      },
      {
        type: 'primary',
        params: {
          exposure: 0.06,
          contrast: 0.08,
          saturation: 0.12 * warmthIntensity,
          highlights: -0.08,
          shadows: 0.12,
          whites: 0,
          blacks: 0
        }
      }
    ],
    quickPrompt: '加一点暖色调，温暖舒适的感觉'
  };
}

/**
 * 创建"专业降噪"建议卡片
 * 针对高噪点或夜景场景
 */
function createNoiseReductionSuggestion(analysis: AnalysisResult): SuggestionItem {
  const strength = analysis.brightness === 'dark' ? 0.7 : 0.5;

  return {
    id: 'noise-reduction',
    title: '专业降噪',
    description: '智能降噪处理，去除画面噪点和颗粒，同时保护细节清晰度',
    icon: 'ScanLine',
    nodes: [
      {
        type: 'noiseReduce',
        params: {
          spatialRadius: 2,
          strength: strength,
          protectDetail: 0.35
        }
      },
      {
        type: 'primary',
        params: {
          exposure: 0.03,
          contrast: -0.05,
          saturation: -0.05,
          highlights: 0,
          shadows: 0.05,
          whites: 0,
          blacks: 0
        }
      }
    ],
    quickPrompt: '降噪处理，减少画面噪点'
  };
}

/**
 * 创建"复古怀旧"建议卡片
 * 通用复古风格效果
 */
function createVintageSuggestion(analysis: AnalysisResult): SuggestionItem {
  return {
    id: 'vintage',
    title: '复古怀旧',
    description: '应用经典复古胶片色调，营造时光沉淀的年代感',
    icon: 'Clock',
    nodes: [
      {
        type: 'lut',
        params: { lutName: 'vintage', intensity: 0.65 }
      },
      {
        type: 'primary',
        params: {
          exposure: 0,
          contrast: 0.15,
          saturation: -0.28,
          highlights: -0.12,
          shadows: 0.08,
          whites: -0.1,
          blacks: 0.05
        }
      }
    ],
    quickPrompt: '复古怀旧风格，老照片感觉'
  };
}

/**
 * 创建"柔光效果"建议卡片
 * 降低对比度，柔和过渡
 */
function createSoftLightSuggestion(analysis: AnalysisResult): SuggestionItem {
  return {
    id: 'soft-light',
    title: '柔光效果',
    description: '降低对比度并轻微提亮，营造梦幻柔和的视觉效果',
    icon: 'Cloud',
    nodes: [
      {
        type: 'primary',
        params: {
          exposure: 0.1,
          contrast: -0.18,
          saturation: -0.1,
          highlights: -0.22,
          shadows: 0.18,
          whites: -0.08,
          blacks: 0.1
        }
      }
    ],
    quickPrompt: '柔光柔化效果，降低对比度'
  };
}

/**
 * 创建"冷色调"建议卡片
 * 清凉冷静的蓝色调
 */
function createCoolToneSuggestion(analysis: AnalysisResult): SuggestionItem {
  return {
    id: 'cool-tone',
    title: '清凉冷调',
    description: '添加蓝青色调，营造冷静清新的视觉感受',
    icon: 'Snowflake',
    nodes: [
      {
        type: 'colorWheel',
        params: {
          gain: { h: 210, s: 14 },
          gamma: { h: 215, s: 9 },
          lift: { h: 220, s: 5 },
          liftMaster: 0,
          gammaMaster: 0,
          gainMaster: 4
        }
      },
      {
        type: 'primary',
        params: {
          exposure: 0,
          contrast: 0.1,
          saturation: 0.08,
          highlights: 0,
          shadows: 0,
          whites: 0,
          blacks: 0
        }
      }
    ],
    quickPrompt: '冷色调，清凉的感觉'
  };
}
