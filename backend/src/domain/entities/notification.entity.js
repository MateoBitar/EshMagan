// src/domain/entities/notification.entity.js

// This entity represents a notification sent to a user regarding a possible fire incident.
export class Notification {
    constructor({notification_id, target_role, notification_message, notification_status, expires_at,
            created_at, fire_id, user_id}) {

        this.notification_id = notification_id;
        this.target_role = target_role;
        this.notification_message = notification_message;
        this.notification_status = notification_status;
        this.expires_at = expires_at;
        this.created_at = created_at;
        this.fire_id = fire_id; // nullable FK
        this.user_id = user_id; // required FK
    }

    // Static factory method
    static fromEntity(raw) {
        return new Notification({
            notification_id: raw.notification_id,
            target_role: raw.target_role,
            notification_message: raw.notification_message,
            notification_status: raw.notification_status,
            expires_at: raw.expires_at,
            created_at: raw.created_at,
            fire_id: raw.fire_id,
            user_id: raw.user_id
        });
    }

    // Expose a DTO for controllers
    toDTO() {
        return {
            notification_id: this.notification_id,
            target_role: this.target_role,
            notification_message: this.notification_message,
            notification_status: this.notification_status,
            expires_at: this.expires_at,
            created_at: this.created_at,
            fire_id: this.fire_id,
            user_id: this.user_id
        }
    }
}
