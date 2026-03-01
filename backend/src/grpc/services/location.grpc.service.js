// backend/src/grpc/services/location.grpc.service.js
import { ResponderService } from '../../services/responder.service.js';
import { ResidentService } from '../../services/resident.service.js';
import { FireService } from '../../services/fire.service.js';

const responderService = new ResponderService();
const residentService = new ResidentService();
const fireService = new FireService();

export const locationGrpcService = {
  UpdateLocation: async (call, callback) => {
    try {
      const { entity_id, latitude, longitude, entity_type } = call.request;
      let result;

      if (entity_type === "Responder") {
        result = await responderService.updateResponderLocation(entity_id, latitude, longitude);
      } else if (entity_type === "Resident") {
        result = await residentService.updateResident(entity_id, {
          last_known_location: { latitude, longitude }
        });
      } else if (entity_type === "Fire") {
        result = await fireService.updateFireSpreadPrediction(entity_id, {
          latitude, longitude
        });
      } else {
        throw new Error("Unknown entity type");
      }

      callback(null, result);
    } catch (err) {
      callback(err, null);
    }
  },

  StreamLocations: (call) => {
    const { entity_id, entity_type } = call.request;

    // Example: hook into NATS or DB triggers
    const unsubscribe = subscribeToLocationUpdates(entity_id, entity_type, (update) => {
      call.write(update);
    });

    call.on('end', () => {
      unsubscribe();
      call.end();
    });
  }
};
