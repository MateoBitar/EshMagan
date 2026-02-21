// src/domain/entities/fire.entity.js

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

    // Static factory method
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
