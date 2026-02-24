// src/api/graphql/resolvers/notification.resolver.js

// Notifications are created internally by fire.service.js via NATS — never by the client.
// The only mutation exposed is updateNotificationStatus, so clients can mark
// notifications as Delivered or acknowledge receipt.
export const notificationResolvers = {
  Query: {
    // Fetch all active (non-expired) notifications
    getAllNotifications: async (_, __, { dataSources }) => {
      try {
        return await dataSources.notificationService.getAllNotifications();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllNotifications: ${err.message}`);
      }
    },

    // Fetch a single notification by ID
    getNotificationById: async (_, { notification_id }, { dataSources }) => {
      try {
        const notification = await dataSources.notificationService.getNotificationById(notification_id);
        if (!notification) throw new Error(`Notification with ID ${notification_id} not found`);
        return notification;
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationById: ${err.message}`);
      }
    },

    // Fetch notifications by target role (Resident, Responder, Municipality, Admin)
    getNotificationsByTargetRole: async (_, { target_role }, { dataSources }) => {
      try {
        return await dataSources.notificationService.getNotificationsByTargetRole(target_role);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByTargetRole: ${err.message}`);
      }
    },

    // Fetch notifications by status (Sent, Delivered, Failed)
    getNotificationsByStatus: async (_, { notification_status }, { dataSources }) => {
      try {
        return await dataSources.notificationService.getNotificationsByStatus(notification_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByStatus: ${err.message}`);
      }
    },

    // Fetch notifications expiring before or at a given timestamp
    getNotificationsByExpiration: async (_, { expires_at }, { dataSources }) => {
      try {
        return await dataSources.notificationService.getNotificationsByExpiration(expires_at);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByExpiration: ${err.message}`);
      }
    },

    // Fetch all notifications associated with a specific fire
    getNotificationsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        return await dataSources.notificationService.getNotificationsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByFireId: ${err.message}`);
      }
    },

    // Fetch all notifications for a specific user
    getNotificationsByUserId: async (_, { user_id }, { dataSources }) => {
      try {
        return await dataSources.notificationService.getNotificationsByUserId(user_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getNotificationsByUserId: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Update the status of a notification (e.g. client marks as Delivered)
    updateNotificationStatus: async (_, { notification_id, notification_status }, { dataSources }) => {
      try {
        const notification = await dataSources.notificationService.updateNotificationStatus(notification_id, notification_status);
        if (!notification) throw new Error(`Notification with ID ${notification_id} not found`);
        return notification;
      } catch (err) {
        throw new Error(`GraphQL Error - updateNotificationStatus: ${err.message}`);
      }
    },
  },
};
