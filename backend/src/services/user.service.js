// src/services/user.service.js

import { User } from '../domain/entities/user.entity.js';

export class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async createUser(data) {
        try {
            // User-specific checks
            if (!data.user_email) throw new Error("Missing required field: User Email");
            if (!data.user_password) throw new Error("Missing required field: User Password");
            if (!data.user_phone) throw new Error("Missing required field: User Phone");
            if (!data.user_role) throw new Error("Missing required field: User Role");

            // Step 1: Build User entity
            const user = new User({
                user_email: data.user_email,
                user_password: data.user_password,
                user_phone: data.user_phone,
                user_role: data.user_role || 'user',
                isactive: data.isactive !== undefined ? data.isactive : true
            });

            // Step 2: Persist via repository
            const createdUser = await this.userRepository.createUser(user);
            return createdUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to create user: ${err.message}`);
        }
    }

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

    async getUserById(user_id) {
        try {
            // Fetch users by ID
            const user = await this.userRepository.getUserById(user_id);
            if (!user ) return null; // Not found or inactive
            return user.toDTO(); 
        } catch (err) {
            throw new Error(`Failed to fetch user by ID: ${err.message}`);
        }
    }

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

    async getUsersByRole(user_role) {
        try {
            // Fetch users by role
            const users = await this.userRepository.getUsersByRole(user_role);
            if (!users) return []; // Not found or inactive
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch users by role: ${err.message}`);
        }
    }

    async getActiveUsers() {
        try {
            // Fetch active users
            const users = await this.userRepository.getActiveUsers();
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch active users: ${err.message}`);
        }
    }

    async getInActiveUsers() {
        try {
            // Fetch inactive users
            const users = await this.userRepository.getInActiveUsers();
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch inactive users: ${err.message}`);
        }
    }

    async getUserByEmailAndActive(user_email) {
        try {
            // Fetch user by email and active status
            const user = await this.userRepository.getUserByEmailAndActive(user_email);
            if (!user ) return null; // Not found or inactive
            return user.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch active user by email: ${err.message}`);
        }
    }

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

    async deactivateUser(user_id) {
        try {
            // Deactivate user (soft delete)
            const deactivatedUser = await this.userRepository.deactivateUser(user_id);
            if (!deactivatedUser) return null; // Not found or inactive
            return deactivatedUser.toDTO();
        } catch (err) {
            throw new Error(`Failed to deactivate user: ${err.message}`);
        }
    }

    async filterUsers(filters, pagination) {
        try {
            // Filter users based on criteria and pagination
            const users = await this.userRepository.filterUsers(filters, pagination);
            return users.map(user => user.toDTO());
        } catch (err) {
            throw new Error(`Failed to filter users: ${err.message}`);
        }
    }

    async countUsers(filters) {
        try {
            // Count users based on filters
            return await this.userRepository.countUsers(filters);
        } catch (err) {
            throw new Error(`Failed to count users: ${err.message}`);
        }
    }
}
