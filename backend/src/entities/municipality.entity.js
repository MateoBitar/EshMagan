// src/entities/municipality.entity.js

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
}
