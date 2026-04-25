// src/api/graphql/resolvers/user.resolver.js

/**
 * This file defines GraphQL resolvers for User operations.
 * It manages user-related queries and mutations and delegates
 * all logic to userService through dataSources.
 */

export const userResolvers = {
  Query: {
    /**
     * Retrieve all users.
     * 
     * PRE-CONDITIONS:
     * - dataSources.userService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of users
     * - Throws error if operation fails
     */
    // Fetch all users
    getAllUsers: async (_, __, { dataSources }) => {
      try {
        return await dataSources.userService.getAllUsers();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllUsers: ${err.message}`);
      }
    },

    /**
     * Retrieve a user by ID.
     * 
     * PRE-CONDITIONS:
     * - user_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns user if found
     * - Throws error if not found or fails
     */
    // Fetch a single user by ID
    getUserById: async (_, { user_id }, { dataSources }) => {
      try {
        const user = await dataSources.userService.getUserById(user_id);
        if (!user) throw new Error(`User with ID ${user_id} not found`);
        return user;
      } catch (err) {
        throw new Error(`GraphQL Error - getUserById: ${err.message}`);
      }
    },

    /**
     * Retrieve a user by email.
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns user if found
     * - Throws error if not found or fails
     */
    // Fetch user by email
    getUserByEmail: async (_, { user_email }, { dataSources }) => {
      try {
        const user = await dataSources.userService.getUserByEmail(user_email);
        if (!user) throw new Error(`User with email ${user_email} not found`);
        return user;
      } catch (err) {
        throw new Error(`GraphQL Error - getUserByEmail: ${err.message}`);
      }
    },

    /**
     * Retrieve a user by phone.
     * 
     * PRE-CONDITIONS:
     * - user_phone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns user if found
     * - Throws error if not found or fails
     */
    // Fetch user by phone
    getUserByPhone: async (_, { user_phone }, { dataSources }) => {
      try {
        const user = await dataSources.userService.getUserByPhone(user_phone);
        if (!user) throw new Error(`User with phone ${user_phone} not found`);
        return user;
      } catch (err) {
        throw new Error(`GraphQL Error - getUserByPhone: ${err.message}`);
      }
    },

    /**
     * Retrieve users by role.
     * 
     * PRE-CONDITIONS:
     * - user_role must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of users
     * - Throws error if operation fails
     */
    // Fetch users by role
    getUsersByRole: async (_, { user_role }, { dataSources }) => {
      try {
        return await dataSources.userService.getUsersByRole(user_role);
      } catch (err) {
        throw new Error(`GraphQL Error - getUsersByRole: ${err.message}`);
      }
    },

    /**
     * Retrieve active users.
     * 
     * PRE-CONDITIONS:
     * - userService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of active users
     * - Throws error if operation fails
     */
    // Fetch active users
    getActiveUsers: async (_, __, { dataSources }) => {
      try {
        return await dataSources.userService.getActiveUsers();
      } catch (err) {
        throw new Error(`GraphQL Error - getActiveUsers: ${err.message}`);
      }
    },

    /**
     * Retrieve inactive users.
     * 
     * PRE-CONDITIONS:
     * - userService must be available
     * 
     * POST-CONDITIONS:
     * - Returns list of inactive users
     * - Throws error if operation fails
     */
    // Fetch inactive users
    getInActiveUsers: async (_, __, { dataSources }) => {
      try {
        return await dataSources.userService.getInActiveUsers();
      } catch (err) {
        throw new Error(`GraphQL Error - getInActiveUsers: ${err.message}`);
      }
    },

    /**
     * Retrieve an active user by email.
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns user if found
     * - Throws error if not found or fails
     */
    // Fetch active user by email
    getUserByEmailAndActive: async (_, { user_email }, { dataSources }) => {
      try {
        const user = await dataSources.userService.getUserByEmailAndActive(user_email);
        if (!user) throw new Error(`Active user with email ${user_email} not found`);
        return user;
      } catch (err) {
        throw new Error(`GraphQL Error - getUserByEmailAndActive: ${err.message}`);
      }
    },

    /**
     * Filter users with pagination.
     * 
     * PRE-CONDITIONS:
     * - filters and pagination must be provided
     * 
     * POST-CONDITIONS:
     * - Returns filtered users
     * - Throws error if operation fails
     */
    // Filter users with pagination
    filterUsers: async (_, { filters, pagination }, { dataSources }) => {
      try {
        return await dataSources.userService.filterUsers(filters, pagination);
      } catch (err) {
        throw new Error(`GraphQL Error - filterUsers: ${err.message}`);
      }
    },

    /**
     * Count users based on filters.
     * 
     * PRE-CONDITIONS:
     * - filters must be provided
     * 
     * POST-CONDITIONS:
     * - Returns count of users
     * - Throws error if operation fails
     */
    // Count users with filters
    countUsers: async (_, { filters }, { dataSources }) => {
      try {
        return await dataSources.userService.countUsers(filters);
      } catch (err) {
        throw new Error(`GraphQL Error - countUsers: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Create a new user.
     * 
     * PRE-CONDITIONS:
     * - input must contain valid user data
     * 
     * POST-CONDITIONS:
     * - Returns created user
     * - Throws error if creation fails
     */
    // Create a new user
    createUser: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.userService.createUser(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createUser: ${err.message}`);
      }
    },

    /**
     * Update user details.
     * 
     * PRE-CONDITIONS:
     * - user_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated user
     * - Throws error if update fails
     */
    // Update user
    updateUser: async (_, { user_id, input }, { dataSources }) => {
      try {
        const updated = await dataSources.userService.updateUser(user_id, input);
        if (!updated) throw new Error(`User with ID ${user_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateUser: ${err.message}`);
      }
    },

    /**
     * Update user role.
     * 
     * PRE-CONDITIONS:
     * - user_id and user_role must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated user
     * - Throws error if update fails
     */
    // Update user role
    updateUserRole: async (_, { user_id, user_role }, { dataSources }) => {
      try {
        const updated = await dataSources.userService.updateUserRole(user_id, user_role);
        if (!updated) throw new Error(`User with ID ${user_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateUserRole: ${err.message}`);
      }
    },

    /**
     * Update user status.
     * 
     * PRE-CONDITIONS:
     * - user_id and user_status must be provided
     * 
     * POST-CONDITIONS:
     * - Returns updated user
     * - Throws error if update fails
     */
    // Update user status
    updateUserStatus: async (_, { user_id, user_status }, { dataSources }) => {
      try {
        const updated = await dataSources.userService.updateUserStatus(user_id, user_status);
        if (!updated) throw new Error(`User with ID ${user_id} not found`);
        return updated;
      } catch (err) {
        throw new Error(`GraphQL Error - updateUserStatus: ${err.message}`);
      }
    },

    /**
     * Deactivate a user.
     * 
     * PRE-CONDITIONS:
     * - user_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns result of deactivation
     * - Throws error if operation fails
     */
    // Deactivate user
    deactivateUser: async (_, { user_id }, { dataSources }) => {
      try {
        return await dataSources.userService.deactivateUser(user_id);
      } catch (err) {
        throw new Error(`GraphQL Error - deactivateUser: ${err.message}`);
      }
    },

    /**
     * Save FCM token for a user.
     * 
     * PRE-CONDITIONS:
     * - user_id and fcm_token must be provided
     * 
     * POST-CONDITIONS:
     * - Stores token for notifications
     */
    saveFcmToken: async (_, { user_id, fcm_token }, { dataSources }) => {
      return await dataSources.userService.saveFcmToken(user_id, fcm_token);
    },

    /**
     * Clear FCM token for a user.
     * 
     * PRE-CONDITIONS:
     * - user_id must be provided
     * 
     * POST-CONDITIONS:
     * - Removes token from storage
     */
    clearFcmToken: async (_, { user_id }, { dataSources }) => {
      return await dataSources.userService.clearFcmToken(user_id);
    },
  },
};