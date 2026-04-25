import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * This file provides utility functions for working with gRPC.
 * It includes helpers for loading proto definitions and creating gRPC servers.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to load a proto file

/**
 * Load a gRPC proto file and return its package definition
 * 
 * PRE-CONDITIONS:
 * - protoFile must exist in ../grpc/proto directory
 * - packageName must match the proto package
 * 
 * POST-CONDITIONS:
 * - Returns loaded gRPC package definition
 */
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

/**
 * Create a new gRPC server instance
 * 
 * PRE-CONDITIONS:
 * - gRPC library must be available
 * 
 * POST-CONDITIONS:
 * - Returns initialized gRPC server
 */
export function createGrpcServer() {
  return new grpc.Server();
}

/**
 * Export gRPC module for external usage
 * 
 * PRE-CONDITIONS:
 * - gRPC module must be imported
 * 
 * POST-CONDITIONS:
 * - Allows access to gRPC credentials and utilities
 */
// Export grpc for credentials
export { grpc };