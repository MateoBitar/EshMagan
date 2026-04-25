// src/api/graphql/resolvers/evacuation.resolver.js

/**
 * This file defines the GraphQL resolvers for Evacuation-related operations.
 * It handles both Query and Mutation requests and communicates with
 * evacuationService through dataSources to perform all evacuation route operations.
 * 
 * The resolver acts as an intermediary between the GraphQL schema
 * and the backend service layer.
 */

export const evacuationResolvers = {
  Query: {
    /**
     * Retrieves all evacuation routes available in the system.
     * 
     * PRE-CONDITIONS:
     * - dataSources.evacuationService must be available
     * 
     * POST-CONDITIONS:
     * - Returns an array of evacuation routes
     * - Throws an error if retrieval fails
     */
    // Fetch all evacuation routes
    getAllEvacuations: async (_, __, { dataSources }) => {
      try {
        // Call service to get all evacuation routes
        return await dataSources.evacuationService.getAllEvacuations();
      } catch (err) {
        // Handle error and rethrow
        throw new Error(`GraphQL Error - getAllEvacuations: ${err.message}`);
      }
    },

    /**
     * Retrieves a specific evacuation route by its ID.
     * 
     * PRE-CONDITIONS:
     * - route_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns evacuation route if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch evacuation route by ID
    getEvacuationById: async (_, { route_id }, { dataSources }) => {
      try {
        // Fetch evacuation route using ID
        const evacuation = await dataSources.evacuationService.getEvacuationById(route_id);

        // Check if route exists
        if (!evacuation) throw new Error(`Evacuation route with ID ${route_id} not found`);

        return evacuation;
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationById: ${err.message}`);
      }
    },

    /**
     * Retrieves evacuation routes filtered by their status.
     * 
     * PRE-CONDITIONS:
     * - route_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of evacuation routes matching the status
     * - Throws error if retrieval fails
     */
    // Fetch evacuation routes by status
    getEvacuationsByStatus: async (_, { route_status }, { dataSources }) => {
      try {
        // Fetch routes by status
        return await dataSources.evacuationService.getEvacuationsByStatus(route_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByStatus: ${err.message}`);
      }
    },

    /**
     * Retrieves evacuation routes based on priority level.
     * 
     * PRE-CONDITIONS:
     * - route_priority must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of routes matching priority
     * - Throws error if retrieval fails
     */
    // Fetch evacuation routes by priority
    getEvacuationsByPriority: async (_, { route_priority }, { dataSources }) => {
      try {
        // Fetch routes by priority
        return await dataSources.evacuationService.getEvacuationsByPriority(route_priority);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByPriority: ${err.message}`);
      }
    },

    /**
     * Retrieves evacuation routes associated with a specific safe zone.
     * 
     * PRE-CONDITIONS:
     * - safe_zone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of routes linked to the safe zone
     * - Throws error if retrieval fails
     */
    // Fetch evacuation routes by safe zone
    getEvacuationsByZone: async (_, { safe_zone }, { dataSources }) => {
      try {
        // Fetch routes by safe zone
        return await dataSources.evacuationService.getEvacuationsByZone(safe_zone);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByZone: ${err.message}`);
      }
    },

    /**
     * Retrieves evacuation routes linked to a specific fire ID.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of routes associated with the fire
     * - Throws error if retrieval fails
     */
    // Fetch evacuation routes by fire ID
    getEvacuationsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        // Fetch routes by fire ID
        return await dataSources.evacuationService.getEvacuationsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getEvacuationsByFireId: ${err.message}`);
      }
    },

    /**
     * Finds the nearest evacuation route based on geographic coordinates.
     * 
     * PRE-CONDITIONS:
     * - latitude and longitude must be provided
     * 
     * POST-CONDITIONS:
     * - Returns the nearest evacuation route
     * - Throws error if none found or operation fails
     */
    // Fetch nearest evacuation route
    getNearestEvacuation: async (_, { latitude, longitude }, { dataSources }) => {
      try {
        // Call service to compute nearest route
        const evacuation = await dataSources.evacuationService.getNearestEvacuation(latitude, longitude);

        // Validate result
        if (!evacuation) throw new Error(`No evacuation route found near (${latitude}, ${longitude})`);

        return evacuation;
      } catch (err) {
        throw new Error(`GraphQL Error - getNearestEvacuation: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Creates a new evacuation route.
     * 
     * PRE-CONDITIONS:
     * - input must contain valid route data
     * 
     * POST-CONDITIONS:
     * - Returns the created evacuation route
     * - Throws error if creation fails
     */
    // Create a new evacuation route
    createEvacuation: async (_, { input }, { dataSources }) => {
      try {
        // Call service to create route
        return await dataSources.evacuationService.createEvacuation(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createEvacuation: ${err.message}`);
      }
    },

    /**
     * Updates the status of an evacuation route.
     * 
     * PRE-CONDITIONS:
     * - route_id must be provided
     * - input.new_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated route
     * - Throws error if route not found or update fails
     */
    // Update evacuation route status
    updateEvacuationStatus: async (_, { route_id, input }, { dataSources }) => {
      try {
        // Update route status
        const updated = await dataSources.evacuationService.updateEvacuationStatus(route_id, input.new_status);

        // Validate update success
        if (!updated) throw new Error(`Evacuation route with ID ${route_id} not found`);

        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateEvacuationStatus: ${err.message}`);
      }
    },

    /**
     * Updates the priority of an evacuation route.
     * 
     * PRE-CONDITIONS:
     * - route_id must be provided
     * - input.new_priority must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated route
     * - Throws error if route not found or update fails
     */
    // Update evacuation route priority
    updateEvacuationPriority: async (_, { route_id, input }, { dataSources }) => {
      try {
        // Update route priority
        const updated = await dataSources.evacuationService.updateEvacuationPriority(route_id, input.new_priority);

        if (!updated) throw new Error(`Evacuation route with ID ${route_id} not found`);

        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateEvacuationPriority: ${err.message}`);
      }
    },

    /**
     * Updates the geometry (path and safe zone) of an evacuation route.
     * 
     * PRE-CONDITIONS:
     * - route_id must be provided
     * - input.new_route_path and input.new_safe_zone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated route
     * - Throws error if update fails
     */
    // Update evacuation route geometry
    updateEvacuationGeometry: async (_, { route_id, input }, { dataSources }) => {
      try {
        // Update route geometry
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

    /**
     * Deletes a specific evacuation route by ID.
     * 
     * PRE-CONDITIONS:
     * - route_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns deletion result
     * - Throws error if deletion fails
     */
    // Delete evacuation route by ID
    deleteEvacuation: async (_, { route_id }, { dataSources }) => {
      try {
        // Delete route
        return await dataSources.evacuationService.deleteEvacuation(route_id);
      } catch (err) {
        throw new Error(`GraphQL Error - deleteEvacuation: ${err.message}`);
      }
    },

    /**
     * Deletes all evacuation routes associated with a specific fire.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns result of deletion
     * - Throws error if operation fails
     */
    // Delete evacuation routes by fire ID
    deleteEvacuationsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        // Delete routes by fire ID
        return await dataSources.evacuationService.deleteEvacuationsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - deleteEvacuationsByFireId: ${err.message}`);
      }
    },
  },
};