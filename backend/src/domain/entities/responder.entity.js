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

    // Static factory method
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
                isactive: this.user.isactive
            } : null
        };
    }
}
