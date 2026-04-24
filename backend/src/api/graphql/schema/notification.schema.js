// src/api/graphql/schema/notification.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Notification operations.
 * Notifications are system-generated and this schema allows querying
 * and updating their status.
 */

export const notificationTypeDefs = gql`
  # -----------------------------
  # Enums (from SQL constraints)
  # -----------------------------

  # Defines possible notification statuses
  # PRE-CONDITIONS:
  # - Must match backend/database constraints
  # POST-CONDITIONS:
  # - Restricts valid status values
  enum NotificationStatus {
    Sent
    Delivered
    Failed
  }

  # Defines target roles for notifications
  # PRE-CONDITIONS:
  # - Must match system roles
  # POST-CONDITIONS:
  # - Restricts valid role values
  enum NotificationTargetRole {
    Resident
    Responder
    Municipality
    Admin
  }

  # -----------------------------
  # Types
  # -----------------------------

  # Represents a Notification entity
  # PRE-CONDITIONS:
  # - Notification must exist in the system
  # POST-CONDITIONS:
  # - Provides structured notification data
  type Notification {
    notification_id: ID!
    target_role: NotificationTargetRole!
    notification_message: String!
    notification_status: NotificationStatus!
    expires_at: String!
    created_at: String!
    fire_id: ID
    user_id: ID!
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all notifications
    # PRE-CONDITIONS:
    # - Notification data must exist
    # POST-CONDITIONS:
    # - Returns list of notifications
    getAllNotifications: [Notification!]!

    # Retrieve notification by ID
    # PRE-CONDITIONS:
    # - notification_id must be provided
    # POST-CONDITIONS:
    # - Returns notification if found
    getNotificationById(notification_id: ID!): Notification

    # Retrieve notifications by target role
    # PRE-CONDITIONS:
    # - target_role must be provided
    # POST-CONDITIONS:
    # - Returns filtered notifications
    getNotificationsByTargetRole(target_role: NotificationTargetRole!): [Notification!]!

    # Retrieve notifications by status
    # PRE-CONDITIONS:
    # - notification_status must be provided
    # POST-CONDITIONS:
    # - Returns filtered notifications
    getNotificationsByStatus(notification_status: NotificationStatus!): [Notification!]!

    # Retrieve notifications by expiration
    # PRE-CONDITIONS:
    # - expires_at must be provided
    # POST-CONDITIONS:
    # - Returns filtered notifications
    getNotificationsByExpiration(expires_at: String!): [Notification!]!

    # Retrieve notifications by fire ID
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered notifications
    getNotificationsByFireId(fire_id: ID!): [Notification!]!

    # Retrieve notifications by user ID
    # PRE-CONDITIONS:
    # - user_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered notifications
    getNotificationsByUserId(user_id: ID!): [Notification!]!
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Update notification status
    # PRE-CONDITIONS:
    # - notification_id and notification_status must be provided
    # POST-CONDITIONS:
    # - Returns updated notification
    # - Allows client to acknowledge or mark as delivered
    # Client-facing: mark a notification as Delivered or acknowledge receipt
    updateNotificationStatus(notification_id: ID!, notification_status: NotificationStatus!): Notification!
  }
`;