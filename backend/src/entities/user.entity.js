// src/entities/user.entity.js

// This entity represents a system user, storing their credentials, role, and contact details.
export class User {
    constructor({ user_id, user_email, user_password, user_phone, user_role, isactive,
            created_at, updated_at }) {

        this.user_id = user_id;
        this.user_email = user_email;
        this.user_password = user_password;
        this.user_phone = user_phone;
        this.user_role = user_role;
        this.isactive = isactive;
        this.created_at = created_at;
        this.updated_at = updated_at;    
    }
}
