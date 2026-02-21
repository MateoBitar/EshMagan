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
    municipality_location: String!
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
  input CreateMunicipalityInput {
    user_email: String!
    user_password: String!
    user_phone: String
    municipality_name: String!
    region_name: String!
    municipality_code: String!
    municipality_location: String!
  }

  input UpdateMunicipalityInput {
    municipality_name: String
    region_name: String
    municipality_code: String
    municipality_location: String
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
    getMunicipalityByLocation(municipality_location: String!): Municipality
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
