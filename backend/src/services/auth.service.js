// src/services/auth.service.js

import { hashPassword, comparePassword } from '../utils/hash.utils.js';
import { generateToken } from '../utils/jwt.utils.js';

export class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
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

            // Step 3: Generate JWT
            const token = generateToken({
                user_id:   user.user_id,
                user_role: user.user_role
            });

            // Step 4: Update last login timestamp
            await this.userRepository.updateLastLogin(user.user_id);

            return {
                token,
                user: user.toDTO()
            };
        } catch (err) {
            throw new Error(`Login failed: ${err.message}`);
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

            return true;
        } catch (err) {
            throw new Error(`Password change failed: ${err.message}`);
        }
    }
}