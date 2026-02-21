// src/api/graphql/resolvers/evacuation.resolver.js

export const evacuationResolvers = {
  Query: {
    // Fetch all evacuation routes
    getAllEvacuations: async (_, __, { dataSources }) => {
      try {
        return await dataSources.evacuationService.getAllEvacuations();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllEvacuations: ${err.message}`);
      }
    },

    // Fetch evacuation route by ID
    getEvacuationById: async (_, { route_id }, { dataSources }) => {
      try {
        const evacuation = await dataSources.evacuationService.getEvacuationById(route_id);
        if (!evacuation) throw new Error(`Evacuation route with ID ${route_id} not found`);
        return evacuation;
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationById: ${err.message}`);
      }
    },

    // Fetch evacuation routes by status
    getEvacuationsByStatus: async (_, { route_status }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.getEvacuationsByStatus(route_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByStatus: ${err.message}`);
      }
    },

    // Fetch evacuation routes by priority
    getEvacuationsByPriority: async (_, { route_priority }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.getEvacuationsByPriority(route_priority);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByPriority: ${err.message}`);
      }
    },

    // Fetch evacuation routes by safe zone
    getEvacuationsByZone: async (_, { safe_zone }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.getEvacuationsByZone(safe_zone);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByZone: ${err.message}`);
      }
    },

    // Fetch evacuation routes by fire ID
    getEvacuationsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.getEvacuationsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByFireId: ${err.message}`);
      }
    },

    // Fetch nearest evacuation route
    getNearestEvacuation: async (_, { latitude, longitude }, { dataSources }) => {
      try {
        const evacuation = await dataSources.evacuationService.getNearestEvacuation(latitude, longitude);
        if (!evacuation) throw new Error(`No evacuation route found near (${latitude}, ${longitude})`);
        return evacuation;
      } catch (err) {
        throw new Error(`GraphQL Error - getNearestEvacuation: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Create a new evacuation route
    createEvacuation: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.createEvacuation(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createEvacuation: ${err.message}`);
      }
    },

    // Update evacuation route status
    updateEvacuationStatus: async (_, { route_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.evacuationService.updateEvacuationStatus(route_id, input.new_status);
        if (!updated) throw new Error(`Evacuation route with ID ${route_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateEvacuationStatus: ${err.message}`);
      }
    },

    // Update evacuation route priority
    updateEvacuationPriority: async (_, { route_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.evacuationService.updateEvacuationPriority(route_id, input.new_priority);
        if (!updated) throw new Error(`Evacuation route with ID ${route_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateEvacuationPriority: ${err.message}`);
      }
    },

    // Update evacuation route geometry
    updateEvacuationGeometry: async (_, { route_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.evacuationService.updateEvacuationGeometry(
          route_id,
          input.new_route_path,
          input.new_safe_zone
        );
        if (!updated) throw new Error(`Evacuation route with ID ${route_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateEvacuationGeometry: ${err.message}`);
      }
    },

    // Delete evacuation route by ID
    deleteEvacuation: async (_, { route_id }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.deleteEvacuation(route_id);
      } catch (err) {
        throw new Error(`GraphQL Error - deleteEvacuation: ${err.message}`);
      }
    },

    // Delete evacuation routes by fire ID
    deleteEvacuationsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        return await dataSources.evacuationService.deleteEvacuationsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - deleteEvacuationsByFireId: ${err.message}`);
      }
    },
  },
};
