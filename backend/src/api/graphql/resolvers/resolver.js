// src/api/graphql/resolvers/resolver.js

/**
 * This file aggregates and exports all GraphQL resolvers.
 * It combines individual resolver modules into a single array
 * that will be used by the GraphQL server.
 */

import { adminResolvers }          from './admin.resolver.js';
import { municipalityResolvers }   from './municipality.resolver.js';
import { residentResolvers }       from './resident.resolver.js';
import { responderResolvers }      from './responder.resolver.js';
import { evacuationResolvers }     from './evacuation.resolver.js';
import { userResolvers }           from './user.resolver.js';
import { fireResolvers }           from './fire.resolver.js';
import { fireAssignmentResolvers } from './fireAssignment.resolver.js';
import { alertResolvers }          from './alert.resolver.js';
import { notificationResolvers }   from './notification.resolver.js';

/**
 * Combines all resolver modules into a single resolver array.
 * 
 * PRE-CONDITIONS:
 * - All resolver modules must be correctly imported
 * - Each resolver must follow GraphQL resolver structure
 * 
 * POST-CONDITIONS:
 * - Returns an array containing all resolvers
 * - This array is used by the GraphQL server to resolve queries and mutations
 */

// Merged resolver array
export const resolvers = [
    adminResolvers,
    municipalityResolvers,
    residentResolvers,
    responderResolvers,
    evacuationResolvers,
    userResolvers,
    fireResolvers,
    fireAssignmentResolvers,
    alertResolvers,
    notificationResolvers,
];