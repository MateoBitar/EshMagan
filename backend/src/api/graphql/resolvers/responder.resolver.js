// src/api/graphql/resolvers/responder.resolver.js

export const responderResolvers = {
  Query: {
    // Fetch all responders
    getAllResponders: async (_, __, { dataSources }) => {
      try {
        return await dataSources.responderService.getAllResponders();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllResponders: ${err.message}`);
      }
    },

    // Fetch responder by ID
    getResponderById: async (_, { responder_id }, { dataSources }) => {
      try {
        const responder = await dataSources.responderService.getResponderById(responder_id);
        if (!responder) throw new Error(`Responder with ID ${responder_id} not found`);
        return responder;
      } catch (err) {
        throw new Error(`GraphQL Error - getResponderById: ${err.message}`);
      }
    },

    // Fetch responders by unit number
    getRespondersByUnitNb: async (_, { unit_nb }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByUnitNb(unit_nb);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByUnitNb: ${err.message}`);
      }
    },

    // Fetch responders by unit location
    getRespondersByUnitLocation: async (_, { unit_location }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByUnitLocation(unit_location);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByUnitLocation: ${err.message}`);
      }
    },

    // Fetch responders by assigned region
    getRespondersByAssignedRegion: async (_, { assigned_region }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByAssignedRegion(assigned_region);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByAssignedRegion: ${err.message}`);
      }
    },

    // Fetch responders by status
    getRespondersByResponderStatus: async (_, { responder_status }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByResponderStatus(responder_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByResponderStatus: ${err.message}`);
      }
    },

    // Fetch responders by last known location
    getRespondersByLastKnownLocation: async (_, { last_known_location }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByLastKnownLocation(last_known_location);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByLastKnownLocation: ${err.message}`);
      }
    },

    // Fetch responder by email
    getResponderByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        const responder = await dataSources.responderService.getResponderByEmail(user_email);
        if (!responder) throw new Error(`Responder with email ${user_email} not found`);
        return responder;
      } catch (err) {
        throw new Error(`GraphQL Error - getResponderByEmail: ${err.message}`);
      }
    },

    // Fetch responder by phone
    getResponderByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        const responder = await dataSources.responderService.getResponderByPhone(user_phone);
        if (!responder) throw new Error(`Responder with phone ${user_phone} not found`);
        return responder;
      } catch (err) {
        throw new Error(`GraphQL Error - getResponderByPhone: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Create a new responder
    createResponder: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.responderService.createResponder(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createResponder: ${err.message}`);
      }
    },

    // Update responder details
    updateResponder: async (_, { responder_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.responderService.updateResponder(responder_id, input);
        if (!updated) throw new Error(`Responder with ID ${responder_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateResponder: ${err.message}`);
      }
    },

    // Deactivate a responder
    deactivateResponder: async (_, { responder_id }, { dataSources }) => {
      try {
        const result = await dataSources.responderService.deactivateResponder(responder_id);
        if (!result) throw new Error(`Failed to deactivate responder with ID ${responder_id}`);
        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateResponder: ${err.message}`);
      }
    },
  },
};
