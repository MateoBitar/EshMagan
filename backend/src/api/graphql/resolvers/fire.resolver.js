// src/api/graphql/resolvers/fire.resolver.js

/**
 * This file defines the GraphQL resolvers for Fire-related operations.
 * It handles both Query and Mutation requests and communicates with
 * fireService via dataSources to perform all fire-related logic.
 * 
 * The resolver serves as a bridge between the GraphQL schema
 * and the backend service layer.
 */

export const fireResolvers = {
  Query: {
    /**
     * Retrieves all fires in the system.
     * 
     * PRE-CONDITIONS:
     * - dataSources.fireService must be available
     * 
     * POST-CONDITIONS:
     * - Returns an array of fire objects
     * - Throws error if retrieval fails
     */
    // Fetch all fires
    getAllFires: async (_, __, { dataSources }) => {
      try {
        // Call service to fetch all fires
        return await dataSources.fireService.getAllFires();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllFires: ${err.message}`);
      }
    },

    /**
     * Retrieves a fire by its unique ID.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns fire object if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch fire by ID
    getFireById: async (_, { fire_id }, { dataSources }) => {
      try {
        // Fetch fire by ID
        const fire = await dataSources.fireService.getFireById(fire_id);

        // Validate existence
        if (!fire) throw new Error(`Fire with ID ${fire_id} not found`);

        return fire;
      } catch (err) {
        throw new Error(`GraphQL Error - getFireById: ${err.message}`);
      }
    },

    /**
     * Retrieves all currently active fires.
     * 
     * PRE-CONDITIONS:
     * - fireService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of active fires
     * - Throws error if retrieval fails
     */
    // Fetch active fires
    getActiveFires: async (_, __, { dataSources }) => {
      try {
        // Fetch active fires
        return await dataSources.fireService.getActiveFires();
      } catch (err) {
        throw new Error(`GraphQL Error - getActiveFires: ${err.message}`);
      }
    },

    /**
     * Retrieves fires filtered by status.
     * 
     * PRE-CONDITIONS:
     * - fire_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns filtered fires
     * - Throws error if retrieval fails
     */
    // Fetch fires by verification status
    getFiresByStatus: async (_, { fire_status }, { dataSources }) => {
      try {
        // Fetch fires by status
        return await dataSources.fireService.getFiresByStatus(fire_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByStatus: ${err.message}`);
      }
    },

    /**
     * Retrieves fires associated with a municipality.
     * 
     * PRE-CONDITIONS:
     * - municipality_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of fires in municipality
     * - Throws error if retrieval fails
     */
    // Fetch fires by municipality
    getFiresByMunicipality: async (_, { municipality_id }, { dataSources }) => {
      try {
        // Fetch fires by municipality
        return await dataSources.fireService.getFiresByMunicipality(municipality_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByMunicipality: ${err.message}`);
      }
    },

    /**
     * Retrieves fires within a specified radius from coordinates.
     * 
     * PRE-CONDITIONS:
     * - lat, lng, radiusMeters must be provided
     * 
     * POST-CONDITIONS:
     * - Returns fires within radius
     * - Throws error if retrieval fails
     */
    // Fetch fires within a radius
    getFiresRadius: async (_, { lat, lng, radiusMeters }, { dataSources }) => {
      try {
        // Fetch fires within radius
        return await dataSources.fireService.getFiresRadius(lat, lng, radiusMeters);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresRadius: ${err.message}`);
      }
    },

    /**
     * Retrieves fires within a given polygon area.
     * 
     * PRE-CONDITIONS:
     * - polygonGeoJSON must be provided
     * 
     * POST-CONDITIONS:
     * - Returns fires inside polygon
     * - Throws error if retrieval fails
     */
    // Fetch fires within a polygon
    getFiresWithinPolygon: async (_, { polygonGeoJSON }, { dataSources }) => {
      try {
        // Fetch fires within polygon
        return await dataSources.fireService.getFiresWithinPolygon(polygonGeoJSON);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresWithinPolygon: ${err.message}`);
      }
    },

    /**
     * Retrieves most recent fires with a limit.
     * 
     * PRE-CONDITIONS:
     * - limit must be provided
     * 
     * POST-CONDITIONS:
     * - Returns limited list of recent fires
     * - Throws error if retrieval fails
     */
    // Fetch recent fires
    getRecentFires: async (_, { limit }, { dataSources }) => {
      try {
        // Fetch recent fires
        return await dataSources.fireService.getRecentFires(limit);
      } catch (err) {
        throw new Error(`GraphQL Error - getRecentFires: ${err.message}`);
      }
    },

    /**
     * Retrieves fires within a date range.
     * 
     * PRE-CONDITIONS:
     * - startDate and endDate must be provided
     * 
     * POST-CONDITIONS:
     * - Returns fires within date range
     * - Throws error if retrieval fails
     */
    // Fetch fires by date range
    getFiresByDate: async (_, { startDate, endDate }, { dataSources }) => {
      try {
        // Fetch fires by date range
        return await dataSources.fireService.getFiresByDate(startDate, endDate);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByDate: ${err.message}`);
      }
    },

    /**
     * Retrieves fire statistics within a date range.
     * 
     * PRE-CONDITIONS:
     * - startDate and endDate must be provided
     * 
     * POST-CONDITIONS:
     * - Returns statistical data
     * - Throws error if retrieval fails
     */
    // Fetch fire statistics
    getFireStatistics: async (_, { startDate, endDate }, { dataSources }) => {
      try {
        // Fetch statistics
        return await dataSources.fireService.getFireStatistics(startDate, endDate);
      } catch (err) {
        throw new Error(`GraphQL Error - getFireStatistics: ${err.message}`);
      }
    },

    /**
     * Retrieves fires filtered by location and time.
     * 
     * PRE-CONDITIONS:
     * - lat, lng, startDate, endDate, radiusMeters must be provided
     * 
     * POST-CONDITIONS:
     * - Returns filtered fires
     * - Throws error if retrieval fails
     */
    // Fetch fires by location and time
    getFiresByLocationAndTime: async (_, { lat, lng, startDate, endDate, radiusMeters }, { dataSources }) => {
      try {
        // Fetch fires by location and time
        return await dataSources.fireService.getFiresByLocationAndTime(lat, lng, startDate, endDate, radiusMeters);
      } catch (err) {
        throw new Error(`GraphQL Error - getFiresByLocationAndTime: ${err.message}`);
      }
    },

    /**
     * Counts fires based on filters.
     * 
     * PRE-CONDITIONS:
     * - filters object must be provided
     * 
     * POST-CONDITIONS:
     * - Returns count of fires
     * - Throws error if operation fails
     */
    // Count fires with filters
    countFires: async (_, { filters }, { dataSources }) => {
      try {
        // Count fires
        return await dataSources.fireService.countFires(filters);
      } catch (err) {
        throw new Error(`GraphQL Error - countFires: ${err.message}`);
      }
    },

    /**
     * Finds residents near a fire within a radius.
     * 
     * PRE-CONDITIONS:
     * - fire_id and radiusMeters must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of nearby residents
     * - Throws error if operation fails
     */
    // Find residents near fire
    findResidentsNearFire: async (_, { fire_id, radiusMeters }, { dataSources }) => {
      try {
        // Find residents near fire
        return await dataSources.fireService.findResidentsNearFire(fire_id, radiusMeters);
      } catch (err) {
        throw new Error(`GraphQL Error - findResidentsNearFire: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Creates a new fire record.
     */
    // Create a new fire
    createFire: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.fireService.createFire(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createFire: ${err.message}`);
      }
    },

    /**
     * Creates a fire and triggers system-wide processes.
     */
    // Create fire and trigger full system orchestration 
    createFireAndTriggerSystem: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.fireService.createFireAndTriggerSystem(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createFireAndTriggerSystem: ${err.message}`);
      }
    },

    /**
     * Updates an existing fire.
     */
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

    /**
     * Updates fire status.
     */
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

    /**
     * Updates fire severity level.
     */
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

    /**
     * Deletes a fire by ID.
     */
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

    /**
     * Verifies a fire.
     */
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

    /**
     * Marks a fire as extinguished.
     */
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

    /**
     * Dispatches the closest responder to a fire.
     */
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