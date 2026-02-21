// src/api/graphql/resolvers/municipality.resolver.js

export const municipalityResolvers = {
  Query: {
    // Fetch all municipalities
    getAllMunicipalities: async (_, __, { dataSources }) => {
      try {
        return await dataSources.municipalityService.getAllMunicipalities();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllMunicipalities: ${err.message}`);
      }
    },

    // Fetch a municipality by ID
    getMunicipalityById: async (_, { municipality_id }, { dataSources }) => {
      try {
        const municipality = await dataSources.municipalityService.getMunicipalityById(municipality_id);
        if (!municipality) throw new Error(`Municipality with ID ${municipality_id} not found`);
        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityById: ${err.message}`);
      }
    },

    // Fetch municipalities by name (supports partial match)
    getMunicipalitiesByName: async (_, { municipality_name }, { dataSources }) => {
      try {
        return await dataSources.municipalityService.getMunicipalitiesByName(municipality_name);
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalitiesByName: ${err.message}`);
      }
    },

    // Fetch municipalities by region
    getMunicipalityByRegion: async (_, { region_name }, { dataSources }) => {
      try {
        return await dataSources.municipalityService.getMunicipalityByRegion(region_name);
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByRegion: ${err.message}`);
      }
    },

    // Fetch municipality by unique code
    getMunicipalityByCode: async (_, { municipality_code }, { dataSources }) => {
      try {
        const municipality = await dataSources.municipalityService.getMunicipalityByCode(municipality_code);
        if (!municipality) throw new Error(`Municipality with code ${municipality_code} not found`);
        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByCode: ${err.message}`);
      }
    },

    // Fetch municipality by location (spatial query)
    getMunicipalityByLocation: async (_, { municipality_location }, { dataSources }) => {
      try {
        const municipality = await dataSources.municipalityService.getMunicipalityByLocation(municipality_location);
        if (!municipality) throw new Error(`Municipality at location ${municipality_location} not found`);
        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByLocation: ${err.message}`);
      }
    },

    // Fetch municipality by associated user email
    getMunicipalityByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        const municipality = await dataSources.municipalityService.getMunicipalityByEmail(user_email);
        if (!municipality) throw new Error(`Municipality with email ${user_email} not found`);
        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByEmail: ${err.message}`);
      }
    },

    // Fetch municipality by associated user phone
    getMunicipalityByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        const municipality = await dataSources.municipalityService.getMunicipalityByPhone(user_phone);
        if (!municipality) throw new Error(`Municipality with phone ${user_phone} not found`);
        return municipality;
      } catch (err) {
        throw new Error(`GraphQL Error - getMunicipalityByPhone: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Create a new municipality
    createMunicipality: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.municipalityService.createMunicipality(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createMunicipality: ${err.message}`);
      }
    },

    // Update municipality details
    updateMunicipality: async (_, { municipality_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.municipalityService.updateMunicipality(municipality_id, input);
        if (!updated) throw new Error(`Municipality with ID ${municipality_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateMunicipality: ${err.message}`);
      }
    },

    // Deactivate a municipality
    deactivateMunicipality: async (_, { municipality_id }, { dataSources }) => {
      try {
        const result = await dataSources.municipalityService.deactivateMunicipality(municipality_id);
        if (!result) throw new Error(`Failed to deactivate municipality with ID ${municipality_id}`);
        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateMunicipality: ${err.message}`);
      }
    },
  },
};
