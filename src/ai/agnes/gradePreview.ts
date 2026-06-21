/**
 * 复查阶段预览图生成模块
 *
 * 功能：根据 V1 的调色命令（GradingCommand[]）对原始 ImageData 应用调色效果，
 *       生成一张调色后的图片 base64（JPEG dataURL），供复查阶段预览使用。
 */

import { executeWorkflow } from '../../engines/workflow/WorkflowEngine';
import type { BaseNode, EdgeData } from '../../types';
import type { GradingCommand } from './imageAnalyzer';

/** 最大输出边长（像素） */
const MAX_OUTPUT_SIZE = 1024;

/** JPEG 输出质量 */
const JPEG_QUALITY = 0.85;

/**
 * 将 GradingCommand 数组转换为 BaseNode[] + EdgeData[]
 *
 * 转换规则：
 * - 每个 command 生成一个 BaseNode，按顺序分配 id（node-0, node-1, ...）
 * - 节点之间按顺序串联：node-0 → node-1 → node-2 → ...
 * - 节点位置沿 Y 轴递增排列，便于调试时可视化
 *
 * @param commands - AI 生成的调色命令数组
 * @returns 节点数组和边数组，可直接传入 executeWorkflow
 */
export function commandsToNodes(commands: GradingCommand[]): { nodes: BaseNode[]; edges: EdgeData[] } {
  const nodes: BaseNode[] = [];
  const edges: EdgeData[] = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const nodeId = `preview-node-${i}`;

    // 构建 BaseNode
    const node: BaseNode = {
      id: nodeId,
      type: cmd.nodeType as BaseNode['type'],
      position: { x: 0, y: i * 120 }, // 垂直排列
      enabled: true,
      name: cmd.description || `${cmd.nodeType} #${i + 1}`,
      params: cmd.params || {},
    };
    nodes.push(node);

    // 构建串联边（前一个节点 → 当前节点）
    if (i > 0) {
      const prevNodeId = `preview-node-${i - 1}`;
      edges.push({
        id: `edge-${prevNodeId}-${nodeId}`,
        source: prevNodeId,
        target: nodeId,
      });
    }
  }

  return { nodes, edges };
}

/**
 * 根据调色命令生成调色后的预览图（JPEG base64 dataURL）
 *
 * 流程：
 * 1. 将 GradingCommand[] 转换为 BaseNode[] + EdgeData[]
 * 2. 调用 executeWorkflow 对原始 ImageData 执行完整调色流程
 * 3. 将结果 ImageData 绘制到 canvas 并导出为 JPEG base64
 *
 * @param imageData - 原始图像数据（未调色的原图）
 * @param commands - V1 阶段生成的调色命令数组
 * @returns JPEG 格式的 base64 dataURL（如 "data:image/jpeg;base64,..."）
 */
export function generateGradedImage(imageData: ImageData, commands: GradingCommand[]): string {
  // 空命令直接返回原图的 base64
  if (!commands || commands.length === 0) {
    return imageDataToDataURL(imageData);
  }

  // 1. 命令转换为节点 + 边
  const { nodes, edges } = commandsToNodes(commands);

  // 2. 执行调色工作流
  const gradedImageData = executeWorkflow(imageData, nodes, edges);

  // 3. 结果转 JPEG base64
  return imageDataToDataURL(gradedImageData);
}

/**
 * 将 ImageData 转换为 JPEG base64 dataURL
 *
 * - 等比缩放至最大边长 MAX_OUTPUT_SIZE（1024px）
 * - 使用 JPEG_QUALITY（0.85）质量压缩
 *
 * @param imageData - 待转换的图像数据
 * @returns "data:image/jpeg;base64,..." 格式的字符串
 */
function imageDataToDataURL(imageData: ImageData): string {
  const { width: origW, height: origH } = imageData;

  // 计算等比缩放尺寸
  let drawW = origW;
  let drawH = origH;
  if (origW > MAX_OUTPUT_SIZE || origH > MAX_OUTPUT_SIZE) {
    const scale = Math.min(MAX_OUTPUT_SIZE / origW, MAX_OUTPUT_SIZE / origH);
    drawW = Math.round(origW * scale);
    drawH = Math.round(origH * scale);
  }

  // 原图放入临时 canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
  srcCtx.putImageData(imageData, 0, 0);

  // 输出 canvas 用缩放后尺寸，JPEG 压缩
  const outCanvas = document.createElement('canvas');
  outCanvas.width = drawW;
  outCanvas.height = drawH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.drawImage(srcCanvas, 0, 0, drawW, drawH);

  return outCanvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
