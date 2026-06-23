/**
 * 色轮调色算法 (Color Wheel / Lift-Gamma-Gain)
 *
 * 三路色彩校正：
 *   Lift:   暗部偏色   → 影响低亮度区域
 *   Gamma:  中间调偏色 → 影响中间亮度区域
 *   Gain:   高光偏色   → 影响高亮度区域
 * + Master 控制各路整体亮度
 *
 * 使用混合模式（lerp）而非纯加法，防止色块/像素块产生
 */

import type { ColorWheelParams } from '../../types';
import { rgbToHsl, hslToRgb, clamp, lerp } from '../../utils/colorUtils';

export function applyColorWheel(imageData: ImageData, params: ColorWheelParams): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  // 将 H/S 值转换为 RGB 目标色（混合目标）
  const liftTarget = hsToRgbTarget(params.lift.h, params.lift.s);
  const gammaTarget = hsToRgbTarget(params.gamma.h, params.gamma.s);
  const gainTarget = hsToRgbTarget(params.gain.h, params.gain.s);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // 计算亮度（使用 luminance）
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // ---- 使用更宽的权重过渡，避免色块边界 ----
    // Lift（暗部）权重：低亮度时高，过渡更柔和
    const liftW = 1.0 - smoothstep5(0.0, 0.6, lum);

    // Gamma（中间调）权重：中间亮度时高，sigma 更宽
    const gammaW = gaussianWeight(lum, 0.5, 0.35);

    // Gain（高光）权重：高亮度时高，过渡更柔和
    const gainW = smoothstep5(0.4, 1.0, lum);

    // ---- 混合模式：将原色向目标色混合，而非加法偏移 ----
    // 每路的混合强度 = s/100 * master系数
    // 这样可以避免加法偏移导致的色块和量化问题
    const liftBlend = (params.lift.s / 100) * (1 + params.liftMaster / 100) * liftW;
    const gammaBlend = (params.gamma.s / 100) * (1 + params.gammaMaster / 100) * gammaW;
    const gainBlend = (params.gain.s / 100) * (1 + params.gainMaster / 100) * gainW;

    // 对每路分别 lerp 原色到目标色
    r = lerp(r, liftTarget.r, clamp(liftBlend, 0, 1));
    g = lerp(g, liftTarget.g, clamp(liftBlend, 0, 1));
    b = lerp(b, liftTarget.b, clamp(liftBlend, 0, 1));

    r = lerp(r, gammaTarget.r, clamp(gammaBlend, 0, 1));
    g = lerp(g, gammaTarget.g, clamp(gammaBlend, 0, 1));
    b = lerp(b, gammaTarget.b, clamp(gammaBlend, 0, 1));

    r = lerp(r, gainTarget.r, clamp(gainBlend, 0, 1));
    g = lerp(g, gainTarget.g, clamp(gainBlend, 0, 1));
    b = lerp(b, gainTarget.b, clamp(gainBlend, 0, 1));

    // 加入微小抖动消除色块（1/256 级别的噪声，肉眼不可见但能打破量化条纹）
    const dither = (Math.random() - 0.5) / 256;

    out[i]     = Math.round(clamp((r + dither) * 255, 0, 255));
    out[i + 1] = Math.round(clamp((g + dither) * 255, 0, 255));
    out[i + 2] = Math.round(clamp((b + dither) * 255, 0, 255));
    out[i + 3] = data[i + 3];
  }

  return output;
}

/**
 * 将色相和饱和度转换为 RGB 目标色（用于混合）
 *
 * 与旧版 hsToRgbOffset 不同，这里返回的是归一化的 RGB 颜色值，
 * 用于 lerp 混合而非加法偏移，避免色块问题
 */
function hsToRgbTarget(h: number, s: number): { r: number; g: number; b: number } {
  if (s === 0) return { r: 0.5, g: 0.5, b: 0.5 }; // 无偏色时目标=中性灰
  const rgb = hslToRgb(h, s, 50);
  return {
    r: rgb.r / 255,
    g: rgb.g / 255,
    b: rgb.b / 255,
  };
}

/** 五次 smoothstep（比三次更平滑，减少色块边界） */
function smoothstep5(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10); // Ken Perlin's improved smoothstep
}

/** 高斯权重函数，center 为中心点，sigma 为宽度 */
function gaussianWeight(x: number, center: number, sigma: number): number {
  const dx = x - center;
  return Math.exp(-(dx * dx) / (2 * sigma * sigma));
}
