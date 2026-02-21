// src/api/graphql/index.js

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { typeDefs } from './schema/schema.js'; // unified GraphQL schema
import { adminResolvers } from './resolvers/admin.resolver.js';
import { municipalityResolvers } from './resolvers/municipality.resolver.js';
import { residentResolvers } from './resolvers/resident.resolver.js';
import { responderResolvers } from './resolvers/responder.resolver.js';

// Services & repositories
import { AdminService } from '../services/admin.service.js';
import { MunicipalityService } from '../services/municipality.service.js';
import { ResidentService } from '../services/resident.service.js';
import { ResponderService } from '../services/responder.service.js';
import { UserService } from '../services/user.service.js';

import { AdminRepository } from '../repositories/admin.repository.js';
import { MunicipalityRepository } from '../repositories/municipality.repository.js';
import { ResidentRepository } from '../repositories/resident.repository.js';
import { ResponderRepository } from '../repositories/responder.repository.js';

async function startApolloServer() {
  // Create Apollo server instance
  const server = new ApolloServer({
    typeDefs,
    resolvers: [
      adminResolvers,
      municipalityResolvers,
      residentResolvers,
      responderResolvers,
    ],
  });

  // Start server with context injection
  const { url } = await startStandaloneServer(server, {
    context: async () => {
      // Instantiate shared service
      const userService = new UserService();

      // Instantiate repositories
      const adminRepository = new AdminRepository();
      const municipalityRepository = new MunicipalityRepository();
      const residentRepository = new ResidentRepository();
      const responderRepository = new ResponderRepository();

      // Instantiate services with dependencies
      const adminService = new AdminService(adminRepository, userService);
      const municipalityService = new MunicipalityService(municipalityRepository, userService);
      const residentService = new ResidentService(residentRepository, userService);
      const responderService = new ResponderService(responderRepository, userService);

      // Inject into context for resolvers
      return {
        dataSources: {
          adminService,
          municipalityService,
          residentService,
          responderService,
        },
      };
    },
  });

  console.log(`GraphQL server ready at ${url}`);
}

// Run server
startApolloServer();
