// src/services/notification.service.js

import { Notification } from '../domain/entities/notification.entity.js';

export class NotificationService {
    constructor(notificationRepository, userService) {
        this.notificationRepository = notificationRepository;
        this.userService = userService;
    }

    async createNotification(data) {
        try {
            // Notification-specific checks
            if (!data.target_role)           throw new Error("Missing required field: Target Role");
            if (!data.notification_message)  throw new Error("Missing required field: Notification Message");
            if (!data.notification_status)   throw new Error("Missing required field: Notification Status");
            if (!data.expires_at)            throw new Error("Missing required field: Expiration Date");
            if (!data.user_id)               throw new Error("Missing required field: User ID");
            // fire_id is optional (nullable)

            // Step 1: Validate user exists via UserService
            const user = await this.userService.getUserById(data.user_id);
            if (!user) throw new Error("User not found for the given user_id");

            // Step 2: Create Notification entity
            const notification = new Notification({
                target_role:          data.target_role,
                notification_message: data.notification_message,
                notification_status:  data.notification_status,
                expires_at:           data.expires_at,
                fire_id:              data.fire_id ?? null,
                user_id:              data.user_id
            });

            // Step 3: Persist via repository (repo handles fire_id FK validation internally)
            const createdNotification = await this.notificationRepository.createNotification(notification);
            return createdNotification.toDTO();
        } catch (err) {
            throw new Error(`Failed to create notification: ${err.message}`);
        }
    }

    async getAllNotifications() {
        try {
            // Fetch all notifications from repository
            const notifications = await this.notificationRepository.getAllNotifications();
            return notifications.map(notif => notif.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch notifications: ${err.message}`);
        }
    }

    async getNotificationById(notification_id) {
        try {
            // Fetch notification by ID
            const notification = await this.notificationRepository.getNotificationById(notification_id);
            if (!notification) return null;  // Not found or expired
            return notification.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch notification by ID: ${err.message}`);
        }
    }

    async getNotificationsByTargetRole(target_role) {
        try {
            // Fetch notifications by target role
            const notifications = await this.notificationRepository.getNotificationsByTargetRole(target_role);
            if (!notifications || notifications.length === 0) return [];  // No notifications found for this target role
            return notifications.map(notif => notif.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch notifications by target role: ${err.message}`);
        }
    }

    async getNotificationsByStatus(notification_status) {
        try {
            // Fetch notifications by status
            const notifications = await this.notificationRepository.getNotificationsByStatus(notification_status);
            if (!notifications || notifications.length === 0) return [];  // No notifications found for this status
            return notifications.map(notif => notif.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch notifications by status: ${err.message}`);
        }
    }

    async getNotificationsByExpiration(expires_at) {
        try {
            // Fetch notifications by expiration date
            const notifications = await this.notificationRepository.getNotificationsByExpiration(expires_at);
            if (!notifications || notifications.length === 0) return [];  // No notifications found for this expiration date
            return notifications.map(notif => notif.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch notifications by expiration: ${err.message}`);
        }
    }

    async getNotificationsByFireId(fire_id) {
        try {
            // Fetch notifications by associated fire ID
            const notifications = await this.notificationRepository.getNotificationsByFireId(fire_id);
            if (!notifications || notifications.length === 0) return [];  // No notifications found for this fire ID
            return notifications.map(notif => notif.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch notifications by fire ID: ${err.message}`);
        }
    }

    async getNotificationsByUserId(user_id) {
        try {
            // Fetch notifications by associated user ID
            const notifications = await this.notificationRepository.getNotificationsByUserId(user_id);
            if (!notifications || notifications.length === 0) return [];  // No notifications found for this user ID
            return notifications.map(notif => notif.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch notifications by user ID: ${err.message}`);
        }
    }

    async updateNotificationStatus(notification_id, new_status) {
        try {
            // Validate new status input
            if (!new_status) throw new Error("Missing required field: New Status");

            // Update notification status
            const notification = await this.notificationRepository.updateNotificationStatus(notification_id, new_status);
            if (!notification) return null; // Notification not found or update failed
            return notification.toDTO();
        } catch (err) {
            throw new Error(`Failed to update notification status: ${err.message}`);
        }
    }

    async deleteNotification(notification_id) {
        try {
            // Delete notification by ID
            return await this.notificationRepository.deleteNotification(notification_id);
        } catch (err) {
            throw new Error(`Failed to delete notification: ${err.message}`);
        }
    }

    async deleteExpiredNotifications() {
        try {
            // Delete all notifications that have expired (expires_at <= NOW())
            return await this.notificationRepository.deleteExpiredNotifications();
        } catch (err) {
            throw new Error(`Failed to delete expired notifications: ${err.message}`);
        }
    }

    async deleteNonFailedNotifications() {
        try {
            // Delete all notifications that do not have a status of 'Failed'
            return await this.notificationRepository.deleteNonFailedNotifications();
        } catch (err) {
            throw new Error(`Failed to delete non-failed notifications: ${err.message}`);
        }
    }

    async deleteNotificationsByFireId(fire_id) {
        try {
            // Delete all notifications associated with a specific fire ID
            return await this.notificationRepository.deleteNotificationsByFireId(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete notifications by fire ID: ${err.message}`);
        }
    }
}

