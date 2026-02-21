// src/graphql/index.js

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { typeDefs } from './schemas/schema.js';       // your GraphQL schema
import { adminResolvers } from './resolvers/admin.resolver.js'; // resolvers

// Services & repositories
import { AdminService } from '../services/admin.service.js';
import { UserService } from '../services/user.service.js';
import { AdminRepository } from '../repositories/admin.repository.js';

async function startApolloServer() {
  // Create Apollo server instance
  const server = new ApolloServer({
    typeDefs,
    resolvers: [adminResolvers], // you can merge multiple resolver files here
  });

  // Start server with context injection
  const { url } = await startStandaloneServer(server, {
    context: async () => {
      // Instantiate dependencies
      const userService = new UserService();
      const adminRepository = new AdminRepository();
      const adminService = new AdminService(adminRepository, userService);

      // Inject into context
      return {
        dataSources: {
          adminService,
        },
      };
    },
  });

  console.log(`GraphQL server ready at ${url}`);
}

// Run server
startApolloServer();