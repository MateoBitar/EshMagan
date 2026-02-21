// src/domain/entities/municipality.entity.js

// This entity represents a municipality, which is a local government user of the system, with additonal fields.
export class Municipality {
    constructor({ municipality_id, municipality_name, region_name, municipality_code,
            municipality_location, updated_at, user }) {

        this.municipality_id = municipality_id;
        this.municipality_name = municipality_name;
        this.region_name = region_name;
        this.municipality_code = municipality_code;
        this.municipality_location = municipality_location; // PostGIS geography point
        this.updated_at = updated_at;
        this.user = user; // This will be an object containing user fields
    }

    // Static factory method
    static fromEntity(raw) {
        return new Municipality({
            municipality_id: raw.municipality_id,
            municipality_name: raw.municipality_name,
            region_name: raw.region_name,
            municipality_code: raw.municipality_code,
            municipality_location: raw.municipality_location,
            updated_at: raw.updated_at,
            user: raw.user
        });
    }

    // Expose a DTO for controllers
    toDTO() {
        return {
            municipality_id: this.municipality_id,
            municipality_name: this.municipality_name,
            region_name: this.region_name,
            municipality_code: this.municipality_code,
            municipality_location: this.municipality_location,
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
