// src/domain/entities/evacuation.entity.js

// This entity represents an evacuation route generated for a fire incident.

/**
 * This file defines the Evacuation entity class.
 * It represents evacuation route data and provides methods
 * to create instances and convert them into DTOs.
 */
export class Evacuation {

    /**
     * Construct an Evacuation entity
     * 
     * PRE-CONDITIONS:
     * - Required evacuation fields must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes Evacuation instance with provided data
     */
    constructor({route_id, route_status, route_priority, route_path, safe_zone, distance_km, 
            estimated_time, created_at, updated_at, fire_id}) {

        this.route_id = route_id;
        this.route_status = route_status;
        this.route_priority = route_priority;
        this.route_path = route_path;
        this.safe_zone = safe_zone;
        this.distance_km = distance_km;
        this.estimated_time = estimated_time; // In minutes
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.fire_id = fire_id;
    }

    // Static factory method

    /**
     * Create Evacuation entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain evacuation fields
     * 
     * POST-CONDITIONS:
     * - Returns new Evacuation instance
     */
    static fromEntity(raw) {
        return new Evacuation({
            route_id: raw.route_id,
            route_status: raw.route_status,
            route_priority: raw.route_priority,
            route_path: raw.route_path,
            safe_zone: raw.safe_zone,
            distance_km: raw.distance_km,
            estimated_time: raw.estimated_time,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            fire_id: raw.fire_id
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert Evacuation entity to DTO
     * 
     * PRE-CONDITIONS:
     * - Evacuation instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            route_id: this.route_id,
            route_status: this.route_status,
            route_priority: this.route_priority,
            route_path: this.route_path,
            safe_zone: this.safe_zone,
            distance_km: this.distance_km,
            estimated_time: this.estimated_time,
            created_at: this.created_at,
            updated_at: this.updated_at,
            fire_id: this.fire_id
        }
    }
}