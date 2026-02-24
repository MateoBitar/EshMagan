// src/services/auth.service.js

import { hashPassword, comparePassword } from '../utils/hash.utils.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';

export class AuthService {
    constructor(userRepository, refreshTokenRepository) {
        this.userRepository         = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    async register(data) {
        try {
            if (!data.user_email)    throw new Error("Missing required field: Email");
            if (!data.user_password) throw new Error("Missing required field: Password");
            if (!data.user_phone)    throw new Error("Missing required field: Phone");
            if (!data.user_role)     throw new Error("Missing required field: Role");

            // Check email not already taken
            const existing = await this.userRepository.getUserByEmail(data.user_email);
            if (existing) throw new Error("Email already registered");

            // Hash password before storing
            const hashedPassword = await hashPassword(data.user_password);

            const createdUser = await this.userRepository.createUser({
                user_email:    data.user_email,
                user_password: hashedPassword,
                user_phone:    data.user_phone,
                user_role:     data.user_role
            });

            return createdUser.toDTO();
        } catch (err) {
            throw new Error(`Registration failed: ${err.message}`);
        }
    }

    async login(user_email, user_password) {
        try {
            if (!user_email)    throw new Error("Missing required field: Email");
            if (!user_password) throw new Error("Missing required field: Password");

            // Step 1: Find active user by email
            const user = await this.userRepository.getUserByEmailAndActive(user_email);
            if (!user) throw new Error("Invalid credentials");

            // Step 2: Compare password
            const isMatch = await comparePassword(user_password, user.user_password);
            if (!isMatch) throw new Error("Invalid credentials");

            // Step 3: Generate both tokens
            const tokenPayload = { user_id: user.user_id, user_role: user.user_role };
            const accessToken  = generateAccessToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Step 4: Save refresh token to DB
            await this.refreshTokenRepository.saveToken(user.user_id, refreshToken);

            // Step 5: Update last login timestamp
            await this.userRepository.updateLastLogin(user.user_id);

            return {
                accessToken,
                refreshToken,
                user: user.toDTO()
            };
        } catch (err) {
            throw new Error(`Login failed: ${err.message}`);
        }
    }

    // Called when the access token expires (every 15 minutes).
    // Validates the refresh token against the DB, rotates it,
    // and returns a fresh access token + new refresh token.
    // The user never needs to log in again unless they explicitly log out.
    async refreshToken(token) {
        try {
            if (!token) throw new Error("Missing required field: Refresh Token");

            // Step 1: Verify token signature
            const payload = verifyRefreshToken(token);

            // Step 2: Check token exists in DB (not logged out)
            const stored = await this.refreshTokenRepository.findToken(token);
            if (!stored) throw new Error("Refresh token not found — please log in again");

            // Step 3: Delete old token (rotation — invalidate after one use)
            await this.refreshTokenRepository.deleteToken(token);

            // Step 4: Issue new tokens
            const tokenPayload    = { user_id: payload.user_id, user_role: payload.user_role };
            const newAccessToken  = generateAccessToken(tokenPayload);
            const newRefreshToken = generateRefreshToken(tokenPayload);

            // Step 5: Save new refresh token to DB
            await this.refreshTokenRepository.saveToken(payload.user_id, newRefreshToken);

            return {
                accessToken:  newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (err) {
            throw new Error(`Token refresh failed: ${err.message}`);
        }
    }

    // Ends the session by deleting the refresh token from DB.
    // The access token will naturally expire in 15 minutes.
    async logout(token) {
        try {
            if (!token) throw new Error("Missing required field: Refresh Token");
            await this.refreshTokenRepository.deleteToken(token);
            return true;
        } catch (err) {
            throw new Error(`Logout failed: ${err.message}`);
        }
    }

    // Logs out from ALL devices by deleting every refresh token for the user.
    async logoutAll(user_id) {
        try {
            if (!user_id) throw new Error("Missing required field: User ID");
            await this.refreshTokenRepository.deleteAllTokensForUser(user_id);
            return true;
        } catch (err) {
            throw new Error(`Logout all failed: ${err.message}`);
        }
    }

    async changePassword(user_id, old_password, new_password) {
        try {
            if (!old_password) throw new Error("Missing required field: Old Password");
            if (!new_password) throw new Error("Missing required field: New Password");

            // Step 1: Fetch user with password
            const user = await this.userRepository.getUserById(user_id);
            if (!user) throw new Error("User not found");

            // Step 2: Verify old password
            const isMatch = await comparePassword(old_password, user.user_password);
            if (!isMatch) throw new Error("Old password is incorrect");

            // Step 3: Hash and store new password
            const hashedPassword = await hashPassword(new_password);
            await this.userRepository.updateUser(user_id, { user_password: hashedPassword });

            // Step 4: Force logout from all devices — all refresh tokens invalidated
            await this.refreshTokenRepository.deleteAllTokensForUser(user_id);

            return true;
        } catch (err) {
            throw new Error(`Password change failed: ${err.message}`);
        }
    }
}
