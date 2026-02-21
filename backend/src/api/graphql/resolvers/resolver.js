// src/api/graphql/resolvers/resolver.js

import { adminResolvers } from './admin.resolver.js';
import { municipalityResolvers } from './municipality.resolver.js';
import { residentResolvers } from './resident.resolver.js';
import { responderResolvers } from './responder.resolver.js';
import { evacuationResolvers } from './evacuation.resolver.js';
import { userResolvers } from './user.resolver.js';
import { fireResolvers } from './fire.resolver.js';
import { fireAssignmentResolvers } from './fireAssignment.resolver.js';

// Merge all domain-specific resolvers into one array
export const resolvers = [
  adminResolvers,
  municipalityResolvers,
  residentResolvers,
  responderResolvers,
  evacuationResolvers,
  userResolvers,
  fireResolvers,
  fireAssignmentResolvers,
];