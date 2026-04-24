import pkg from "pg";
const { Pool } = pkg;

import { DATABASE_URL } from "./env.js";

/**
 * This file initializes and exports the PostgreSQL connection pool.
 * It manages database connections and handles connection lifecycle events.
 */

/**
 * Create PostgreSQL connection pool
 * 
 * PRE-CONDITIONS:
 * - DATABASE_URL must be defined and valid
 * 
 * POST-CONDITIONS:
 * - Pool instance is created and ready for queries
 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Handle successful database connection event
 * 
 * PRE-CONDITIONS:
 * - A new client connection is established
 * 
 * POST-CONDITIONS:
 * - Logs successful connection message
 */
// Log successful connection (fires per new client)
pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

/**
 * Handle unexpected database errors
 * 
 * PRE-CONDITIONS:
 * - An error occurs on an idle client
 * 
 * POST-CONDITIONS:
 * - Logs error details for debugging
 */
// Handle unexpected errors on idle clients
pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});