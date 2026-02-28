// src/api/graphql/resolvers/user.resolver.js

export const userResolvers = {
  Query: {
    // Fetch all users
    getAllUsers: async (_, __, { dataSources }) => {
      try {
        return await dataSources.userService.getAllUsers();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllUsers: ${err.message}`);
      }
    },

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

    // Fetch users by role
    getUsersByRole: async (_, { user_role }, { dataSources }) => {
      try {
        return await dataSources.userService.getUsersByRole(user_role);
      } catch (err) {
        throw new Error(`GraphQL Error - getUsersByRole: ${err.message}`);
      }
    },

    // Fetch active users
    getActiveUsers: async (_, __, { dataSources }) => {
      try {
        return await dataSources.userService.getActiveUsers();
      } catch (err) {
        throw new Error(`GraphQL Error - getActiveUsers: ${err.message}`);
      }
    },

    // Fetch inactive users
    getInActiveUsers: async (_, __, { dataSources }) => {
      try {
        return await dataSources.userService.getInActiveUsers();
      } catch (err) {
        throw new Error(`GraphQL Error - getInActiveUsers: ${err.message}`);
      }
    },

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

    // Filter users with pagination
    filterUsers: async (_, { filters, pagination }, { dataSources }) => {
      try {
        return await dataSources.userService.filterUsers(filters, pagination);
      } catch (err) {
        throw new Error(`GraphQL Error - filterUsers: ${err.message}`);
      }
    },

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
    // Create a new user
    createUser: async (_, { input }, { dataSources }) => {
      try {
        return await dataSources.userService.createUser(input);
      } catch (err) {
        throw new Error(`GraphQL Error - createUser: ${err.message}`);
      }
    },

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

    // Deactivate user
    deactivateUser: async (_, { user_id }, { dataSources }) => { 
      try { 
        return await dataSources.userService.deactivateUser(user_id); 
      } catch (err) { 
        throw new Error(`GraphQL Error - deactivateUser: ${err.message}`); 
      } 
    },
  },
};
