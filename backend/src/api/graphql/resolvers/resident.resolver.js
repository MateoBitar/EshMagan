// src/api/graphql/resolvers/resident.resolver.js

export const residentResolvers = {
  Query: {
    // Fetch all residents
    getAllResidents: async (_, __, { dataSources }) => {
      try {
        return await dataSources.residentService.getAllResidents();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllResidents: ${err.message}`);
      }
    },

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

    // Fetch residents by first name
    getResidentsByFName: async (_, { resident_fname }, { dataSources }) => {
      try {
        return await dataSources.residentService.getResidentsByFName(resident_fname);
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentsByFName: ${err.message}`);
      }
    },

    // Fetch residents by last name
    getResidentsByLName: async (_, { resident_lname }, { dataSources }) => {
      try {
        return await dataSources.residentService.getResidentsByLName(resident_lname);
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentsByLName: ${err.message}`);
      }
    },

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

    // Fetch residents by last known location
    getResidentsByLastKnownLocation: async (_, { last_known_location }, { dataSources }) => {
      try {
        return await dataSources.residentService.getResidentsByLastKnownLocation(last_known_location);
      } catch (err) {
        throw new Error(`GraphQL Error - getResidentsByLastKnownLocation: ${err.message}`);
      }
    },

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
  },

  Mutation: {
    // Create a new resident
    createResident: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.residentService.createResident(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createResident: ${err.message}`);
      }
    },

    // Update resident details
    updateResident: async (_, { resident_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.residentService.updateResident(resident_id, input);
        if (!updated) throw new Error(`Resident with ID ${resident_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateResident: ${err.message}`);
      }
    },

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
