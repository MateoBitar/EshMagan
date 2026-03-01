// src/api/graphql/schema/responder.schema.js

import gql from 'graphql-tag';

export const responderTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type Responder {
    responder_id: ID!
    unit_nb: String!
    unit_location: Location
    assigned_region: String!
    responder_status: String!
    last_known_location: Location!
    updated_at: String
    user: User!
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  type Location {
    latitude: Float
    longitude: Float
  }

  input CreateResponderInput {
    unit_nb: String!
    unit_location: LocationInput
    assigned_region: String!
    responder_status: String!
    last_known_location: LocationInput!
    user_email: String!
    user_password: String!
    user_phone: String!
  }

  input UpdateResponderInput {
    unit_nb: String
    unit_location: LocationInput
    assigned_region: String
    responder_status: String
    last_known_location: LocationInput
    user_email: String
    user_phone: String
    user_password: String
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllResponders: [Responder!]!
    getResponderById(responder_id: ID!): Responder
    getRespondersByUnitNb(unit_nb: String!): [Responder!]!
    getRespondersByUnitLocation(unit_location: LocationInput!): [Responder!]!
    getRespondersByAssignedRegion(assigned_region: String!): [Responder!]!
    getRespondersByResponderStatus(responder_status: String!): [Responder!]!
    getRespondersByLastKnownLocation(last_known_location: LocationInput!): [Responder!]!
    getResponderByEmail(user_email: String!): Responder
    getResponderByPhone(user_phone: String!): Responder
    getNearestResponder(fire_location: LocationInput!): Responder
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createResponder(input: CreateResponderInput!): Responder!
    updateResponder(responder_id: ID!, input: UpdateResponderInput!): Responder
    updateResponderStatus(responder_id: ID!, responder_status: String!): Responder
    updateResponderLocation(responder_id: ID!, latitude: Float!, longitude: Float!): Responder
    deactivateResponder(responder_id: ID!): Boolean!
  }
`;