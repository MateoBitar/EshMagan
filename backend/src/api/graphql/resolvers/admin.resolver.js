// src/api/graphql/resolvers/admin.resolver.js

export const adminResolvers = {
  Query: {
    // Fetch all admins
    getAllAdmins: async (_, __, { dataSources }) => {
      try {
        return await dataSources.adminService.getAllAdmins();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllAdmins: ${err.message}`);
      }
    },

    // Fetch a single admin by ID
    getAdminById: async (_, { admin_id }, { dataSources }) => {
      try {
        const admin = await dataSources.adminService.getAdminById(admin_id);
        if (!admin) throw new Error(`Admin with ID ${admin_id} not found`);
        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminById: ${err.message}`);
      }
    },

    // Fetch admin by first name
    getAdminByFName: async (_, { admin_fname }, { dataSources }) => {
      try {
        const admin = await dataSources.adminService.getAdminByFName(admin_fname);
        if (!admin) throw new Error(`Admin with first name ${admin_fname} not found`);
        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByFName: ${err.message}`);
      }
    },

    // Fetch admin by last name
    getAdminByLName: async (_, { admin_lname }, { dataSources }) => {
      try {
        const admin = await dataSources.adminService.getAdminByLName(admin_lname);
        if (!admin) throw new Error(`Admin with last name ${admin_lname} not found`);
        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByLName: ${err.message}`);
      }
    },

    // Fetch admin by email
    getAdminByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        const admin = await dataSources.adminService.getAdminByEmail(user_email);
        if (!admin) throw new Error(`Admin with email ${user_email} not found`);
        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByEmail: ${err.message}`);
      }
    },

    // Fetch admin by phone
    getAdminByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        const admin = await dataSources.adminService.getAdminByPhone(user_phone);
        if (!admin) throw new Error(`Admin with phone ${user_phone} not found`);
        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByPhone: ${err.message}`);
      }
    },

    // Fetch admins created on a specific date
    getAdminsByCreationDate: async (_, { created_at }, { dataSources }) => {
      try {
        return await dataSources.adminService.getAdminsByCreationDate(created_at);
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminsByCreationDate: ${err.message}`);
      }
    },
  },

  Mutation: {
    // Create a new admin
    createAdmin: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.adminService.createAdmin(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createAdmin: ${err.message}`);
      }
    },

    // Deactivate an admin by ID
    deactivateAdmin: async (_, { admin_id }, { dataSources }) => {
      try {
        const result = await dataSources.adminService.deactivateAdmin(admin_id);
        if (!result) throw new Error(`Failed to deactivate admin with ID ${admin_id}`);
        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateAdmin: ${err.message}`);
      }
    },
  },
};
