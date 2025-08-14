import { callDeepSeekAPI, ChatRequest, ChatResponse, DeepSeekError, validateChatRequest } from "./deepseek";
import { isValidOrigin } from "./utils";


/**
 * 处理 REST API 请求（保持向后兼容）
 */
export async function handleRestAPI(request: Request, env: Env): Promise<Response> {
  try {
    // 验证请求来源
    const origin = request.headers.get('Origin');
    if (!isValidOrigin(origin, env)) {
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
    console.error('REST API error:', error);

    if (error instanceof DeepSeekError) {
      return createErrorResponse(error.message, error.statusCode, error.errorType);
    }

    return createErrorResponse('Internal server error', 500);
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
