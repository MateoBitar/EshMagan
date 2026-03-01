// src/api/graphql/schema/resident.schema.js

import gql from 'graphql-tag';

export const residentTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type Resident {
    resident_id: ID!
    resident_fname: String!
    resident_lname: String!
    resident_dob: String!
    resident_idnb: String!
    resident_idpic: String!
    home_location: Location
    work_location: Location
    last_known_location: Location!
    updated_at: String
    user: User!
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input LocationInput {
    longitude: Float!
    latitude: Float!
  }

  type Location {
    longitude: Float
    latitude: Float
  }

  input CreateResidentInput {
    user_email: String!
    user_password: String!
    user_phone: String
    resident_fname: String!
    resident_lname: String!
    resident_dob: String!
    resident_idnb: String!
    resident_idpic: String!
    home_location: LocationInput
    work_location: LocationInput
    last_known_location: LocationInput!
  }

  input UpdateResidentInput {
    resident_fname: String
    resident_lname: String
    resident_dob: String
    resident_idnb: String
    resident_idpic: String
    home_location: LocationInput
    work_location: LocationInput
    last_known_location: LocationInput
    user_email: String
    user_phone: String
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllResidents: [Resident!]!
    getResidentById(resident_id: ID!): Resident
    getResidentsByFName(resident_fname: String!): [Resident!]!
    getResidentsByLName(resident_lname: String!): [Resident!]!
    getResidentByIdNb(resident_idnb: String!): Resident
    getResidentsByLastKnownLocation(last_known_location: LocationInput!): [Resident!]!
    getResidentByEmail(user_email: String!): Resident
    getResidentByPhone(user_phone: String!): Resident
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createResident(input: CreateResidentInput!): Resident!
    updateResident(resident_id: ID!, input: UpdateResidentInput!): Resident
    deactivateResident(resident_id: ID!): Boolean!
  }
`;