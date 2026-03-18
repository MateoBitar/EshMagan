// src/api/rest/routes/auth.routes.js

import { Router } from 'express';
import { UserRepository } from '../../../domain/repositories/user.repository.js';
import { RefreshTokenRepository } from '../../../domain/repositories/refreshtoken.repository.js';
import { ResidentRepository } from '../../../domain/repositories/resident.repository.js';
import { AuthService } from '../../../services/auth.service.js';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../../../middleware/auth.middleware.js';
import {
    loginValidator,
    refreshValidator,
    logoutValidator,
    changePasswordValidator
} from '../../../middleware/validation.middleware.js';

const userRepo         = new UserRepository();
const refreshTokenRepo = new RefreshTokenRepository();
const residentRepo     = new ResidentRepository();

// Pass residentRepository so register() can create the resident profile
const service    = new AuthService(userRepo, refreshTokenRepo, residentRepo);
const controller = new AuthController(service);

export const authRoutes = Router();

// Public routes — no token required
authRoutes.post('/register', controller.register);   // no validator — frontend sends all fields
authRoutes.post('/login', loginValidator, controller.login);
authRoutes.post('/refresh', refreshValidator, controller.refresh);
authRoutes.post('/logout', logoutValidator, controller.logout);

// Protected routes — valid access token required
authRoutes.post('/logout-all', authenticateToken, controller.logoutAll);
authRoutes.post('/change-password', authenticateToken, changePasswordValidator, controller.changePassword);
