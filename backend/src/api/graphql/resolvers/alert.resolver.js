// src/api/graphql/resolvers/alert.resolver.js

// Alerts are created internally by fire.service.js via NATS never by the client.
// This resolver is therefore READ-ONLY from the GraphQL perspective.
export const alertResolvers = {
  Query: {
    // Fetch all active (non-expired) alerts
    getAllAlerts: async (_, __, { dataSources }) => {
      try {
        return await dataSources.alertService.getAllAlerts();
      } catch (err) {
        throw new Error(`GraphQL Error - getAllAlerts: ${err.message}`);
      }
    },

    // Fetch a single alert by ID
    getAlertById: async (_, { alert_id }, { dataSources }) => {
      try {
        const alert = await dataSources.alertService.getAlertById(alert_id);
        if (!alert) throw new Error(`Alert with ID ${alert_id} not found`);
        return alert;
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertById: ${err.message}`);
      }
    },

    // Fetch alerts by type (FireAlert, EvacuationAlert, PredictionAlert)
    getAlertsByAlertType: async (_, { alert_type }, { dataSources }) => {
      try {
        return await dataSources.alertService.getAlertsByAlertType(alert_type);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByAlertType: ${err.message}`);
      }
    },

    // Fetch alerts by target role (Resident, Responder, Municipality, Admin)
    getAlertsByTargetRole: async (_, { target_role }, { dataSources }) => {
      try {
        return await dataSources.alertService.getAlertsByTargetRole(target_role);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByTargetRole: ${err.message}`);
      }
    },

    // Fetch alerts expiring before or at a given timestamp
    getAlertsByExpiration: async (_, { expires_at }, { dataSources }) => {
      try {
        return await dataSources.alertService.getAlertsByExpiration(expires_at);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByExpiration: ${err.message}`);
      }
    },

    // Fetch all active alerts associated with a specific fire
    getAlertsByFireId: async (_, { fire_id }, { dataSources }) => {
      try {
        return await dataSources.alertService.getAlertsByFireId(fire_id);
      } catch (err) {
        throw new Error(`GraphQL Error - getAlertsByFireId: ${err.message}`);
      }
    },
  },

  // No Mutation block, alerts are created and deleted internally via NATS/fire.service.js
};
