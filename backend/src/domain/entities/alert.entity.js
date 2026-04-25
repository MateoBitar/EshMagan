// src/domain/entities/alert.entity.js

// This entity represents an alert sent to a user regarding a fire incident that requires immediate attention.

/**
 * This file defines the Alert entity class.
 * It represents an alert domain object and provides methods
 * to create instances and transform them into DTOs.
 */
export class Alert {

    /**
     * Construct an Alert entity
     * 
     * PRE-CONDITIONS:
     * - Required alert fields must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes Alert instance with provided data
     */
    constructor({alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id}) {

        this.alert_id = alert_id;
        this.alert_type = alert_type;
        this.target_role = target_role;
        this.alert_message = alert_message;
        this.expires_at = expires_at;
        this.created_at = created_at;
        this.fire_id = fire_id;
    }

    // Static factory method

    /**
     * Create Alert entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain alert fields
     * 
     * POST-CONDITIONS:
     * - Returns new Alert instance
     */
    static fromEntity(raw) {
        return new Alert({
            alert_id: raw.alert_id,
            alert_type: raw.alert_type,
            target_role: raw.target_role,
            alert_message: raw.alert_message,
            expires_at: raw.expires_at,
            created_at: raw.created_at,
            fire_id: raw.fire_id
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert Alert entity to DTO
     * 
     * PRE-CONDITIONS:
     * - Alert instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            alert_id: this.alert_id,
            alert_type: this.alert_type,
            target_role: this.target_role,
            alert_message: this.alert_message,
            expires_at: this.expires_at,
            created_at: this.created_at,
            fire_id: this.fire_id
        }
    }
}