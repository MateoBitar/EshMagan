// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Basic route (health check)
app.get("/", (req, res) => {
  res.send("Wildfire backend is running smoothly!");
});

import pool from "./config/db.js";

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

export default app;