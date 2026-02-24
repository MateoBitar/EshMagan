// src/api/rest/controllers/auth.controller.js

import { validationResult } from 'express-validator';

export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    _validate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return false;
        }
        return true;
    }

    // POST /api/auth/register
    // Creates a new user account (no token issued — user must login after)
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

    // POST /api/auth/login
    // Returns accessToken + refreshToken + user DTO
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

    // POST /api/auth/refresh
    // Accepts a refresh token, rotates it, returns new accessToken + refreshToken
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

    // POST /api/auth/logout
    // Deletes the refresh token from DB — ends the session
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

    // POST /api/auth/logout-all
    // Deletes ALL refresh tokens for the user — logs out from every device
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

    // POST /api/auth/change-password
    // Requires valid access token — changes password and invalidates all sessions
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
