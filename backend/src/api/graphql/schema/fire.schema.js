// src/api/graphql/schema/fire.schema.js

import gql from 'graphql-tag';

export const fireTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type Fire {
    fire_id: ID!
    fire_source: String!
    fire_location: String!   # Stored as WKT POINT string
    fire_severitylevel: Int
    is_extinguished: Boolean!
    is_verified: Boolean!
    spread_prediction: String
    created_at: String
    updated_at: String
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input CreateFireInput {
    fire_source: String!
    fire_location: String!   # WKT POINT format: "POINT(lng lat)"
    fire_severitylevel: Int
    is_extinguished: Boolean = false
    is_verified: Boolean = false
  }

  input UpdateFireInput {
    fire_source: String
    fire_location: String
    fire_severitylevel: Int
    is_extinguished: Boolean
    is_verified: Boolean
    spread_prediction: String
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllFires: [Fire!]!
    getFireById(fire_id: ID!): Fire
    getActiveFires: [Fire!]!
    getFiresByStatus(fire_status: Boolean!): [Fire!]!
    getFiresByMunicipality(municipality_id: ID!): [Fire!]!
    getFiresRadius(lat: Float!, lng: Float!, radiusMeters: Int!): [Fire!]!
    getFiresWithinPolygon(polygonGeoJSON: String!): [Fire!]!
    getRecentFires(limit: Int!): [Fire!]!
    getFiresByDate(startDate: String!, endDate: String!): [Fire!]!
    getFireStatistics(startDate: String!, endDate: String!): FireStatistics
    getFiresByLocationAndTime(lat: Float!, lng: Float!, startDate: String!, endDate: String!, radiusMeters: Int): [Fire!]!
    countFires(filters: FireFilterInput): Int!
    findResidentsNearFire(fire_id: ID!, radiusMeters: Int): [Resident!]!
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createFire(input: CreateFireInput!): Fire!
    updateFire(fire_id: ID!, input: UpdateFireInput!): Fire
    updateFireStatus(fire_id: ID!, fire_status: Boolean!): Fire
    updateFireSeverity(fire_id: ID!, severityLevel: Int!): Fire
    updateFireSpreadPrediction(fire_id: ID!, spreadPrediction: String!): Fire
    deleteFire(fire_id: ID!): Boolean!
    createFireAndTriggerSystem(input: CreateFireInput!): Fire! 
    verifyFire(fire_id: ID!): Fire 
    extinguishFire(fire_id: ID!): Fire 
    dispatchClosestResponder(fire_id: ID!): FireAssignment
  }

  # -----------------------------
  # Supporting Types & Inputs
  # -----------------------------
  type FireStatistics {
    total_fires: Int!
    extinguished_fires: Int!
    active_fires: Int!
  }

  input FireFilterInput {
    is_extinguished: Boolean
    is_verified: Boolean
    fire_severitylevel: Int
  }
`;
