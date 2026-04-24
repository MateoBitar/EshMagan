// src/api/rest/controllers/auth.controller.js

import { validationResult } from 'express-validator';

/**
 * This file defines the REST controller for authentication operations.
 * It handles user registration, login, token refresh, logout,
 * and password management by delegating logic to authService.
 */

export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    /**
     * Validates request input using express-validator.
     * 
     * PRE-CONDITIONS:
     * - Request must contain validation rules
     * 
     * POST-CONDITIONS:
     * - Returns false and sends 400 response if validation fails
     * - Returns true if validation passes
     */
    _validate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return false;
        }
        return true;
    }

    /**
     * Registers a new user account.
     * 
     * PRE-CONDITIONS:
     * - Request body must contain valid registration data
     * 
     * POST-CONDITIONS:
     * - Returns created user with status 201
     * - Handles validation, conflict, and server errors
     */
    register = async (req, res) => {
        try {
            if (!this._validate(req, res)) return;

            const user = await this.authService.register(req.body);
            res.status(201).json(user);
        } catch (e) {
            if (e.message.includes('Email already registered')) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            if (e.message.includes('Missing required field')) {
                return res.status(400).json({ error: e.message });
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    /**
     * Authenticates user and returns tokens.
     * 
     * PRE-CONDITIONS:
     * - user_email and user_password must be provided
     * 
     * POST-CONDITIONS:
     * - Returns tokens and user data
     * - Handles invalid credentials and errors
     */
    login = async (req, res) => {
        try {
            if (!this._validate(req, res)) return;

            const { user_email, user_password } = req.body;
            const result = await this.authService.login(user_email, user_password);
            res.status(200).json(result);
        } catch (e) {
            if (e.message.includes('Invalid credentials')) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            if (e.message.includes('Missing required field')) {
                return res.status(400).json({ error: e.message });
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    /**
     * Refreshes authentication tokens.
     * 
     * PRE-CONDITIONS:
     * - refreshToken must be provided
     * 
     * POST-CONDITIONS:
     * - Returns new access and refresh tokens
     * - Handles invalid or expired tokens
     */
    refresh = async (req, res) => {
        try {
            if (!this._validate(req, res)) return;

            const { refreshToken } = req.body;
            const result = await this.authService.refreshToken(refreshToken);
            res.status(200).json(result);
        } catch (e) {
            if (e.message.includes('not found') || e.message.includes('Invalid refresh token')) {
                return res.status(401).json({ error: 'Invalid or expired refresh token — please log in again' });
            }
            if (e.message.includes('Missing required field')) {
                return res.status(400).json({ error: e.message });
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    /**
     * Logs out user by invalidating refresh token.
     * 
     * PRE-CONDITIONS:
     * - refreshToken must be provided
     * 
     * POST-CONDITIONS:
     * - Deletes token and ends session
     * - Returns success message
     */
    logout = async (req, res) => {
        try {
            if (!this._validate(req, res)) return;

            const { refreshToken } = req.body;
            await this.authService.logout(refreshToken);
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (e) {
            if (e.message.includes('Missing required field')) {
                return res.status(400).json({ error: e.message });
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    /**
     * Logs out user from all devices.
     * 
     * PRE-CONDITIONS:
     * - user must be authenticated (user_id available)
     * 
     * POST-CONDITIONS:
     * - Deletes all refresh tokens
     * - Returns success message
     */
    logoutAll = async (req, res) => {
        try {
            const user_id = req.user?.user_id;
            if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

            await this.authService.logoutAll(user_id);
            res.status(200).json({ message: 'Logged out from all devices successfully' });
        } catch (e) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };

    /**
     * Changes user password.
     * 
     * PRE-CONDITIONS:
     * - user must be authenticated
     * - old_password and new_password must be provided
     * 
     * POST-CONDITIONS:
     * - Updates password
     * - Invalidates sessions
     * - Returns success message
     */
    changePassword = async (req, res) => {
        try {
            if (!this._validate(req, res)) return;

            const user_id = req.user?.user_id;
            if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

            const { old_password, new_password } = req.body;
            await this.authService.changePassword(user_id, old_password, new_password);
            res.status(200).json({ message: 'Password changed successfully. Please log in again.' });
        } catch (e) {
            if (e.message.includes('Old password is incorrect')) {
                return res.status(400).json({ error: 'Old password is incorrect' });
            }
            if (e.message.includes('Missing required field')) {
                return res.status(400).json({ error: e.message });
            }
            if (e.message.includes('User not found')) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}