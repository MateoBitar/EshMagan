// src/domain/entities/admin.entity.js

// This entity represents an admin user in the system, which is a specialized type of user with additional fields.

/**
 * This file defines the Admin entity class.
 * It represents an admin domain object and provides methods
 * to create instances and transform them into DTOs.
 */
export class Admin {
    /**
     * Construct an Admin entity
     * 
     * PRE-CONDITIONS:
     * - admin_id, admin_fname, admin_lname must be provided
     * - user object may be provided
     * 
     * POST-CONDITIONS:
     * - Initializes Admin instance with provided data
     */
    constructor({ admin_id, admin_fname, admin_lname, user }) {

        this.admin_id = admin_id;
        this.admin_fname = admin_fname;
        this.admin_lname = admin_lname;
        this.user = user; // This will be an object containing user fields
    }

    // Static factory method

    /**
     * Create Admin entity from raw database object
     * 
     * PRE-CONDITIONS:
     * - raw object must contain admin fields
     * 
     * POST-CONDITIONS:
     * - Returns new Admin instance
     */
    static fromEntity(raw) {
        return new Admin({
            admin_id: raw.admin_id,
            admin_fname: raw.admin_fname,
            admin_lname: raw.admin_lname,
            user: raw.user
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert Admin entity to DTO
     * 
     * PRE-CONDITIONS:
     * - Admin instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            admin_id: this.admin_id,
            admin_fname: this.admin_fname,
            admin_lname: this.admin_lname,
            user: this.user ? {
                user_id: this.user.user_id,
                user_email: this.user.user_email,
                user_phone: this.user.user_phone,
                user_role: this.user.user_role,
                isactive: this.user.isactive,
                created_at: this.user.created_at,
                updated_at: this.user.updated_at
            } : null
        };
    }
}