// src/grpc/clients/location.grpc.client.js
import { loadProto, grpc } from '../../config/grpc.js';

// Load the gRPC client stub for LocationService
const locationProto = loadProto('location.proto', 'location');

// Create a gRPC client instance connected to the backend server
const client = new locationProto.LocationService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Function to call the UpdateLocation RPC method on the gRPC server
export function updateLocationViaGrpc({ entity_id, latitude, longitude, entity_type }) {
  return new Promise((resolve, reject) => {
    client.UpdateLocation(
      { entity_id, latitude, longitude, entity_type },
      (err, response) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      }
    );
  });
}
