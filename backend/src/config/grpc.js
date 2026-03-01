import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to load a proto file
export function loadProto(protoFile, packageName) {
  const PROTO_PATH = path.join(__dirname, '../grpc/proto', protoFile);

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(packageDefinition)[packageName];
}

// Utility to create a gRPC server
export function createGrpcServer() {
  return new grpc.Server();
}

// Export grpc for credentials
export { grpc };
