// src/domain/repositories/refreshToken.repository.js

// Manages refresh tokens in a dedicated table.
import { pool } from '../../config/db.js';

export class RefreshTokenRepository {

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
