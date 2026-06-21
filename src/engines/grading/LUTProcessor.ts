/**
 * LUT 处理器 (LUT Processor)
 *
 * 内置多个参数化 LUT 预设：
 *   - warm:    暖色调
 *   - cool:    冷色调
 *   - cinematic: 电影感
 *   - vintage:  复古
 *   - bw:      黑白
 *
 * intensity 控制与原图的混合强度 (0 = 原图, 1 = 完全 LUT)
 */

import type { LUTParams } from '../../types';
import { clamp, lerp } from '../../utils/colorUtils';

/** 参数化 LUT 定义：每个通道的 [r, g, b] 调整系数 + 偏移 */
interface ParametricLUT {
  name: string;
  /** 对 RGB 各通道的增益和偏移：[rGain, rOffset, gGain, gOffset, bGain, bOffset] */
  rgbTransform: number[];
  /** 饱和度倍率 */
  satMult: number;
  /** 对比度调整 */
  contrastAdj: number;
}

/** 内置参数化 LUT 预设 */
const BUILTIN_LUTS: Record<string, ParametricLUT> = {
  warm: {
    name: '暖色调',
    rgbTransform: [1.08, 8, 0.95, 0, 0.90, -5],
    satMult: 1.15,
    contrastAdj: 0.05,
  },
  cool: {
    name: '冷色调',
    rgbTransform: [0.90, -5, 0.95, 2, 1.10, 10],
    satMult: 1.1,
    contrastAdj: 0.03,
  },
  cinematic: {
    name: '电影感',
    rgbTransform: [1.0, 0, 0.98, -3, 1.02, 2],
    satMult: 0.85,
    contrastAdj: 0.12,
  },
  vintage: {
    name: '复古',
    rgbTransform: [1.05, 6, 1.02, 4, 0.92, -2],
    satMult: 0.7,
    contrastAdj: 0.08,
  },
  bw: {
    name: '黑白',
    rgbTransform: [1, 0, 1, 0, 1, 0], // 无通道偏色
    satMult: 0.0, // 完全去饱和
    contrastAdj: 0.1,
  },
};

export function applyLUT(imageData: ImageData, params: LUTParams): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  const lutDef = BUILTIN_LUTS[params.lutName];
  if (!lutDef) {
    // 未找到对应 LUT，返回原图副本
    out.set(data);
    return output;
  }

  const intensity = clamp(params.intensity ?? 1.0, 0, 1);
  const [rG, rO, gG, gO, bG, bO] = lutDef.rgbTransform;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // ---- 应用 LUT 变换 ----

    // 1) 通道增益 + 偏移
    r = r * rG + rO;
    g = g * gG + gO;
    b = b * bG + bO;

    // 2) 饱和度调整（使用加权灰度法）
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = lerp(gray, r, lutDef.satMult);
    g = lerp(gray, g, lutDef.satMult);
    b = lerp(gray, b, lutDef.satMult);

    // 3) 对比度调整（以 128 为中心）
    if (lutDef.contrastAdj !== 0) {
      const factor = 1 + lutDef.contrastAdj;
      r = (r - 128) * factor + 128;
      g = (g - 128) * factor + 128;
      b = (b - 128) * factor + 128;
    }

    // 4) 与原图混合（intensity 控制）
    if (intensity < 1) {
      r = lerp(data[i], r, intensity);
      g = lerp(data[i + 1], g, intensity);
      b = lerp(data[i + 2], b, intensity);
    }

    out[i]     = Math.round(clamp(r, 0, 255));
    out[i + 1] = Math.round(clamp(g, 0, 255));
    out[i + 2] = Math.round(clamp(b, 0, 255));
    out[i + 3] = data[i + 3]; // alpha 不变
  }

  return output;
}

/** 获取所有内置 LUT 名称列表 */
export function getBuiltinLUTNames(): string[] {
  return Object.keys(BUILTIN_LUTS);
}
