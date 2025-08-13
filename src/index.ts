// DeepSeek AI Cloudflare Worker
// 处理聊天请求并转发到DeepSeek API

interface Env {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGINS?: string; // 逗号分隔的允许域名，如: "https://yourdomain.com,https://localhost:3000"
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  messages?: ChatMessage[];
  userId?: string;
  sessionId?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface ChatResponse {
  reply: string;
  status: 'success' | 'error';
  timestamp: string;
  error?: string;
  errorType?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

class DeepSeekError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DeepSeekError';
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS 预检请求处理
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405);
    }

    try {
      // 验证请求来源
      if (!isValidOrigin(request, env)) {
        return createErrorResponse('Origin not allowed', 403);
      }

      // 解析请求体
      const chatRequest = await parseRequest(request);
      
      // 验证请求数据
      validateChatRequest(chatRequest);

      // 调用 DeepSeek API
      const response = await callDeepSeekAPI(chatRequest, env);

      return createSuccessResponse(response);

    } catch (error) {
      console.error('Worker error:', error);

      if (error instanceof DeepSeekError) {
        return createErrorResponse(error.message, error.statusCode, error.errorType);
      }

      return createErrorResponse('Internal server error', 500);
    }
  },
};

/**
 * 处理 CORS 预检请求
 */
function handleCORS(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24小时
  };

  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * 验证请求来源
 */
function isValidOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);

  // 如果配置了允许所有来源
  if (allowedOrigins.includes('*')) {
    return true;
  }

  // 如果没有 Origin 头（可能是同源请求或 API 调用）
  if (!origin) {
    return true; // 或者根据需要返回 false
  }

  return allowedOrigins.includes(origin);
}

/**
 * 获取允许的来源列表
 */
function getAllowedOrigins(env: Env): string[] {
  if (!env.ALLOWED_ORIGINS) {
    return ['*']; // 默认允许所有来源
  }

  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
}

/**
 * 解析请求体
 */
async function parseRequest(request: Request): Promise<ChatRequest> {
  try {
    const body = await request.json() as ChatRequest;
    return body;
  } catch (error) {
    throw new DeepSeekError('Invalid JSON in request body', 400, 'INVALID_JSON');
  }
}

/**
 * 验证聊天请求
 */
function validateChatRequest(chatRequest: ChatRequest): void {
  if (!chatRequest.message && !chatRequest.messages) {
    throw new DeepSeekError('Message or messages array is required', 400, 'MISSING_MESSAGE');
  }

  if (chatRequest.message && typeof chatRequest.message !== 'string') {
    throw new DeepSeekError('Message must be a string', 400, 'INVALID_MESSAGE_TYPE');
  }

  if (chatRequest.message && chatRequest.message.trim().length === 0) {
    throw new DeepSeekError('Message cannot be empty', 400, 'EMPTY_MESSAGE');
  }

  if (chatRequest.message && chatRequest.message.length > 32000) {
    throw new DeepSeekError('Message too long (max 32000 characters)', 400, 'MESSAGE_TOO_LONG');
  }
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeekAPI(chatRequest: ChatRequest, env: Env): Promise<ChatResponse> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new DeepSeekError('DeepSeek API key not configured', 500, 'MISSING_API_KEY');
  }

  // 构建消息数组
  let messages: ChatMessage[];
  
  if (chatRequest.messages) {
    // 如果提供了完整的消息历史
    messages = chatRequest.messages;
  } else {
    // 如果只提供了单个消息，创建简单的对话
    messages = [
      {
        role: 'system',
        content: '你是一个有用的AI助手，请提供准确、有帮助的回答。'
      },
      {
        role: 'user',
        content: chatRequest.message
      }
    ];
  }

  // 构建 DeepSeek API 请求
  const deepSeekRequest: DeepSeekRequest = {
    model: chatRequest.model || 'deepseek-chat',
    messages: messages,
    temperature: chatRequest.temperature ?? 0.7,
    max_tokens: chatRequest.max_tokens ?? 2048,
    stream: false
  };

  try {
    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(deepSeekRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as DeepSeekErrorResponse;
      
      // 处理不同类型的错误
      let errorMessage = errorData.error?.message || `DeepSeek API error: ${response.status}`;
      let errorType = 'DEEPSEEK_API_ERROR';

      // 特殊处理余额不足错误
      if (response.status === 402 || errorMessage.toLowerCase().includes('insufficient balance')) {
        errorMessage = '账户余额不足，请前往 DeepSeek 平台充值后继续使用。';
        errorType = 'INSUFFICIENT_BALANCE';
      } else if (response.status === 401) {
        errorMessage = 'API密钥无效，请检查配置。';
        errorType = 'INVALID_API_KEY';
      } else if (response.status === 429) {
        errorMessage = '请求频率过高，请稍后重试。';
        errorType = 'RATE_LIMIT_EXCEEDED';
      } else if (response.status === 403) {
        errorMessage = 'API访问被拒绝，请检查权限配置。';
        errorType = 'ACCESS_DENIED';
      }

      throw new DeepSeekError(errorMessage, response.status, errorType, errorData);
    }

    const deepSeekResponse = await response.json() as DeepSeekResponse;

    // 检查响应结构
    if (!deepSeekResponse.choices || deepSeekResponse.choices.length === 0) {
      throw new DeepSeekError('No response from DeepSeek API', 500, 'EMPTY_RESPONSE');
    }

    const reply = deepSeekResponse.choices[0].message.content;

    return {
      reply: reply,
      status: 'success',
      timestamp: new Date().toISOString(),
      usage: deepSeekResponse.usage,
    };

  } catch (error) {
    if (error instanceof DeepSeekError) {
      throw error;
    }

    // 网络错误或其他错误
    throw new DeepSeekError(
      `Failed to call DeepSeek API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'NETWORK_ERROR'
    );
  }
}

/**
 * 创建成功响应
 */
function createSuccessResponse(data: ChatResponse): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 简单的 CORS 处理（生产环境应该更严格）
  headers['Access-Control-Allow-Origin'] = '*';
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}

/**
 * 创建错误响应
 */
function createErrorResponse(message: string, status: number, errorType?: string): Response {
  const errorResponse: ChatResponse = {
    reply: '',
    status: 'error',
    timestamp: new Date().toISOString(),
    error: message,
    errorType: errorType,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 简单的 CORS 处理
  headers['Access-Control-Allow-Origin'] = '*';
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers,
  });
}