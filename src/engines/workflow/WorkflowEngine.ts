/**
 * 工作流执行引擎 (Workflow Engine)
 *
 * 功能：
 *   - 拓扑排序节点（基于 edges 的 DAG）
 *   - 按顺序执行每个节点
 *   - qualifier / powerWindow 节点生成 mask 并传递给下游 secondary 节点
 *   - 返回最终处理的 ImageData
 */

import type { BaseNode, EdgeData } from '../../types';
import { applyPrimaryGrade } from '../grading/PrimaryGrade';
import { applyColorWheel } from '../grading/ColorWheelGrade';
import { applyCurves } from '../grading/CurvesGrade';
import { applySecondaryGrade } from '../grading/SecondaryGrade';
import { generateQualifierMask } from '../grading/Qualifier';
import { generatePowerWindowMask } from '../grading/PowerWindowMask';
import { applyRGBMixer } from '../grading/RGBMixer';
import { applyLUT } from '../grading/LUTProcessor';
import { applyNoiseReduction } from '../grading/NoiseReduction';
import { rgbToHsl, clamp } from '../../utils/colorUtils';

/** 处理器映射表 */
const PROCESSOR_MAP: Record<string, Function> = {
  primary: applyPrimaryGrade,
  colorWheel: applyColorWheel,
  curves: applyCurves,
  secondary: applySecondaryGrade,
  qualifier: generateQualifierMask,       // 返回 mask
  powerWindow: generatePowerWindowMask,    // 返回 mask
  rgbMixer: applyRGBMixer,
  lut: applyLUT,
  noiseReduce: applyNoiseReduction,
};

/** 返回 mask 的节点类型集合 */
const MASK_NODE_TYPES = new Set(['qualifier', 'powerWindow']);

export function executeWorkflow(
  originalImageData: ImageData,
  nodes: BaseNode[],
  edges: EdgeData[]
): ImageData {
  if (nodes.length === 0) {
    // 无节点：返回原图副本
    const out = new ImageData(originalImageData.width, originalImageData.height);
    out.data.set(originalImageData.data);
    return out;
  }

  // ---- 1. 拓扑排序 ----
  const sortedNodes = topologicalSort(nodes, edges);

  // ---- 2. 按顺序执行节点 ----
  let currentImageData: ImageData = cloneImageData(originalImageData);

  // 存储各节点生成的 mask（供下游 secondary 使用）
  const maskStore: Map<string, Uint8ClampedArray> = new Map();

  for (const node of sortedNodes) {
    if (!node.enabled) continue;

    const processor = PROCESSOR_MAP[node.type];
    if (!processor) continue; // 未知节点类型跳过

    if (MASK_NODE_TYPES.has(node.type)) {
      // ---- Mask 生成节点 ----
      let mask: Uint8ClampedArray;

      if (node.type === 'qualifier') {
        mask = generateQualifierMask(currentImageData, node.params as any);
      } else {
        // powerWindow
        mask = generatePowerWindowMask(
          currentImageData.width,
          currentImageData.height,
          node.params as any
        );
      }

      maskStore.set(node.id, mask);
      // Mask 节点不改变图像数据，只存储 mask

    } else if (node.type === 'secondary') {
      // ---- 二级调色：需要查找上游传入的 mask ----
      const upstreamMask = findUpstreamMask(node.id, nodes, edges, maskStore);
      currentImageData = applySecondaryGrade(currentImageData, upstreamMask, node.params);

    } else {
      // ---- 普通图像处理节点 ----
      currentImageData = processor(currentImageData, node.params) as ImageData;
    }
  }

  // ---- 3. 颜色多样性保护 ----
  // 防止调色后直方图坍塌（所有颜色偏向单一色）
  // 对色相偏移过大的像素，回混一定比例的原始颜色
  currentImageData = preserveColorDiversity(originalImageData, currentImageData);

  return currentImageData;
}

// ---- 内部辅助函数 ----

/**
 * 基于 DFS 的拓扑排序
 * 返回按依赖顺序排列的节点列表
 */
function topologicalSort(nodes: BaseNode[], edges: EdgeData[]): BaseNode[] {
  // 构建邻接表和入度表
  const adjMap = new Map<string, string[]>(); // node -> successors
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjMap.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    adjMap.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Kahn 算法
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: BaseNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const next of adjMap.get(id) ?? []) {
      const newDeg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }

  // 如果有环（sorted 长度 < nodes 长度），回退到原始顺序
  if (sorted.length < nodes.length) {
    return [...nodes];
  }

  return sorted;
}

/**
 * 查找节点的所有上游 mask 节点输出的 mask
 * 如果有多个上游 mask，取交集（逐像素取最小值）
 */
function findUpstreamMask(
  nodeId: string,
  nodes: BaseNode[],
  edges: EdgeData[],
  maskStore: Map<string, Uint8ClampedArray>
): Uint8ClampedArray | null {
  // 找到所有直接连接到此节点的边（source -> target == ? -> nodeId）
  const sourceIds = edges
    .filter(e => e.target === nodeId)
    .map(e => e.source);

  // 收集所有上游 mask
  const masks: Uint8ClampedArray[] = [];
  for (const sid of sourceIds) {
    const mask = maskStore.get(sid);
    if (mask) masks.push(mask);
  }

  if (masks.length === 0) return null; // 无 mask
  if (masks.length === 1) return masks[0]; // 单个 mask 直接返回

  // 多个 mask 取交集（逐像素 min）
  const result = new Uint8ClampedArray(masks[0].length);
  for (let i = 0; i < result.length; i++) {
    let minVal = 255;
    for (const m of masks) {
      if (m[i] < minVal) minVal = m[i];
    }
    result[i] = minVal;
  }

  return result;
}

/** 克隆 ImageData（深拷贝） */
function cloneImageData(imageData: ImageData): ImageData {
  const copy = new ImageData(imageData.width, imageData.height);
  copy.data.set(imageData.data);
  return copy;
}

/**
 * 颜色多样性保护
 *
 * 核心问题：调色后所有颜色偏向单一色，直方图从丰富分布坍塌为几条直线
 * 解决方案：对每个像素检测色相偏移量，偏移越大则回混越多原始颜色
 *
 * 机制：
 * - 色相偏移 < 10°：完全保留调色结果
 * - 色相偏移 10°~30°：逐渐回混原始颜色（10°时 0%，30°时 30%）
 * - 色相偏移 > 30°：回混 30%~50% 原始颜色
 * - 饱和度大幅变化时也回混原始颜色
 *
 * 这样既保留了调色的整体方向感，又确保不同颜色不会坍塌到同一色相
 */
function preserveColorDiversity(original: ImageData, graded: ImageData): ImageData {
  const { width, height } = graded;
  const output = new ImageData(width, height);
  const out = output.data;
  const origData = original.data;
  const gradData = graded.data;

  for (let i = 0; i < gradData.length; i += 4) {
    const or = origData[i], og = origData[i + 1], ob = origData[i + 2];
    const gr = gradData[i], gg = gradData[i + 1], gb = gradData[i + 2];

    // 转换到 HSL 比较色相偏移
    const origHsl = rgbToHsl(or, og, ob);
    const gradHsl = rgbToHsl(gr, gg, gb);

    // 计算色相偏移（考虑环形距离）
    let hueDiff = Math.abs(gradHsl.h - origHsl.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;

    // 计算饱和度变化比例
    const satRatio = origHsl.s > 5
      ? Math.abs(gradHsl.s - origHsl.s) / origHsl.s
      : 0;

    // 根据偏移量计算回混比例
    let blendBack = 0;

    // 色相偏移越大，回混越多
    if (hueDiff > 10) {
      blendBack = Math.min(0.5, (hueDiff - 10) / 40 * 0.3);
    }

    // 饱和度变化过大也回混
    if (satRatio > 0.3) {
      blendBack = Math.max(blendBack, Math.min(0.4, (satRatio - 0.3) * 0.5));
    }

    // 低饱和度像素被强行拉高饱和度时，回混更多
    if (origHsl.s < 10 && gradHsl.s > 20) {
      blendBack = Math.max(blendBack, 0.4);
    }

    // 混合
    out[i]     = Math.round(clamp(gr + (or - gr) * blendBack, 0, 255));
    out[i + 1] = Math.round(clamp(gg + (og - gg) * blendBack, 0, 255));
    out[i + 2] = Math.round(clamp(gb + (ob - gb) * blendBack, 0, 255));
    out[i + 3] = gradData[i + 3];
  }

  return output;
}
