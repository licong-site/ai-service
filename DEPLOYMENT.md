# 部署指南 📚

完整的AI Service Cloudflare Worker部署教程

## 🚀 快速部署

### 1. 安装 Wrangler CLI

```bash
# 使用 npm 安装
npm install -g wrangler

# 或使用 yarn
yarn global add wrangler

# 验证安装
wrangler --version
```

### 2. 认证 Cloudflare

```bash
# 登录 Cloudflare 账户
wrangler auth login
```

这会打开浏览器，登录你的 Cloudflare 账户并授权。

### 3. 克隆并设置项目

```bash
# 克隆项目
git clone https://github.com/licong-site/ai-service.git
cd ai-service

# 安装依赖
npm install
```

### 4. 配置环境变量

#### 设置 DeepSeek API Key

```bash
# 设置 API Key（必需）
wrangler secret put DEEPSEEK_API_KEY
# 在提示时输入你的 DeepSeek API Key
```

#### 设置允许的域名（可选）

```bash
# 设置允许访问的域名
wrangler secret put ALLOWED_ORIGINS
# 例如：https://yourdomain.com,https://localhost:3000
```

### 5. 本地测试

```bash
# 启动本地开发服务器
npm run dev
```

在另一个终端测试：

```bash
# 测试 API
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，DeepSeek！"}'
```

### 6. 部署到生产环境

```bash
# 部署到 Cloudflare
npm run deploy
```

部署成功后，你会看到类似输出：

```
✨ Success! Uploaded to Cloudflare Workers
🌍 Deployed to https://ai-service.your-subdomain.workers.dev
```

## 🔧 详细配置

### DeepSeek API Key 获取

1. 访问 [DeepSeek 平台](https://platform.deepseek.com/)
2. 注册并登录账户
3. 在 API Keys 页面创建新的 API Key
4. 复制 API Key（格式如：`sk-xxxxxxxxxxxxx`）

### 自定义域名（可选）

#### 1. 在 Cloudflare Dashboard 中设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 Workers & Pages
3. 找到你的 `ai-service` Worker
4. 点击 "Settings" > "Triggers"
5. 添加自定义域名

#### 2. 更新 wrangler.toml

```toml
name = "ai-service"
main = "src/index.ts"
compatibility_date = "2024-01-15"

# 添加自定义域名
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

### 环境分离

#### 开发环境

```bash
# 部署到开发环境
wrangler deploy --env development

# 设置开发环境的环境变量
wrangler secret put DEEPSEEK_API_KEY --env development
```

#### 生产环境

```bash
# 部署到生产环境
wrangler deploy --env production

# 设置生产环境的环境变量
wrangler secret put DEEPSEEK_API_KEY --env production
wrangler secret put ALLOWED_ORIGINS --env production
```

## 🛠️ 高级配置

### 使用 KV 存储（可选）

#### 1. 创建 KV 命名空间

```bash
# 创建 KV 命名空间
wrangler kv:namespace create "CHAT_SESSIONS"
wrangler kv:namespace create "CHAT_SESSIONS" --preview
```

#### 2. 更新 wrangler.toml

```toml
[[kv_namespaces]]
binding = "CHAT_SESSIONS"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

#### 3. 在代码中使用

```typescript
// 在 Worker 中使用 KV
interface Env {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGINS?: string;
  CHAT_SESSIONS: KVNamespace; // 添加 KV 绑定
}

// 存储会话
await env.CHAT_SESSIONS.put(`session:${sessionId}`, JSON.stringify(messages));

// 获取会话
const sessionsData = await env.CHAT_SESSIONS.get(`session:${sessionId}`);
```

### 使用 R2 存储（可选）

#### 1. 创建 R2 存储桶

```bash
# 创建 R2 存储桶
wrangler r2 bucket create ai-service-files
```

#### 2. 更新 wrangler.toml

```toml
[[r2_buckets]]
binding = "AI_FILES"
bucket_name = "ai-service-files"
```

## 📊 监控和日志

### 查看实时日志

```bash
# 查看实时日志
npm run tail

# 或指定环境
wrangler tail --env production
```

### 设置告警（可选）

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 进入 "Observability" 选项卡
4. 设置错误率或延迟告警

## 🔒 安全最佳实践

### 1. API Key 安全

```bash
# ✅ 正确：使用 Wrangler secrets
wrangler secret put DEEPSEEK_API_KEY

# ❌ 错误：不要在代码中硬编码
const API_KEY = "sk-xxxxx"; // 永远不要这样做
```

### 2. CORS 配置

```bash
# 生产环境：设置具体域名
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# 开发环境：可以包含 localhost
ALLOWED_ORIGINS=https://yourdomain.com,https://localhost:3000
```

### 3. 速率限制

考虑在 Worker 中添加速率限制：

```typescript
// 简单的速率限制示例
const RATE_LIMIT = 60; // 每分钟60次请求
const rateLimiter = new Map();

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const windowStart = now - 60000; // 1分钟窗口
  
  if (!rateLimiter.has(clientIP)) {
    rateLimiter.set(clientIP, []);
  }
  
  const requests = rateLimiter.get(clientIP);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(clientIP, recentRequests);
  return true;
}
```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 认证失败

```bash
Error: Not authenticated
```

**解决方案：**
```bash
wrangler auth login
wrangler whoami  # 验证登录状态
```

#### 2. API Key 未设置

```bash
Error: DeepSeek API key not configured
```

**解决方案：**
```bash
wrangler secret put DEEPSEEK_API_KEY
wrangler secret list  # 查看已设置的 secrets
```

#### 3. CORS 错误

```bash
Error: Origin not allowed
```

**解决方案：**
```bash
# 临时允许所有源（仅开发环境）
wrangler secret put ALLOWED_ORIGINS
# 输入: *

# 或设置具体域名
# 输入: https://yourdomain.com,https://localhost:3000
```

#### 4. 部署失败

```bash
Error: Script size exceeds limit
```

**解决方案：**
- 检查依赖大小
- 移除不必要的导入
- 使用 Tree Shaking

#### 5. 运行时错误

```bash
Error: TypeError: Cannot read property
```

**解决方案：**
```bash
# 查看详细日志
wrangler tail --format pretty

# 本地调试
wrangler dev --local
```

### 调试技巧

#### 1. 本地调试

```bash
# 启用详细日志
wrangler dev --local --verbose

# 使用 console.log 调试
console.log('Debug info:', { request, env });
```

#### 2. 远程调试

```bash
# 查看实时日志
wrangler tail

# 过滤错误日志
wrangler tail | grep "ERROR"
```

## 📈 性能优化

### 1. 减少冷启动时间

```typescript
// 预加载常量
const SYSTEM_MESSAGE = '你是一个有用的AI助手...';
const DEFAULT_MODEL = 'deepseek-chat';

// 避免在请求处理中创建大对象
const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};
```

### 2. 缓存优化

```typescript
// 使用 KV 缓存常见响应
const cacheKey = `cache:${hash(message)}`;
const cachedResponse = await env.CACHE.get(cacheKey);

if (cachedResponse) {
  return new Response(cachedResponse, { headers: responseHeaders });
}
```

### 3. 请求优化

```typescript
// 设置合理的超时时间
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000); // 30秒超时

const response = await fetch(API_URL, {
  signal: controller.signal,
  // ...其他选项
});
```

## 🔄 更新和维护

### 版本管理

```bash
# 查看当前版本
npm version

# 发布新版本
npm version patch  # 补丁版本
npm version minor  # 小版本
npm version major  # 大版本

# 推送标签
git push --tags
```

### 定期维护

1. **更新依赖**
   ```bash
   npm update
   npm audit fix
   ```

2. **监控性能**
   - 定期检查 Cloudflare Analytics
   - 监控错误率和响应时间
   - 检查 API 使用量

3. **备份配置**
   ```bash
   # 导出配置
   wrangler secret list
   
   # 备份 wrangler.toml
   cp wrangler.toml wrangler.toml.backup
   ```

## 🎯 最佳实践总结

### ✅ 推荐做法

1. **安全**
   - 使用 Wrangler secrets 管理敏感信息
   - 设置具体的 CORS 域名
   - 实施速率限制

2. **性能**
   - 预加载常量和配置
   - 使用适当的缓存策略
   - 设置合理的超时时间

3. **监控**
   - 启用详细日志记录
   - 设置错误告警
   - 定期检查性能指标

4. **维护**
   - 定期更新依赖
   - 备份重要配置
   - 使用版本标签管理发布

### ❌ 避免的做法

1. **安全风险**
   - 在代码中硬编码 API Key
   - 允许所有域名访问（生产环境）
   - 忽略输入验证

2. **性能问题**
   - 在请求处理中进行大量计算
   - 不设置超时时间
   - 忽略缓存机制

3. **维护问题**
   - 不记录日志
   - 不监控错误率
   - 忽略依赖更新

现在你的 AI Service 已经完全部署就绪！🚀