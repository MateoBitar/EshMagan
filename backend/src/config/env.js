// src/config/env.js
import dotenv from "dotenv";
import path from "path";

/**
 * This file loads environment variables from the .env file
 * and exports them for use across the application.
 */

/**
 * Load environment variables using dotenv
 * 
 * PRE-CONDITIONS:
 * - .env file must exist at specified path
 * 
 * POST-CONDITIONS:
 * - Environment variables are loaded into process.env
 */
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

/**
 * Application port configuration
 * 
 * PRE-CONDITIONS:
 * - PORT may be defined in environment variables
 * 
 * POST-CONDITIONS:
 * - Exports PORT value (default 5000 if undefined)
 */
export const PORT = process.env.PORT || 5000;

/**
 * Database connection string
 * 
 * PRE-CONDITIONS:
 * - DATABASE_URL must be defined in environment variables
 * 
 * POST-CONDITIONS:
 * - Used to connect to PostgreSQL database
 */
export const DATABASE_URL = process.env.DATABASE_URL;

/**
 * JWT access token secret
 * 
 * PRE-CONDITIONS:
 * - JWT_ACCESS_SECRET must be defined
 * 
 * POST-CONDITIONS:
 * - Used to sign and verify access tokens
 */
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * JWT refresh token secret
 * 
 * PRE-CONDITIONS:
 * - JWT_REFRESH_SECRET must be defined
 * 
 * POST-CONDITIONS:
 * - Used to sign and verify refresh tokens
 */
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * Encryption key for sensitive data
 * 
 * PRE-CONDITIONS:
 * - ENCRYPTION_KEY must be defined
 * 
 * POST-CONDITIONS:
 * - Used for encryption/decryption processes
 */
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * NATS server URL
 * 
 * PRE-CONDITIONS:
 * - NATS_URL must be defined
 * 
 * POST-CONDITIONS:
 * - Used to connect to NATS messaging system
 */
export const NATS_URL = process.env.NATS_URL;