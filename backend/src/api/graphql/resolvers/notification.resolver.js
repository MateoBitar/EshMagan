// src/api/graphql/resolvers/notification.resolver.js

/**
 * This file defines the GraphQL resolvers for Notification-related operations.
 * Notifications are generated internally by fire.service.js via NATS,
 * and cannot be created or deleted directly by clients.
 * 
 * This resolver provides read access (queries) and allows clients
 * to update the notification status (e.g., mark as Delivered).
 */

// Notifications are created internally by fire.service.js via NATS — never by the client.
// The only mutation exposed is updateNotificationStatus, so clients can mark
// notifications as Delivered or acknowledge receipt.
export const notificationResolvers = {
  Query: {
    /**
     * Retrieves all active (non-expired) notifications.
     * 
     * PRE-CONDITIONS:
     * - dataSources.notificationService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of notifications
     * - Throws error if retrieval fails
     */
    // Fetch all active (non-expired) notifications
    getAllNotifications: async (_, __, { dataSources }) => {
      try {
        // Fetch all active notifications
        return await dataSources.notificationService.getAllNotifications();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllNotifications: ${err.message}`);
      }
    },

    /**
     * Retrieves a notification by its unique ID.
     * 
     * PRE-CONDITIONS:
     * - notification_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns notification if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch a single notification by ID
    getNotificationById: async (_, { notification_id }, { dataSources }) => {
      try {
        // Fetch notification by ID
        const notification = await dataSources.notificationService.getNotificationById(notification_id);

        // Validate existence
        if (!notification) throw new Error(`Notification with ID ${notification_id} not found`);

        return notification;
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationById: ${err.message}`);
      }
    },

    /**
     * Retrieves notifications filtered by target role.
     * 
     * PRE-CONDITIONS:
     * - target_role must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of notifications
     * - Throws error if retrieval fails
     */
    // Fetch notifications by target role (Resident, Responder, Municipality, Admin)
    getNotificationsByTargetRole: async (_, { target_role }, { dataSources }) => {
      try {
        // Fetch notifications by role
        return await dataSources.notificationService.getNotificationsByTargetRole(target_role);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByTargetRole: ${err.message}`);
      }
    },

    /**
     * Retrieves notifications filtered by status.
     * 
     * PRE-CONDITIONS:
     * - notification_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of notifications
     * - Throws error if retrieval fails
     */
    // Fetch notifications by status (Sent, Delivered, Failed)
    getNotificationsByStatus: async (_, { notification_status }, { dataSources }) => {
      try {
        // Fetch notifications by status
        return await dataSources.notificationService.getNotificationsByStatus(notification_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByStatus: ${err.message}`);
      }
    },

    /**
     * Retrieves notifications that expire before or at a given timestamp.
     * 
     * PRE-CONDITIONS:
     * - expires_at must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of notifications
     * - Throws error if retrieval fails
     */
    // Fetch notifications expiring before or at a given timestamp
    getNotificationsByExpiration: async (_, { expires_at }, { dataSources }) => {
      try {
        // Fetch notifications by expiration
        return await dataSources.notificationService.getNotificationsByExpiration(expires_at);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByExpiration: ${err.message}`);
      }
    },

    /**
     * Retrieves notifications associated with a specific fire.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of notifications
     * - Throws error if retrieval fails
     */
    // Fetch all notifications associated with a specific fire
    getNotificationsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        // Fetch notifications by fire ID
        return await dataSources.notificationService.getNotificationsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByFireId: ${err.message}`);
      }
    },

    /**
     * Retrieves notifications associated with a specific user.
     * 
     * PRE-CONDITIONS:
     * - user_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of notifications
     * - Throws error if retrieval fails
     */
    // Fetch all notifications for a specific user
    getNotificationsByUserId: async (_, { user_id }, { dataSources }) => {
      try {
        // Fetch notifications by user ID
        return await dataSources.notificationService.getNotificationsByUserId(user_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByUserId: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Updates the status of a notification (e.g., marking as Delivered).
     * 
     * PRE-CONDITIONS:
     * - notification_id must be provided
     * - notification_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated notification
     * - Throws error if notification not found or update fails
     */
    // Update the status of a notification (e.g. client marks as Delivered)
    updateNotificationStatus: async (_, { notification_id, notification_status }, { dataSources }) => {
      try {
        // Update notification status
        const notification = await dataSources.notificationService.updateNotificationStatus(notification_id, notification_status);

        // Validate existence
        if (!notification) throw new Error(`Notification with ID ${notification_id} not found`);

        return notification;
      } catch (err) {
        throw new Error(`GraphQL Error - updateNotificationStatus: ${err.message}`);
      }
    },
  },
};