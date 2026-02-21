// src/api/graphql/schema/user.schema.js

import gql from 'graphql-tag';

export const userTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type User {
    user_id: ID!
    user_email: String!
    user_phone: String
    user_role: String!
    isactive: Boolean!
    created_at: String
    updated_at: String
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input CreateUserInput {
    user_email: String!
    user_password: String!
    user_phone: String
    user_role: String!
  }

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
    getAllUsers: [User!]!
    getUserById(user_id: ID!): User
    getUserByEmail(user_email: String!): User
    getUserByPhone(user_phone: String!): User
    getUsersByRole(user_role: String!): [User!]!
    getActiveUsers: [User!]!
    getInActiveUsers: [User!]!
    getUserByEmailAndActive(user_email: String!): User
    filterUsers(filters: UserFilterInput, pagination: PaginationInput): [User!]!
    countUsers(filters: UserFilterInput): Int!
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(user_id: ID!, input: UpdateUserInput!): User
    updateUserRole(user_id: ID!, user_role: String!): User
    updateUserStatus(user_id: ID!, user_status: Boolean!): User
    deactivateUser(user_id: ID!): User
  }

  # -----------------------------
  # Supporting Inputs
  # -----------------------------
  input UserFilterInput {
    role: String
    isactive: Boolean
  }

  input PaginationInput {
    limit: Int = 10
    offset: Int = 0
  }
`;
