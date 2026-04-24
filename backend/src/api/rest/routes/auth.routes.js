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

/**
 * This file defines the REST routes for authentication operations.
 * It initializes repositories, service, and controller,
 * and maps HTTP endpoints to controller methods.
 */

const userRepo         = new UserRepository();
const refreshTokenRepo = new RefreshTokenRepository();
const residentRepo     = new ResidentRepository();

// Pass residentRepository so register() can create the resident profile
const service    = new AuthService(userRepo, refreshTokenRepo, residentRepo);
const controller = new AuthController(service);

/**
 * Initializes authentication routes using Express Router.
 * 
 * PRE-CONDITIONS:
 * - Express application must be configured
 * 
 * POST-CONDITIONS:
 * - Returns router containing all auth endpoints
 */
export const authRoutes = Router();

// Public routes — no token required

/**
 * Register route
 * 
 * PRE-CONDITIONS:
 * - Request must contain registration data
 * 
 * POST-CONDITIONS:
 * - Calls controller.register
 */
authRoutes.post('/register', controller.register);   // no validator — frontend sends all fields

/**
 * Login route
 * 
 * PRE-CONDITIONS:
 * - loginValidator must pass
 * 
 * POST-CONDITIONS:
 * - Calls controller.login
 */
authRoutes.post('/login', loginValidator, controller.login);

/**
 * Refresh token route
 * 
 * PRE-CONDITIONS:
 * - refreshValidator must pass
 * 
 * POST-CONDITIONS:
 * - Calls controller.refresh
 */
authRoutes.post('/refresh', refreshValidator, controller.refresh);

/**
 * Logout route
 * 
 * PRE-CONDITIONS:
 * - logoutValidator must pass
 * 
 * POST-CONDITIONS:
 * - Calls controller.logout
 */
authRoutes.post('/logout', logoutValidator, controller.logout);

// Protected routes — valid access token required

/**
 * Logout from all devices route
 * 
 * PRE-CONDITIONS:
 * - User must be authenticated (valid token)
 * 
 * POST-CONDITIONS:
 * - Calls controller.logoutAll
 */
authRoutes.post('/logout-all', authenticateToken, controller.logoutAll);

/**
 * Change password route
 * 
 * PRE-CONDITIONS:
 * - User must be authenticated
 * - changePasswordValidator must pass
 * 
 * POST-CONDITIONS:
 * - Calls controller.changePassword
 */
authRoutes.post('/change-password', authenticateToken, changePasswordValidator, controller.changePassword);