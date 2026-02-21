// src/api/graphql/schema/responder.schema.js

import gql from 'graphql-tag';

export const responderTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type Responder {
    responder_id: ID!
    unit_nb: String!
    unit_location: String!
    assigned_region: String!
    responder_status: String!
    last_known_location: String!
    user: User!
  }

  type User {
    user_id: ID!
    user_email: String!
    user_phone: String
    user_role: String!
    isactive: Boolean!
    created_at: String
    # password intentionally excluded
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input CreateResponderInput {
    user_email: String!
    user_password: String!
    user_phone: String
    unit_nb: String!
    unit_location: String!
    assigned_region: String!
    responder_status: String!
    last_known_location: String!
  }

  input UpdateResponderInput {
    unit_nb: String
    unit_location: String
    assigned_region: String
    responder_status: String
    last_known_location: String
    user_email: String
    user_phone: String
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
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createResponder(input: CreateResponderInput!): Responder!
    updateResponder(responder_id: ID!, input: UpdateResponderInput!): Responder
    deactivateResponder(responder_id: ID!): Boolean!
  }
`;
