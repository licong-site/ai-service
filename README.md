# AI Service 🤖⚡

AI服务后端 - 基于Cloudflare Worker的DeepSeek API代理服务，为AI聊天应用提供安全、高效的后端支持。

![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![DeepSeek](https://img.shields.io/badge/DeepSeek-API-green) ![Zero Config](https://img.shields.io/badge/Zero%20Config-✅-brightgreen)

## ✨ 特性

- 🚀 **Cloudflare Worker** - 全球边缘部署，超低延迟
- 🔒 **安全代理** - 隐藏API密钥，防止前端暴露
- 🎯 **类型安全** - 100% TypeScript，零any类型
- 🌐 **CORS支持** - 完善的跨域处理
- 🛡️ **错误处理** - 详细的错误信息和状态码
- ⚡ **高性能** - 边缘计算，毫秒级响应
- 🔧 **易部署** - 一键部署到Cloudflare

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/licong-site/ai-service.git
cd ai-service
```

### 2. 安装依赖

```bash
npm install
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
npm run dev
```

### 5. 部署到生产环境

```bash
npm run deploy
```

## 🔧 配置

### 环境变量

| 变量名 | 必需 | 描述 | 示例 |
|--------|------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API密钥 | `sk-xxx...` |
| `ALLOWED_ORIGINS` | ❌ | 允许的域名列表 | `https://yourdomain.com,https://localhost:3000` |

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
├── src/
│   └── index.ts          # Worker主代码
├── wrangler.toml         # Cloudflare配置
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript配置
├── .eslintrc.json        # ESLint配置
└── .prettierrc           # Prettier配置
```

### 可用脚本

```bash
npm run dev           # 本地开发服务器
npm run deploy        # 部署到生产环境
npm run tail          # 查看实时日志
npm run type-check    # TypeScript类型检查
npm run lint          # 代码质量检查
npm run format        # 代码格式化
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
npm run tail

# 查看详细日志
wrangler tail --format pretty
```

## 🚀 部署

```bash
# 一键部署到生产环境
npm run deploy
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关项目

- [AI Chat App](https://github.com/licong-site/ai-app) - 前端聊天应用
- [DeepSeek API](https://platform.deepseek.com/) - DeepSeek官方文档

---

**让AI服务触手可及！** 🚀