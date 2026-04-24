// src/api/rest/index.js

import { Router } from 'express';
import { authRoutes } from './auth.routes.js';

/**
 * This file defines the main REST router.
 * It mounts authentication routes and provides a proxy endpoint
 * for reverse geocoding using Nominatim with caching support.
 */

const restRouter = Router();

/**
 * Mount authentication routes
 * 
 * PRE-CONDITIONS:
 * - authRoutes must be defined and imported
 * 
 * POST-CONDITIONS:
 * - All /auth endpoints are registered
 */
// AUTH
restRouter.use('/auth', authRoutes);

// GEO PROXY
// Proxies Nominatim reverse geocoding to avoid CORS issues from the browser
// and to keep rate limiting per-server rather than per-client IP.
// Simple in-memory cache to avoid hammering Nominatim on repeated coordinates.

/**
 * In-memory cache for geolocation responses
 * 
 * PRE-CONDITIONS:
 * - Server must be running
 * 
 * POST-CONDITIONS:
 * - Stores cached responses to reduce API calls
 */
const _geoCache = new Map();

/**
 * Reverse geocoding endpoint using Nominatim API
 * 
 * PRE-CONDITIONS:
 * - lat and lon query parameters must be provided
 * 
 * POST-CONDITIONS:
 * - Returns location data from cache or external API
 * - Stores result in cache
 * - Handles API and server errors
 */
restRouter.get('/geo/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

    // Normalize coordinates for caching key
    const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;

    // Check cache first
    if (_geoCache.has(key)) {
      return res.json(_geoCache.get(key));
    }

    // Fetch from Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=13&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'EshMagan/1.0' } }
    );

    // Handle external API errors
    if (!response.ok) {
      return res.status(response.status).json({ error: `Nominatim returned ${response.status}` });
    }

    const data = await response.json();

    // Cache result
    _geoCache.set(key, data);   // cache forever for this server session

    // Return response
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Export main REST router
 * 
 * PRE-CONDITIONS:
 * - Routes must be defined
 * 
 * POST-CONDITIONS:
 * - Router is available for use in server setup
 */
export default restRouter;