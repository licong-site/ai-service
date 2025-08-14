import { makeExecutableSchema } from '@graphql-tools/schema';

export const typeDefs = `
  type Query {
    health: HealthStatus!
    apiConfig: APIConfig!
  }

  type Mutation {
    sendMessage(input: SendMessageInput!): ChatResponse!
  }

  type HealthStatus {
    status: String!
    timestamp: String!
    version: String!
  }

  type APIConfig {
    version: String!
    supportedModels: [String!]!
    maxTokens: Int!
    timestamp: String!
  }

  input SendMessageInput {
    message: String!
    messages: [ChatMessageInput!]
    userId: String
    sessionId: String
    model: String
    temperature: Float
    maxTokens: Int
  }

  input ChatMessageInput {
    role: ChatRole!
    content: String!
  }

  enum ChatRole {
    USER
    ASSISTANT
    SYSTEM
  }

  type ChatResponse {
    reply: String!
    status: ResponseStatus!
    timestamp: String!
    usage: TokenUsage
    error: String
    errorType: String
  }

  enum ResponseStatus {
    SUCCESS
    ERROR
  }

  type TokenUsage {
    promptTokens: Int!
    completionTokens: Int!
    totalTokens: Int!
  }
`;
