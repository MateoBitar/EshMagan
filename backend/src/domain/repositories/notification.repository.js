// src/domain/repositories/notification.repository.js

import { pool } from '../../config/db.js';
import { Notification } from '../entities/notification.entity.js';
import { FireRepository } from './fire.repository.js';
import { UserRepository } from './user.repository.js';

/**
 * This repository handles all database operations related to notifications,
 * including creation, retrieval, filtering, updating, and deletion.
 */
export class NotificationRepository {

    /**
     * Create a new notification.
     *
     * PRE-CONDITIONS:
     * - data must contain target_role, notification_message, notification_status,
     *   expires_at, and user_id.
     * - user_id must exist in the system.
     * - fire_id (if provided) must exist.
     *
     * POST-CONDITIONS:
     * - A new notification is inserted into the database.
     * - Returns the created Notification entity.
     */
    async createNotification(data) {
        const { target_role, notification_message, notification_status, expires_at, fire_id, user_id } = data;
        
        // Step 1: Validate user_id exists
        const userRepository = new UserRepository();
        const user = await userRepository.getUserById(user_id);
        if (!user) {
            throw new Error('User not found for the given user_id');
        }

        // Step 2: Validate fire_id exists
        if (fire_id) {
            const fireRepository = new FireRepository();
            const fire = await fireRepository.getFireById(fire_id);
            if (!fire) {
                throw new Error('Fire incident not found for the given fire_id');
            }
        }

        // Step 3: Insert the notification
        const notificationSql = `
            INSERT INTO notifications (target_role, notification_message, notification_status, 
            expires_at, fire_id, user_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
            RETURNING notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
        `;
        const notificationValues = [target_role, notification_message, notification_status, expires_at, fire_id, user_id];
        const { rows: notificationRows } = await pool.query(notificationSql, notificationValues);

        return Notification.fromEntity(notificationRows[0]);
    }

    /**
     * Retrieve all active notifications.
     *
     * PRE-CONDITIONS:
     * - Database connection must be available.
     *
     * POST-CONDITIONS:
     * - Returns notifications where expires_at > NOW().
     * - Returns empty array if none found.
     */
    async getAllNotifications() {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status, 
            expires_at, created_at, fire_id, user_id
            FROM notifications 
            WHERE expires_at > NOW() 
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => Notification.fromEntity(row));
    }

    /**
     * Retrieve notification by ID.
     *
     * PRE-CONDITIONS:
     * - notification_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns notification if found and not expired.
     * - Returns null otherwise.
     */
    async getNotificationById(notification_id) {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
            FROM notifications 
            WHERE notification_id = $1 AND expires_at > NOW()
        `;
        const { rows } = await pool.query(sql, [notification_id]);

        if (rows.length === 0) {
            return null;
        }

        return Notification.fromEntity(rows[0]);
    }

    /**
     * Retrieve notifications by target role.
     *
     * PRE-CONDITIONS:
     * - target_role must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching notifications.
     * - Returns empty array if none found.
     */
    async getNotificationsByTargetRole(target_role) {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
            FROM notifications 
            WHERE target_role = $1 AND expires_at > NOW() 
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql, [target_role]);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => Notification.fromEntity(row));
    }

    /**
     * Retrieve notifications by status.
     *
     * PRE-CONDITIONS:
     * - notification_status must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching notifications.
     * - Returns empty array if none found.
     */
    async getNotificationsByStatus(notification_status) {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
            FROM notifications 
            WHERE notification_status = $1 AND expires_at > NOW()
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql, [notification_status]);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => Notification.fromEntity(row));
    }

    /**
     * Retrieve notifications by expiration time.
     *
     * PRE-CONDITIONS:
     * - expires_at must be provided.
     *
     * POST-CONDITIONS:
     * - Returns notifications expiring before or at the given time.
     * - Returns empty array if none found.
     */
    async getNotificationsByExpiration(expires_at) {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
            FROM notifications 
            WHERE expires_at <= $1 
            ORDER BY expires_at ASC
        `;
        const { rows } = await pool.query(sql, [expires_at]);

        if (rows.length ===0) {
            return [];
        }

        return rows.map(row => Notification.fromEntity(row));
    }

    /**
     * Retrieve notifications by fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns notifications related to the fire.
     * - Returns empty array if none found.
     */
    async getNotificationsByFireId(fire_id) {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
            FROM notifications
            WHERE fire_id = $1 AND expires_at > NOW()
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql, [fire_id]);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => Notification.fromEntity(row));
    }

    /**
     * Retrieve notifications by user ID.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns notifications linked to the user.
     * - Returns empty array if none found.
     */
    async getNotificationsByUserId(user_id) {
        const sql = `
            SELECT notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
            FROM notifications 
            WHERE user_id = $1 AND expires_at > NOW() 
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql, [user_id]);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => Notification.fromEntity(row));
    }

    /**
     * Update notification status.
     *
     * PRE-CONDITIONS:
     * - notification_id and new_status must be provided.
     *
     * POST-CONDITIONS:
     * - Updates notification status.
     * - Returns updated notification if found.
     * - Returns null otherwise.
     */
    async updateNotificationStatus(notification_id, new_status) {
        const sql = `
            UPDATE notifications 
            SET notification_status = $1 
            WHERE notification_id = $2 
            RETURNING notification_id, target_role, notification_message, notification_status,
            expires_at, created_at, fire_id, user_id
        `;
        const { rows } = await pool.query(sql, [new_status, notification_id]);

        if (rows.length === 0) {
            return null;
        }

        return Notification.fromEntity(rows[0]);
    }

    /**
     * Delete notification by ID.
     *
     * PRE-CONDITIONS:
     * - notification_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes notification if it exists.
     * - Returns true if deleted, false otherwise.
     */
    async deleteNotification(notification_id) {
        const sql = `
            DELETE FROM notifications 
            WHERE notification_id = $1 
            RETURNING notification_id
        `;
        const { rows } = await pool.query(sql, [notification_id]);

        if (rows.length === 0) {
            return false;
        }

        return true;
    }

    /**
     * Delete expired notifications.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Deletes all expired notifications.
     * - Returns true if any were deleted.
     */
    async deleteExpiredNotifications() {
        const sql = `
            DELETE FROM notifications 
            WHERE expires_at <= NOW() 
            RETURNING notification_id
        `;
        const { rows } = await pool.query(sql);

        return rows.length > 0;
    }

    /**
     * Delete non-failed notifications.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Deletes notifications where status is not 'Failed'.
     * - Returns true if any were deleted.
     */
    async deleteNonFailedNotifications() {
        const sql = `
            DELETE FROM notifications 
            WHERE notification_status != 'Failed' 
            RETURNING notification_id
        `;
        const { rows } = await pool.query(sql);

        return rows.length > 0;
    }

    /**
     * Delete notifications by fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes notifications related to the fire.
     * - Returns true if any were deleted.
     */
    async deleteNotificationsByFireId(fire_id) {
        const sql = `
            DELETE FROM notifications 
            WHERE fire_id = $1 
            RETURNING notification_id
        `;
        const { rows } = await pool.query(sql, [fire_id]);

        return rows.length > 0;
    }
}