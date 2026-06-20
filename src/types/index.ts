// 节点类型枚举
export type NodeType =
  | 'primary' | 'colorWheel' | 'curves' | 'secondary'
  | 'qualifier' | 'powerWindow' | 'tracking' | 'rgbMixer'
  | 'lut' | 'colorMatch' | 'noiseReduce';

// 节点基类
export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  enabled: boolean;
  name: string;
  params: Record<string, any>;
}

// 各节点参数接口（完整定义所有12种节点参数）
export interface PrimaryParams {
  exposure: number;      // -2 ~ +2
  contrast: number;      // -1 ~ +1
  highlights: number;    // -1 ~ +1
  shadows: number;       // -1 ~ +1
  whites: number;        // -1 ~ +1
  blacks: number;        // -1 ~ +1
  saturation: number;    // -1 ~ +1
}

export interface ColorWheelParams {
  lift: { h: number; s: number };
  gamma: { h: number; s: number };
  gain: { h: number; s: number };
  liftMaster: number;
  gammaMaster: number;
  gainMaster: number;
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface CurvesParams {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface QualifierParams {
  hueRange: [number, number];
  satRange: [number, number];
  lumRange: [number, number];
  softness: number;
  invert: boolean;
}

export interface PowerWindowParams {
  shape: 'circle' | 'linear';
  centerX: number;
  centerY: number;
  size: number;
  angle: number;
  feather: number;
}

export interface RGBMixerParams {
  redOut: { r: number; g: number; b: number };
  greenOut: { r: number; g: number; b: number };
  blueOut: { r: number; g: number; b: number };
}

export interface LUTParams {
  lutName: string;
  intensity: number;
}

export interface NoiseReduceParams {
  spatialRadius: number;
  strength: number;
  protectDetail: number;
}

// 边连接
export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

// 图像分析结果
export interface AnalysisResult {
  sceneType: 'portrait' | 'landscape' | 'interior' | 'night' | 'other';
  dominantColors: string[];
  brightness: 'dark' | 'normal' | 'bright';
  contrastLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

// 历史记录条目
export interface HistoryEntry {
  id: string;
  timestamp: number;
  nodes: BaseNode[];
  edges: EdgeData[];
  description: string;
  thumbnail?: string;
}

// 节点类型配置映射
export const NODE_TYPE_CONFIG: Record<NodeType, { label: string; color: string; category: string }> = {
  primary: { label: '一级校色', color: '#4ade80', category: 'primary' },
  colorWheel: { label: '色轮调色', color: '#4ade80', category: 'primary' },
  curves: { label: '曲线调色', color: '#4ade80', category: 'primary' },
  secondary: { label: '二级调色', color: '#a855f7', category: 'secondary' },
  qualifier: { label: '限定器抠像', color: '#a855f7', category: 'secondary' },
  powerWindow: { label: 'Power Window', color: '#a855f7', category: 'secondary' },
  tracking: { label: '跟踪调色', color: '#a855f7', category: 'secondary' },
  rgbMixer: { label: 'RGB混合器', color: '#3b82f6', category: 'effect' },
  lut: { label: 'LUT套用', color: '#3b82f6', category: 'effect' },
  colorMatch: { label: '色彩匹配', color: '#3b82f6', category: 'effect' },
  noiseReduce: { label: '降噪处理', color: '#3b82f6', category: 'effect' },
};

// 默认参数工厂函数
export function getDefaultParams(type: NodeType): Record<string, any> {
  switch (type) {
    case 'primary':
      return { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, saturation: 0 };
    case 'colorWheel':
      return { lift: { h: 0, s: 0 }, gamma: { h: 0, s: 0 }, gain: { h: 0, s: 0 }, liftMaster: 0, gammaMaster: 0, gainMaster: 0 };
    case 'curves':
      return { master: [{x:0,y:0},{x:1,y:1}], red: [{x:0,y:0},{x:1,y:1}], green: [{x:0,y:0},{x:1,y:1}], blue: [{x:0,y:0},{x:1,y:1}] };
    case 'secondary':
      return { hueShift: 0, satAdjust: 0, lumAdjust: 0, saturation: 0, contrast: 0 };
    case 'qualifier':
      return { hueRange: [0, 360], satRange: [0, 100], lumRange: [0, 100], softness: 10, invert: false };
    case 'powerWindow':
      return { shape: 'circle', centerX: 50, centerY: 50, size: 30, angle: 0, feather: 15 };
    case 'tracking':
      return { trackArea: { x: 20, y: 20, w: 30, h: 40 }, sensitivity: 50 };
    case 'rgbMixer':
      return { redOut: { r: 100, g: 0, b: 0 }, greenOut: { r: 0, g: 100, b: 0 }, blueOut: { r: 0, g: 0, b: 100 } };
    case 'lut':
      return { lutName: '', intensity: 1.0 };
    case 'colorMatch':
      return { referenceImage: null, matchStrength: 0.8 };
    case 'noiseReduce':
      return { spatialRadius: 2, strength: 0.5, protectDetail: 0.3 };
    default:
      return {};
  }
}
