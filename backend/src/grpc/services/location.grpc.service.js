// grpc/services/location.grpc.service.js
import { ResponderRepository } from '../../domain/repositories/responder.repository.js';
import { ResidentRepository }  from '../../domain/repositories/resident.repository.js';
import { FireRepository }      from '../../domain/repositories/fire.repository.js';
import { UserRepository }      from '../../domain/repositories/user.repository.js';
import { UserService }         from '../../services/user.service.js';
import { ResponderService }    from '../../services/responder.service.js';
import { ResidentService }     from '../../services/resident.service.js';
import { getNATSConnection, sc } from '../../config/nats.js';

const userRepository   = new UserRepository();
const userService      = new UserService(userRepository);
const responderService = new ResponderService(new ResponderRepository(), userService);
const residentService  = new ResidentService(new ResidentRepository(), userService);
const fireRepository   = new FireRepository();

// Subscribe to NATS location updates for a specific entity.
// Publishers push to location.<EntityType>.<entity_id> subjects.
// Returns an unsubscribe function for cleanup on stream end.
function subscribeToLocationUpdates(entity_id, entity_type, onUpdate) {
    const nc = getNATSConnection();
    const subject = `location.${entity_type}.${entity_id}`;
    const sub = nc.subscribe(subject);

    (async () => {
        for await (const msg of sub) {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                onUpdate({
                    entity_id: data.entity_id,
                    latitude:  data.latitude,
                    longitude: data.longitude,
                    timestamp: data.timestamp ?? new Date().toISOString()
                });
            } catch (err) {
                console.error(`[gRPC] StreamLocations parse error: ${err.message}`);
            }
        }
    })();

    return () => sub.unsubscribe();
}

// Publish location update to NATS so StreamLocations subscribers receive it
function publishLocationUpdate(entity_id, entity_type, latitude, longitude, timestamp) {
    try {
        const nc = getNATSConnection();
        const subject = `location.${entity_type}.${entity_id}`;
        nc.publish(subject, sc.encode(JSON.stringify({
            entity_id,
            latitude,
            longitude,
            timestamp
        })));
    } catch (natsErr) {
        console.warn(`[gRPC] NATS publish failed: ${natsErr.message}`);
    }
}

export const locationGrpcService = {

    // Unary RPC — update location once and return result
    UpdateLocation: async (call, callback) => {
        try {
            const { entity_id, latitude, longitude, entity_type } = call.request;
            let entity_result_id;
            let last_known_location;
            let updated_at;

            if (entity_type === 'Responder') {
                const result = await responderService.updateResponderLocation(
                    entity_id, latitude, longitude
                );
                entity_result_id    = result.responder_id;
                last_known_location = JSON.stringify(result.last_known_location);
                updated_at          = result.updated_at ?? new Date().toISOString();

            } else if (entity_type === 'Resident') {
                const result = await residentService.updateResident(entity_id, {
                    last_known_location: { latitude, longitude }
                });
                entity_result_id    = result.resident_id;
                last_known_location = JSON.stringify(result.last_known_location);
                updated_at          = result.updated_at ?? new Date().toISOString();

            } else if (entity_type === 'Fire') {
                const wkt = `POINT(${longitude} ${latitude})`;
                const result = await fireRepository.updateFireSpreadPrediction(entity_id, wkt);
                entity_result_id    = result.fire_id;
                last_known_location = result.fire_location ?? wkt;
                updated_at          = result.updated_at ?? new Date().toISOString();

            } else {
                return callback(new Error(`Unknown entity_type: ${entity_type}`), null);
            }

            // Publish to NATS → StreamLocations subscribers receive the update
            publishLocationUpdate(entity_id, entity_type, latitude, longitude, updated_at);

            callback(null, {
                entity_id:           entity_result_id ?? entity_id,
                last_known_location: last_known_location,
                updated_at:          updated_at
            });

        } catch (err) {
            console.error(`[gRPC] UpdateLocation error: ${err.message}`);
            callback(err, null);
        }
    },

    // Server-streaming RPC — stream live location updates to client
    StreamLocations: (call) => {
        const { entity_id, entity_type } = call.request;

        const unsubscribe = subscribeToLocationUpdates(entity_id, entity_type, (update) => {
            try {
                call.write(update);
            } catch (err) {
                console.error(`[gRPC] StreamLocations write error: ${err.message}`);
            }
        });

        call.on('cancelled', () => {
            unsubscribe();
            call.end();
        });

        call.on('error', (err) => {
            console.error(`[gRPC] StreamLocations stream error: ${err.message}`);
            unsubscribe();
        });
    }
};
