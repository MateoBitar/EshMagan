// src/api/graphql/resolvers/resolver.js

import { adminResolvers } from './admin.resolver.js';
import { municipalityResolvers } from './municipality.resolver.js';
import { residentResolvers } from './resident.resolver.js';
import { responderResolvers } from './responder.resolver.js';
import { evacuationResolvers } from './evacuation.resolver.js';

// Merge all domain-specific resolvers into one array
export const resolvers = [
  adminResolvers,
  municipalityResolvers,
  residentResolvers,
  responderResolvers,
  evacuationResolvers,
];