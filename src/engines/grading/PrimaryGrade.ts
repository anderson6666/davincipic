/**
 * 一级校色算法 (Primary Grade)
 * 实现：曝光、对比度、高光、阴影、白色、黑色、饱和度调整
 * 使用 ACES 风格的色调映射
 */

import type { PrimaryParams } from '../../types';
import { rgbToHsl, hslToRgb, clamp } from '../../utils/colorUtils';
import { smoothstep } from '../color/ColorSpace';

export function applyPrimaryGrade(imageData: ImageData, params: PrimaryParams): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  const exposureFactor = Math.pow(2, params.exposure);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // ---- 曝光：线性乘法 ----
    r *= exposureFactor;
    g *= exposureFactor;
    b *= exposureFactor;

    // ---- 对比度：以 0.5 为中心 S 曲线 ----
    if (params.contrast !== 0) {
      const c = params.contrast;
      r = applyContrast(r, c);
      g = applyContrast(g, c);
      b = applyContrast(b, c);
    }

    // ---- 高光 / 阴影：柔和提拉/压缩 ----
    if (params.highlights !== 0 || params.shadows !== 0) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // 高光权重：亮度 > 0.5 时递增
      const highlightWeight = smoothstep(0.5, 1.0, lum) * params.highlights;
      // 阴影权重：亮度 < 0.5 时递增
      const shadowWeight = (1 - smoothstep(0.0, 0.5, lum)) * params.shadows;

      r += (r - lum) * (highlightWeight + shadowWeight);
      g += (g - lum) * (highlightWeight + shadowWeight);
      b += (b - lum) * (highlightWeight + shadowWeight);
    }

    // ---- 白点 / 黑点调整 ----
    if (params.whites !== 0 || params.blacks !== 0) {
      r += params.whites * (r > 0.9 ? 1 : 0) + params.blacks * (r < 0.1 ? -1 : 0);
      g += params.whites * (g > 0.9 ? 1 : 0) + params.blacks * (g < 0.1 ? -1 : 0);
      b += params.whites * (b > 0.9 ? 1 : 0) + params.blacks * (b < 0.1 ? -1 : 0);
    }

    // ---- 饱和度：HSL 空间 S 通道调整 ----
    if (params.saturation !== 0) {
      const hsl = rgbToHsl(
        Math.round(clamp(r * 255, 0, 255)),
        Math.round(clamp(g * 255, 0, 255)),
        Math.round(clamp(b * 255, 0, 255))
      );
      hsl.s = clamp(hsl.s * (1 + params.saturation), 0, 100);
      const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      r = rgb.r / 255;
      g = rgb.g / 255;
      b = rgb.b / 255;
    }

    out[i]     = Math.round(clamp(r * 255, 0, 255));
    out[i + 1] = Math.round(clamp(g * 255, 0, 255));
    out[i + 2] = Math.round(clamp(b * 255, 0, 255));
    out[i + 3] = data[i + 3]; // alpha 保持不变
  }

  return output;
}

/** 对比度曲线：以 0.5 为中心的非线性映射 */
function applyContrast(v: number, contrast: number): number {
  return clamp(
    (v - 0.5) * (1 + contrast) + 0.5,
    0,
    1
  );
}
