// src/api/graphql/schema/resident.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Resident operations.
 * It includes resident types, location structures, input types,
 * and all related queries and mutations.
 */

export const residentTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents a Resident entity
  # PRE-CONDITIONS:
  # - Resident must exist in the system
  # POST-CONDITIONS:
  # - Provides structured resident data
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

  # Input structure for geographic location
  # PRE-CONDITIONS:
  # - longitude and latitude must be provided
  # POST-CONDITIONS:
  # - Used for spatial operations
  input LocationInput {
    longitude: Float!
    latitude: Float!
  }

  # Represents a geographic location
  # PRE-CONDITIONS:
  # - Values may exist depending on context
  # POST-CONDITIONS:
  # - Returns longitude and latitude
  type Location {
    longitude: Float
    latitude: Float
  }

  # Input structure for creating a resident
  # PRE-CONDITIONS:
  # - Required user and resident fields must be provided
  # POST-CONDITIONS:
  # - Used to create resident and associated user
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

  # Input structure for updating a resident
  # PRE-CONDITIONS:
  # - At least one field must be provided
  # POST-CONDITIONS:
  # - Updates resident data
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
    # Retrieve all residents
    # PRE-CONDITIONS:
    # - Resident data must exist
    # POST-CONDITIONS:
    # - Returns list of residents
    getAllResidents: [Resident!]!

    # Retrieve resident by ID
    # PRE-CONDITIONS:
    # - resident_id must be provided
    # POST-CONDITIONS:
    # - Returns resident if found
    getResidentById(resident_id: ID!): Resident

    # Retrieve residents by first name
    # PRE-CONDITIONS:
    # - resident_fname must be provided
    # POST-CONDITIONS:
    # - Returns filtered residents
    getResidentsByFName(resident_fname: String!): [Resident!]!

    # Retrieve residents by last name
    # PRE-CONDITIONS:
    # - resident_lname must be provided
    # POST-CONDITIONS:
    # - Returns filtered residents
    getResidentsByLName(resident_lname: String!): [Resident!]!

    # Retrieve resident by ID number
    # PRE-CONDITIONS:
    # - resident_idnb must be provided
    # POST-CONDITIONS:
    # - Returns resident if found
    getResidentByIdNb(resident_idnb: String!): Resident

    # Retrieve residents by last known location
    # PRE-CONDITIONS:
    # - last_known_location must be provided
    # POST-CONDITIONS:
    # - Returns filtered residents
    getResidentsByLastKnownLocation(last_known_location: LocationInput!): [Resident!]!

    # Retrieve resident by email
    # PRE-CONDITIONS:
    # - user_email must be provided
    # POST-CONDITIONS:
    # - Returns resident if found
    getResidentByEmail(user_email: String!): Resident

    # Retrieve resident by phone
    # PRE-CONDITIONS:
    # - user_phone must be provided
    # POST-CONDITIONS:
    # - Returns resident if found
    getResidentByPhone(user_phone: String!): Resident
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new resident
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created resident
    createResident(input: CreateResidentInput!): Resident!

    # Update resident
    # PRE-CONDITIONS:
    # - resident_id must be provided
    # POST-CONDITIONS:
    # - Returns updated resident
    updateResident(resident_id: ID!, input: UpdateResidentInput!): Resident

    # Deactivate resident
    # PRE-CONDITIONS:
    # - resident_id must be provided
    # POST-CONDITIONS:
    # - Returns true if successful
    deactivateResident(resident_id: ID!): Boolean!
  }
`;