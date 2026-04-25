// src/domain/entities/responder.entity.js

// This entity represents a responder user in the system, which is a specialized type of user with additional fields.

/**
 * This file defines the Responder entity class.
 * It represents responder data and provides methods
 * to create instances and convert them into DTOs.
 */
export class Responder {

    /**
     * Construct a Responder entity
     * 
     * PRE-CONDITIONS:
     * - Required responder fields must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes Responder instance with provided data
     */
    constructor({ responder_id, unit_nb, unit_location, assigned_region, 
                responder_status, last_known_location, updated_at, user }) {

        this.responder_id = responder_id;
        this.unit_nb = unit_nb;
        this.unit_location = unit_location;
        this.assigned_region = assigned_region;
        this.responder_status = responder_status;
        this.last_known_location = last_known_location; // PostGIS geography point
        this.updated_at = updated_at;
        this.user = user; // This will be an object containing user fields
    }

    // Static factory method

    /**
     * Create Responder entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain responder fields
     * 
     * POST-CONDITIONS:
     * - Returns new Responder instance
     */
    static fromEntity(raw) {
        return new Responder({
            responder_id: raw.responder_id,
            unit_nb: raw.unit_nb,
            unit_location: raw.unit_location,
            assigned_region: raw.assigned_region,
            responder_status: raw.responder_status,
            last_known_location: raw.last_known_location,
            updated_at: raw.updated_at,
            user: raw.user
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert Responder entity to DTO
     * 
     * PRE-CONDITIONS:
     * - Responder instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            responder_id: this.responder_id,
            unit_nb: this.unit_nb,
            unit_location: this.unit_location,
            assigned_region: this.assigned_region,
            responder_status: this.responder_status,
            last_known_location: this.last_known_location,
            updated_at: this.updated_at,
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