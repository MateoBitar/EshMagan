// src/services/alert.service.js

import { Alert } from '../domain/entities/alert.entity.js';

export class AlertService {
    constructor(alertRepository) {
        this.alertRepository = alertRepository;
    }

    async createAlert(data) {
        try {
            // Validate required fields
            if (!data.alert_type) throw new Error("Missing required field: alert_type");
            if (!data.target_role) throw new Error("Missing required field: target_role");
            if (!data.alert_message) throw new Error("Missing required field: alert_message");
            if (!data.expires_at) throw new Error("Missing required field: expires_at");
            if (!data.fire_id) throw new Error("Missing required field: fire_id");

            // Create Alert entity
            const alert = new Alert({
                alert_type:    data.alert_type,
                target_role:   data.target_role,
                alert_message: data.alert_message,
                expires_at:    data.expires_at,
                fire_id:       data.fire_id
            });

            // Persist via repository (repo handles fire_id FK validation internally)
            const createdAlert = await this.alertRepository.createAlert(alert);
            return createdAlert.toDTO();
        } catch (err) {
            throw new Error(`Failed to create alert: ${err.message}`);
        }
    }

    async getAllAlerts() {
        try {
            // Fetch all alerts from repository
            const alerts = await this.alertRepository.getAllAlerts();
            return alerts.map(alert => alert.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch alerts: ${err.message}`);
        }
    }

    async getAlertById(alert_id) {
        try {
            // Fetch admin by ID
            const alert = await this.alertRepository.getAlertById(alert_id);
            if (!alert) return null;  // Not found
            return alert.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch alert by ID: ${err.message}`);
        }
    }

    async getAlertsByAlertType(alert_type) {
        try {
            // Fetch alerts by type
            const alerts = await this.alertRepository.getAlertsByAlertType(alert_type);
            if (!alerts || alerts.length === 0) return [];  // No alerts found for this type
            return alerts.map(alert => alert.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch alerts by type: ${err.message}`);
        }
    }

    async getAlertsByTargetRole(target_role) {
        try {
            // Fetch alerts by target role
            const alerts = await this.alertRepository.getAlertsByTargetRole(target_role);
            if (!alerts || alerts.length === 0) return [];  // No alerts found for this target role
            return alerts.map(alert => alert.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch alerts by target role: ${err.message}`);
        }
    }

    async getAlertsByExpiration(expires_at) {
        try {
            // Fetch alerts by expiration time
            const alerts = await this.alertRepository.getAlertsByExpiration(expires_at);
            if (!alerts || alerts.length === 0) return [];  // No alerts expiring by this time
            return alerts.map(alert => alert.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch alerts by expiration: ${err.message}`);
        }
    }

    async getAlertsByFireId(fire_id) {
        try {
            // Fetch alerts by associated fire ID
            const alerts = await this.alertRepository.getAlertsByFireId(fire_id);
            if (!alerts || alerts.length === 0) return [];  // No alerts found for this fire ID
            return alerts.map(alert => alert.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch alerts by fire ID: ${err.message}`);
        }
    }

    async deleteAlert(alert_id) {
        try {
            // Delete alert by ID
            return await this.alertRepository.deleteAlert(alert_id);
        } catch (err) {
            throw new Error(`Failed to delete alert: ${err.message}`);
        }
    }

    async deleteExpiredAlerts() {
        try {
            // Delete all expired alerts
            return await this.alertRepository.deleteExpiredAlerts();
        } catch (err) {
            throw new Error(`Failed to delete expired alerts: ${err.message}`);
        }
    }

    async deleteAlertsByFireId(fire_id) {
        try {
            // Delete all alerts associated with a specific fire ID
            return await this.alertRepository.deleteAlertsByFireId(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete alerts by fire ID: ${err.message}`);
        }
    }
}
