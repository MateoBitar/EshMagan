import pkg from "pg";
const { Pool } = pkg;

import { DATABASE_URL } from "./env.js";

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Log successful connection (fires per new client)
pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

// Handle unexpected errors on idle clients
pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});