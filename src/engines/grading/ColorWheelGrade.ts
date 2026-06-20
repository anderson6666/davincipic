/**
 * 色轮调色算法 (Color Wheel / Lift-Gamma-Gain)
 *
 * 三路色彩校正：
 *   Lift:   暗部偏色   → 影响低亮度区域
 *   Gamma:  中间调偏色 → 影响中间亮度区域
 *   Gain:   高光偏色   → 影响高亮度区域
 * + Master 控制各路整体亮度
 * 色相偏移通过 HSL 色相旋转实现
 */

import type { ColorWheelParams } from '../../types';
import { rgbToHsl, hslToRgb, clamp, lerp } from '../../utils/colorUtils';

export function applyColorWheel(imageData: ImageData, params: ColorWheelParams): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  // 将 H/S 值转换为 RGB 偏移量
  const liftColor = hsToRgbOffset(params.lift.h, params.lift.s);
  const gammaColor = hsToRgbOffset(params.gamma.h, params.gamma.s);
  const gainColor = hsToRgbOffset(params.gain.h, params.gain.s);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // 计算亮度（使用 luminance）
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // ---- Lift（暗部）权重：低亮度时高 ----
    const liftW = 1.0 - smoothstep3(0.0, 0.5, lum);

    // ---- Gamma（中间调）权重：中间亮度时高 ----
    const gammaW = gaussianWeight(lum, 0.5, 0.25);

    // ---- Gain（高光）权重：高亮度时高 ----
    const gainW = smoothstep3(0.5, 1.0, lum);

    // 应用三路偏色
    r += liftW * liftColor.r * (1 + params.liftMaster / 100)
       + gammaW * gammaColor.r * (1 + params.gammaMaster / 100)
       + gainW * gainColor.r * (1 + params.gainMaster / 100);
    g += liftW * liftColor.g * (1 + params.liftMaster / 100)
       + gammaW * gammaColor.g * (1 + params.gammaMaster / 100)
       + gainW * gainColor.g * (1 + params.gainMaster / 100);
    b += liftW * liftColor.b * (1 + params.liftMaster / 100)
       + gammaW * gammaColor.b * (1 + params.gammaMaster / 100)
       + gainW * gainColor.b * (1 + params.gainMaster / 100);

    out[i]     = Math.round(clamp(r * 255, 0, 255));
    out[i + 1] = Math.round(clamp(g * 255, 0, 255));
    out[i + 2] = Math.round(clamp(b * 255, 0, 255));
    out[i + 3] = data[i + 3];
  }

  return output;
}

/** 将色相(h: 0-360) 和 饱和度(s: 0-100) 转为 RGB 归一化偏移量 */
function hsToRgbOffset(h: number, s: number): { r: number; g: number; b: number } {
  if (s === 0) return { r: 0, g: 0, b: 0 };
  const rgb = hslToRgb(h, s, 50); // 中等亮度作为基准
  return {
    r: (rgb.r / 127.5 - 1) * (s / 100),
    g: (rgb.g / 127.5 - 1) * (s / 100),
    b: (rgb.b / 127.5 - 1) * (s / 100),
  };
}

/** 简化的 smoothstep (三次 Hermite 插值) */
function smoothstep3(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** 高斯权重函数，center 为中心点，sigma 为宽度 */
function gaussianWeight(x: number, center: number, sigma: number): number {
  const dx = x - center;
  return Math.exp(-(dx * dx) / (2 * sigma * sigma));
}
