import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { expressMiddleware } from '@apollo/server/express4';

import { pool } from './config/db.js';
import restRouter from './api/rest/routes/index.js';
import { createApolloServer } from './api/graphql/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health
app.get('/', (req, res) => {
  res.send('Wildfire backend is running smoothly!');
});

// DB Test
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    res.status(500).send('Database error');
  }
});

// REST
app.use('/api', restRouter);

// GRAPHQL
const { server, buildContext } = await createApolloServer();

app.use(
  '/eshmagan',
  expressMiddleware(server, {
    context: buildContext,
  })
);

export default app;