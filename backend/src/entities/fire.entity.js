// src/entities/fire.entity.js

// This entity represents a fire incident detected or reported in the system.
export class FireEvent {
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
}
