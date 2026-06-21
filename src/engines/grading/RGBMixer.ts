/**
 * RGB 混合器 (RGB Mixer)
 *
 * 控制每个输出通道来自 R/G/B 输入通道的比例：
 *   newR = oldR * (redOut.r / 100) + oldG * (redOut.g / 100) + oldB * (redOut.b / 100)
 *   newG = oldR * (greenOut.r / 100) + oldG * (greenOut.g / 100) + oldB * (greenOut.b / 100)
 *   newB = oldR * (blueOut.r / 100) + oldG * (blueOut.g / 100) + oldB * (blueOut.b / 100)
 */

import type { RGBMixerParams } from '../../types';
import { clamp } from '../../utils/colorUtils';

export function applyRGBMixer(imageData: ImageData, params: RGBMixerParams): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  const rr = params.redOut.r / 100;   // Red 输出中 R 的比例
  const rg = params.redOut.g / 100;   // Red 输出中 G 的比例
  const rb = params.redOut.b / 100;   // Red 输出中 B 的比例

  const gr = params.greenOut.r / 100; // Green 输出中 R 的比例
  const gg = params.greenOut.g / 100; // Green 输出中 G 的比例
  const gb = params.greenOut.b / 100; // Green 输出中 B 的比例

  const br = params.blueOut.r / 100;  // Blue 输出中 R 的比例
  const bg = params.blueOut.g / 100;  // Blue 输出中 G 的比例
  const bb = params.blueOut.b / 100;  // Blue 输出中 B 的比例

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    out[i]     = clamp(Math.round(r * rr + g * rg + b * rb), 0, 255);
    out[i + 1] = clamp(Math.round(r * gr + g * gg + b * gb), 0, 255);
    out[i + 2] = clamp(Math.round(r * br + g * bg + b * bb), 0, 255);
    out[i + 3] = data[i + 3]; // alpha 不变
  }

  return output;
}
