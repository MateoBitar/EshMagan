// src/api/graphql/schema/evacuation.schema.js

import gql from 'graphql-tag';

export const evacuationTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type Evacuation {
    route_id: ID!
    route_status: String!
    route_priority: Int!
    route_path: String!
    safe_zone: String!
    distance_km: Float!
    estimated_time: String!
    fire_id: ID!
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input CreateEvacuationInput {
    route_status: String!
    route_priority: Int!
    route_path: String!
    safe_zone: String!
    distance_km: Float!
    estimated_time: String!
    fire_id: ID!
  }

  input UpdateEvacuationStatusInput {
    new_status: String!
  }

  input UpdateEvacuationPriorityInput {
    new_priority: Int!
  }

  input UpdateEvacuationGeometryInput {
    new_route_path: String!
    new_safe_zone: String!
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllEvacuations: [Evacuation!]!
    getEvacuationById(route_id: ID!): Evacuation
    getEvacuationsByStatus(route_status: String!): [Evacuation!]!
    getEvacuationsByPriority(route_priority: Int!): [Evacuation!]!
    getEvacuationsByZone(safe_zone: String!): [Evacuation!]!
    getEvacuationsByFireId(fire_id: ID!): [Evacuation!]!
    getNearestEvacuation(latitude: Float!, longitude: Float!): Evacuation
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createEvacuation(input: CreateEvacuationInput!): Evacuation!
    updateEvacuationStatus(route_id: ID!, input: UpdateEvacuationStatusInput!): Evacuation
    updateEvacuationPriority(route_id: ID!, input: UpdateEvacuationPriorityInput!): Evacuation
    updateEvacuationGeometry(route_id: ID!, input: UpdateEvacuationGeometryInput!): Evacuation
    deleteEvacuation(route_id: ID!): Boolean!
    deleteEvacuationsByFireId(fire_id: ID!): Boolean!
  }
`;
