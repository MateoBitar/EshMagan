// src/api/graphql/resolvers/resident.resolver.js
import { updateLocationViaGrpc } from '../../../grpc/clients/location.grpc.client.js';

/**
 * This file defines GraphQL resolvers for Resident operations.
 * It handles queries and mutations related to residents and delegates
 * logic to residentService and fireService. It also integrates a gRPC
 * client for optimized location updates.
 */

export const residentResolvers = {
  Query: {
    /**
     * Retrieve all residents.
     * 
     * PRE-CONDITIONS:
     * - dataSources.residentService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of residents
     * - Throws error if operation fails
     */
    // Fetch all residents
    getAllResidents: async (_, __, { dataSources }) => {
      try {
        return await dataSources.residentService.getAllResidents();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllResidents: ${err.message}`);
      }
    },

    /**
     * Retrieve a resident by ID.
     * 
     * PRE-CONDITIONS:
     * - resident_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns resident if found
     * - Throws error if not found or fails
     */
    // Fetch resident by ID
    getResidentById: async (_, { resident_id }, { dataSources }) => {
      try {
        const resident = await dataSources.residentService.getResidentById(resident_id);
        if (!resident) throw new Error(`Resident with ID ${resident_id} not found`);
        return resident;
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentById: ${err.message}`);
      }
    },

    /**
     * Retrieve residents by first name.
     * 
     * PRE-CONDITIONS:
     * - resident_fname must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of residents
     * - Throws error if operation fails
     */
    // Fetch residents by first name
    getResidentsByFName: async (_, { resident_fname }, { dataSources }) => {
      try {
        return await dataSources.residentService.getResidentsByFName(resident_fname);
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentsByFName: ${err.message}`);
      }
    },

    /**
     * Retrieve residents by last name.
     * 
     * PRE-CONDITIONS:
     * - resident_lname must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of residents
     * - Throws error if operation fails
     */
    // Fetch residents by last name
    getResidentsByLName: async (_, { resident_lname }, { dataSources }) => {
      try {
        return await dataSources.residentService.getResidentsByLName(resident_lname);
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentsByLName: ${err.message}`);
      }
    },

    /**
     * Retrieve a resident by ID number.
     * 
     * PRE-CONDITIONS:
     * - resident_idnb must be provided
     * 
     * POST-CONDITIONS:
     * - Returns resident if found
     * - Throws error if not found or fails
     */
    // Fetch resident by ID number
    getResidentByIdNb: async (_, { resident_idnb }, { dataSources }) => {
      try {
        const resident = await dataSources.residentService.getResidentByIdNb(resident_idnb);
        if (!resident) throw new Error(`Resident with ID number ${resident_idnb} not found`);
        return resident;
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentByIdNb: ${err.message}`);
      }
    },

    /**
     * Retrieve residents by last known location.
     * 
     * PRE-CONDITIONS:
     * - last_known_location must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of residents
     * - Throws error if operation fails
     */
    // Fetch residents by last known location
    getResidentsByLastKnownLocation: async (_, { last_known_location }, { dataSources }) => {
      try {
        return await dataSources.residentService.getResidentsByLastKnownLocation(last_known_location);
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentsByLastKnownLocation: ${err.message}`);
      }
    },

    /**
     * Retrieve a resident by email.
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns resident if found
     * - Throws error if not found or fails
     */
    // Fetch resident by email
    getResidentByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        const resident = await dataSources.residentService.getResidentByEmail(user_email);
        if (!resident) throw new Error(`Resident with email ${user_email} not found`);
        return resident;
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentByEmail: ${err.message}`);
      }
    },

    /**
     * Retrieve a resident by phone.
     * 
     * PRE-CONDITIONS:
     * - user_phone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns resident if found
     * - Throws error if not found or fails
     */
    // Fetch resident by phone
    getResidentByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        const resident = await dataSources.residentService.getResidentByPhone(user_phone);
        if (!resident) throw new Error(`Resident with phone ${user_phone} not found`);
        return resident;
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentByPhone: ${err.message}`);
      }
    },

    /**
     * Retrieve nearby fires based on location.
     * 
     * PRE-CONDITIONS:
     * - latitude and longitude must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of nearby fires
     * - Throws error if operation fails
     */
    getNearbyFires: async (_, { latitude, longitude }, { dataSources }) => {
      try {
        return await dataSources.fireService.getNearbyFires(latitude, longitude);
      } catch (err) {
        throw new Error(`GraphQL Error - getNearbyFires: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Create a new resident.
     * 
     * PRE-CONDITIONS:
     * - input must contain valid resident data
     * 
     * POST-CONDITIONS:
     * - Returns created resident
     * - Throws error if creation fails
     */
    // Create a new resident
    createResident: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.residentService.createResident(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createResident: ${err.message}`);
      }
    },

    /**
     * Update resident details.
     * 
     * PRE-CONDITIONS:
     * - resident_id must be provided
     * - input must be valid
     * 
     * POST-CONDITIONS:
     * - Returns updated resident
     * - Uses gRPC if only location is updated
     * - Throws error if update fails
     */
    // Update resident details
    updateResident: async (_, { resident_id, input }, { dataSources }) => {
      try {
        const keys = Object.keys(input || {}).filter(k => input[k] !== undefined);

        const isLocationOnlyUpdate =
          keys.length === 1 &&
          keys[0] === 'last_known_location' &&
          input.last_known_location &&
          input.last_known_location.latitude != null &&
          input.last_known_location.longitude != null;

        if (isLocationOnlyUpdate) {
          await updateLocationViaGrpc({
            entity_id: resident_id,
            latitude: input.last_known_location.latitude,
            longitude: input.last_known_location.longitude,
            entity_type: 'Resident',
          });

          const resident = await dataSources.residentService.getResidentById(resident_id);
          if (!resident) throw new Error(`Resident with ID ${resident_id} not found`);
          return resident;
        }

        const updated = await dataSources.residentService.updateResident(resident_id, input);
        if (!updated) throw new Error(`Resident with ID ${resident_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateResident: ${err.message}`);
      }
    },

    /**
     * Deactivate a resident.
     * 
     * PRE-CONDITIONS:
     * - resident_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns result of deactivation
     * - Throws error if operation fails
     */
    // Deactivate a resident
    deactivateResident: async (_, { resident_id }, { dataSources }) => {
      try {
        const result = await dataSources.residentService.deactivateResident(resident_id);
        if (!result) throw new Error(`Failed to deactivate resident with ID ${resident_id}`);
        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateResident: ${err.message}`);
      }
    },
  },
};