// src/api/graphql/index.js

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { typeDefs } from './schema/schema.js';       // Unified GraphQL schema
import { resolvers } from './resolvers/resolver.js'; // Unified resolvers
import { buildContext } from './context.js';         // Context builder (services & repositories)

async function startApolloServer() {
  // Create Apollo server instance
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start server with context injection
  const { url } = await startStandaloneServer(server, {
    context: buildContext, // Delegated to context.js
  });

  console.log(`GraphQL server ready at ${url}`);
}

(async () => {
  try {
    // Run Server
    await startApolloServer();
  } catch (err) {
    console.error("Failed to start GraphQL server:", err);
    process.exit(1);
  }
})();
