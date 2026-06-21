import type {
  AgnesAPIRequest,
  AgnesRawResponse,
  AgnesAPIResponse,
} from './types';
import { AgnesAPIError } from './types';
import { SYSTEM_PROMPTS } from './prompts';

const API_URLS: Record<string, string> = {
  apihub: 'https://apihub.agnes-ai.com/v1',
  platform: 'https://platform.agnes-ai.com/v1',
};
const DEFAULT_API_KEY = 'apihub';
const DEFAULT_MODEL = 'agnes-2.0-flash';

export type APIConnectionStatus = 'idle' | 'validating' | 'connected' | 'error' | 'no_key';

/** 可选的 API 地址列表 */
export const API_ENDPOINTS = Object.entries(API_URLS).map(([key, url]) => ({
  key,
  label: key === 'platform' ? 'Platform' : 'APIHub',
  url,
}));

/**
 * Agnes AI API 客户端
 *
 * 提供图像分析和连接验证功能
 * 支持 apihub / platform 两种 API 地址
 */
export class AgnesAPIClient {
  private apiKey: string = '';
  private baseUrl: string;
  private _status: APIConnectionStatus = 'idle';

  get status(): APIConnectionStatus { return this._status; }
  get currentUrl(): string { return this.baseUrl; }

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = options?.apiKey || this.loadSavedKey();
    this.baseUrl = options?.baseUrl || this.loadSavedUrl() || API_URLS[DEFAULT_API_KEY];
  }

  // ========== API Key 管理 ==========

  /** 设置 API Key 并持久化到 localStorage */
  setApiKey(key: string): void {
    this.apiKey = key.trim();
    if (typeof window !== 'undefined' && key.trim()) {
      localStorage.setItem('agnes_api_key', key.trim());
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('agnes_api_key');
    }
    this._status = 'idle';
  }

  /** 获取当前 API Key */
  getApiKey(): string {
    return this.apiKey;
  }

  /** 是否已配置 Key */
  hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  /** 从 localStorage 恢复 Key */
  private loadSavedKey(): string {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('agnes_api_key') || '';
    } catch {
      return '';
    }
  }

  // ========== API 地址管理 ==========

  /** 设置 API 地址并持久化到 localStorage */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this._status = 'idle';
    if (typeof window !== 'undefined') {
      const key = Object.entries(API_URLS).find(([, v]) => v === url)?.[0] || 'custom';
      localStorage.setItem('agnes_api_url', url);
      localStorage.setItem('agnes_api_url_key', key);
    }
  }

  /** 获取当前 API 地址 */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** 从 localStorage 恢复 API 地址 */
  private loadSavedUrl(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('agnes_api_url');
    } catch {
      return null;
    }
  }

  // ========== API 连接验证 ==========

  /**
   * 验证 API Key 是否有效
   * 发送一个最小化的请求测试连通性
   */
  async validateConnection(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      this._status = 'no_key';
      return { valid: false, error: '未配置 API Key' };
    }

    this._status = 'validating';

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(60000), // 60秒超时（移动端网络可能较慢）
      });

      if (response.ok) {
        this._status = 'connected';
        return { valid: true };
      } else if (response.status === 401 || response.status === 403) {
        this._status = 'error';
        return { valid: false, error: `认证失败 (${response.status}): API Key 无效或已过期` };
      } else {
        this._status = 'error';
        return { valid: false, error: `服务器错误 (${response.status})` };
      }
    } catch (err) {
      this._status = 'error';
      const msg = err instanceof Error ? err.message : '网络连接失败';
      return { valid: false, error: msg };
    }
  }

  // ========== 核心请求方法 ==========

  /**
   * 发送聊天补全请求
   * @param onProgress - 可选的下载进度回调 (loaded, total) => void，total 为预估值（-1 表示未知）
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: any }>,
    systemPrompt?: string,
    useJSONFormat: boolean = true,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<AgnesAPIResponse> {
    if (!this.apiKey) {
      throw new AgnesAPIError('未配置 API Key，请在设置中输入 Agnes AI API Key');
    }

    const request: AgnesAPIRequest = {
      model: DEFAULT_MODEL,
      temperature: 0.3,
      max_tokens: 8000,
      ...(useJSONFormat && { response_format: { type: 'json_object' } }),
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        ...messages,
      ],
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(60000), // 60秒超时
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');

      if (response.status === 401 || response.status === 403) {
        throw new AgnesAPIError(`API Key 认证失败 (${response.status})`, response.status, 'AUTH_ERROR');
      }
      if (response.status === 429) {
        throw new AgnesAPIError('API 请求频率超限，请稍后重试', response.status, 'RATE_LIMIT');
      }

      throw new AgnesAPIError(
        `API 请求失败 (${response.status}): ${errorBody.slice(0, 200)}`,
        response.status,
      );
    }

    // 使用 ReadableStream 读取响应体，支持真实进度追踪
    let raw: AgnesRawResponse;
    const contentLength = response.headers.get('content-length');
    const estimatedTotal = contentLength ? parseInt(contentLength, 10) : 8192; // 无 Content-Length 时使用预估值

    if (onProgress && response.body) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;
        onProgress(loaded, Math.max(estimatedTotal, loaded));
      }

      // 合并所有 chunk 并解析
      const combined = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const text = new TextDecoder().decode(combined);
      raw = JSON.parse(text);
    } else {
      raw = await response.json();
    }

    if (!raw.choices || raw.choices.length === 0) {
      throw new AgnesAPIError('API 返回空响应');
    }

    const content = raw.choices[0].message.content;

    if (!content || content.trim().length === 0) {
      throw new AgnesAPIError('AI 返回了空内容');
    }

    // 解析 JSON（去除可能的 markdown 代码块标记）
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    try {
      const parsed: AgnesAPIResponse = JSON.parse(jsonStr);
      
      // 验证必要字段
      if (!parsed.commands || !Array.isArray(parsed.commands)) {
        console.warn('[Agnes API] 响应缺少 commands 字段，尝试修复');
        parsed.commands = [];
      }

      return parsed;
    } catch (e) {
      throw new AgnesAPIError(
        `AI 返回的 JSON 格式无法解析。原始内容前200字: ${content.slice(0, 200)}`,
      );
    }
  }

  // ========== 业务方法 ==========

  /**
   * 图像分析 + 自动调色决策
   */
  async analyzeImage(imageBase64: string, onProgress?: (loaded: number, total: number) => void): Promise<AgnesAPIResponse> {
    return this.chat(
      [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBase64, detail: 'low' } },
          { type: 'text', text: '请分析这张图片并给出调色方案。' },
        ],
      }],
      SYSTEM_PROMPTS.imageAnalysis,
      true,
      onProgress,
    );
  }

  /**
   * Prompt 解析（保留接口，当前不使用）
   */
  async parsePrompt(_userPrompt: string, _imageBase64?: string): Promise<AgnesAPIResponse> {
    throw new AgnesAPIError('Prompt 解析功能已禁用，系统完全由 AI 自动决策');
  }
}

// 导出全局单例
export const agnesClient = new AgnesAPIClient();
