// src/domain/entities/alert.entity.js

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

    // Static factory method
    static fromEntity(raw) {
        return new Alert({
            alert_id: raw.alert_id,
            alert_type: raw.alert_type,
            target_role: raw.target_role,
            alert_message: raw.alert_message,
            expires_at: raw.expires_at,
            created_at: raw.created_at,
            fire_id: raw.fire_id
        });
    }

    // Expose a DTO for controllers
    toDTO() {
        return {
            alert_id: this.alert_id,
            alert_type: this.alert_type,
            target_role: this.target_role,
            alert_message: this.alert_message,
            expires_at: this.expires_at,
            created_at: this.created_at,
            fire_id: this.fire_id
        }
    }
}
