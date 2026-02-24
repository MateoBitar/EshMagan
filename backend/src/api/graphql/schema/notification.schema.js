// src/api/graphql/schema/notification.schema.js

import gql from 'graphql-tag';

export const notificationTypeDefs = gql`
  # -----------------------------
  # Enums (from SQL constraints)
  # -----------------------------
  enum NotificationStatus {
    Sent
    Delivered
    Failed
  }

  enum NotificationTargetRole {
    Resident
    Responder
    Municipality
    Admin
  }

  # -----------------------------
  # Types
  # -----------------------------
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
    getAllNotifications: [Notification!]!
    getNotificationById(notification_id: ID!): Notification
    getNotificationsByTargetRole(target_role: NotificationTargetRole!): [Notification!]!
    getNotificationsByStatus(notification_status: NotificationStatus!): [Notification!]!
    getNotificationsByExpiration(expires_at: String!): [Notification!]!
    getNotificationsByFireId(fire_id: ID!): [Notification!]!
    getNotificationsByUserId(user_id: ID!): [Notification!]!
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    # Client-facing: mark a notification as Delivered or acknowledge receipt
    updateNotificationStatus(notification_id: ID!, notification_status: NotificationStatus!): Notification!
  }
`;
