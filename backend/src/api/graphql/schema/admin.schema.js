// src/api/graphql/schema/admin.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema (type definitions) for Admin.
 * It includes Admin types, related User type, input structures,
 * and all queries and mutations related to admin operations.
 */

export const adminTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents an Admin entity in the system
  # PRE-CONDITIONS:
  # - Admin data must exist in the system
  # POST-CONDITIONS:
  # - Provides structured Admin data for queries
  type Admin {
    admin_id: ID!
    admin_fname: String!
    admin_lname: String!
    user: User!
  }

  # Represents a User entity associated with Admin
  # PRE-CONDITIONS:
  # - User must exist and be linked to an Admin
  # POST-CONDITIONS:
  # - Provides user-related information
  type User {
    user_id: ID!
    user_email: String!
    user_phone: String
    user_role: String!
    isactive: Boolean!
    created_at: String
  }

  # -----------------------------
  # Input Types
  # -----------------------------

  # Input structure for creating a new Admin
  # PRE-CONDITIONS:
  # - Required fields must be provided (email, password, name)
  # POST-CONDITIONS:
  # - Used to create a new Admin and associated User
  input CreateAdminInput {
    user_email: String!
    user_password: String!
    user_phone: String
    admin_fname: String!
    admin_lname: String!
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all admins
    # PRE-CONDITIONS:
    # - Admin data must exist
    # POST-CONDITIONS:
    # - Returns list of admins
    getAllAdmins: [Admin!]!

    # Retrieve admin by ID
    # PRE-CONDITIONS:
    # - admin_id must be provided
    # POST-CONDITIONS:
    # - Returns admin if found
    getAdminById(admin_id: ID!): Admin

    # Retrieve admin by first name
    # PRE-CONDITIONS:
    # - admin_fname must be provided
    # POST-CONDITIONS:
    # - Returns admin if found
    getAdminByFName(admin_fname: String!): Admin

    # Retrieve admin by last name
    # PRE-CONDITIONS:
    # - admin_lname must be provided
    # POST-CONDITIONS:
    # - Returns admin if found
    getAdminByLName(admin_lname: String!): Admin

    # Retrieve admin by email
    # PRE-CONDITIONS:
    # - user_email must be provided
    # POST-CONDITIONS:
    # - Returns admin if found
    getAdminByEmail(user_email: String!): Admin

    # Retrieve admin by phone
    # PRE-CONDITIONS:
    # - user_phone must be provided
    # POST-CONDITIONS:
    # - Returns admin if found
    getAdminByPhone(user_phone: String!): Admin

    # Retrieve admins by creation date
    # PRE-CONDITIONS:
    # - created_at must be provided
    # POST-CONDITIONS:
    # - Returns list of admins
    getAdminsByCreationDate(created_at: String!): [Admin!]!
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new admin
    # PRE-CONDITIONS:
    # - input must contain valid data
    # POST-CONDITIONS:
    # - Returns created admin
    createAdmin(input: CreateAdminInput!): Admin!

    # Deactivate an admin
    # PRE-CONDITIONS:
    # - admin_id must be provided
    # POST-CONDITIONS:
    # - Returns true if successful
    deactivateAdmin(admin_id: ID!): Boolean!
  }
`;