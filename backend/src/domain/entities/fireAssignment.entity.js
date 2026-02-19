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
}
