// src/entities/alert.entity.js

// This entity represents an alert sent to a user regarding a fire incident that requires immediate attention.
export class Alert {
    static ALERT_TYPES = ['FireAlert', 'EvacuationAlert', 'PredictionAlert'];  // Types of alerts possible
    static TARGET_ROLES = ['Resident', 'Responder', 'Municipality', 'Admin'];  // Roles that can receive alerts

    constructor({
        alert_id,
        alert_type,
        target_role,
        alert_message,
        expires_at,
        created_at = new Date(),
        fire_id
    }) {
        if (!alert_id) throw new Error("alert_id is required");

        if (!Alert.ALERT_TYPES.includes(alert_type)) {
            throw new Error(`Invalid alert_type: ${alert_type}`);
        }

        if (!Alert.TARGET_ROLES.includes(target_role)) {
            throw new Error(`Invalid target_role: ${target_role}`);
        }

        if (!alert_message) throw new Error("alert_message is required");

        this.alert_id = alert_id;
        this.alert_type = alert_type;
        this.target_role = target_role;
        this.alert_message = alert_message;
        this.expires_at = expires_at ? new Date(expires_at) : null;
        this.created_at = new Date(created_at);
        this.fire_id = fire_id;
    }
}

