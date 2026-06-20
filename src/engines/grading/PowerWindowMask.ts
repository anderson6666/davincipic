/**
 * Power Window 遮罩生成 (Power Window Mask)
 *
 * 支持两种形状：
 *   - 圆形遮罩：基于到圆心距离 + feather 羽化
 *   - 线性遮罩：基于角度 + feather 羽化
 * 返回 mask (0-255)，每个像素 RGBA 四通道同值
 */

import type { PowerWindowParams } from '../../types';
import { clamp } from '../../utils/colorUtils';

export function generatePowerWindowMask(
  width: number,
  height: number,
  params: PowerWindowParams
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height * 4);

  // 将百分比坐标转为像素坐标
  const cx = (params.centerX / 100) * width;
  const cy = (params.centerY / 100) * height;
  // size 为短边百分比，转为像素半径
  const radius = (params.size / 100) * Math.min(width, height);
  const featherPixels = Math.max((params.feather / 100) * Math.min(width, height), 0.5);

  if (params.shape === 'circle') {
    generateCircleMask(mask, width, height, cx, cy, radius, featherPixels);
  } else {
    generateLinearMask(mask, width, height, cx, cy, params.angle, radius, featherPixels);
  }

  return mask;
}

/** 圆形遮罩 */
function generateCircleMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  feather: number
): void {
  const innerR = Math.max(radius - feather, 0);
  const outerR = radius + feather;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let value: number;
      if (dist <= innerR) {
        value = 1.0;
      } else if (dist >= outerR) {
        value = 0.0;
      } else {
        value = 1.0 - (dist - innerR) / (outerR - innerR); // 线性羽化
      }

      const v = Math.round(clamp(value, 0, 1) * 255);
      const idx = (y * width + x) * 4;
      mask[idx]     = v;
      mask[idx + 1] = v;
      mask[idx + 2] = v;
      mask[idx + 3] = 255;
    }
  }
}

/** 线性（渐变）遮罩 */
function generateLinearMask(
  mask: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  angleDeg: number,
  size: number,
  feather: number
): void {
  // 角度转弧度，并旋转坐标系使渐变方向与角度对齐
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const cosA = Math.cos(-angleRad);
  const sinA = Math.sin(-angleRad);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 相对于中心点的坐标
      const px = x - cx;
      const py = y - cy;

      // 旋转后的投影距离
      const projDist = px * cosA - py * sinA;

      let value: number;
      if (projDist <= -size) {
        value = 0.0;
      } else if (projDist >= size) {
        value = 1.0;
      } else {
        value = (projDist + size) / (2 * size); // [-size, size] -> [0, 1]
      }

      // 应用羽化到边缘
      if (feather > 0 && (Math.abs(projDist) > size - feather)) {
        const edgeDist = Math.abs(projDist) - (size - feather);
        value *= clamp(1.0 - edgeDist / feather, 0, 1);
      }

      const v = Math.round(clamp(value, 0, 1) * 255);
      const idx = (y * width + x) * 4;
      mask[idx]     = v;
      mask[idx + 1] = v;
      mask[idx + 2] = v;
      mask[idx + 3] = 255;
    }
  }
}
