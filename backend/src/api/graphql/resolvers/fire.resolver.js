// src/api/graphql/resolvers/fire.resolver.js

export const fireResolvers = {
  Query: {
    // Fetch all fires
    getAllFires: async (_, __, { dataSources }) => {
      try {
        return await dataSources.fireService.getAllFires();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllFires: ${err.message}`);
      }
    },

    // Fetch fire by ID
    getFireById: async (_, { fire_id }, { dataSources }) => {
      try {
        const fire = await dataSources.fireService.getFireById(fire_id);
        if (!fire) throw new Error(`Fire with ID ${fire_id} not found`);
        return fire;
      } catch (err) {
        throw new Error(`GraphQL Error - getFireById: ${err.message}`);
      }
    },

    // Fetch active fires
    getActiveFires: async (_, __, { dataSources }) => {
      try {
        return await dataSources.fireService.getActiveFires();
      } catch (err) {
        throw new Error(`GraphQL Error - getActiveFires: ${err.message}`);
      }
    },

    // Fetch fires by verification status
    getFiresByStatus: async (_, { fire_status }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFiresByStatus(fire_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByStatus: ${err.message}`);
      }
    },

    // Fetch fires by municipality
    getFiresByMunicipality: async (_, { municipality_id }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFiresByMunicipality(municipality_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByMunicipality: ${err.message}`);
      }
    },

    // Fetch fires within a radius
    getFiresRadius: async (_, { lat, lng, radiusMeters }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFiresRadius(lat, lng, radiusMeters);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresRadius: ${err.message}`);
      }
    },

    // Fetch fires within a polygon
    getFiresWithinPolygon: async (_, { polygonGeoJSON }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFiresWithinPolygon(polygonGeoJSON);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresWithinPolygon: ${err.message}`);
      }
    },

    // Fetch recent fires
    getRecentFires: async (_, { limit }, { dataSources }) => {
      try {
        return await dataSources.fireService.getRecentFires(limit);
      } catch (err) {
        throw new Error(`GraphQL Error - getRecentFires: ${err.message}`);
      }
    },

    // Fetch fires by date range
    getFiresByDate: async (_, { startDate, endDate }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFiresByDate(startDate, endDate);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByDate: ${err.message}`);
      }
    },

    // Fetch fire statistics
    getFireStatistics: async (_, { startDate, endDate }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFireStatistics(startDate, endDate);
      } catch (err) {
        throw new Error(`GraphQL Error - getFireStatistics: ${err.message}`);
      }
    },

    // Fetch fires by location and time
    getFiresByLocationAndTime: async (_, { lat, lng, startDate, endDate, radiusMeters }, { dataSources }) => {
      try {
        return await dataSources.fireService.getFireByLocationAndTime(lat, lng, startDate, endDate, radiusMeters);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByLocationAndTime: ${err.message}`);
      }
    },

    // Count fires with filters
    countFires: async (_, { filters }, { dataSources }) => {
      try {
        return await dataSources.fireService.countFires(filters);
      } catch (err) {
        throw new Error(`GraphQL Error - countFires: ${err.message}`);
      }
    },

    // Find residents near fire
    findResidentsNearFire: async (_, { fire_id, radiusMeters }, { dataSources }) => {
      try {
        return await dataSources.fireService.findResidentsNearFire(fire_id, radiusMeters);
      } catch (err) {
        throw new Error(`GraphQL Error - findResidentsNearFire: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Create a new fire
    createFire: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.fireService.createFire(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createFire: ${err.message}`);
      }
    },

    // Create fire and trigger full system orchestration 
    createFireAndTriggerSystem: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.fireService.createFireAndTriggerSystem(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createFireAndTriggerSystem: ${err.message}`);
      }
    },

    // Update fire
    updateFire: async (_, { fire_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.fireService.updateFire(fire_id, input);
        if (!updated) throw new Error(`Fire with ID ${fire_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateFire: ${err.message}`);
      }
    },

    // Update fire status
    updateFireStatus: async (_, { fire_id, fire_status }, { dataSources }) => {
      try {
        const updated = await dataSources.fireService.updateFireStatus(fire_id, fire_status);
        if (!updated) throw new Error(`Fire with ID ${fire_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateFireStatus: ${err.message}`);
      }
    },

    // Update fire severity
    updateFireSeverity: async (_, { fire_id, severityLevel }, { dataSources }) => {
      try {
        const updated = await dataSources.fireService.updateFireSeverity(fire_id, severityLevel);
        if (!updated) throw new Error(`Fire with ID ${fire_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateFireSeverity: ${err.message}`);
      }
    },

    // Update fire spread prediction
    updateFireSpreadPrediction: async (_, { fire_id, spreadPrediction }, { dataSources }) => {
      try {
        const updated = await dataSources.fireService.updateFireSpreadPrediction(fire_id, spreadPrediction);
        if (!updated) throw new Error(`Fire with ID ${fire_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateFireSpreadPrediction: ${err.message}`);
      }
    },

    // Delete fire
    deleteFire: async (_, { fire_id }, { dataSources }) => {
      try {
        const result = await dataSources.fireService.deleteFire(fire_id);
        if (!result) throw new Error(`Failed to delete fire with ID ${fire_id}`);
        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deleteFire: ${err.message}`);
      }
    },

    // Verify fire
    verifyFire: async (_, { fire_id }, { dataSources }) => {
      try {
        const fire = await dataSources.fireService.verifyFire(fire_id);
        if (!fire) throw new Error(`Fire with ID ${fire_id} not found`);
        return fire;
      } catch (err) {
        throw new Error(`GraphQL Error - verifyFire: ${err.message}`);
      }
    },

    // Extinguish fire
    extinguishFire: async (_, { fire_id }, { dataSources }) => {
      try {
        const fire = await dataSources.fireService.extinguishFire(fire_id);
        if (!fire) throw new Error(`Fire with ID ${fire_id} not found`);
        return fire;
      } catch (err) {
        throw new Error(`GraphQL Error - extinguishFire: ${err.message}`);
      }
    },

    // Dispatch closest responder
    dispatchClosestResponder: async (_, { fire_id }, { dataSources }) => {
      try {
        const assignment = await dataSources.fireService.dispatchClosestResponder(fire_id);
        if (!assignment) throw new Error(`Failed to dispatch responder for fire ${fire_id}`);
        return assignment;
      } catch (err) {
        throw new Error(`GraphQL Error - dispatchClosestResponder: ${err.message}`);
      }
    },
  },
};
