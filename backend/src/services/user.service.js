// src/services/user.service.js

import { User } from '../domain/entities/user.entity.js';
import { hashPassword } from '../utils/hash.utils.js';

/**
 * This file defines the UserService class.
 * It manages user-related business logic including
 * creation, retrieval, updates, authentication support,
 * and FCM token management.
 */
export class UserService {
    /**
     * Initialize UserService.
     *
     * PRE-CONDITIONS:
     * - userRepository must be provided.
     *
     * POST-CONDITIONS:
     * - Service is ready to handle user operations.
     */
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Create a user.
     *
     * PRE-CONDITIONS:
     * - user_email, user_password, user_phone, and user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Password is hashed.
     * - User entity is created and stored.
     * - Returns user DTO.
     */
    async createUser(data) {
        try {
            // User-specific checks
            if (!data.user_email) throw new Error("Missing required field: User Email");
            if (!data.user_password) throw new Error("Missing required field: User Password");
            if (!data.user_phone) throw new Error("Missing required field: User Phone");
            if (!data.user_role) throw new Error("Missing required field: User Role");

            const existing = await this.userRepository.getUserByEmail(data.user_email);
            if (existing) throw new Error("A user with this email already exists");

            const hashedPassword = await hashPassword(data.user_password);

            // Step 1: Build User entity
            const user = new User({
                user_email: data.user_email,
                user_password: hashedPassword,
                user_phone: data.user_phone,
                user_role: data.user_role || 'Resident',
                isactive: data.isactive !== undefined ? data.isactive : true
            });

            // Step 2: Persist via repository
            const createdUser = await this.userRepository.createUser(user);
            return createdUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to create user: ${err.message}`);
        }
    }

    /**
     * Retrieve all users.
     *
     * PRE-CONDITIONS:
     * - Repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of user DTOs.
     */
    async getAllUsers() {
        try {
            // Fetch all users from repository
            const users = await this.userRepository.getAllUsers();
            // Expose safe outward-facing data
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch users: ${err.message}`);
        }
    }

    /**
     * Retrieve user by ID.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns user DTO if found.
     * - Returns null if not found.
     */
    async getUserById(user_id) {
        try {
            // Fetch users by ID
            const user = await this.userRepository.getUserById(user_id);
            if (!user) return null; // Not found or inactive
            return user.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch user by ID: ${err.message}`);
        }
    }

    /**
     * Retrieve user by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns user DTO if found.
     * - Returns null if not found.
     */
    async getUserByEmail(user_email) {
        try {
            // Fetch users by email
            const user = await this.userRepository.getUserByEmail(user_email);
            if (!user) return null; // Not found or inactive
            return user.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch user by email: ${err.message}`);
        }
    }

    /**
     * Retrieve user by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns user DTO if found.
     * - Returns null if not found.
     */
    async getUserByPhone(user_phone) {
        try {
            // Fetch users by phone
            const user = await this.userRepository.getUserByPhone(user_phone);
            if (!user) return null; // Not found or inactive
            return user.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch user by phone: ${err.message}`);
        }
    }

    /**
     * Retrieve users by role.
     *
     * PRE-CONDITIONS:
     * - user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching users.
     * - Returns empty array if none found.
     */
    async getUsersByRole(user_role) {
        try {
            // Fetch users by role
            const users = await this.userRepository.getUsersByRole(user_role);
            if (!users || users.length === 0) return []; // Not found or inactive
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch users by role: ${err.message}`);
        }
    }

    /**
     * Retrieve active users.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Returns active users.
     */
    async getActiveUsers() {
        try {
            // Fetch active users
            const users = await this.userRepository.getActiveUsers();
            if (!users || users.length === 0) return []; // Not found or inactive
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch active users: ${err.message}`);
        }
    }

    /**
     * Retrieve inactive users.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Returns inactive users.
     */
    async getInActiveUsers() {
        try {
            // Fetch inactive users
            const users = await this.userRepository.getInActiveUsers();
            if (!users || users.length === 0) return []; // Not found or inactive
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch inactive users: ${err.message}`);
        }
    }

    /**
     * Retrieve active user by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns user DTO if found and active.
     * - Returns null otherwise.
     */
    async getUserByEmailAndActive(user_email) {
        try {
            // Fetch user by email and active status
            const user = await this.userRepository.getUserByEmailAndActive(user_email);
            if (!user) return null; // Not found or inactive
            return user.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch active user by email: ${err.message}`);
        }
    }

    /**
     * Update user.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - User is updated.
     * - Returns updated DTO.
     */
    async updateUser(user_id, data) {
        try {
            // Update user details
            const updatedUser = await this.userRepository.updateUser(user_id, data);
            if (!updatedUser) return null; // Not found or inactive
            return updatedUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to update user: ${err.message}`);
        }
    }

    /**
     * Update user role.
     *
     * PRE-CONDITIONS:
     * - user_id and user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Role is updated.
     * - Returns updated DTO.
     */
    async updateUserRole(user_id, user_role) {
        try {
            // Update user role
            const updatedUser = await this.userRepository.updateUserRole(user_id, user_role);
            if (!updatedUser) return null; // Not found or inactive
            return updatedUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to update user role: ${err.message}`);
        }
    }

    /**
     * Update user status.
     *
     * PRE-CONDITIONS:
     * - user_id and user_status must be provided.
     *
     * POST-CONDITIONS:
     * - Status is updated.
     * - Returns updated DTO.
     */
    async updateUserStatus(user_id, user_status) {
        try {
            // Update user active status
            const updatedUser = await this.userRepository.updateUserStatus(user_id, user_status);
            if (!updatedUser) return null; // Not found or inactive
            return updatedUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to update user status: ${err.message}`);
        }
    }

    /**
     * Update last login timestamp.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - last_login is updated.
     * - Returns updated DTO.
     */
    async updateLastLogin(user_id) {
        try {
            // Update user's last login timestamp
            const updatedUser = await this.userRepository.updateLastLogin(user_id);
            if (!updatedUser) return null; // Not found or inactive
            return updatedUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to update last login: ${err.message}`);
        }
    }

    /**
     * Deactivate user.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - User is deactivated.
     */
    async deactivateUser(user_id) {
        try {
            // Deactivate user (soft delete)
            const deactivatedUser = await this.userRepository.deactivateUser(user_id);
            if (!deactivatedUser) return null; // Not found or inactive
            return deactivatedUser;
        } catch (err) {
            throw new Error(`Failed to deactivate user: ${err.message}`);
        }
    }

    /**
     * Filter users with pagination.
     *
     * PRE-CONDITIONS:
     * - filters and pagination may be provided.
     *
     * POST-CONDITIONS:
     * - Returns filtered user list.
     */
    async filterUsers(filters = {}, pagination = { limit: 10, offset: 0 }) {
        try {
            // Filter users based on criteria and pagination
            const users = await this.userRepository.filterUsers(filters, pagination);
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to filter users: ${err.message}`);
        }
    }

    /**
     * Count users.
     *
     * PRE-CONDITIONS:
     * - filters may be provided.
     *
     * POST-CONDITIONS:
     * - Returns number of users.
     */
    async countUsers(filters) {
        try {
            // Count users based on filters
            return await this.userRepository.countUsers(filters);
        } catch (err) {
            throw new Error(`Failed to count users: ${err.message}`);
        }
    }

    /**
     * Save FCM token.
     *
     * PRE-CONDITIONS:
     * - user_id and fcm_token must be provided.
     *
     * POST-CONDITIONS:
     * - Token is stored for the user.
     */
    async saveFcmToken(user_id, fcm_token) {
        if (!user_id) throw new Error('Missing user_id');
        if (!fcm_token) throw new Error('Missing fcm_token');
        return await this.userRepository.saveFcmToken(user_id, fcm_token);
    }

    /**
     * Clear FCM token.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Token is removed for the user.
     */
    async clearFcmToken(user_id) {
        if (!user_id) throw new Error('Missing user_id');
        return await this.userRepository.clearFcmToken(user_id);
    }

    /**
     * Retrieve users with FCM tokens by role.
     *
     * PRE-CONDITIONS:
     * - user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Returns users with valid FCM tokens.
     */
    async getUsersWithFcmByRole(user_role) {
        if (!user_role) throw new Error('Missing user_role');
        return await this.userRepository.getUsersWithFcmByRole(user_role);
    }

    /**
     * Retrieve FCM token by user ID.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns token if exists.
     */
    async getFcmTokenByUserId(user_id) {
        if (!user_id) throw new Error('Missing user_id');
        return await this.userRepository.getFcmTokenByUserId(user_id);
    }

    /**
     * Remove FCM token.
     *
     * PRE-CONDITIONS:
     * - token must be provided.
     *
     * POST-CONDITIONS:
     * - Token is removed from database.
     */
    async removeFcmToken(token) {
        if (!token) throw new Error('Missing token');
        return await this.userRepository.removeFcmToken(token);
    }
}
