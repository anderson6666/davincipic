/**
 * 二级调色算法 (Secondary Grade)
 *
 * 支持基于 mask 的选择性调色：
 *   - 如果有 mask，仅对 mask > 128 的像素应用调整
 *   - 调整项：色相偏移、饱和度调整、亮度调整
 */

import { rgbToHsl, hslToRgb, clamp, lerp } from '../../utils/colorUtils';

export interface SecondaryParams {
  hueShift: number;      // 色相偏移 (-180 ~ 180)
  satAdjust: number;     // 饱和度调整 (-100 ~ 100)
  lumAdjust: number;     // 亮度调整 (-100 ~ 100)
}

export function applySecondaryGrade(
  imageData: ImageData,
  mask: Uint8ClampedArray | null,
  params: Record<string, number>
): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  const hueShift = params.hueShift ?? 0;
  const satAdjust = params.satAdjust ?? 0;
  const lumAdjust = params.lumAdjust ?? 0;

  for (let i = 0; i < data.length; i += 4) {
    // 检查 mask：如果存在且值 <= 128 则跳过
    if (mask && mask[i] <= 128) {
      out[i]     = data[i];
      out[i + 1] = data[i + 1];
      out[i + 2] = data[i + 2];
      out[i + 3] = data[i + 3];
      continue;
    }

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 转到 HSL 空间
    const hsl = rgbToHsl(r, g, b);

    // 色相偏移（循环）
    hsl.h = (hsl.h + hueShift + 360) % 360;

    // 饱和度调整
    hsl.s = clamp(hsl.s + satAdjust, 0, 100);

    // 亮度调整
    hsl.l = clamp(hsl.l + lumAdjust, 0, 100);

    // 转回 RGB
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);

    out[i]     = clamp(rgb.r, 0, 255);
    out[i + 1] = clamp(rgb.g, 0, 255);
    out[i + 2] = clamp(rgb.b, 0, 255);
    out[i + 3] = data[i + 3];
  }

  return output;
}
