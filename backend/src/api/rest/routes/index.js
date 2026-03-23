// src/api/rest/index.js

import { Router } from 'express';
import { authRoutes } from './auth.routes.js';

const restRouter = Router();

// AUTH
restRouter.use('/auth', authRoutes);

// GEO PROXY
// Proxies Nominatim reverse geocoding to avoid CORS issues from the browser
// and to keep rate limiting per-server rather than per-client IP.
// Simple in-memory cache to avoid hammering Nominatim on repeated coordinates.
const _geoCache = new Map();

restRouter.get('/geo/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

    const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;

    if (_geoCache.has(key)) {
      return res.json(_geoCache.get(key));
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=13&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'EshMagan/1.0' } }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `Nominatim returned ${response.status}` });
    }

    const data = await response.json();
    _geoCache.set(key, data);   // cache forever for this server session
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default restRouter;