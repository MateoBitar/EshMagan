// src/repositories/alert.repository.js

import { pool } from '../config/db.js';
import { Alert } from '../entities/alert.entity.js';
import { FireRepository } from './fire.repository.js';

export class AlertRepository {
    async createAlert(data) {
        const { alert_type, target_role, alert_message, expires_at, fire_id } = data;

        // Step 1: Validate fire_id exists
        const fireRepository = new FireRepository();
        const fire = await fireRepository.getFireById(fire_id);
        if (!fire) {
            throw new Error('Fire incident not found for the given fire_id');
        }

        // Step 2: Insert the alert
        const alertSql = `INSERT INTO alerts (alert_type, target_role, alert_message, expires_at, fire_id, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id`;
        const alertValues = [alert_type, target_role, alert_message, expires_at, fire_id];
        const { rows: alertRows } = await pool.query(alertSql, alertValues);

        return new Alert(alertRows[0]);
    }

    async getAllAlerts() {
        const sql = `SELECT alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id
            FROM alerts WHERE expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No alerts found
        }
        
        return rows.map(row => new Alert(row));
    }

    async getAlertById(alert_id) {
        const sql = `SELECT alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id
            FROM alerts WHERE alert_id = $1 AND expires_at > NOW()`;
        const { rows } = await pool.query(sql, [alert_id]);
        if (rows.length === 0) {
            return null; // Alert not found or expired
        }

        return new Alert(rows[0]);
    }

    async getAlertsByAlertType(alert_type) {
        const sql = `SELECT alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id
            FROM alerts WHERE alert_type = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [alert_type]);
        if (rows.length === 0) {
            return []; // No alerts found for this type
        }

        return rows.map(row => new Alert(row));
    }

    async getAlertsByTargetRole(target_role) {
        const sql = `SELECT alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id
            FROM alerts WHERE target_role = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [target_role]);
        if (rows.length === 0) {
            return []; // No alerts found for this target role
        }

        return rows.map(row => new Alert(row));
    }

    async getAlertsByExpiration(expires_at) {
        const sql = `SELECT alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id
            FROM alerts WHERE expires_at <= $1 ORDER BY expires_at ASC`;
        const { rows } = await pool.query(sql, [expires_at]);
        if (rows.length === 0) {
            return []; // No alerts expiring by this time
        }

        return rows.map(row => new Alert(row));
    }

    async getAlertsByFireId(fire_id) {
        const sql = `SELECT alert_id, alert_type, target_role, alert_message, expires_at, created_at, fire_id
            FROM alerts WHERE fire_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return []; // No alerts found for this fire_id
        }

        return rows.map(row => new Alert(row));
    }

    async deleteAlert(alert_id) {
        const sql = `DELETE FROM alerts WHERE alert_id = $1 RETURNING alert_id`;
        const { rows } = await pool.query(sql, [alert_id]);
        if (rows.length === 0) {
            return false; // Alert not found
        }

        return true; // Alert deleted successfully
    }

    async deleteExpiredAlerts() {
        const sql = `DELETE FROM alerts WHERE expires_at <= NOW() RETURNING alert_id`;
        const { rows } = await pool.query(sql);

        return rows.length > 0; // Returns true if any expired alerts were deleted
    }

    async deleteAlertsByFireId(fire_id) {
        const sql = `DELETE FROM alerts WHERE fire_id = $1 RETURNING alert_id`;
        const { rows } = await pool.query(sql, [fire_id]);

        return rows.length > 0; // Return true if any alerts were deleted
    }
}
