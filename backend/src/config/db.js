// src/config/db.js
import pkg from "pg";
const { Pool } = pkg;

import { DATABASE_URL } from "./env.js";

console.log("DATABASE_URL:", DATABASE_URL); // <-- add this

const pool = new Pool({
    connectionString: DATABASE_URL,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("PostgreSQL connection error:", err);
});

export default pool;