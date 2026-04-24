// src/domain/entities/municipality.entity.js

// This entity represents a municipality, which is a local government user of the system, with additional fields.

/**
 * This file defines the Municipality entity class.
 * It represents municipality data and provides methods
 * to create instances and convert them into DTOs.
 */
export class Municipality {

    /**
     * Construct a Municipality entity
     * 
     * PRE-CONDITIONS:
     * - Required municipality fields must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes Municipality instance with provided data
     */
    constructor({ municipality_id, municipality_name, region_name, municipality_code,
            municipality_location, updated_at, user }) {

        this.municipality_id = municipality_id;
        this.municipality_name = municipality_name;
        this.region_name = region_name;
        this.municipality_code = municipality_code;
        this.municipality_location = municipality_location; // PostGIS geography point
        this.updated_at = updated_at;
        this.user = user; // This will be an object containing user fields
    }

    // Static factory method

    /**
     * Create Municipality entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain municipality fields
     * 
     * POST-CONDITIONS:
     * - Returns new Municipality instance
     */
    static fromEntity(raw) {
        return new Municipality({
            municipality_id: raw.municipality_id,
            municipality_name: raw.municipality_name,
            region_name: raw.region_name,
            municipality_code: raw.municipality_code,
            municipality_location: raw.municipality_location,
            updated_at: raw.updated_at,
            user: raw.user
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert Municipality entity to DTO
     * 
     * PRE-CONDITIONS:
     * - Municipality instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            municipality_id: this.municipality_id,
            municipality_name: this.municipality_name,
            region_name: this.region_name,
            municipality_code: this.municipality_code,
            municipality_location: this.municipality_location,
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