// src/domain/entities/responder.entity.js

// This entity represents a responder user in the system, which is a specialized type of user with additional fields.
export class Responder {
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
}
