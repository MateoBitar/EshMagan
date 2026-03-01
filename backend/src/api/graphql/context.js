// src/api/graphql/context.js

// Services
import { AdminService }           from '../../services/admin.service.js';
import { MunicipalityService }    from '../../services/municipality.service.js';
import { ResidentService }        from '../../services/resident.service.js';
import { ResponderService }       from '../../services/responder.service.js';
import { EvacuationService }      from '../../services/evacuation.service.js';
import { UserService }            from '../../services/user.service.js';
import { FireService }            from '../../services/fire.service.js';
import { FireAssignmentService }  from '../../services/fireAssignment.service.js';
import { AlertService }           from '../../services/alert.service.js';
import { NotificationService }    from '../../services/notification.service.js';

// Repositories
import { AdminRepository }          from '../../domain/repositories/admin.repository.js';
import { MunicipalityRepository }   from '../../domain/repositories/municipality.repository.js';
import { ResidentRepository }       from '../../domain/repositories/resident.repository.js';
import { ResponderRepository }      from '../../domain/repositories/responder.repository.js';
import { EvacuationRepository }     from '../../domain/repositories/evacuation.repository.js';
import { UserRepository }           from '../../domain/repositories/user.repository.js';
import { FireRepository }           from '../../domain/repositories/fire.repository.js';
import { FireAssignmentRepository } from '../../domain/repositories/fireAssignment.repository.js';
import { AlertRepository }          from '../../domain/repositories/alert.repository.js';
import { NotificationRepository }   from '../../domain/repositories/notification.repository.js';
import { natsPublisher }            from '../../events/publishers/nats.publisher.js';

// Engine / NATS stubs
// These will be replaced with real implementations when those layers are built.
// Stubbed here so FireService can be instantiated without crashing.
const infraredEngine      = { analyze:  async () => null };
const firePredictionEngine = { predict:  async () => null };
const fireSpreadEngine    = { spread:   async () => null };

// Context Builder
// Called on every GraphQL request by Apollo.
// Instantiates all repositories and services and injects them into dataSources.
export async function buildContext({ req }) {

    // Repositories
    const userRepository           = new UserRepository();
    const adminRepository          = new AdminRepository();
    const municipalityRepository   = new MunicipalityRepository();
    const residentRepository       = new ResidentRepository();
    const responderRepository      = new ResponderRepository();
    const evacuationRepository     = new EvacuationRepository();
    const fireRepository           = new FireRepository();
    const fireAssignmentRepository = new FireAssignmentRepository();
    const alertRepository          = new AlertRepository();
    const notificationRepository   = new NotificationRepository();

    // Shared service
    const userService = new UserService(userRepository);

    // Services
    const adminService          = new AdminService(adminRepository, userService);
    const municipalityService   = new MunicipalityService(municipalityRepository, userService);
    const residentService       = new ResidentService(residentRepository, userService);
    const responderService      = new ResponderService(responderRepository, userService);
    const evacuationService     = new EvacuationService(evacuationRepository);
    const fireAssignmentService = new FireAssignmentService(fireAssignmentRepository);
    const alertService          = new AlertService(alertRepository);
    const notificationService   = new NotificationService(notificationRepository, userService);

    const fireService = new FireService(
        fireRepository,
        fireAssignmentService,
        evacuationRepository,
        alertRepository,
        responderService,
        infraredEngine,
        firePredictionEngine,
        fireSpreadEngine,
        natsPublisher
    );

    return {
        user: req?.user ?? null, // populated by auth.middleware if access token present
        dataSources: {
            userService,
            adminService,
            municipalityService,
            residentService,
            responderService,
            evacuationService,
            fireService,
            fireAssignmentService,
            alertService,
            notificationService,
        },
    };
}
