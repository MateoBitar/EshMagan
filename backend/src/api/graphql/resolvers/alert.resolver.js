// src/api/graphql/resolvers/alert.resolver.js

/**
 * This file defines the GraphQL resolvers for Alert-related operations.
 * It is strictly READ-ONLY from the GraphQL perspective.
 * Alerts are not created, updated, or deleted through GraphQL,
 * but are instead managed internally by fire.service.js using NATS.
 * 
 * This resolver only provides query access to retrieve alert data.
 */

// Alerts are created internally by fire.service.js via NATS never by the client.
// This resolver is therefore READ-ONLY from the GraphQL perspective.
export const alertResolvers = {
  Query: {
    /**
     * Retrieves all active (non-expired) alerts in the system.
     * 
     * PRE-CONDITIONS:
     * - dataSources.alertService must be available
     * 
     * POST-CONDITIONS:
     * - Returns an array of active alert objects
     * - Throws an error if retrieval fails
     */
    // Fetch all active (non-expired) alerts
    getAllAlerts: async (_, __, { dataSources }) => {
      try {
        // Call service to retrieve all active alerts
        return await dataSources.alertService.getAllAlerts();
      } catch (err) {
        // Handle and rethrow error
        throw new Error(`GraphQL Error - getAllAlerts: ${err.message}`);
      }
    },

    /**
     * Retrieves a specific alert using its unique ID.
     * 
     * PRE-CONDITIONS:
     * - alert_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns the alert object if found
     * - Throws an error if alert does not exist or retrieval fails
     */
    // Fetch a single alert by ID
    getAlertById: async (_, { alert_id }, { dataSources }) => {
      try {
        // Fetch alert by ID
        const alert = await dataSources.alertService.getAlertById(alert_id);

        // Validate if alert exists
        if (!alert) throw new Error(`Alert with ID ${alert_id} not found`);

        return alert;
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertById: ${err.message}`);
      }
    },

    /**
     * Retrieves alerts filtered by their alert type.
     * (e.g., FireAlert, EvacuationAlert, PredictionAlert)
     * 
     * PRE-CONDITIONS:
     * - alert_type must be provided
     * 
     * POST-CONDITIONS:
     * - Returns a list of alerts matching the given type
     * - Throws an error if retrieval fails
     */
    // Fetch alerts by type (FireAlert, EvacuationAlert, PredictionAlert)
    getAlertsByAlertType: async (_, { alert_type }, { dataSources }) => {
      try {
        // Fetch alerts by type
        return await dataSources.alertService.getAlertsByAlertType(alert_type);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByAlertType: ${err.message}`);
      }
    },

    /**
     * Retrieves alerts based on the target user role.
     * (e.g., Resident, Responder, Municipality, Admin)
     * 
     * PRE-CONDITIONS:
     * - target_role must be provided
     * 
     * POST-CONDITIONS:
     * - Returns a list of alerts targeting the specified role
     * - Throws an error if retrieval fails
     */
    // Fetch alerts by target role (Resident, Responder, Municipality, Admin)
    getAlertsByTargetRole: async (_, { target_role }, { dataSources }) => {
      try {
        // Fetch alerts by target role
        return await dataSources.alertService.getAlertsByTargetRole(target_role);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByTargetRole: ${err.message}`);
      }
    },

    /**
     * Retrieves alerts that expire before or at a given timestamp.
     * 
     * PRE-CONDITIONS:
     * - expires_at must be provided (valid timestamp)
     * 
     * POST-CONDITIONS:
     * - Returns a list of alerts meeting the expiration condition
     * - Throws an error if retrieval fails
     */
    // Fetch alerts expiring before or at a given timestamp
    getAlertsByExpiration: async (_, { expires_at }, { dataSources }) => {
      try {
        // Fetch alerts by expiration date
        return await dataSources.alertService.getAlertsByExpiration(expires_at);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByExpiration: ${err.message}`);
      }
    },

    /**
     * Retrieves all active alerts associated with a specific fire ID.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns a list of alerts linked to the given fire
     * - Throws an error if retrieval fails
     */
    // Fetch all active alerts associated with a specific fire
    getAlertsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        // Fetch alerts by fire ID
        return await dataSources.alertService.getAlertsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByFireId: ${err.message}`);
      }
    },
  },

  // No Mutation block, alerts are created and deleted internally via NATS/fire.service.js
};