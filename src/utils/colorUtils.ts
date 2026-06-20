/**
 * 色彩工具函数集
 * 提供 RGB/HSL/XYZ/Lab 等色彩空间之间的转换
 */

export interface RGB { r: number; g: number; b: number }
export interface HSL { h: number; s: number; l: number }
export interface XYZ { x: number; y: number; z: number }
export interface LAB { l: number; a: number; b: number }

/** RGB (0-255) -> HSL (h: 0-360, s: 0-100, l: 0-100) */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;

  return { h, s: s * 100, l: l * 100 };
}

/** HSL -> RGB (0-255) */
export function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn: number, gn: number, bn: number;
  if (h < 60) { rn = c; gn = x; bn = 0; }
  else if (h < 120) { rn = x; gn = c; bn = 0; }
  else if (h < 180) { rn = 0; gn = c; bn = x; }
  else if (h < 240) { rn = 0; gn = x; bn = c; }
  else if (h < 300) { rn = x; gn = 0; bn = c; }
  else { rn = c; gn = 0; bn = x; }

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  };
}

/** RGB (0-255) -> XYZ (D65 illuminant) */
export function rgbToXyz(r: number, g: number, b: number): XYZ {
  const rl = srgbToLinear(r / 255);
  const gl = srgbToLinear(g / 255);
  const bl = srgbToLinear(b / 255);

  return {
    x: (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) * 100,
    y: (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) * 100,
    z: (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) * 100,
  };
}

/** XYZ -> Lab */
export function xyzToLab(x: number, y: number, z: number): LAB {
  const xn = x / 95.047;
  const yn = y / 100.000;
  const zn = z / 108.883;

  const fx = labF(xn);
  const fy = labF(yn);
  const fz = labF(zn);

  return {
    l: (116 * fy) - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/** Lab -> XYZ */
export function labToXyz(l: number, a: number, b: number): XYZ {
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;

  return {
    x: labInvF(fx) * 95.047,
    y: labInvF(fy) * 100.000,
    z: labInvF(fz) * 108.883,
  };
}

/** XYZ -> RGB (0-255) */
export function xyzToRgb(x: number, y: number, z: number): RGB {
  let rl = (x / 100) * 3.2404542 + (y / 100) * (-1.5371385) + (z / 100) * (-0.4985314);
  let gl = (x / 100) * (-0.9692660) + (y / 100) * 1.8760108 + (z / 100) * 0.0415560;
  let bl = (x / 100) * 0.0556434 + (y / 100) * (-0.2040259) + (z / 100) * 1.0572252;

  return {
    r: Math.round(linearToSrgb(clamp01(rl)) * 255),
    g: Math.round(linearToSrgb(clamp01(gl)) * 255),
    b: Math.round(linearToSrgb(clamp01(bl)) * 255),
  };
}

/** 值限制到 [min, max] 范围 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ---- 内部辅助函数 ----

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

function labF(t: number): number {
  return t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + 16 / 116;
}

function labInvF(t: number): number {
  return Math.pow(t, 3) > 0.008856
    ? Math.pow(t, 3)
    : (116 * t - 16) / 903.3;
}
