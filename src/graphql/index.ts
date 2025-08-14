import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const graphqlURL = '/chat';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// 创建 GraphQL Yoga 实例
export const yoga = createYoga({
  schema,
  graphqlEndpoint: graphqlURL,
  landingPage: false,
  // TODO 使用系统变量
  cors: {
    origin: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://ai-app-cb9.pages.dev',
      'https://www.lcif2025.cc',
    ],
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['X-Custom-Header'],
  },
  context: ({ request }) => ({
    request,
    env: (request as any).env, 
  })
});
