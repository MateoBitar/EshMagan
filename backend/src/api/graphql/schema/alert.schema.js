// src/api/graphql/schema/alert.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Alert operations.
 * Alerts are system-generated (via NATS/fire.service.js) and are read-only
 * from the GraphQL perspective. This schema includes enums, types, and queries only.
 */

export const alertTypeDefs = gql`
  # -----------------------------
  # Enums (from SQL constraints)
  # -----------------------------

  # Defines possible alert types
  # PRE-CONDITIONS:
  # - Must match backend/database constraints
  # POST-CONDITIONS:
  # - Ensures valid alert type values
  enum AlertType {
    FireAlert
    EvacuationAlert
    PredictionAlert
  }

  # Defines roles targeted by alerts
  # PRE-CONDITIONS:
  # - Must match system roles
  # POST-CONDITIONS:
  # - Restricts valid target roles
  enum AlertTargetRole {
    Resident
    Responder
    Municipality
    Admin
  }

  # -----------------------------
  # Types
  # -----------------------------

  # Represents an Alert entity
  # PRE-CONDITIONS:
  # - Alert must exist in the system
  # POST-CONDITIONS:
  # - Provides alert data for queries
  type Alert {
    alert_id: ID!
    alert_type: AlertType!
    target_role: AlertTargetRole!
    alert_message: String!
    expires_at: String!
    created_at: String!
    fire_id: ID
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all alerts
    # PRE-CONDITIONS:
    # - Alerts must exist
    # POST-CONDITIONS:
    # - Returns list of alerts
    getAllAlerts: [Alert!]!

    # Retrieve alert by ID
    # PRE-CONDITIONS:
    # - alert_id must be provided
    # POST-CONDITIONS:
    # - Returns alert if found
    getAlertById(alert_id: ID!): Alert

    # Retrieve alerts by type
    # PRE-CONDITIONS:
    # - alert_type must be provided
    # POST-CONDITIONS:
    # - Returns filtered alerts
    getAlertsByAlertType(alert_type: AlertType!): [Alert!]!

    # Retrieve alerts by target role
    # PRE-CONDITIONS:
    # - target_role must be provided
    # POST-CONDITIONS:
    # - Returns filtered alerts
    getAlertsByTargetRole(target_role: AlertTargetRole!): [Alert!]!

    # Retrieve alerts by expiration date
    # PRE-CONDITIONS:
    # - expires_at must be provided
    # POST-CONDITIONS:
    # - Returns filtered alerts
    getAlertsByExpiration(expires_at: String!): [Alert!]!

    # Retrieve alerts by fire ID
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered alerts
    getAlertsByFireId(fire_id: ID!): [Alert!]!
  }

  # No Mutation block, alerts are created and deleted internally via NATS/fire.service.js
`;