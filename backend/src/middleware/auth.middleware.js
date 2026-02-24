// src/api/middleware/auth.middleware.js

import { verifyAccessToken } from '../utils/jwt.utils.js';

// Verifies the access token from the Authorization header.
// If valid, attaches the decoded payload to req.user and calls next().
// If invalid or missing, responds with 401 immediately.
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access token missing or malformed' });
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);

        req.user = payload; // { user_id, user_role }
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired access token' });
    }
};
