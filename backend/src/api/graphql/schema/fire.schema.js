// src/api/graphql/schema/fire.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Fire operations.
 * It includes fire types, input structures, queries, mutations,
 * and supporting types used for filtering and statistics.
 */

export const fireTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents a Fire entity in the system
  # PRE-CONDITIONS:
  # - Fire must exist in the system
  # POST-CONDITIONS:
  # - Provides structured fire data
  type Fire {
    fire_id: ID!
    fire_source: String!
    fire_location: String!   # Stored as WKT POINT string
    fire_severitylevel: Int
    is_extinguished: Boolean!
    is_verified: Boolean!
    created_at: String
    updated_at: String
  }

  type PredictionPublishResult {
    success: Boolean!
    message: String!
  }

  # -----------------------------
  # Input Types
  # -----------------------------

  # Input structure for creating a fire
  # PRE-CONDITIONS:
  # - fire_source and fire_location must be provided
  # POST-CONDITIONS:
  # - Used to create a new fire record
  input CreateFireInput {
    fire_source: String!
    fire_location: String!   # WKT POINT format: "POINT(lng lat)"
    fire_severitylevel: Int
    is_extinguished: Boolean = false
    is_verified: Boolean = false
    evacuation_routes: [AI_EvacuationRouteInput!]
  }

  # Input structure for updating a fire
  # PRE-CONDITIONS:
  # - At least one field must be provided
  # POST-CONDITIONS:
  # - Updates existing fire data
  input UpdateFireInput {
    fire_source: String
    fire_location: String
    fire_severitylevel: Int
    is_extinguished: Boolean
    is_verified: Boolean
  }

  # Input structure for AI-generated evacuation route
  # PRE-CONDITIONS:
  # - All fields must be provided
  # POST-CONDITIONS:
  # - Used to create evacuation routes based on AI analysis
  input AI_EvacuationRouteInput {
    route_status: String!
    route_priority: Int!
    route_path: String!
    safe_zone: String!
    distance_km: Float!
    estimated_time: String!
  }

  # Input structure for fire risk prediction event
  # PRE-CONDITIONS:
  # - zone_location and risk_level must be provided
  # POST-CONDITIONS:
  # - Used to publish fire risk prediction events to NATS
  input FireRiskPredictionInput {
    zone_location: String!
    risk_level: String!
    fire_id: ID
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all fires
    # PRE-CONDITIONS:
    # - Fire data must exist
    # POST-CONDITIONS:
    # - Returns list of fires
    getAllFires: [Fire!]!

    # Retrieve fire by ID
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns fire if found
    getFireById(fire_id: ID!): Fire

    # Retrieve active fires
    # PRE-CONDITIONS:
    # - Fire data must exist
    # POST-CONDITIONS:
    # - Returns active fires
    getActiveFires: [Fire!]!

    # Retrieve fires by status
    # PRE-CONDITIONS:
    # - fire_status must be provided
    # POST-CONDITIONS:
    # - Returns filtered fires
    getFiresByStatus(fire_status: Boolean!): [Fire!]!

    # Retrieve fires by municipality
    # PRE-CONDITIONS:
    # - municipality_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered fires
    getFiresByMunicipality(municipality_id: ID!): [Fire!]!

    # Retrieve fires within a radius
    # PRE-CONDITIONS:
    # - lat, lng, radiusMeters must be provided
    # POST-CONDITIONS:
    # - Returns filtered fires
    getFiresRadius(lat: Float!, lng: Float!, radiusMeters: Int!): [Fire!]!

    # Retrieve fires within polygon
    # PRE-CONDITIONS:
    # - polygonGeoJSON must be provided
    # POST-CONDITIONS:
    # - Returns filtered fires
    getFiresWithinPolygon(polygonGeoJSON: String!): [Fire!]!

    # Retrieve recent fires
    # PRE-CONDITIONS:
    # - limit must be provided
    # POST-CONDITIONS:
    # - Returns limited list
    getRecentFires(limit: Int!): [Fire!]!

    # Retrieve fires by date range
    # PRE-CONDITIONS:
    # - startDate and endDate must be provided
    # POST-CONDITIONS:
    # - Returns filtered fires
    getFiresByDate(startDate: String!, endDate: String!): [Fire!]!

    # Retrieve fire statistics
    # PRE-CONDITIONS:
    # - startDate and endDate must be provided
    # POST-CONDITIONS:
    # - Returns statistics object
    getFireStatistics(startDate: String!, endDate: String!): FireStatistics

    # Retrieve fires by location and time
    # PRE-CONDITIONS:
    # - lat, lng, startDate, endDate must be provided
    # POST-CONDITIONS:
    # - Returns filtered fires
    getFiresByLocationAndTime(lat: Float!, lng: Float!, startDate: String!, endDate: String!, radiusMeters: Int): [Fire!]!

    # Count fires with filters
    # PRE-CONDITIONS:
    # - filters may be provided
    # POST-CONDITIONS:
    # - Returns count of fires
    countFires(filters: FireFilterInput): Int!

    # Find residents near a fire
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns list of residents
    findResidentsNearFire(fire_id: ID!, radiusMeters: Int): [Resident!]!

    # Retrieve nearby fires
    # PRE-CONDITIONS:
    # - latitude and longitude must be provided
    # POST-CONDITIONS:
    # - Returns nearby fires
    getNearbyFires(latitude: Float!, longitude: Float!): [Fire!]!
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new fire
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created fire
    createFire(input: CreateFireInput!): Fire!

    # Update fire
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns updated fire
    updateFire(fire_id: ID!, input: UpdateFireInput!): Fire

    # Update fire status
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns updated fire
    updateFireStatus(fire_id: ID!, fire_status: Boolean!): Fire

    # Update fire severity
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns updated fire
    updateFireSeverity(fire_id: ID!, severityLevel: Int!): Fire

    # Delete fire
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns true if deleted
    deleteFire(fire_id: ID!): Boolean!

    # Create fire and trigger system processes
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created fire
    createFireAndTriggerSystem(input: CreateFireInput!): Fire!
    
    # Publish fire risk prediction event
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns result of publish action
    publishFireRiskPrediction(input: FireRiskPredictionInput!): PredictionPublishResult!

    # Verify fire
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns updated fire
    verifyFire(fire_id: ID!): Fire 

    # Extinguish fire
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns updated fire
    extinguishFire(fire_id: ID!): Fire 

    # Dispatch closest responder
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns assignment
    dispatchClosestResponder(fire_id: ID!): FireAssignment
  }

  # -----------------------------
  # Supporting Types & Inputs
  # -----------------------------

  # Represents fire statistics
  # PRE-CONDITIONS:
  # - Fire data must exist
  # POST-CONDITIONS:
  # - Provides aggregated values
  type FireStatistics {
    total_fires: Int!
    extinguished_fires: Int!
    active_fires: Int!
  }

  # Filter input for fire queries
  # PRE-CONDITIONS:
  # - Optional filters may be provided
  # POST-CONDITIONS:
  # - Used to refine queries
  input FireFilterInput {
    is_extinguished: Boolean
    is_verified: Boolean
    fire_severitylevel: Int
  }
`;