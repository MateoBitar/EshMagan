// src/api/graphql/schema/responder.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Responder operations.
 * It includes responder types, location structures, input types,
 * and all related queries and mutations.
 */

export const responderTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents a Responder entity
  # PRE-CONDITIONS:
  # - Responder must exist in the system
  # POST-CONDITIONS:
  # - Provides structured responder data
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

  # Input structure for geographic location
  # PRE-CONDITIONS:
  # - latitude and longitude must be provided
  # POST-CONDITIONS:
  # - Used for spatial operations
  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  # Represents a geographic location
  # PRE-CONDITIONS:
  # - Values may exist depending on context
  # POST-CONDITIONS:
  # - Returns latitude and longitude
  type Location {
    latitude: Float
    longitude: Float
  }

  # Input structure for creating a responder
  # PRE-CONDITIONS:
  # - Required fields must be provided
  # POST-CONDITIONS:
  # - Used to create responder and associated user
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

  # Input structure for updating a responder
  # PRE-CONDITIONS:
  # - At least one field must be provided
  # POST-CONDITIONS:
  # - Updates responder data
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
    # Retrieve all responders
    # PRE-CONDITIONS:
    # - Responder data must exist
    # POST-CONDITIONS:
    # - Returns list of responders
    getAllResponders: [Responder!]!

    # Retrieve responder by ID
    # PRE-CONDITIONS:
    # - responder_id must be provided
    # POST-CONDITIONS:
    # - Returns responder if found
    getResponderById(responder_id: ID!): Responder

    # Retrieve responders by unit number
    # PRE-CONDITIONS:
    # - unit_nb must be provided
    # POST-CONDITIONS:
    # - Returns filtered responders
    getRespondersByUnitNb(unit_nb: String!): [Responder!]!

    # Retrieve responders by unit location
    # PRE-CONDITIONS:
    # - unit_location must be provided
    # POST-CONDITIONS:
    # - Returns filtered responders
    getRespondersByUnitLocation(unit_location: LocationInput!): [Responder!]!

    # Retrieve responders by assigned region
    # PRE-CONDITIONS:
    # - assigned_region must be provided
    # POST-CONDITIONS:
    # - Returns filtered responders
    getRespondersByAssignedRegion(assigned_region: String!): [Responder!]!

    # Retrieve responders by status
    # PRE-CONDITIONS:
    # - responder_status must be provided
    # POST-CONDITIONS:
    # - Returns filtered responders
    getRespondersByResponderStatus(responder_status: String!): [Responder!]!

    # Retrieve responders by last known location
    # PRE-CONDITIONS:
    # - last_known_location must be provided
    # POST-CONDITIONS:
    # - Returns filtered responders
    getRespondersByLastKnownLocation(last_known_location: LocationInput!): [Responder!]!

    # Retrieve responder by email
    # PRE-CONDITIONS:
    # - user_email must be provided
    # POST-CONDITIONS:
    # - Returns responder if found
    getResponderByEmail(user_email: String!): Responder

    # Retrieve responder by phone
    # PRE-CONDITIONS:
    # - user_phone must be provided
    # POST-CONDITIONS:
    # - Returns responder if found
    getResponderByPhone(user_phone: String!): Responder

    # Retrieve nearest responder to a fire location
    # PRE-CONDITIONS:
    # - fire_location must be provided
    # POST-CONDITIONS:
    # - Returns nearest responder
    getNearestResponder(fire_location: LocationInput!): Responder
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new responder
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created responder
    createResponder(input: CreateResponderInput!): Responder!

    # Update responder
    # PRE-CONDITIONS:
    # - responder_id must be provided
    # POST-CONDITIONS:
    # - Returns updated responder
    updateResponder(responder_id: ID!, input: UpdateResponderInput!): Responder

    # Update responder status
    # PRE-CONDITIONS:
    # - responder_id and responder_status must be provided
    # POST-CONDITIONS:
    # - Returns updated responder
    updateResponderStatus(responder_id: ID!, responder_status: String!): Responder

    # Update responder location
    # PRE-CONDITIONS:
    # - responder_id, latitude, longitude must be provided
    # POST-CONDITIONS:
    # - Returns updated responder
    updateResponderLocation(responder_id: ID!, latitude: Float!, longitude: Float!): Responder

    # Deactivate responder
    # PRE-CONDITIONS:
    # - responder_id must be provided
    # POST-CONDITIONS:
    # - Returns true if successful
    deactivateResponder(responder_id: ID!): Boolean!
  }
`;