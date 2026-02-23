// src/api/graphql/resolvers/fireAssignment.resolver.js

export const fireAssignmentResolvers = {
  Query: {
    // Fetch all assignments
    getAllAssignments: async (_, __, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.getAllAssignments();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllAssignments: ${err.message}`);
      }
    },

    // Fetch assignment by ID
    getAssignmentById: async (_, { assignment_id }, { dataSources }) => {
      try {
        const assignment = await dataSources.fireAssignmentService.getAssignmentById(assignment_id);
        if (!assignment) throw new Error(`Assignment with ID ${assignment_id} not found`);
        return assignment;
      } catch (err) {
        throw new Error(`GraphQL Error - getAssignmentById: ${err.message}`);
      }
    },

    // Fetch assignments by fire ID
    getAssignmentsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.getAssignmentsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getAssignmentsByFireId: ${err.message}`);
      }
    },

    // Fetch assignments by responder ID
    getAssignmentsByResponderId: async (_, { responder_id }, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.getAssignmentsByResponderId(responder_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getAssignmentsByResponderId: ${err.message}`);
      }
    },

    // Fetch active assignments
    getActiveAssignments: async (_, __, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.getActiveAssignments();
      } catch (err) {
        throw new Error(`GraphQL Error - getActiveAssignments: ${err.message}`);
      }
    },

    // Count assignments with filters
    countAssignments: async (_, { filters }, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.countAssignments(filters);
      } catch (err) {
        throw new Error(`GraphQL Error - countAssignments: ${err.message}`);
      }
    },

    // Count assignments by fire
    countAssignmentsByFire: async (_, { fire_id }, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.countAssignmentsByFire(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - countAssignmentsByFire: ${err.message}`);
      }
    },

    // Count assignments by responder
    countAssignmentsByResponder: async (_, { responder_id }, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.countAssignmentsByResponder(responder_id);
      } catch (err) {
        throw new Error(`GraphQL Error - countAssignmentsByResponder: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Create a new assignment
    createAssignment: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.fireAssignmentService.createAssignment(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createAssignment: ${err.message}`);
      }
    },

    // Update assignment status
    updateAssignmentStatus: async (_, { input }, { dataSources }) => { 
      try { 
        const updated = await dataSources.fireAssignmentService.updateAssignmentStatus( input.assignment_id, input.status );
        if (!updated) 
          throw new Error(`Assignment with ID ${input.assignment_id} not found`); 
        return updated; 
      } catch (err) { 
        throw new Error(`GraphQL Error - updateAssignmentStatus: ${err.message}`); 
      } 
    },

    // Delete assignment
    deleteAssignment: async (_, { assignment_id }, { dataSources }) => {
      try {
        const result = await dataSources.fireAssignmentService.deleteAssignment(assignment_id);
        if (!result) throw new Error(`Failed to delete assignment with ID ${assignment_id}`);
        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deleteAssignment: ${err.message}`);
      }
    },
  },
};
