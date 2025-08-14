/**
 * 验证请求来源
 */
export function isValidOrigin(origin: string | null, env: Env): boolean {
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
export function getAllowedOrigins(env: Env): string[] {
  if (!env.ALLOWED_ORIGINS) {
    return ['*']; // 默认允许所有来源
  }

  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
}
