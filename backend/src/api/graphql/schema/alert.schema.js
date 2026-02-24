// src/api/graphql/schema/alert.schema.js

import gql from 'graphql-tag';

export const alertTypeDefs = gql`
  # -----------------------------
  # Enums (from SQL constraints)
  # -----------------------------
  enum AlertType {
    FireAlert
    EvacuationAlert
    PredictionAlert
  }

  enum AlertTargetRole {
    Resident
    Responder
    Municipality
    Admin
  }

  # -----------------------------
  # Types
  # -----------------------------
  type Alert {
    alert_id: ID!
    alert_type: AlertType!
    target_role: AlertTargetRole!
    alert_message: String!
    expires_at: String!
    created_at: String!
    fire_id: ID!
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllAlerts: [Alert!]!
    getAlertById(alert_id: ID!): Alert
    getAlertsByAlertType(alert_type: AlertType!): [Alert!]!
    getAlertsByTargetRole(target_role: AlertTargetRole!): [Alert!]!
    getAlertsByExpiration(expires_at: String!): [Alert!]!
    getAlertsByFireId(fire_id: ID!): [Alert!]!
  }

  # No Mutation block, alerts are created and deleted internally via NATS/fire.service.js
`;
