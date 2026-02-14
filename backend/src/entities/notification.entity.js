// src/entities/notification.entity.js

// This entity represents a notification sent to a user regarding a possible fire incident.
export class Notification {
    static TARGET_ROLES = ['Resident', 'Responder', 'Municipality', 'Admin'];  // Roles that can receive notifications
    static STATUSES = ['Sent', 'Delivered', 'Failed'];                         // Possible statuses for a notification

    constructor({
        notification_id,
        target_role,
        notification_message,
        notification_status,
        expires_at,
        created_at = new Date(),
        fire_id = null,
        user_id
    }) {
        if (!notification_id) throw new Error("notification_id is required");

        if (!Notification.TARGET_ROLES.includes(target_role)) {
            throw new Error(`Invalid target_role: ${target_role}`);
        }

        if (!notification_message) throw new Error("notification_message is required");

        if (!Notification.STATUSES.includes(notification_status)) {
            throw new Error(`Invalid notification_status: ${notification_status}`);
        }

        this.notification_id = notification_id;
        this.target_role = target_role;
        this.notification_message = notification_message;
        this.notification_status = notification_status;
        this.expires_at = expires_at ? new Date(expires_at) : null;
        this.created_at = new Date(created_at);
        this.fire_id = fire_id; // nullable FK
        this.user_id = user_id; // required FK
    }
}
