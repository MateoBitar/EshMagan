// src/api/graphql/schema/fireAssignment.schema.js

import gql from 'graphql-tag';

/**
 * This file defines the GraphQL schema for Fire Assignment operations.
 * It includes types, input structures, queries, mutations,
 * and filtering options related to assignments between fires and responders.
 */

export const fireAssignmentTypeDefs = gql`
  # -----------------------------
  # Types
  # -----------------------------

  # Represents a Fire Assignment entity
  # PRE-CONDITIONS:
  # - Assignment must exist in the system
  # POST-CONDITIONS:
  # - Provides structured assignment data
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

  # Input structure for creating a fire assignment
  # PRE-CONDITIONS:
  # - assignment_status, fire_id, responder_id must be provided
  # POST-CONDITIONS:
  # - Used to create a new assignment
  input CreateFireAssignmentInput {
    assignment_status: String!
    fire_id: ID!
    responder_id: ID!
  }

  # Input structure for updating assignment status
  # PRE-CONDITIONS:
  # - assignment_id and status must be provided
  # POST-CONDITIONS:
  # - Updates assignment status
  input UpdateFireAssignmentStatusInput {
    assignment_id: ID!
    status: String!
  }

  # -----------------------------
  # Queries
  # -----------------------------

  extend type Query {
    # Retrieve all assignments
    # PRE-CONDITIONS:
    # - Assignment data must exist
    # POST-CONDITIONS:
    # - Returns list of assignments
    getAllAssignments: [FireAssignment!]!

    # Retrieve assignment by ID
    # PRE-CONDITIONS:
    # - assignment_id must be provided
    # POST-CONDITIONS:
    # - Returns assignment if found
    getAssignmentById(assignment_id: ID!): FireAssignment

    # Retrieve assignments by fire ID
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered assignments
    getAssignmentsByFireId(fire_id: ID!): [FireAssignment!]!

    # Retrieve assignments by responder ID
    # PRE-CONDITIONS:
    # - responder_id must be provided
    # POST-CONDITIONS:
    # - Returns filtered assignments
    getAssignmentsByResponderId(responder_id: ID!): [FireAssignment!]!

    # Retrieve active assignments
    # PRE-CONDITIONS:
    # - Assignment data must exist
    # POST-CONDITIONS:
    # - Returns active assignments
    getActiveAssignments: [FireAssignment!]!

    # Count assignments using filters
    # PRE-CONDITIONS:
    # - filters may be provided
    # POST-CONDITIONS:
    # - Returns count
    countAssignments(filters: FireAssignmentFilterInput): Int!

    # Count assignments by fire
    # PRE-CONDITIONS:
    # - fire_id must be provided
    # POST-CONDITIONS:
    # - Returns count
    countAssignmentsByFire(fire_id: ID!): Int!

    # Count assignments by responder
    # PRE-CONDITIONS:
    # - responder_id must be provided
    # POST-CONDITIONS:
    # - Returns count
    countAssignmentsByResponder(responder_id: ID!): Int!
  }

  # -----------------------------
  # Mutations
  # -----------------------------

  extend type Mutation {
    # Create a new assignment
    # PRE-CONDITIONS:
    # - input must be valid
    # POST-CONDITIONS:
    # - Returns created assignment
    createAssignment(input: CreateFireAssignmentInput!): FireAssignment!

    # Update assignment status
    # PRE-CONDITIONS:
    # - input must be provided
    # POST-CONDITIONS:
    # - Returns updated assignment
    updateAssignmentStatus(input: UpdateFireAssignmentStatusInput!): FireAssignment

    # Delete assignment
    # PRE-CONDITIONS:
    # - assignment_id must be provided
    # POST-CONDITIONS:
    # - Returns true if deleted
    deleteAssignment(assignment_id: ID!): Boolean!
  }

  # -----------------------------
  # Supporting Inputs
  # -----------------------------

  # Filter structure for assignments
  # PRE-CONDITIONS:
  # - Optional filter fields may be provided
  # POST-CONDITIONS:
  # - Used to refine queries
  input FireAssignmentFilterInput {
    fire_id: ID
    responder_id: ID
    assignment_status: String
  }
`;