// src/services/alert.service.js

import { Alert } from '../domain/entities/alert.entity.js';

/**
 * This file defines the AlertService class.
 * It contains the business logic for managing alerts,
 * including creation, retrieval, and deletion operations.
 */
export class AlertService {

    /**
     * Initialize AlertService.
     *
     * PRE-CONDITIONS:
     * - alertRepository must be provided.
     *
     * POST-CONDITIONS:
     * - AlertService is ready to handle alert-related operations.
     */
    constructor(alertRepository) {
        this.alertRepository = alertRepository;
    }

    /**
     * Create a new alert.
     *
     * PRE-CONDITIONS:
     * - data must include alert_type, target_role, alert_message,
     *   expires_at, and fire_id.
     *
     * POST-CONDITIONS:
     * - Creates Alert entity.
     * - Persists alert via repository.
     * - Returns alert DTO.
     */
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

    /**
     * Retrieve all alerts.
     *
     * PRE-CONDITIONS:
     * - alertRepository must be available.
     *
     * POST-CONDITIONS:
     * - Returns array of alert DTOs.
     */
    async getAllAlerts() {
        try {
            // Fetch all alerts from repository
            const alerts = await this.alertRepository.getAllAlerts();
            return alerts.map(alert => alert.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch alerts: ${err.message}`);
        }
    }

    /**
     * Retrieve alert by ID.
     *
     * PRE-CONDITIONS:
     * - alert_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns alert DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve alerts by alert type.
     *
     * PRE-CONDITIONS:
     * - alert_type must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching alert DTOs.
     * - Returns empty array if none found.
     */
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

    /**
     * Retrieve alerts by target role.
     *
     * PRE-CONDITIONS:
     * - target_role must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching alert DTOs.
     * - Returns empty array if none found.
     */
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

    /**
     * Retrieve alerts by expiration time.
     *
     * PRE-CONDITIONS:
     * - expires_at must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching alert DTOs.
     * - Returns empty array if none found.
     */
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

    /**
     * Retrieve alerts by fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching alert DTOs.
     * - Returns empty array if none found.
     */
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

    /**
     * Delete alert by ID.
     *
     * PRE-CONDITIONS:
     * - alert_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes alert from repository.
     * - Returns result of deletion.
     */
    async deleteAlert(alert_id) {
        try {
            // Delete alert by ID
            return await this.alertRepository.deleteAlert(alert_id);
        } catch (err) {
            throw new Error(`Failed to delete alert: ${err.message}`);
        }
    }

    /**
     * Delete expired alerts.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Deletes all expired alerts.
     * - Returns result of deletion.
     */
    async deleteExpiredAlerts() {
        try {
            // Delete all expired alerts
            return await this.alertRepository.deleteExpiredAlerts();
        } catch (err) {
            throw new Error(`Failed to delete expired alerts: ${err.message}`);
        }
    }

    /**
     * Delete alerts by fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes all alerts linked to fire.
     * - Returns result of deletion.
     */
    async deleteAlertsByFireId(fire_id) {
        try {
            // Delete all alerts associated with a specific fire ID
            return await this.alertRepository.deleteAlertsByFireId(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete alerts by fire ID: ${err.message}`);
        }
    }
}