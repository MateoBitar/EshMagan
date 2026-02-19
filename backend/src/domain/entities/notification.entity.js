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
}
