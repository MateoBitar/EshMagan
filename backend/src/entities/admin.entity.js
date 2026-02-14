// src/entities/admin.entity.js

// This entity represents an admin user in the system, which is a specialized type of user with additional fields.
export class Admin {
    constructor({ admin_id, admin_fname, admin_lname, user }) {

        this.admin_id = admin_id;
        this.admin_fname = admin_fname;
        this.admin_lname = admin_lname;
        this.user = user; // This will be an object containing user fields
    }
}
