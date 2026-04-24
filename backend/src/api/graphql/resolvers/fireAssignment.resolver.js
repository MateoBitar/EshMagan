// src/api/graphql/resolvers/fireAssignment.resolver.js

/**
 * This file defines the GraphQL resolvers for Fire Assignment operations.
 * It handles both Query and Mutation requests and communicates with
 * fireAssignmentService through dataSources to manage assignments
 * between responders and fires.
 * 
 * The resolver acts as an intermediary between the GraphQL schema
 * and the backend service layer.
 */

export const fireAssignmentResolvers = {
  Query: {
    /**
     * Retrieves all fire assignments.
     * 
     * PRE-CONDITIONS:
     * - dataSources.fireAssignmentService must be available
     * 
     * POST-CONDITIONS:
     * - Returns an array of assignments
     * - Throws error if retrieval fails
     */
    // Fetch all assignments
    getAllAssignments: async (_, __, { dataSources }) => {
      try {
        // Fetch all assignments from service
        return await dataSources.fireAssignmentService.getAllAssignments();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllAssignments: ${err.message}`);
      }
    },

    /**
     * Retrieves a specific assignment by its ID.
     * 
     * PRE-CONDITIONS:
     * - assignment_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns assignment if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch assignment by ID
    getAssignmentById: async (_, { assignment_id }, { dataSources }) => {
      try {
        // Fetch assignment by ID
        const assignment = await dataSources.fireAssignmentService.getAssignmentById(assignment_id);

        // Validate existence
        if (!assignment) throw new Error(`Assignment with ID ${assignment_id} not found`);

        return assignment;
      } catch (err) {
        throw new Error(`GraphQL Error - getAssignmentById: ${err.message}`);
      }
    },

    /**
     * Retrieves assignments associated with a specific fire.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of assignments
     * - Throws error if retrieval fails
     */
    // Fetch assignments by fire ID
    getAssignmentsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        // Fetch assignments by fire ID
        return await dataSources.fireAssignmentService.getAssignmentsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getAssignmentsByFireId: ${err.message}`);
      }
    },

    /**
     * Retrieves assignments associated with a specific responder.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of assignments
     * - Throws error if retrieval fails
     */
    // Fetch assignments by responder ID
    getAssignmentsByResponderId: async (_, { responder_id }, { dataSources }) => {
      try {
        // Fetch assignments by responder ID
        return await dataSources.fireAssignmentService.getAssignmentsByResponderId(responder_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getAssignmentsByResponderId: ${err.message}`);
      }
    },

    /**
     * Retrieves all active assignments.
     * 
     * PRE-CONDITIONS:
     * - fireAssignmentService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of active assignments
     * - Throws error if retrieval fails
     */
    // Fetch active assignments
    getActiveAssignments: async (_, __, { dataSources }) => {
      try {
        // Fetch active assignments
        return await dataSources.fireAssignmentService.getActiveAssignments();
      } catch (err) {
        throw new Error(`GraphQL Error - getActiveAssignments: ${err.message}`);
      }
    },

    /**
     * Counts assignments based on provided filters.
     * 
     * PRE-CONDITIONS:
     * - filters object must be provided
     * 
     * POST-CONDITIONS:
     * - Returns count of assignments
     * - Throws error if operation fails
     */
    // Count assignments with filters
    countAssignments: async (_, { filters }, { dataSources }) => {
      try {
        // Count assignments using filters
        return await dataSources.fireAssignmentService.countAssignments(filters);
      } catch (err) {
        throw new Error(`GraphQL Error - countAssignments: ${err.message}`);
      }
    },

    /**
     * Counts assignments for a specific fire.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns count of assignments
     * - Throws error if operation fails
     */
    // Count assignments by fire
    countAssignmentsByFire: async (_, { fire_id }, { dataSources }) => {
      try {
        // Count assignments by fire ID
        return await dataSources.fireAssignmentService.countAssignmentsByFire(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - countAssignmentsByFire: ${err.message}`);
      }
    },

    /**
     * Counts assignments for a specific responder.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns count of assignments
     * - Throws error if operation fails
     */
    // Count assignments by responder
    countAssignmentsByResponder: async (_, { responder_id }, { dataSources }) => {
      try {
        // Count assignments by responder ID
        return await dataSources.fireAssignmentService.countAssignmentsByResponder(responder_id);
      } catch (err) {
        throw new Error(`GraphQL Error - countAssignmentsByResponder: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Creates a new fire assignment.
     * 
     * PRE-CONDITIONS:
     * - input must contain valid assignment data
     * 
     * POST-CONDITIONS:
     * - Returns created assignment
     * - Throws error if creation fails
     */
    // Create a new assignment
    createAssignment: async (_, { input }, { dataSources }) => {
      try {
        // Create assignment
        return await dataSources.fireAssignmentService.createAssignment(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createAssignment: ${err.message}`);
      }
    },

    /**
     * Updates the status of an assignment.
     * 
     * PRE-CONDITIONS:
     * - input.assignment_id and input.status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated assignment
     * - Throws error if assignment not found or update fails
     */
    // Update assignment status
    updateAssignmentStatus: async (_, { input }, { dataSources }) => { 
      try { 
        // Update assignment status
        const updated = await dataSources.fireAssignmentService.updateAssignmentStatus( input.assignment_id, input.status );

        // Validate update
        if (!updated) 
          throw new Error(`Assignment with ID ${input.assignment_id} not found`); 

        return updated; 
      } catch (err) { 
        throw new Error(`GraphQL Error - updateAssignmentStatus: ${err.message}`); 
      } 
    },

    /**
     * Deletes an assignment by ID.
     * 
     * PRE-CONDITIONS:
     * - assignment_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns deletion result
     * - Throws error if deletion fails
     */
    // Delete assignment
    deleteAssignment: async (_, { assignment_id }, { dataSources }) => {
      try {
        // Delete assignment
        const result = await dataSources.fireAssignmentService.deleteAssignment(assignment_id);

        // Validate deletion
        if (!result) throw new Error(`Failed to delete assignment with ID ${assignment_id}`);

        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deleteAssignment: ${err.message}`);
      }
    },
  },
};