// src/domain/entities/fire.entity.js

// This entity represents a fire incident detected or reported in the system.

/**
 * This file defines the FireEvent entity class.
 * It represents fire incident data and provides methods
 * to create instances and convert them into DTOs.
 */
export class FireEvent {

    /**
     * Construct a FireEvent entity
     * 
     * PRE-CONDITIONS:
     * - Required fire fields must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes FireEvent instance with provided data
     */
    constructor({ fire_id, fire_source, fire_location, fire_severitylevel, is_extinguished,
            is_verified, created_at, updated_at }) {

        this.fire_id = fire_id;
        this.fire_source = fire_source;
        this.fire_location = fire_location;  // PostGIS geography point
        this.fire_severitylevel = fire_severitylevel;
        this.is_extinguished = is_extinguished;
        this.is_verified = is_verified;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    // Static factory method

    /**
     * Create FireEvent entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain fire fields
     * 
     * POST-CONDITIONS:
     * - Returns new FireEvent instance
     */
    static fromEntity(raw) {
        return new FireEvent({
            fire_id: raw.fire_id,
            fire_source: raw.fire_source,
            fire_location: raw.fire_location,
            fire_severitylevel: raw.fire_severitylevel,
            is_extinguished: raw.is_extinguished,
            is_verified: raw.is_verified,
            created_at: raw.created_at,
            updated_at: raw.updated_at
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert FireEvent entity to DTO
     * 
     * PRE-CONDITIONS:
     * - FireEvent instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            fire_id: this.fire_id,
            fire_source: this.fire_source,
            fire_location: this.fire_location,  // This may need to be transformed to a more client-friendly format
            fire_severitylevel: this.fire_severitylevel,
            is_extinguished: this.is_extinguished,
            is_verified: this.is_verified,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}