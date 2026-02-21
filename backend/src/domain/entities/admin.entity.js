// src/domain/entities/admin.entity.js

// This entity represents an admin user in the system, which is a specialized type of user with additional fields.
export class Admin {
    constructor({ admin_id, admin_fname, admin_lname, user }) {

        this.admin_id = admin_id;
        this.admin_fname = admin_fname;
        this.admin_lname = admin_lname;
        this.user = user; // This will be an object containing user fields
    }

    // Static factory method
    static fromEntity(raw) {
        return new Admin({
            admin_id: raw.admin_id,
            admin_fname: raw.admin_fname,
            admin_lname: raw.admin_lname,
            user: raw.user
        });
    }

    // Expose a DTO for controllers
    toDTO() {
        return {
            admin_id: this.admin_id,
            admin_fname: this.admin_fname,
            admin_lname: this.admin_lname,
            user: this.user ? {
                user_id: this.user.user_id,
                user_email: this.user.user_email,
                user_phone: this.user.user_phone,
                isactive: this.user.isactive
            } : null
        };
    }
}
