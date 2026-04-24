// src/api/graphql/schema/municipality.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Municipality operations.
 * It includes municipality types, location structures, input types,
 * and all related queries and mutations.
 */

export const municipalityTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents a Municipality entity
  # PRE-CONDITIONS:
  # - Municipality must exist in the system
  # POST-CONDITIONS:
  # - Provides structured municipality data
  type Municipality {
    municipality_id: ID!
    municipality_name: String!
    region_name: String!
    municipality_code: String!
    municipality_location: Location!
    created_at: String
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
  # - Used for spatial queries and creation
  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  # Represents a geographic location
  # PRE-CONDITIONS:
  # - Values may exist depending on query
  # POST-CONDITIONS:
  # - Returns latitude and longitude
  type Location {
    latitude: Float
    longitude: Float
  }

  # Input structure for creating a municipality
  # PRE-CONDITIONS:
  # - Required user and municipality fields must be provided
  # POST-CONDITIONS:
  # - Used to create municipality and associated user
  input CreateMunicipalityInput {
    user_email: String!
    user_password: String!
    user_phone: String
    municipality_name: String!
    region_name: String!
    municipality_code: String!
    municipality_location: LocationInput!
  }

  # Input structure for updating municipality
  # PRE-CONDITIONS:
  # - At least one field must be provided
  # POST-CONDITIONS:
  # - Updates municipality data
  input UpdateMunicipalityInput {
    municipality_name: String
    region_name: String
    municipality_code: String
    municipality_location: LocationInput
    user_phone: String
    user_email: String
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all municipalities
    # PRE-CONDITIONS:
    # - Municipality data must exist
    # POST-CONDITIONS:
    # - Returns list of municipalities
    getAllMunicipalities: [Municipality!]!

    # Retrieve municipality by ID
    # PRE-CONDITIONS:
    # - municipality_id must be provided
    # POST-CONDITIONS:
    # - Returns municipality if found
    getMunicipalityById(municipality_id: ID!): Municipality

    # Retrieve municipalities by name
    # PRE-CONDITIONS:
    # - municipality_name must be provided
    # POST-CONDITIONS:
    # - Returns filtered municipalities
    getMunicipalitiesByName(municipality_name: String!): [Municipality!]!

    # Retrieve municipalities by region
    # PRE-CONDITIONS:
    # - region_name must be provided
    # POST-CONDITIONS:
    # - Returns filtered municipalities
    getMunicipalityByRegion(region_name: String!): [Municipality!]!

    # Retrieve municipality by code
    # PRE-CONDITIONS:
    # - municipality_code must be provided
    # POST-CONDITIONS:
    # - Returns municipality if found
    getMunicipalityByCode(municipality_code: String!): Municipality

    # Retrieve municipality by location
    # PRE-CONDITIONS:
    # - municipality_location must be provided
    # POST-CONDITIONS:
    # - Returns municipality if found
    getMunicipalityByLocation(municipality_location: LocationInput!): Municipality

    # Retrieve municipality by email
    # PRE-CONDITIONS:
    # - user_email must be provided
    # POST-CONDITIONS:
    # - Returns municipality if found
    getMunicipalityByEmail(user_email: String!): Municipality

    # Retrieve municipality by phone
    # PRE-CONDITIONS:
    # - user_phone must be provided
    # POST-CONDITIONS:
    # - Returns municipality if found
    getMunicipalityByPhone(user_phone: String!): Municipality
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new municipality
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created municipality
    createMunicipality(input: CreateMunicipalityInput!): Municipality!

    # Update municipality
    # PRE-CONDITIONS:
    # - municipality_id must be provided
    # POST-CONDITIONS:
    # - Returns updated municipality
    updateMunicipality(municipality_id: ID!, input: UpdateMunicipalityInput!): Municipality

    # Deactivate municipality
    # PRE-CONDITIONS:
    # - municipality_id must be provided
    # POST-CONDITIONS:
    # - Returns true if successful
    deactivateMunicipality(municipality_id: ID!): Boolean!
  }
`;