// src/utils/jwt.utils.js

// Two-token strategy:
//   - Access Token:  short-lived (15 minutes), sent with every request
//   - Refresh Token: no expiry, stored in DB, invalidated only on logout

import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../config/env.js';

const ACCESS_SECRET  = JWT_ACCESS_SECRET;
const REFRESH_SECRET = JWT_REFRESH_SECRET;

if (!ACCESS_SECRET)  throw new Error("Missing required env variable: JWT_ACCESS_SECRET");
if (!REFRESH_SECRET) throw new Error("Missing required env variable: JWT_REFRESH_SECRET");

// Generates a short-lived access token (15 minutes)
// Payload: { user_id, user_role }
export function generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

// Generates a refresh token with NO expiry
// It lives forever: invalidated only by deleting it from the DB on logout
export function generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET); // no expiresIn → never expires
}

// Verifies an access token, throws if invalid or expired
export function verifyAccessToken(token) {
    try {
        return jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
        throw new Error(`Invalid or expired access token: ${err.message}`);
    }
}

// Verifies a refresh token, throws if invalid or tampered
export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
        throw new Error(`Invalid refresh token: ${err.message}`);
    }
}