// src/domain/repositories/refreshToken.repository.js

// Manages refresh tokens in a dedicated table.
import { pool } from '../../config/db.js';

/**
 * This repository manages refresh tokens stored in the database.
 * It handles creation, lookup, and deletion of refresh tokens
 * to support authentication and session management.
 */
export class RefreshTokenRepository {

    /**
     * Save a new refresh token.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided and must exist.
     * - token must be a valid refresh token string.
     *
     * POST-CONDITIONS:
     * - Inserts a new refresh token into the database.
     * - Returns the created token record.
     * - Returns null if insertion fails.
     */
    // Saves a new refresh token for a user.
    // Called on every login and every token rotation.
    async saveToken(user_id, token) {
        const sql = `
            INSERT INTO refresh_tokens (user_id, token, created_at)
            VALUES ($1, $2, NOW())
            RETURNING id, user_id, token, created_at
        `;
        const { rows } = await pool.query(sql, [user_id, token]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    /**
     * Find a refresh token by its value.
     *
     * PRE-CONDITIONS:
     * - token must be provided.
     *
     * POST-CONDITIONS:
     * - Returns the token record if found.
     * - Returns null if token does not exist.
     */
    // Finds a refresh token record by token string.
    // Used to validate that the token exists in DB before issuing a new access token.
    async findToken(token) {
        const sql = `
            SELECT id, user_id, token, created_at
            FROM refresh_tokens
            WHERE token = $1
        `;
        const { rows } = await pool.query(sql, [token]);
        if (rows.length === 0) return null;
        return rows[0];
    }

    /**
     * Delete a specific refresh token.
     *
     * PRE-CONDITIONS:
     * - token must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes the token if it exists.
     * - Returns true if deleted.
     * - Returns false if token was not found.
     */
    // Deletes a specific refresh token, called on logout.
    // Returns true if deleted, false if token wasn't found.
    async deleteToken(token) {
        const sql = `
            DELETE FROM refresh_tokens
            WHERE token = $1
            RETURNING id
        `;
        const { rows } = await pool.query(sql, [token]);
        return rows.length > 0;
    }

    /**
     * Delete all refresh tokens for a user.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes all tokens associated with the user.
     * - Returns true if at least one token was deleted.
     * - Returns false if no tokens were found.
     */
    // Deletes ALL refresh tokens for a user.
    // Called when a user changes their password or gets deactivated to 
    // invalidate all existing sessions.
    async deleteAllTokensForUser(user_id) {
        const sql = `
            DELETE FROM refresh_tokens
            WHERE user_id = $1
            RETURNING id
        `;
        const { rows } = await pool.query(sql, [user_id]);
        return rows.length > 0;
    }
}