// src/api/graphql/resolvers/admin.resolver.js

/**
 * This file defines the GraphQL resolvers related to Admin operations.
 * It handles all Query and Mutation requests coming from the GraphQL layer
 * and delegates the actual data operations to the adminService through dataSources.
 * 
 * The resolvers act as an intermediate layer between the GraphQL schema
 * and the backend service logic.
 */

export const adminResolvers = {
  Query: {
    /**
     * Retrieves a list of all admins from the system.
     * 
     * PRE-CONDITIONS:
     * - dataSources.adminService must be available
     * - The service must be able to access the data source (DB/API)
     * 
     * POST-CONDITIONS:
     * - Returns an array of admin objects
     * - Throws an error if retrieval fails
     */
    // Fetch all admins
    getAllAdmins: async (_, __, { dataSources }) => {
      try {
        // Call service layer to fetch all admins
        return await dataSources.adminService.getAllAdmins();
      } catch (err) {
        // Handle and rethrow error with GraphQL-specific message
        throw new Error(`GraphQL Error - getAllAdmins: ${err.message}`);
      }
    },

    /**
     * Retrieves a single admin based on the provided admin ID.
     * 
     * PRE-CONDITIONS:
     * - admin_id must be provided
     * - adminService must be accessible
     * 
     * POST-CONDITIONS:
     * - Returns the admin object if found
     * - Throws an error if admin does not exist or retrieval fails
     */
    // Fetch a single admin by ID
    getAdminById: async (_, { admin_id }, { dataSources }) => {
      try {
        // Fetch admin using ID
        const admin = await dataSources.adminService.getAdminById(admin_id);

        // Validate if admin exists
        if (!admin) throw new Error(`Admin with ID ${admin_id} not found`);

        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminById: ${err.message}`);
      }
    },

    /**
     * Retrieves an admin by their first name.
     * 
     * PRE-CONDITIONS:
     * - admin_fname must be provided
     * 
     * POST-CONDITIONS:
     * - Returns admin object if found
     * - Throws error if not found
     */
    // Fetch admin by first name
    getAdminByFName: async (_, { admin_fname }, { dataSources }) => {
      try {
        // Fetch admin by first name
        const admin = await dataSources.adminService.getAdminByFName(admin_fname);

        // Check if result exists
        if (!admin) throw new Error(`Admin with first name ${admin_fname} not found`);

        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByFName: ${err.message}`);
      }
    },

    /**
     * Retrieves an admin by their last name.
     * 
     * PRE-CONDITIONS:
     * - admin_lname must be provided
     * 
     * POST-CONDITIONS:
     * - Returns admin object if found
     * - Throws error if not found
     */
    // Fetch admin by last name
    getAdminByLName: async (_, { admin_lname }, { dataSources }) => {
      try {
        // Fetch admin by last name
        const admin = await dataSources.adminService.getAdminByLName(admin_lname);

        // Validate existence
        if (!admin) throw new Error(`Admin with last name ${admin_lname} not found`);

        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByLName: ${err.message}`);
      }
    },

    /**
     * Retrieves an admin using their email address.
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns admin object if found
     * - Throws error if not found
     */
    // Fetch admin by email
    getAdminByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        // Fetch admin by email
        const admin = await dataSources.adminService.getAdminByEmail(user_email);

        // Check if admin exists
        if (!admin) throw new Error(`Admin with email ${user_email} not found`);

        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByEmail: ${err.message}`);
      }
    },

    /**
     * Retrieves an admin using their phone number.
     * 
     * PRE-CONDITIONS:
     * - user_phone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns admin object if found
     * - Throws error if not found
     */
    // Fetch admin by phone
    getAdminByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        // Fetch admin by phone
        const admin = await dataSources.adminService.getAdminByPhone(user_phone);

        // Validate existence
        if (!admin) throw new Error(`Admin with phone ${user_phone} not found`);

        return admin;
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminByPhone: ${err.message}`);
      }
    },

    /**
     * Retrieves all admins created on a specific date.
     * 
     * PRE-CONDITIONS:
     * - created_at must be provided (valid date format)
     * 
     * POST-CONDITIONS:
     * - Returns list of admins created on that date
     * - Throws error if operation fails
     */
    // Fetch admins created on a specific date
    getAdminsByCreationDate: async (_, { created_at }, { dataSources }) => {
      try {
        // Fetch admins by creation date
        return await dataSources.adminService.getAdminsByCreationDate(created_at);
      } catch (err) {
        throw new Error(`GraphQL Error - getAdminsByCreationDate: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Creates a new admin in the system.
     * 
     * PRE-CONDITIONS:
     * - input object must contain valid admin data
     * - Required fields must be present
     * 
     * POST-CONDITIONS:
     * - Returns the newly created admin
     * - Throws error if creation fails
     */
    // Create a new admin
    createAdmin: async (_, { input }, { dataSources }) => {
      try {
        // Call service to create admin
        return await dataSources.adminService.createAdmin(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createAdmin: ${err.message}`);
      }
    },

    /**
     * Deactivates an existing admin by ID.
     * 
     * PRE-CONDITIONS:
     * - admin_id must be provided
     * - Admin must exist in the system
     * 
     * POST-CONDITIONS:
     * - Returns confirmation/result of deactivation
     * - Throws error if operation fails
     */
    // Deactivate an admin by ID
    deactivateAdmin: async (_, { admin_id }, { dataSources }) => {
      try {
        // Call service to deactivate admin
        const result = await dataSources.adminService.deactivateAdmin(admin_id);

        // Check if operation succeeded
        if (!result) throw new Error(`Failed to deactivate admin with ID ${admin_id}`);

        return result;
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateAdmin: ${err.message}`);
      }
    },
  },
};