// src/repositories/notification.repository.js

import { pool } from '../config/db.js';
import { Notification } from '../entities/notification.entity.js';

export class NotificationRepository {
    async createNotification(data) {
        const { target_role, notification_message, notification_status, expires_at, fire_id, user_id } = data;
        
        // Step 1: Validate user_id exists
        const userSql = `SELECT * FROM users WHERE user_id = $1`;
        const userResult = await pool.query(userSql, [user_id]);
        if (userResult.rows.length === 0) {
            throw new Error('User not found for the given user_id');
        }

        // Step 2: Validate fire_id exists
        const fireSql = `SELECT * FROM fireevents WHERE fire_id = $1`;
        const fireResult = await pool.query(fireSql, [fire_id]);
        if (fireResult.rows.length === 0) {
            throw new Error('Fire incident not found for the given fire_id');
        }

        // Step 3: Insert the notification
        const notificationSql = `INSERT INTO notifications (target_role, notification_message, notification_status, 
            expires_at, fire_id, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING 
            notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id`;
        const notificationValues = [target_role, notification_message, notification_status, expires_at, fire_id, user_id];
        const { rows: notificationRows } = await pool.query(notificationSql, notificationValues);

        return new Notification(notificationRows[0]);
    }

    async getAllNotifications() {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No notifications found
        }

        return rows.map(row => new Notification(row));
    }

    async getNotificationById(notification_id) {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE notification_id = $1 AND expires_at > NOW()`;
        const { rows } = await pool.query(sql, [notification_id]);
        if (rows.length === 0) {
            return null; // Notification not found or expired
        }

        return new Notification(rows[0]);
    }

    async getNotificationsByTargetRole(target_role) {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE target_role = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [target_role]);
        if (rows.length === 0) {
            return []; // No notifications found for this target role
        }

        return rows.map(row => new Notification(row));
    }

    async getNotificationsByStatus(notification_status) {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE notification_status = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [notification_status]);
        if (rows.length === 0) {
            return []; // No notifications found for this status
        }

        return rows.map(row => new Notification(row));
    }

    async getNotificationsByExpiration(expires_at) {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE expires_at <= $1 ORDER BY expires_at ASC`;
        const { rows } = await pool.query(sql, [expires_at]);
        if (rows.length ===0) {
            return []; // No notifications expiring by this time
        }

        return rows.map(row => new Notification(row));
    }

    async getNotificationsByFireId(fire_id) {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE fire_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return []; // No notifications found for this fire_id
        }

        return rows.map(row => new Notification(row));
    }

    async getNotificationsByUserId(user_id) {
        const sql = `SELECT notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id
            FROM notifications WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`;
        const { rows } = await pool.query(sql, [user_id]);
        if (rows.length === 0) {
            return []; // No notifications found for this user_id
        }

        return rows.map(row => new Notification(row));
    }

    async updateNotificationStatus(notification_id, new_status) {
        const sql = `UPDATE notifications SET notification_status = $1 WHERE notification_id = $2 RETURNING 
            notification_id, target_role, notification_message, notification_status, expires_at, created_at, fire_id, user_id`;
        const { rows } = await pool.query(sql, [new_status, notification_id]);
        if (rows.length === 0) {
            return null; // Notification not found
        }

        return new Notification(rows[0]);
    }

    async deleteNotification(notification_id) {
        const sql = `DELETE FROM notifications WHERE notification_id = $1 RETURNING notification_id`;
        const { rows } = await pool.query(sql, [notification_id]);
        if (rows.length === 0) {
            return false; // Notification not found
        }

        return true; // Successfully deleted
    }

    async deleteExpiredNotifications() {
        const sql = `DELETE FROM notifications WHERE expires_at <= NOW() RETURNING notification_id`;
        const { rows } = await pool.query(sql);

        return rows.length > 0; // Returns true if any notifications were deleted
    }

    async deleteNonFailedNotifications() {
        const sql = `DELETE FROM notifications WHERE notification_status != 'Failed' RETURNING notification_id`;
        const { rows } = await pool.query(sql);

        return rows.length > 0; // Returns true if any notifications were deleted
    }

    async deleteNotificationsByFireId(fire_id) {
        const sql = `DELETE FROM notifications WHERE fire_id = $1 RETURNING notification_id`;
        const { rows } = await pool.query(sql, [fire_id]);
        
        return rows.length > 0; // Returns true if any notifications were deleted
    }
}
