// src/api/graphql/schema/schema.js

import gql from 'graphql-tag';
import { adminTypeDefs }          from './admin.schema.js';
import { municipalityTypeDefs }   from './municipality.schema.js';
import { residentTypeDefs }       from './resident.schema.js';
import { responderTypeDefs }      from './responder.schema.js';
import { evacuationTypeDefs }     from './evacuation.schema.js';
import { userTypeDefs }           from './user.schema.js';
import { fireTypeDefs }           from './fire.schema.js';
import { fireAssignmentTypeDefs } from './fireAssignment.schema.js';
import { alertTypeDefs }          from './alert.schema.js';
import { notificationTypeDefs }   from './notification.schema.js';

/**
 * This file defines the root GraphQL schema and merges all domain-specific
 * schema definitions into a single export used by the GraphQL server.
 */

// Root types must exist so that "extend type Query/Mutation" in each schema works
/**
 * Defines root Query and Mutation types
 * 
 * PRE-CONDITIONS:
 * - Must exist before extending Query/Mutation in other schema files
 * 
 * POST-CONDITIONS:
 * - Enables all schema modules to extend Query and Mutation
 */
export const rootTypeDefs = gql`
    type Query
    type Mutation
`;

// Merge all domain-specific schemas into one array
/**
 * Combines all schema definitions into a single array
 * 
 * PRE-CONDITIONS:
 * - All schema modules must be correctly imported
 * 
 * POST-CONDITIONS:
 * - Returns unified schema definition used by GraphQL server
 */
export const typeDefs = [
    rootTypeDefs,
    adminTypeDefs,
    municipalityTypeDefs,
    residentTypeDefs,
    responderTypeDefs,
    evacuationTypeDefs,
    userTypeDefs,
    fireTypeDefs,
    fireAssignmentTypeDefs,
    alertTypeDefs,
    notificationTypeDefs,
];