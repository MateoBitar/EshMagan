// src/api/graphql/schema/municipality.schema.js

import gql from 'graphql-tag';

export const municipalityTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
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
  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  type Location {
    latitude: Float
    longitude: Float
  }

  input CreateMunicipalityInput {
    user_email: String!
    user_password: String!
    user_phone: String
    municipality_name: String!
    region_name: String!
    municipality_code: String!
    municipality_location: LocationInput!
  }

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
    getAllMunicipalities: [Municipality!]!
    getMunicipalityById(municipality_id: ID!): Municipality
    getMunicipalitiesByName(municipality_name: String!): [Municipality!]!
    getMunicipalityByRegion(region_name: String!): [Municipality!]!
    getMunicipalityByCode(municipality_code: String!): Municipality
    getMunicipalityByLocation(municipality_location: LocationInput!): Municipality
    getMunicipalityByEmail(user_email: String!): Municipality
    getMunicipalityByPhone(user_phone: String!): Municipality
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createMunicipality(input: CreateMunicipalityInput!): Municipality!
    updateMunicipality(municipality_id: ID!, input: UpdateMunicipalityInput!): Municipality
    deactivateMunicipality(municipality_id: ID!): Boolean!
  }
`;