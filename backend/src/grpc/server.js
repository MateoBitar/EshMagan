import { createGrpcServer, loadProto, grpc } from '../config/grpc.js';
import { locationGrpcService } from './services/location.grpc.service.js';
import { connectNATS } from '../config/nats.js';

const locationProto = loadProto('location.proto', 'location');

async function startGrpcServer() {
    // Connect NATS first — required for StreamLocations subscription
    await connectNATS();
    console.log('[gRPC] NATS connected');

    const server = createGrpcServer();
    server.addService(locationProto.LocationService.service, locationGrpcService);

    const address = '0.0.0.0:50051';
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
        if (err) {
            console.error('gRPC server failed to start:', err);
            process.exit(1);
        }
        console.log(`gRPC server running at ${address}`);
    });
}

startGrpcServer();
