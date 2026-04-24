// src/domain/entities/user.entity.js

// This entity represents a system user, storing their credentials, role, and contact details.

/**
 * This file defines the User entity class.
 * It represents user data and provides methods
 * to create instances and convert them into DTOs.
 */
export class User {

    /**
     * Construct a User entity
     * 
     * PRE-CONDITIONS:
     * - Required user fields must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes User instance with provided data
     */
    constructor({ user_id, user_email, user_password, user_phone, user_role, isactive,
        created_at, updated_at }) {

        this.user_id = user_id;
        this.user_email = user_email;
        this.user_password = user_password;
        this.user_phone = user_phone;
        this.user_role = user_role;
        this.isactive = isactive;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    // Static factory method

    /**
     * Create User entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain user fields
     * 
     * POST-CONDITIONS:
     * - Returns new User instance
     */
    static fromEntity(raw) {
        return new User({
            user_id: raw.user_id,
            user_email: raw.user_email,
            user_password: raw.user_password,
            user_phone: raw.user_phone,
            user_role: raw.user_role,
            isactive: raw.isactive,
            created_at: raw.user_created_at ?? raw.created_at,
            updated_at: raw.user_updated_at ?? raw.updated_at
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert User entity to DTO
     * 
     * PRE-CONDITIONS:
     * - User instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     * - Includes all user fields
     */
    toDTO() {
        return {
            user_id: this.user_id,
            user_email: this.user_email,
            user_password: this.user_password,
            user_phone: this.user_phone,
            user_role: this.user_role,
            isactive: this.isactive,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}