// src/api/graphql/schema/user.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for User operations.
 * It includes user types, input structures, queries, mutations,
 * and supporting inputs for filtering and pagination.
 */

export const userTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents a User entity
  # PRE-CONDITIONS:
  # - User must exist in the system
  # POST-CONDITIONS:
  # - Provides structured user data
  type User {
    user_id: ID!
    user_email: String!
    user_phone: String
    user_role: String!
    isactive: Boolean!
    created_at: String
    updated_at: String
    last_login: String
  }

  # -----------------------------
  # Input Types
  # -----------------------------

  # Input structure for creating a user
  # PRE-CONDITIONS:
  # - Required fields must be provided
  # POST-CONDITIONS:
  # - Used to create a new user
  input CreateUserInput {
    user_email: String!
    user_password: String!
    user_phone: String
    user_role: String!
  }

  # Input structure for updating a user
  # PRE-CONDITIONS:
  # - At least one field must be provided
  # POST-CONDITIONS:
  # - Updates user data
  input UpdateUserInput {
    user_email: String
    user_phone: String
    user_role: String
    isactive: Boolean
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all users
    # PRE-CONDITIONS:
    # - User data must exist
    # POST-CONDITIONS:
    # - Returns list of users
    getAllUsers: [User!]!

    # Retrieve user by ID
    # PRE-CONDITIONS:
    # - user_id must be provided
    # POST-CONDITIONS:
    # - Returns user if found
    getUserById(user_id: ID!): User

    # Retrieve user by email
    # PRE-CONDITIONS:
    # - user_email must be provided
    # POST-CONDITIONS:
    # - Returns user if found
    getUserByEmail(user_email: String!): User

    # Retrieve user by phone
    # PRE-CONDITIONS:
    # - user_phone must be provided
    # POST-CONDITIONS:
    # - Returns user if found
    getUserByPhone(user_phone: String!): User

    # Retrieve users by role
    # PRE-CONDITIONS:
    # - user_role must be provided
    # POST-CONDITIONS:
    # - Returns filtered users
    getUsersByRole(user_role: String!): [User!]!

    # Retrieve active users
    # PRE-CONDITIONS:
    # - User data must exist
    # POST-CONDITIONS:
    # - Returns active users
    getActiveUsers: [User!]!

    # Retrieve inactive users
    # PRE-CONDITIONS:
    # - User data must exist
    # POST-CONDITIONS:
    # - Returns inactive users
    getInActiveUsers: [User!]!

    # Retrieve active user by email
    # PRE-CONDITIONS:
    # - user_email must be provided
    # POST-CONDITIONS:
    # - Returns user if found
    getUserByEmailAndActive(user_email: String!): User

    # Filter users with pagination
    # PRE-CONDITIONS:
    # - filters and pagination may be provided
    # POST-CONDITIONS:
    # - Returns filtered users
    filterUsers(filters: UserFilterInput, pagination: PaginationInput): [User!]!

    # Count users based on filters
    # PRE-CONDITIONS:
    # - filters may be provided
    # POST-CONDITIONS:
    # - Returns count
    countUsers(filters: UserFilterInput): Int!
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new user
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created user
    createUser(input: CreateUserInput!): User!

    # Update user
    # PRE-CONDITIONS:
    # - user_id must be provided
    # POST-CONDITIONS:
    # - Returns updated user
    updateUser(user_id: ID!, input: UpdateUserInput!): User

    # Update user role
    # PRE-CONDITIONS:
    # - user_id and user_role must be provided
    # POST-CONDITIONS:
    # - Returns updated user
    updateUserRole(user_id: ID!, user_role: String!): User

    # Update user status
    # PRE-CONDITIONS:
    # - user_id and user_status must be provided
    # POST-CONDITIONS:
    # - Returns updated user
    updateUserStatus(user_id: ID!, user_status: Boolean!): User

    # Deactivate user
    # PRE-CONDITIONS:
    # - user_id must be provided
    # POST-CONDITIONS:
    # - Returns true if successful
    deactivateUser(user_id: ID!): Boolean!

    # Save FCM token for notifications
    # PRE-CONDITIONS:
    # - user_id and fcm_token must be provided
    # POST-CONDITIONS:
    # - Returns updated user
    saveFcmToken(user_id: String!, fcm_token: String!): User

    # Clear FCM token
    # PRE-CONDITIONS:
    # - user_id must be provided
    # POST-CONDITIONS:
    # - Returns true if cleared
    clearFcmToken(user_id: String!): Boolean
  }

  # -----------------------------
  # Supporting Inputs
  # -----------------------------

  # Filter structure for users
  # PRE-CONDITIONS:
  # - Optional fields may be provided
  # POST-CONDITIONS:
  # - Used to refine queries
  input UserFilterInput {
    role: String
    isactive: Boolean
  }

  # Pagination structure
  # PRE-CONDITIONS:
  # - limit and offset may be provided
  # POST-CONDITIONS:
  # - Controls query result size
  input PaginationInput {
    limit: Int = 10
    offset: Int = 0
  }
`;