// src/api/graphql/schema/admin.schema.js

import gql from 'graphql-tag';

export const adminTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type Admin {
    admin_id: ID!
    admin_fname: String!
    admin_lname: String!
    user: User!
  }

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
    getAllAdmins: [Admin!]!
    getAdminById(admin_id: ID!): Admin
    getAdminByFName(admin_fname: String!): Admin
    getAdminByLName(admin_lname: String!): Admin
    getAdminByEmail(user_email: String!): Admin
    getAdminByPhone(user_phone: String!): Admin
    getAdminsByCreationDate(created_at: String!): [Admin!]!
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createAdmin(input: CreateAdminInput!): Admin!
    deactivateAdmin(admin_id: ID!): Boolean!
  }
`;
