// src/entities/alert.entity.js

// This entity represents an alert sent to a user regarding a fire incident that requires immediate attention.
export class Alert {
    constructor({alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id}) {

        this.alert_id = alert_id;
        this.alert_type = alert_type;
        this.target_role = target_role;
        this.alert_message = alert_message;
        this.expires_at = expires_at;
        this.created_at = created_at;
        this.fire_id = fire_id;
    }
}
