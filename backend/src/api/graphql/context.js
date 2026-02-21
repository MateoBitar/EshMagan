// src/api/graphql/context.js

// Import services
import { AdminService } from '../services/admin.service.js';
import { MunicipalityService } from '../services/municipality.service.js';
import { ResidentService } from '../services/resident.service.js';
import { ResponderService } from '../services/responder.service.js';
import { EvacuationService } from '../services/evacuation.service.js';
import { UserService } from '../services/user.service.js';
import { FireService } from '../services/fire.service.js'; 
import { FireAssignmentService } from '../services/fireAssignment.service.js';

// Import repositories
import { AdminRepository } from '../repositories/admin.repository.js';
import { MunicipalityRepository } from '../repositories/municipality.repository.js';
import { ResidentRepository } from '../repositories/resident.repository.js';
import { ResponderRepository } from '../repositories/responder.repository.js';
import { EvacuationRepository } from '../repositories/evacuation.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { FireRepository } from '../repositories/fire.repository.js';
import { FireAssignmentRepository } from '../repositories/fireAssignment.repository.js';

/**
 * Build the GraphQL context object.
 * This function instantiates all repositories and services,
 * then injects them into `dataSources` so resolvers can access them.
 */
export async function buildContext() {
  // Instantiate repositories
  const userRepository = new UserRepository();
  const adminRepository = new AdminRepository();
  const municipalityRepository = new MunicipalityRepository();
  const residentRepository = new ResidentRepository();
  const responderRepository = new ResponderRepository();
  const evacuationRepository = new EvacuationRepository();
  const fireRepository = new FireRepository();
  const fireAssignmentRepository = new FireAssignmentRepository();

  // Shared service used across multiple domains
  const userService = new UserService(userRepository);

  // Instantiate services
  const adminService = new AdminService(adminRepository, userService);
  const municipalityService = new MunicipalityService(municipalityRepository, userService);
  const residentService = new ResidentService(residentRepository, userService);
  const responderService = new ResponderService(responderRepository, userService);
  const evacuationService = new EvacuationService(evacuationRepository);
  const fireService = new FireService(fireRepository, userService);
  const fireAssignmentService = new FireAssignmentService(fireAssignmentRepository, userService);

  // Return context object with all services injected
  return {
    dataSources: {
      adminService,
      municipalityService,
      residentService,
      responderService,
      evacuationService,
      userService,
      fireService,
      fireAssignmentService,
    },
  };
}
