// src/api/graphql/resolvers/responder.resolver.js
import { updateLocationViaGrpc } from '../../../grpc/clients/location.grpc.client.js';

/**
 * This file defines GraphQL resolvers for Responder operations.
 * It manages responder-related queries and mutations and integrates
 * with responderService and a gRPC client for location updates.
 */

export const responderResolvers = {
  Query: {
    /**
     * Retrieve all responders.
     * 
     * PRE-CONDITIONS:
     * - dataSources.responderService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of responders
     * - Throws error if operation fails
     */
    // Fetch all responders
    getAllResponders: async (_, __, { dataSources }) => {
      try {
        return await dataSources.responderService.getAllResponders();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllResponders: ${err.message}`);
      }
    },

    /**
     * Retrieve a responder by ID.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns responder if found
     * - Throws error if not found or fails
     */
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

    /**
     * Retrieve responders by unit number.
     * 
     * PRE-CONDITIONS:
     * - unit_nb must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of responders
     * - Throws error if operation fails
     */
    // Fetch responders by unit number
    getRespondersByUnitNb: async (_, { unit_nb }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByUnitNb(unit_nb);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByUnitNb: ${err.message}`);
      }
    },

    /**
     * Retrieve responders by unit location.
     * 
     * PRE-CONDITIONS:
     * - unit_location must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of responders
     * - Throws error if operation fails
     */
    // Fetch responders by unit location
    getRespondersByUnitLocation: async (_, { unit_location }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByUnitLocation(unit_location);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByUnitLocation: ${err.message}`);
      }
    },

    /**
     * Retrieve responders by assigned region.
     * 
     * PRE-CONDITIONS:
     * - assigned_region must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of responders
     * - Throws error if operation fails
     */
    // Fetch responders by assigned region
    getRespondersByAssignedRegion: async (_, { assigned_region }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByAssignedRegion(assigned_region);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByAssignedRegion: ${err.message}`);
      }
    },

    /**
     * Retrieve responders by status.
     * 
     * PRE-CONDITIONS:
     * - responder_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of responders
     * - Throws error if operation fails
     */
    // Fetch responders by status
    getRespondersByResponderStatus: async (_, { responder_status }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByResponderStatus(responder_status);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByResponderStatus: ${err.message}`);
      }
    },

    /**
     * Retrieve responders by last known location.
     * 
     * PRE-CONDITIONS:
     * - last_known_location must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of responders
     * - Throws error if operation fails
     */
    // Fetch responders by last known location
    getRespondersByLastKnownLocation: async (_, { last_known_location }, { dataSources }) => {
      try {
        return await dataSources.responderService.getRespondersByLastKnownLocation(last_known_location);
      } catch (err) {
        throw new Error(`GraphQL Error - getRespondersByLastKnownLocation: ${err.message}`);
      }
    },

    /**
     * Retrieve a responder by email.
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns responder if found
     * - Throws error if not found or fails
     */
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

    /**
     * Retrieve a responder by phone.
     * 
     * PRE-CONDITIONS:
     * - user_phone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns responder if found
     * - Throws error if not found or fails
     */
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

    /**
     * Retrieve the nearest responder to a fire location.
     * 
     * PRE-CONDITIONS:
     * - fire_location must be provided
     * 
     * POST-CONDITIONS:
     * - Returns nearest responder
     * - Throws error if none found or fails
     */
    // Fetch nearest responder to a fire location
    getNearestResponder: async (_, { fire_location }, { dataSources }) => {
      try {
        const responder = await dataSources.responderService.getNearestResponder(fire_location);
        if (!responder) throw new Error(`No responder found near fire location`);
        return responder;
      } catch (err) {
        throw new Error(`GraphQL Error - getNearestResponder: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Create a new responder.
     * 
     * PRE-CONDITIONS:
     * - input must contain valid responder data
     * 
     * POST-CONDITIONS:
     * - Returns created responder
     * - Throws error if creation fails
     */
    // Create a new responder
    createResponder: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.responderService.createResponder(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createResponder: ${err.message}`);
      }
    },

    /**
     * Update responder details.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided
     * - input must be valid
     * 
     * POST-CONDITIONS:
     * - Returns updated responder
     * - Throws error if update fails
     */
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

    /**
     * Update responder status.
     * 
     * PRE-CONDITIONS:
     * - responder_id and responder_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated responder
     * - Throws error if update fails
     */
    // Update responder status
    updateResponderStatus: async (_, { responder_id, responder_status }, { dataSources }) => {
      try {
        const updated = await dataSources.responderService.updateResponderStatus(responder_id, responder_status);
        if (!updated) throw new Error(`Responder with ID ${responder_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateResponderStatus: ${err.message}`);
      }
    },

    /**
     * Update responder location using gRPC.
     * 
     * PRE-CONDITIONS:
     * - responder_id, latitude, longitude must be provided
     * 
     * POST-CONDITIONS:
     * - Updates location via gRPC
     * - Returns updated responder
     * - Throws error if operation fails
     */
    // Update responder location
    updateResponderLocation: async (_, { responder_id, latitude, longitude }, { dataSources }) => {
      try {
        const grpcResult = await updateLocationViaGrpc({
          entity_id: responder_id,
          latitude,
          longitude,
          entity_type: 'Responder',
        });

        if (!grpcResult) {
          throw new Error(`Responder with ID ${responder_id} not found`);
        }

        const responder = await dataSources.responderService.getResponderById(responder_id);
        if (!responder) {
          throw new Error(`Responder with ID ${responder_id} not found`);
        }

        return responder;
      } catch (err) {
        throw new Error(`GraphQL Error - updateResponderLocation: ${err.message}`);
      }
    },

    /**
     * Deactivate a responder.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns result of deactivation
     * - Throws error if operation fails
     */
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