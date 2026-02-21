// src/api/graphql/context.js

// Import services
import { AdminService } from '../services/admin.service.js';
import { MunicipalityService } from '../services/municipality.service.js';
import { ResidentService } from '../services/resident.service.js';
import { ResponderService } from '../services/responder.service.js';
import { EvacuationService } from '../services/evacuation.service.js';
import { UserService } from '../services/user.service.js';

// Import repositories
import { AdminRepository } from '../repositories/admin.repository.js';
import { MunicipalityRepository } from '../repositories/municipality.repository.js';
import { ResidentRepository } from '../repositories/resident.repository.js';
import { ResponderRepository } from '../repositories/responder.repository.js';
import { EvacuationRepository } from '../repositories/evacuation.repository.js';

/**
 * Build the GraphQL context object.
 * This function instantiates all repositories and services,
 * then injects them into `dataSources` so resolvers can access them.
 */
export async function buildContext() {
  // Shared service used across multiple domains
  const userService = new UserService();

  // Instantiate repositories
  const adminRepository = new AdminRepository();
  const municipalityRepository = new MunicipalityRepository();
  const residentRepository = new ResidentRepository();
  const responderRepository = new ResponderRepository();
  const evacuationRepository = new EvacuationRepository();

  // Instantiate services
  const adminService = new AdminService(adminRepository, userService);
  const municipalityService = new MunicipalityService(municipalityRepository, userService);
  const residentService = new ResidentService(residentRepository, userService);
  const responderService = new ResponderService(responderRepository, userService);
  const evacuationService = new EvacuationService(evacuationRepository);

  // Return context object with all services injected
  return {
    dataSources: {
      adminService,
      municipalityService,
      residentService,
      responderService,
      evacuationService,
    },
  };
}
