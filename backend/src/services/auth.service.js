// src/services/auth.service.js

import { hashPassword, comparePassword, needsRehash } from '../utils/hash.utils.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { Resident } from '../domain/entities/resident.entity.js';

/**
 * This file defines the AuthService class.
 * It handles authentication and authorization logic,
 * including registration, login, token management,
 * password changes, and session control.
 */
export class AuthService {

    /**
     * Initialize AuthService.
     *
     * PRE-CONDITIONS:
     * - userRepository, refreshTokenRepository, and residentRepository must be provided.
     *
     * POST-CONDITIONS:
     * - AuthService is ready to handle authentication workflows.
     */
    constructor(userRepository, refreshTokenRepository, residentRepository) {
        this.userRepository         = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.residentRepository     = residentRepository;
    }

    /**
     * Register a new resident user.
     *
     * PRE-CONDITIONS:
     * - All required user and resident fields must be provided.
     * - Email must not already exist.
     *
     * POST-CONDITIONS:
     * - Creates user with hashed password.
     * - Creates linked resident profile.
     * - Returns created user DTO.
     */
    async register(data) {
        try {
            if (!data.user_email)          throw new Error("Missing required field: Email");
            if (!data.user_password)       throw new Error("Missing required field: Password");
            if (!data.user_phone)          throw new Error("Missing required field: Phone");
            if (!data.resident_fname)      throw new Error("Missing required field: First Name");
            if (!data.resident_lname)      throw new Error("Missing required field: Last Name");
            if (!data.resident_dob)        throw new Error("Missing required field: Date of Birth");
            if (!data.resident_idnb)       throw new Error("Missing required field: ID Number");
            if (!data.last_known_location) throw new Error("Missing required field: Location");

            const existing = await this.userRepository.getUserByEmail(data.user_email);
            if (existing) throw new Error("Email already registered");

            const hashedPassword = await hashPassword(data.user_password);

            // Step 1: Create user
            const createdUser = await this.userRepository.createUser({
                user_email:    data.user_email,
                user_password: hashedPassword,
                user_phone:    data.user_phone,
                user_role:     'Resident',
            });

            console.log('[Register] User created:', createdUser.user_id);

            // Step 2: Normalize location — repo expects { longitude, latitude }
            const loc = data.last_known_location;
            const locationObj = (loc && loc.latitude != null && loc.longitude != null)
                ? { latitude: loc.latitude, longitude: loc.longitude }
                : null;

            if (!locationObj) throw new Error("Invalid location format");

            const homeLoc = (data.home_location && data.home_location.latitude != null)
                ? { latitude: data.home_location.latitude, longitude: data.home_location.longitude }
                : locationObj;

            console.log('[Register] Location:', locationObj);

            // Step 3: Create resident — repo handles DOB/ID encryption
            const resident = new Resident({
                resident_id:         createdUser.user_id,
                resident_fname:      data.resident_fname,
                resident_lname:      data.resident_lname,
                resident_dob:        data.resident_dob,
                resident_idnb:       data.resident_idnb,
                resident_idpic:      data.resident_idpic || 'pending',
                home_location:       homeLoc,
                work_location:       null,
                last_known_location: locationObj,
                user:                createdUser,
            });

            console.log('[Register] Creating resident profile...');
            await this.residentRepository.createResident(resident);
            console.log('[Register] Resident created successfully');

            return createdUser.toDTO();
        } catch (err) {
            console.error('[Register] FAILED:', err.message);
            throw new Error(`Registration failed: ${err.message}`);
        }
    }

    /**
     * Authenticate user and generate tokens.
     *
     * PRE-CONDITIONS:
     * - user_email and user_password must be provided.
     *
     * POST-CONDITIONS:
     * - Validates credentials.
     * - Generates access and refresh tokens.
     * - Stores refresh token.
     * - Updates last login.
     * - Returns tokens and user DTO.
     */
    async login(user_email, user_password) {
        try {
            if (!user_email)    throw new Error("Missing required field: Email");
            if (!user_password) throw new Error("Missing required field: Password");

            const user = await this.userRepository.getUserByEmailAndActive(user_email);
            if (!user) throw new Error("Invalid credentials");

            const isMatch = await comparePassword(user_password, user.user_password);
            if (!isMatch) throw new Error("Invalid credentials");

            if (needsRehash(user.user_password)) {
                const newHash = await hashPassword(user_password);
                await this.userRepository.updateUser(user.user_id, { user_password: newHash });
            }

            const tokenPayload = { user_id: user.user_id, user_role: user.user_role };
            const accessToken  = generateAccessToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            await this.refreshTokenRepository.saveToken(user.user_id, refreshToken);
            await this.userRepository.updateLastLogin(user.user_id);

            return { accessToken, refreshToken, user: user.toDTO() };
        } catch (err) {
            throw new Error(`Login failed: ${err.message}`);
        }
    }

    /**
     * Refresh authentication tokens.
     *
     * PRE-CONDITIONS:
     * - refresh token must be provided.
     *
     * POST-CONDITIONS:
     * - Validates token.
     * - Generates new access and refresh tokens.
     * - Replaces stored refresh token.
     * - Returns new tokens.
     */
    async refreshToken(token) {
        try {
            if (!token) throw new Error("Missing required field: Refresh Token");

            const payload = verifyRefreshToken(token);
            const stored  = await this.refreshTokenRepository.findToken(token);
            if (!stored) throw new Error("Refresh token not found — please log in again");

            await this.refreshTokenRepository.deleteToken(token);

            const tokenPayload    = { user_id: payload.user_id, user_role: payload.user_role };
            const newAccessToken  = generateAccessToken(tokenPayload);
            const newRefreshToken = generateRefreshToken(tokenPayload);

            await this.refreshTokenRepository.saveToken(payload.user_id, newRefreshToken);

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (err) {
            throw new Error(`Token refresh failed: ${err.message}`);
        }
    }

    /**
     * Logout user.
     *
     * PRE-CONDITIONS:
     * - refresh token must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes refresh token.
     * - Returns true.
     */
    async logout(token) {
        try {
            if (!token) throw new Error("Missing required field: Refresh Token");
            await this.refreshTokenRepository.deleteToken(token);
            return true;
        } catch (err) {
            throw new Error(`Logout failed: ${err.message}`);
        }
    }

    /**
     * Logout from all sessions.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes all refresh tokens for user.
     * - Returns true.
     */
    async logoutAll(user_id) {
        try {
            if (!user_id) throw new Error("Missing required field: User ID");
            await this.refreshTokenRepository.deleteAllTokensForUser(user_id);
            return true;
        } catch (err) {
            throw new Error(`Logout all failed: ${err.message}`);
        }
    }

    /**
     * Change user password.
     *
     * PRE-CONDITIONS:
     * - user_id, old_password, and new_password must be provided.
     *
     * POST-CONDITIONS:
     * - Validates old password.
     * - Updates password hash.
     * - Invalidates all existing sessions.
     * - Returns true.
     */
    async changePassword(user_id, old_password, new_password) {
        try {
            if (!old_password) throw new Error("Missing required field: Old Password");
            if (!new_password) throw new Error("Missing required field: New Password");

            const user = await this.userRepository.getUserById(user_id);
            if (!user) throw new Error("User not found");

            const isMatch = await comparePassword(old_password, user.user_password);
            if (!isMatch) throw new Error("Old password is incorrect");

            const hashedPassword = await hashPassword(new_password);
            await this.userRepository.updateUser(user_id, { user_password: hashedPassword });
            await this.refreshTokenRepository.deleteAllTokensForUser(user_id);

            return true;
        } catch (err) {
            throw new Error(`Password change failed: ${err.message}`);
        }
    }
}