/**
 * 色彩空间转换工具集
 * 基于 colorUtils 扩展更多色彩空间操作
 */

import {
  rgbToHsl,
  hslToRgb,
  clamp,
  lerp,
} from '../../utils/colorUtils';

/** Gamma 解压：sRGB -> 线性值 */
export function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

/** Gamma 压缩：线性值 -> sRGB */
export function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

export interface HSV { h: number; s: number; v: number }

/** RGB (0-255) -> HSV (h: 0-360, s: 0-100, v: 0-100) */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = (((gn - bn) / d) % 6 + 6) % 6 * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }

  return {
    h,
    s: max === 0 ? 0 : (d / max) * 100,
    v: max * 100,
  };
}

/** HSV -> RGB (0-255) */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const sn = s / 100;
  const vn = v / 100;

  if (sn === 0) {
    const val = Math.round(vn * 255);
    return { r: val, g: val, b: val };
  }

  const hi = ((h / 60) % 6 + 6) % 6;
  const f = h / 60 - Math.floor(hi);
  const p = vn * (1 - sn);
  const q = vn * (1 - f * sn);
  const t = vn * (1 - (1 - f) * sn);

  let rn: number, gn: number, bn: number;
  switch (Math.floor(hi)) {
    case 0: [rn, gn, bn] = [vn, t, p]; break;
    case 1: [rn, gn, bn] = [q, vn, p]; break;
    case 2: [rn, gn, bn] = [p, vn, t]; break;
    case 3: [rn, gn, bn] = [p, q, vn]; break;
    case 4: [rn, gn, bn] = [t, p, vn]; break;
    default: [rn, gn, bn] = [vn, p, q]; break;
  }

  return {
    r: Math.round(rn * 255),
    g: Math.round(gn * 255),
    b: Math.round(bn * 255),
  };
}

/**
 * 计算相对亮度 (sRGB -> linear luminance)
 * 用于 WCAG 对比度计算等场景
 * 输入 RGB 为 0-255
 */
export function getLuminance(r: number, g: number, b: number): number {
  const rl = srgbToLinear(r / 255);
  const gl = srgbToLinear(g / 255);
  const bl = srgbToLinear(b / 255);

  return rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
}

/** smoothstep 插值函数 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
