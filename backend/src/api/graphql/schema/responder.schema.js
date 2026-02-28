// src/api/graphql/schema/responder.schema.js

import gql from 'graphql-tag';

export const responderTypeDefs = gql`
  type Responder {
    responder_id: ID!
    unit_nb: String!
    unit_location: String!
    assigned_region: String!
    responder_status: String!
    last_known_location: String!
    user: User!
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input CreateResponderInput {
    unit_nb: String!
    unit_location: String!
    assigned_region: String!
    responder_status: String!
    last_known_location: String!
    user_email: String!
    user_password: String!
    user_phone: String!
  }

  input UpdateResponderInput {
    unit_nb: String
    unit_location: String
    assigned_region: String
    responder_status: String
    last_known_location: String
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllResponders: [Responder!]!
    getResponderById(responder_id: ID!): Responder
    getRespondersByUnitNb(unit_nb: String!): [Responder!]!
    getRespondersByUnitLocation(unit_location: String!): [Responder!]!
    getRespondersByAssignedRegion(assigned_region: String!): [Responder!]!
    getRespondersByResponderStatus(responder_status: String!): [Responder!]!
    getRespondersByLastKnownLocation(last_known_location: String!): [Responder!]!
    getResponderByEmail(user_email: String!): Responder
    getResponderByPhone(user_phone: String!): Responder
    getNearestResponder(fire_location: String!): Responder
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createResponder(input: CreateResponderInput!): Responder!
    updateResponder(responder_id: ID!, input: UpdateResponderInput!): Responder
    updateResponderStatus(responder_id: ID!, responder_status: String!): Responder
    updateResponderLocation(responder_id: ID!, latitude: Float!, longitude: Float!): ResponderLocationUpdate
    deactivateResponder(responder_id: ID!): Boolean!
  }

  # -----------------------------
  # Extra Types
  # -----------------------------
  type ResponderLocationUpdate {
    responder_id: ID!
    last_known_location: String!
    updated_at: String!
  }
`;
