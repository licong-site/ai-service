# AI Service 🤖⚡

AI服务后端 - 基于Cloudflare Worker的DeepSeek API代理服务，为AI聊天应用提供安全、高效的后端支持。

![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![DeepSeek](https://img.shields.io/badge/DeepSeek-API-green) ![pnpm](https://img.shields.io/badge/pnpm-8.15.0-yellow)

## ✨ 特性

- 🚀 **Cloudflare Worker** - 全球边缘部署，超低延迟
- 🔒 **安全代理** - 隐藏API密钥，防止前端暴露
- 🎯 **类型安全** - 100% TypeScript，零any类型
- 🌐 **CORS支持** - 完善的跨域处理
- 🛡️ **错误处理** - 详细的错误信息和状态码
- ⚡ **高性能** - 边缘计算，毫秒级响应
- 📦 **pnpm优化** - 更快的安装速度，更少的磁盘占用
- 🔧 **易部署** - 一键部署到Cloudflare

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐) 或 npm/yarn

### 1. 克隆项目

```bash
git clone https://github.com/licong-site/ai-service.git
cd ai-service
```

### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 配置环境变量

```bash
# 设置DeepSeek API密钥
wrangler secret put DEEPSEEK_API_KEY

# 设置允许的域名（可选）
wrangler secret put ALLOWED_ORIGINS
```

### 4. 本地开发

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

### 5. 部署到生产环境

```bash
# 使用 pnpm
pnpm deploy

# 或使用 npm
npm run deploy
```

## 📦 pnpm 优势

### 🚀 性能优化
- **3倍更快的安装速度** - 硬链接和符号链接技术
- **节省70%磁盘空间** - 全局存储去重
- **更快的CI/CD** - 减少安装时间

### 🔒 更安全的依赖管理
- **严格的依赖隔离** - 防止幽灵依赖
- **精确的版本控制** - lockfile更准确
- **更好的monorepo支持** - 工作空间管理

### 📋 可用脚本

```bash
pnpm dev           # 本地开发服务器
pnpm deploy        # 部署到生产环境
pnpm type-check    # TypeScript类型检查
pnpm lint          # 代码质量检查
pnpm format        # 代码格式化
pnpm clean         # 清理构建文件
pnpm build         # 构建检查（dry-run）
```

## 🔧 配置

### 环境变量

| 变量名 | 必需 | 描述 | 示例 |
|--------|------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API密钥 | `sk-xxx...` |
| `ALLOWED_ORIGINS` | ❌ | 允许的域名列表 | `https://yourdomain.com,https://localhost:3000` |

### pnpm 配置优化

项目已配置 `.npmrc` 文件进行 pnpm 优化：

```ini
# 严格的依赖管理
strict-peer-dependencies=false
node-linker=isolated
auto-install-peers=true

# 性能优化
resolution-mode=highest
package-import-method=auto
verify-store-integrity=true
```

## 📡 API 使用

### 请求格式

```typescript
POST https://your-worker.workers.dev/

// 简单消息
{
  "message": "你好，DeepSeek！"
}

// 完整对话
{
  "messages": [
    {"role": "system", "content": "你是一个有用的助手"},
    {"role": "user", "content": "什么是人工智能？"}
  ],
  "model": "deepseek-chat",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

### 响应格式

```typescript
// 成功响应
{
  "reply": "你好！我是DeepSeek，很高兴为你服务...",
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 50,
    "total_tokens": 65
  }
}
```

## 🔌 集成到前端

### 在AI Chat App中使用

```typescript
// src/components/ChatApp.tsx
const sendMessageToAPI = async (message: string): Promise<string> => {
  const response = await fetch('https://your-worker.workers.dev', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`API请求失败: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.status === 'error') {
    throw new Error(data.error || '服务器返回错误');
  }
  
  return data.reply;
};
```

## 🛠️ 开发

### 项目结构

```
ai-service/
├── src/index.ts          # Worker主代码
├── wrangler.toml         # Cloudflare配置
├── package.json          # 项目依赖 (pnpm优化)
├── .npmrc               # pnpm配置文件
├── tsconfig.json         # TypeScript配置
├── .eslintrc.json        # ESLint配置
├── .prettierrc           # Prettier配置
├── DEPLOYMENT.md         # 详细部署指南
└── README.md            # 项目文档
```

### 开发工作流

```bash
# 1. 安装依赖
pnpm install

# 2. 类型检查
pnpm type-check

# 3. 代码检查
pnpm lint

# 4. 格式化代码
pnpm format

# 5. 本地开发
pnpm dev

# 6. 部署检查
pnpm build

# 7. 部署到生产
pnpm deploy
```

## 🛡️ 安全

### CORS配置

```bash
# 生产环境建议设置具体域名
wrangler secret put ALLOWED_ORIGINS
# 输入: https://yourdomain.com,https://app.yourdomain.com
```

### API密钥保护

- ✅ 使用Cloudflare Secrets管理敏感信息
- ✅ 密钥不会出现在代码中
- ✅ 支持不同环境的密钥配置

## 📊 监控

### 实时日志

```bash
# 查看生产环境日志
pnpm tail

# 查看详细日志
wrangler tail --format pretty
```

## 🚀 部署

```bash
# 一键部署到生产环境
pnpm deploy

# 部署到特定环境
pnpm deploy:prod
```

## 🔄 迁移到 pnpm

如果你之前使用的是 npm 或 yarn：

```bash
# 删除旧的 lock 文件
rm package-lock.json yarn.lock

# 删除 node_modules
rm -rf node_modules

# 使用 pnpm 重新安装
pnpm install
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关项目

- [AI Chat App](https://github.com/licong-site/ai-app) - 前端聊天应用
- [DeepSeek API](https://platform.deepseek.com/) - DeepSeek官方文档

---

**让AI服务触手可及！使用pnpm享受更快的开发体验！** 🚀