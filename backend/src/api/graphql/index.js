// src/api/graphql/index.js

import { ApolloServer } from '@apollo/server';

import { typeDefs } from './schema/schema.js';       // Unified GraphQL schema
import { resolvers } from './resolvers/resolver.js'; // Unified resolvers
import { buildContext } from './context.js';         // Context builder (services & repositories)

export async function createApolloServer() {
  // Create Apollo server instance
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start Apollo (required before attaching to Express)
  await server.start();

  return {
    server,
    buildContext,
  };
}