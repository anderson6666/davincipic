/**
 * 限定器抠像算法 (Qualifier)
 *
 * 将每个像素转到 HSL 空间
 * 判断是否在 hueRange / satRange / lumRange 范围内
 * softness 控制边缘柔和过渡
 * 返回 mask (0-255)
 */

import type { QualifierParams } from '../../types';
import { rgbToHsl, clamp } from '../../utils/colorUtils';

export function generateQualifierMask(
  imageData: ImageData,
  params: QualifierParams
): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const mask = new Uint8ClampedArray(data.length);

  const [hueMin, hueMax] = params.hueRange;
  const [satMin, satMax] = params.satRange;
  const [lumMin, lumMax] = params.lumRange;
  const softness = Math.max(params.softness, 0.001); // 避免除零

  for (let i = 0; i < data.length; i += 4) {
    const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);

    // 计算各通道在范围内的归一化距离 [0,1]
    let hMatch = 0;

    // 色相是环形的，需要特殊处理跨越 360° 的情况
    if (hueMin <= hueMax) {
      // 普通范围：[hueMin, hueMax]
      if (hsl.h >= hueMin && hsl.h <= hueMax) {
        const distToEdge = Math.min(hsl.h - hueMin, hueMax - hsl.h);
        hMatch = 1.0 - Math.min(distToEdge / softness, 1.0);
      } else {
        const dist = Math.min(
          Math.abs(hsl.h - hueMin),
          Math.abs(hsl.h - hueMax)
        );
        hMatch = clamp(1.0 - dist / softness, 0, 1);
      }
    } else {
      // 跨越范围：如 [350, 20]
      if (hsl.h >= hueMin || hsl.h <= hueMax) {
        hMatch = 1.0;
      }
    }

    // 饱和度范围匹配（带软边缘）
    let sMatch = 1.0;
    if (hsl.s < satMin) {
      sMatch = clamp(1.0 - (satMin - hsl.s) / softness, 0, 1);
    } else if (hsl.s > satMax) {
      sMatch = clamp(1.0 - (hsl.s - satMax) / softness, 0, 1);
    }

    // 亮度范围匹配（带软边缘）
    let lMatch = 1.0;
    if (hsl.l < lumMin) {
      lMatch = clamp(1.0 - (lumMin - hsl.l) / softness, 0, 1);
    } else if (hsl.l > lumMax) {
      lMatch = clamp(1.0 - (hsl.l - lumMax) / softness, 0, 1);
    }

    // 综合匹配度（三通道取最小值表示 AND 关系）
    let value = hMatch * sMatch * lMatch;
    value = clamp(value, 0, 1);

    // 反转
    if (params.invert) {
      value = 1.0 - value;
    }

    // 写入 RGBA 四个通道（mask 单通道复制到每个像素的四个分量）
    const v = Math.round(value * 255);
    mask[i]     = v;
    mask[i + 1] = v;
    mask[i + 2] = v;
    mask[i + 3] = 255;
  }

  return mask;
}
