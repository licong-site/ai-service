// DeepSeek AI Cloudflare Worker with GraphQL Support
// 支持 REST API 和 GraphQL 双协议

import { createYoga } from 'graphql-yoga';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { 
  callDeepSeekAPI, 
  validateChatRequest, 
  DeepSeekError,
  ChatRequest,
  ChatResponse 
} from './deepseek';

interface Env {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGINS?: string;
}

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema: {
    typeDefs,
    resolvers
  },
  graphqlEndpoint: '/graphql',
  landingPage: false,
  cors: {
    origin: (origin) => {
      // 在生产环境中，这里应该使用环境变量来控制允许的源
      return true; // 临时允许所有源，生产环境需要更严格的控制
    },
    credentials: true,
  },
  context: ({ request, env }) => ({
    request,
    env
  })
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // GraphQL 路由
    if (url.pathname === '/graphql') {
      return yoga.fetch(request, env, ctx);
    }
    
    // 健康检查路由
    if (url.pathname === '/health' || url.pathname === '/') {
      return handleHealthCheck();
    }
    
    // CORS 预检请求处理（REST API）
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }
    
    // REST API 路由（保持向后兼容）
    if (request.method === 'POST' && url.pathname === '/') {
      return handleRestAPI(request, env);
    }
    
    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  },
};

/**
 * 健康检查处理
 */
function handleHealthCheck(): Response {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '2.0.0-graphql',
    endpoints: {
      rest: '/',
      graphql: '/graphql',
      health: '/health'
    }
  };

  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * 处理 REST API 请求（保持向后兼容）
 */
async function handleRestAPI(request: Request, env: Env): Promise<Response> {
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
    console.error('REST API error:', error);

    if (error instanceof DeepSeekError) {
      return createErrorResponse(error.message, error.statusCode, error.errorType);
    }

    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * 处理 CORS 预检请求
 */
function handleCORS(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
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
