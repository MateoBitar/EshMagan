// src/api/graphql/schema/evacuation.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Evacuation operations.
 * It includes evacuation types, input types for creation and updates,
 * as well as all related queries and mutations.
 */

export const evacuationTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents an Evacuation route entity
  # PRE-CONDITIONS:
  # - Evacuation route must exist in the system
  # POST-CONDITIONS:
  # - Provides structured evacuation data
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

  # Input structure for creating a new evacuation route
  # PRE-CONDITIONS:
  # - All required fields must be provided
  # POST-CONDITIONS:
  # - Used to create a new evacuation route
  input CreateEvacuationInput {
    route_status: String!
    route_priority: Int!
    route_path: String!
    safe_zone: String!
    distance_km: Float!
    estimated_time: String!
    fire_id: ID!
  }

  # Input structure for updating evacuation status
  # PRE-CONDITIONS:
  # - new_status must be provided
  # POST-CONDITIONS:
  # - Updates evacuation status
  input UpdateEvacuationStatusInput {
    new_status: String!
  }

  # Input structure for updating evacuation priority
  # PRE-CONDITIONS:
  # - new_priority must be provided
  # POST-CONDITIONS:
  # - Updates evacuation priority
  input UpdateEvacuationPriorityInput {
    new_priority: Int!
  }

  # Input structure for updating evacuation geometry
  # PRE-CONDITIONS:
  # - new_route_path and new_safe_zone must be provided
  # POST-CONDITIONS:
  # - Updates route path and safe zone
  input UpdateEvacuationGeometryInput {
    new_route_path: String!
    new_safe_zone: String!
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all evacuation routes
    # PRE-CONDITIONS:
    # - Evacuation data must exist
    # POST-CONDITIONS:
    # - Returns list of routes
    getAllEvacuations: [Evacuation!]!

    # Retrieve evacuation route by ID
    # PRE-CONDITIONS:
    # - route_id must be provided
    # POST-CONDITIONS:
    # - Returns route if found
    getEvacuationById(route_id: ID!): Evacuation

    # Retrieve evacuation routes by status
    # PRE-CONDITIONS:
    # - route_status must be provided
    # POST-CONDITIONS:
    # - Returns filtered routes
    getEvacuationsByStatus(route_status: String!): [Evacuation!]!

    # Retrieve evacuation routes by priority
    # PRE-CONDITIONS:
    # - route_priority must be provided
    # POST-CONDITIONS:
    # - Returns filtered routes
    getEvacuationsByPriority(route_priority: Int!): [Evacuation!]!

    # Retrieve evacuation routes by safe zone
    # PRE-CONDITIONS:
    # - safe_zone must be provided
    # POST-CONDITIONS:
    # - Returns filtered routes
    getEvacuationsByZone(safe_zone: String!): [Evacuation!]!

    # Retrieve evacuation routes by fire ID
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered routes
    getEvacuationsByFireId(fire_id: ID!): [Evacuation!]!

    # Retrieve nearest evacuation route based on coordinates
    # PRE-CONDITIONS:
    # - latitude and longitude must be provided
    # POST-CONDITIONS:
    # - Returns nearest route
    getNearestEvacuation(latitude: Float!, longitude: Float!): Evacuation
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new evacuation route
    # PRE-CONDITIONS:
    # - input must contain valid data
    # POST-CONDITIONS:
    # - Returns created route
    createEvacuation(input: CreateEvacuationInput!): Evacuation!

    # Update evacuation status
    # PRE-CONDITIONS:
    # - route_id and input must be provided
    # POST-CONDITIONS:
    # - Returns updated route
    updateEvacuationStatus(route_id: ID!, input: UpdateEvacuationStatusInput!): Evacuation

    # Update evacuation priority
    # PRE-CONDITIONS:
    # - route_id and input must be provided
    # POST-CONDITIONS:
    # - Returns updated route
    updateEvacuationPriority(route_id: ID!, input: UpdateEvacuationPriorityInput!): Evacuation

    # Update evacuation geometry
    # PRE-CONDITIONS:
    # - route_id and input must be provided
    # POST-CONDITIONS:
    # - Returns updated route
    updateEvacuationGeometry(route_id: ID!, input: UpdateEvacuationGeometryInput!): Evacuation

    # Delete evacuation route
    # PRE-CONDITIONS:
    # - route_id must be provided
    # POST-CONDITIONS:
    # - Returns true if deleted
    deleteEvacuation(route_id: ID!): Boolean!

    # Delete evacuation routes by fire ID
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns true if deleted
    deleteEvacuationsByFireId(fire_id: ID!): Boolean!
  }
`;