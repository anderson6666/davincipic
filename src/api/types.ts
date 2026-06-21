// ========== API 请求类型 ==========

/** 图片内容 (base64 或 URL) */
export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;           // base64 data URI 或 HTTP URL
    detail?: 'auto' | 'low' | 'high';
  };
}

/** 文本内容 */
export interface TextContent {
  type: 'text';
  text: string;
}

/** 消息内容 (联合类型) */
export type MessageContent = string | (ImageContent | TextContent)[];

/** 聊天消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
  name?: string;
}

/** API 请求体 */
export interface AgnesAPIRequest {
  model: string;                    // 模型名称
  messages: ChatMessage[];          // 对话消息列表
  response_format?: {               // 强制 JSON 输出
    type: 'json_object';
  };
  temperature?: number;             // 温度 (0-1)，建议 0.3 保证稳定性
  max_tokens?: number;              // 最大 token 数
  stream?: boolean;                 // 是否流式
}

// ========== API 响应类型 (严格格式) ==========

/** 单条调色命令 */
export interface GradingCommand {
  nodeType: 'primary' | 'colorWheel' | 'curves' | 'secondary'
            | 'qualifier' | 'powerWindow' | 'tracking' | 'rgbMixer'
            | 'lut' | 'colorMatch' | 'noiseReduce';
  params: Record<string, any>;
  confidence: number;        // 0-1 置信度
  description: string;       // 中文描述
}

/** 图像分析结果 */
export interface ImageAnalysis {
  sceneType: 'portrait' | 'landscape' | 'interior' | 'night' | 'other';
  dominantColors: string[];  // hex 颜色数组，如 ["#ff5500", "#2244aa"]
  brightness: 'dark' | 'normal' | 'bright';
  contrastLevel: 'low' | 'medium' | 'high';
}

/** API 返回的完整响应结构 (JSON) */
export interface AgnesAPIResponse {
  analysis?: ImageAnalysis;
  suggestions?: string[];          // 中文调色建议数组 (2-5条)
  commands: GradingCommand[];      // 调色命令数组 (可为空)
  reasoning?: string;              // AI 的推理过程说明 (可选)
}

/** API 原始响应包装 */
export interface AgnesRawResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;             // JSON 字符串，需解析为 AgnesAPIResponse
      reasoning_content?: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ========== 错误类型 ==========

export class AgnesAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AgnesAPIError';
  }
}
