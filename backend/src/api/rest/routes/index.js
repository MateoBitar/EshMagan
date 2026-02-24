// src/api/rest/index.js

import { Router } from 'express';
import { authRoutes } from './routes/auth.routes.js';

const restRouter = Router();

// AUTH
restRouter.use('/auth', authRoutes);

export default restRouter;