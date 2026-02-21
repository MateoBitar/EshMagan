// src/domain/entities/fireAssignment.entity.js

// This entity represents the assignment of a responder unit to a specific fire event.
export class FireAssignment {
    constructor({ assignment_id, assigned_at, assignment_status, fire_id, responder_id }) {
        
        this.assignment_id = assignment_id;
        this.assigned_at = assigned_at;
        this.assignment_status = assignment_status;
        this.fire_id = fire_id;
        this.responder_id = responder_id;
    }

    // Static factory method    
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