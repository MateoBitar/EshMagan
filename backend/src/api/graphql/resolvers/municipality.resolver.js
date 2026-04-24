// src/api/graphql/resolvers/municipality.resolver.js

/**
 * This file defines the GraphQL resolvers for Municipality-related operations.
 * It handles both Query and Mutation requests and communicates with
 * municipalityService via dataSources to manage municipality data.
 * 
 * The resolver serves as a bridge between the GraphQL schema
 * and the backend service layer.
 */

export const municipalityResolvers = {
  Query: {
    /**
     * Retrieves all municipalities in the system.
     * 
     * PRE-CONDITIONS:
     * - dataSources.municipalityService must be available
     * 
     * POST-CONDITIONS:
     * - Returns an array of municipalities
     * - Throws error if retrieval fails
     */
    // Fetch all municipalities
    getAllMunicipalities: async (_, __, { dataSources }) => {
      try {
        // Call service to fetch all municipalities
        return await dataSources.municipalityService.getAllMunicipalities();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllMunicipalities: ${err.message}`);
      }
    },

    /**
     * Retrieves a municipality by its unique ID.
     * 
     * PRE-CONDITIONS:
     * - municipality_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns municipality if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch a municipality by ID
    getMunicipalityById: async (_, { municipality_id }, { dataSources }) => {
      try {
        // Fetch municipality by ID
        const municipality = await dataSources.municipalityService.getMunicipalityById(municipality_id);

        // Validate existence
        if (!municipality) throw new Error(`Municipality with ID ${municipality_id} not found`);

        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityById: ${err.message}`);
      }
    },

    /**
     * Retrieves municipalities by name (supports partial matching).
     * 
     * PRE-CONDITIONS:
     * - municipality_name must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of municipalities matching the name
     * - Throws error if retrieval fails
     */
    // Fetch municipalities by name (supports partial match)
    getMunicipalitiesByName: async (_, { municipality_name }, { dataSources }) => {
      try {
        // Fetch municipalities by name
        return await dataSources.municipalityService.getMunicipalitiesByName(municipality_name);
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalitiesByName: ${err.message}`);
      }
    },

    /**
     * Retrieves municipalities by region name.
     * 
     * PRE-CONDITIONS:
     * - region_name must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of municipalities in the region
     * - Throws error if retrieval fails
     */
    // Fetch municipalities by region
    getMunicipalityByRegion: async (_, { region_name }, { dataSources }) => {
      try {
        // Fetch municipalities by region
        return await dataSources.municipalityService.getMunicipalityByRegion(region_name);
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByRegion: ${err.message}`);
      }
    },

    /**
     * Retrieves a municipality by its unique code.
     * 
     * PRE-CONDITIONS:
     * - municipality_code must be provided
     * 
     * POST-CONDITIONS:
     * - Returns municipality if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch municipality by unique code
    getMunicipalityByCode: async (_, { municipality_code }, { dataSources }) => {
      try {
        // Fetch municipality by code
        const municipality = await dataSources.municipalityService.getMunicipalityByCode(municipality_code);

        // Validate existence
        if (!municipality) throw new Error(`Municipality with code ${municipality_code} not found`);

        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByCode: ${err.message}`);
      }
    },

    /**
     * Retrieves a municipality based on geographic location.
     * 
     * PRE-CONDITIONS:
     * - municipality_location must contain valid latitude and longitude
     * 
     * POST-CONDITIONS:
     * - Returns municipality if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch municipality by location (spatial query)
    getMunicipalityByLocation: async (_, { municipality_location }, { dataSources }) => {
      try {
        // Fetch municipality using spatial query
        const municipality = await dataSources.municipalityService.getMunicipalityByLocation(municipality_location);

        // Validate existence
        if (!municipality) {
          throw new Error(
            `Municipality at location (lat: ${municipality_location.latitude}, lon: ${municipality_location.longitude}) not found`
          );
        }

        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByLocation: ${err.message}`);
      }
    },

    /**
     * Retrieves a municipality associated with a user email.
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns municipality if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch municipality by associated user email
    getMunicipalityByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        // Fetch municipality by email
        const municipality = await dataSources.municipalityService.getMunicipalityByEmail(user_email);

        // Validate existence
        if (!municipality) throw new Error(`Municipality with email ${user_email} not found`);

        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByEmail: ${err.message}`);
      }
    },

    /**
     * Retrieves a municipality associated with a user phone number.
     * 
     * PRE-CONDITIONS:
     * - user_phone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns municipality if found
     * - Throws error if not found or retrieval fails
     */
    // Fetch municipality by associated user phone
    getMunicipalityByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        // Fetch municipality by phone
        const municipality = await dataSources.municipalityService.getMunicipalityByPhone(user_phone);

        // Validate existence
        if (!municipality) throw new Error(`Municipality with phone ${user_phone} not found`);

        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByPhone: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Creates a new municipality.
     * 
     * PRE-CONDITIONS:
     * - input must contain valid municipality data
     * 
     * POST-CONDITIONS:
     * - Returns created municipality
     * - Throws error if creation fails
     */
    // Create a new municipality
    createMunicipality: async (_, { input }, { dataSources }) => {
      try {
        // Create municipality
        return await dataSources.municipalityService.createMunicipality(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createMunicipality: ${err.message}`);
      }
    },

    /**
     * Updates municipality details.
     * 
     * PRE-CONDITIONS:
     * - municipality_id must be provided
     * - input must contain valid fields to update
     * 
     * POST-CONDITIONS:
     * - Returns updated municipality
     * - Throws error if municipality not found or update fails
     */
    // Update municipality details
    updateMunicipality: async (_, { municipality_id, input }, { dataSources }) => {
      try {
        // Update municipality
        const updated = await dataSources.municipalityService.updateMunicipality(municipality_id, input);

        // Validate update
        if (!updated) throw new Error(`Municipality with ID ${municipality_id} not found`);

        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateMunicipality: ${err.message}`);
      }
    },

    /**
     * Deactivates a municipality.
     * 
     * PRE-CONDITIONS:
     * - municipality_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns result of deactivation
     * - Throws error if operation fails
     */
    // Deactivate a municipality
    deactivateMunicipality: async (_, { municipality_id }, { dataSources }) => {
      try {
        // Deactivate municipality
        const result = await dataSources.municipalityService.deactivateMunicipality(municipality_id);

        // Validate result
        if (!result) throw new Error(`Failed to deactivate municipality with ID ${municipality_id}`);

        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateMunicipality: ${err.message}`);
      }
    },
  },
};