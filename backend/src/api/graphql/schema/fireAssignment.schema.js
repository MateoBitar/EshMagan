// src/api/graphql/schema/fireAssignment.schema.js

import gql from 'graphql-tag';

export const fireAssignmentTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------
  type FireAssignment {
    assignment_id: ID!
    assignment_status: String!
    fire_id: ID!
    responder_id: ID!
    assigned_at: String
  }

  # -----------------------------
  # Input Types
  # -----------------------------
  input CreateFireAssignmentInput {
    assignment_status: String!
    fire_id: ID!
    responder_id: ID!
  }

  input UpdateFireAssignmentStatusInput {
    assignment_id: ID!
    status: String!
  }

  # -----------------------------
  # Queries
  # -----------------------------
  extend type Query {
    getAllAssignments: [FireAssignment!]!
    getAssignmentById(assignment_id: ID!): FireAssignment
    getAssignmentsByFireId(fire_id: ID!): [FireAssignment!]!
    getAssignmentsByResponderId(responder_id: ID!): [FireAssignment!]!
    getActiveAssignments: [FireAssignment!]!
    countAssignments(filters: FireAssignmentFilterInput): Int!
    countAssignmentsByFire(fire_id: ID!): Int!
    countAssignmentsByResponder(responder_id: ID!): Int!
  }

  # -----------------------------
  # Mutations
  # -----------------------------
  extend type Mutation {
    createAssignment(input: CreateFireAssignmentInput!): FireAssignment!
    updateAssignmentStatus(input: UpdateFireAssignmentStatusInput!): FireAssignment
    deleteAssignment(assignment_id: ID!): Boolean!
  }

  # -----------------------------
  # Supporting Inputs
  # -----------------------------
  input FireAssignmentFilterInput {
    fire_id: ID
    responder_id: ID
    assignment_status: String
  }
`;
