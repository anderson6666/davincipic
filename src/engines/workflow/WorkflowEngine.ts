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
