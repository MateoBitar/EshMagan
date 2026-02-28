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

// Root types must exist so that "extend type Query/Mutation" in each schema works
export const rootTypeDefs = gql`
    type Query
    type Mutation
`;

// Merge all domain-specific schemas into one array
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