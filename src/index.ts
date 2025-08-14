// DeepSeek AI Cloudflare Worker with GraphQL Support
// 支持 REST API 和 GraphQL 双协议
import { yoga } from './graphql';
import { getAllowedOrigins } from './utils';
import { handleRestAPI } from './restApi';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // GraphQL 路由
    if (url.pathname === '/chat') {
      (request as any).env = env;
      return yoga.fetch(request, env, ctx);
    }
    
    // CORS 预检请求处理（REST API）
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }
    
    // REST API 路由（测试用）
    if (request.method === 'POST' && url.pathname === '/rest') {
      return handleRestAPI(request, env);
    }
    
    // 404 for unknown routes
    return new Response('Not Found', { status: 404 });
  },
};

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
    'Access-Control-Allow-Credentials': 'false',
  };

  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}
