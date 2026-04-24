// src/domain/entities/fireAssignment.entity.js

// This entity represents the assignment of a responder unit to a specific fire event.

/**
 * This file defines the FireAssignment entity class.
 * It represents the relationship between a responder and a fire event,
 * and provides methods to create instances and convert them into DTOs.
 */
export class FireAssignment {

    /**
     * Construct a FireAssignment entity
     * 
     * PRE-CONDITIONS:
     * - assignment_id, fire_id, responder_id must be provided
     * 
     * POST-CONDITIONS:
     * - Initializes FireAssignment instance with provided data
     */
    constructor({ assignment_id, assigned_at, assignment_status, fire_id, responder_id }) {
        
        this.assignment_id = assignment_id;
        this.assigned_at = assigned_at;
        this.assignment_status = assignment_status;
        this.fire_id = fire_id;
        this.responder_id = responder_id;
    }

    // Static factory method    

    /**
     * Create FireAssignment entity from raw data
     * 
     * PRE-CONDITIONS:
     * - raw object must contain assignment fields
     * 
     * POST-CONDITIONS:
     * - Returns new FireAssignment instance
     */
    static fromEntity(raw) {
        return new FireAssignment({
            assignment_id: raw.assignment_id,
            assigned_at: raw.assigned_at,
            assignment_status: raw.assignment_status,
            fire_id: raw.fire_id,
            responder_id: raw.responder_id            
        });
    }

    // Expose a DTO for controllers

    /**
     * Convert FireAssignment entity to DTO
     * 
     * PRE-CONDITIONS:
     * - FireAssignment instance must be initialized
     * 
     * POST-CONDITIONS:
     * - Returns plain object suitable for API responses
     */
    toDTO() {
        return {
            assignment_id: this.assignment_id,
            assigned_at: this.assigned_at,
            assignment_status: this.assignment_status,
            fire_id: this.fire_id,
            responder_id: this.responder_id
        };
    }
}