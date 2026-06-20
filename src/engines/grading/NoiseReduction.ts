/**
 * 降噪算法 (Noise Reduction)
 *
 * 实现空间域降噪：
 *   - Box Blur（盒式模糊）作为基础平滑
 *   - spatialRadius 决定模糊半径
 *   - strength 决定效果强度
 *   - protectDetail: 与原图混合保留细节
 */

import type { NoiseReduceParams } from '../../types';
import { clamp, lerp } from '../../utils/colorUtils';

export function applyNoiseReduction(
  imageData: ImageData,
  params: NoiseReduceParams
): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const out = output.data;

  const radius = Math.max(Math.floor(params.spatialRadius), 1);
  const strength = clamp(params.strength, 0, 1);
  const protectDetail = clamp(params.protectDetail, 0, 1);

  // 先对原图做 box blur 得到模糊图像
  const blurred = boxBlur(data, width, height, radius);

  for (let i = 0; i < data.length; i += 4) {
    const origR = data[i];
    const origG = data[i + 1];
    const origB = data[i + 2];

    const blurR = blurred[i];
    const blurG = blurred[i + 1];
    const blurB = blurred[i + 2];

    // 按强度混合模糊结果与原图
    let r = lerp(origR, blurR, strength);
    let g = lerp(origG, blurG, strength);
    let b = lerp(origB, blurB, strength);

    // 细节保护：将结果再与原图混合一次
    if (protectDetail > 0) {
      r = lerp(r, origR, protectDetail);
      g = lerp(g, origG, protectDetail);
      b = lerp(b, origB, protectDetail);
    }

    out[i]     = Math.round(clamp(r, 0, 255));
    out[i + 1] = Math.round(clamp(g, 0, 255));
    out[i + 2] = Math.round(clamp(b, 0, 255));
    out[i + 3] = data[i + 3]; // alpha 不变
  }

  return output;
}

/**
 * 盒式模糊 (Box Blur)
 * 对每个像素取 (2*radius+1) x (2*radius+1) 邻域的平均值
 * 使用可分离滤波器优化：先水平方向，再垂直方向
 */
function boxBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const temp = new Uint8ClampedArray(data.length);
  const result = new Uint8ClampedArray(data.length);

  // 水平方向模糊：data -> temp
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      for (let dx = -radius; dx <= radius; dx++) {
        const nx = clamp(x + dx, 0, width - 1);
        const idx = (y * width + nx) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        count++;
      }

      const idx = (y * width + x) * 4;
      temp[idx]     = Math.round(rSum / count);
      temp[idx + 1] = Math.round(gSum / count);
      temp[idx + 2] = Math.round(bSum / count);
      temp[idx + 3] = data[idx + 3]; // alpha 直接复制
    }
  }

  // 垂直方向模糊：temp -> result
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = clamp(y + dy, 0, height - 1);
        const idx = (ny * width + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
        count++;
      }

      const idx = (y * width + x) * 4;
      result[idx]     = Math.round(rSum / count);
      result[idx + 1] = Math.round(gSum / count);
      result[idx + 2] = Math.round(bSum / count);
      result[idx + 3] = temp[idx + 3];
    }
  }

  return result;
}
