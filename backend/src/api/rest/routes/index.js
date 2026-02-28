// src/api/rest/index.js

import { Router } from 'express';
import { authRoutes } from './auth.routes.js';

const restRouter = Router();

// AUTH
restRouter.use('/auth', authRoutes);

export default restRouter;