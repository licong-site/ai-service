import { 
  callDeepSeekAPI, 
  DeepSeekError,
  ChatRequest,
  ChatMessage
} from '../deepseek';

export interface Context {
  env: Env;
  request: Request;
}

interface Env {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGINS?: string;
}

interface SendMessageInput {
  message: string;
  messages?: ChatMessageInput[];
  userId?: string;
  sessionId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ChatMessageInput {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

export const resolvers = {
  Query: {
    health: () => ({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '2.0.0-graphql'
    }),

    apiConfig: () => ({
      version: '2.0.0-graphql',
      supportedModels: ['deepseek-chat', 'deepseek-coder'],
      maxTokens: 32000,
      timestamp: new Date().toISOString()
    })
  },

  Mutation: {
    sendMessage: async (_: any, { input }: { input: SendMessageInput }, context: Context) => {
      try {
        // 验证输入
        if (!input.message && !input.messages) {
          return {
            reply: '',
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Message or messages array is required',
            errorType: 'MISSING_MESSAGE'
          };
        }

        // 转换 GraphQL 输入为内部格式
        const chatRequest: ChatRequest = {
          message: input.message,
          messages: input.messages?.map(msg => ({
            role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
            content: msg.content
          })),
          userId: input.userId,
          sessionId: input.sessionId,
          model: input.model,
          temperature: input.temperature,
          max_tokens: input.maxTokens
        };

        // 调用 DeepSeek API
        const response = await callDeepSeekAPI(chatRequest, context.env);

        return {
          reply: response.reply,
          status: 'SUCCESS',
          timestamp: response.timestamp,
          usage: response.usage ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens
          } : null,
          error: null,
          errorType: null
        };

      } catch (error) {
        console.error('GraphQL sendMessage error:', error);

        if (error instanceof DeepSeekError) {
          return {
            reply: '',
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
            errorType: error.errorType,
            usage: null
          };
        }

        return {
          reply: '',
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: 'Internal server error',
          errorType: 'INTERNAL_ERROR',
          usage: null
        };
      }
    }
  }
};
