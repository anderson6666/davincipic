/**
 * 曲线调色算法 (Curves Grade)
 *
 * 对 Master / Red / Green / Blue 四条曲线分别处理
 * 使用线性插值在控制点之间采样
 * 构建查找表 (LUT, 256 entries) 优化性能
 */

import type { CurvesParams } from '../../types';
import { clamp, lerp } from '../../utils/colorUtils';

export function applyCurves(imageData: ImageData, params: CurvesParams): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  // 为每条通道构建 256 级 LUT
  const masterLut = buildLUT(params.master);
  const redLut   = buildLUT(params.red);
  const greenLut = buildLUT(params.green);
  const blueLut  = buildLUT(params.blue);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 先应用 Master 曲线（整体亮度映射）
    r = masterLut[r];
    g = masterLut[g];
    b = masterLut[b];

    // 再应用各通道独立曲线
    r = redLut[r];
    g = greenLut[g];
    b = blueLut[b];

    out[i]     = clamp(r, 0, 255);
    out[i + 1] = clamp(g, 0, 255);
    out[i + 2] = clamp(b, 0, 255);
    out[i + 3] = data[i + 3];
  }

  return output;
}

/**
 * 根据控制点数组构建 256 级查找表
 * 控制点 x, y 均为 [0, 1] 范围
 */
function buildLUT(points: Array<{ x: number; y: number }>): Uint8Array {
  const lut = new Uint8Array(256);

  // 确保 points 按 x 升序排列
  const sorted = [...points].sort((a, b) => a.x - b.x);

  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    lut[i] = Math.round(sampleCurve(sorted, x) * 255);
  }

  return lut;
}

/** 在曲线上采样：找到 x 所在的段并线性插值 */
function sampleCurve(
  points: Array<{ x: number; y: number }>,
  x: number
): number {
  // 边界情况
  if (points.length === 0) return x;
  if (points.length === 1) return points[0].y;
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;

  // 找到 x 所在的区间 [p[i], p[i+1]]
  for (let i = 0; i < points.length - 1; i++) {
    if (x >= points[i].x && x <= points[i + 1].x) {
      const dx = points[i + 1].x - points[i].x;
      if (dx === 0) return points[i].y;
      const t = (x - points[i].x) / dx;
      return lerp(points[i].y, points[i + 1].y, t);
    }
  }

  return x; // fallback
}
