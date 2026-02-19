// src/domain/entities/resident.entity.js

// This entity represents a resident user in the system, which is a specialized type of user with additional fields.
export class Resident {
    constructor({ resident_id, resident_fname, resident_lname, resident_dob, 
            resident_idnb,resident_idpic, home_location, work_location, last_known_location,
            updated_at, user }) {

        this.resident_id = resident_id;
        this.resident_fname = resident_fname;
        this.resident_lname = resident_lname;
        this.resident_dob = resident_dob;
        this.resident_idnb = resident_idnb;
        this.resident_idpic = resident_idpic;
        this.home_location = home_location; // PostGIS geography point
        this.work_location = work_location; // PostGIS geography point
        this.last_known_location = last_known_location; // PostGIS geography point
        this.updated_at = updated_at;
        this.user = user; // This will be an object containing user fields
    }
}
