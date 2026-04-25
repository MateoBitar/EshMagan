// src/domain/repositories/user.repository.js

import { pool } from '../../config/db.js';
import { User } from '../entities/user.entity.js';
import { generateUserId } from '../../utils/id.utils.js';

/**
 * This file defines the UserRepository class.
 * It handles all database operations related to users,
 * including creation, retrieval, filtering, updates,
 * authentication-related queries, and FCM token management.
*/
export class UserRepository {
    /**
     * Create a new user.
     *
     * PRE-CONDITIONS:
     * - data must include user_email, user_password, user_role.
     *
     * POST-CONDITIONS:
     * - Generates a unique user_id.
     * - Inserts user into database.
     * - Returns created User entity.
    */
    async createUser(data) {
        // Generate sequential role-prefixed ID (R for resident, P for responder, M for municipality, A for admin)
        const user_id = await generateUserId(data.user_role);
        const { user_email, user_password, user_phone, user_role } = data;

        const userSql = `
                    INSERT INTO users (user_id, user_email, user_password,
                                       user_phone, user_role, isactive, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), null) 
                    RETURNING *;
        `;
        const userValues = [user_id, user_email, user_password, user_phone, user_role, true];
        const { rows: userRows } = await pool.query(userSql, userValues);

        return User.fromEntity(userRows[0]);
    }

    /**
     * Retrieve all users.
     *
     * PRE-CONDITIONS:
     * - Database connection must be available.
     *
     * POST-CONDITIONS:
     * - Returns array of users.
     * - Returns empty array if none found.
    */
    async getAllUsers() {
        // Retrieves all users without filters
        const sql = `
                SELECT user_id, user_email, user_phone,
                       user_role, isactive, created_at, updated_at 
                FROM users 
                ORDER BY created_at DESC 
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => User.fromEntity(row));
    }

    /**
     * Retrieve user by ID.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns User if found.
     * - Returns null if not found.
    */
    async getUserById(user_id) {
        // Retrieves a user by their unique ID
        const sql = `
                SELECT user_id, user_email, user_password, user_phone,
                       user_role, isactive, created_at, updated_at 
                FROM users 
                WHERE user_id=$1
        `;
        const { rows } = await pool.query(sql, [user_id]);
        if (rows.length === 0) {
            return null; // No users found
        }

        return User.fromEntity(rows[0]);
    }

    /**
     * Retrieve user by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns User if found.
     * - Returns null if not found.
    */
    async getUserByEmail(user_email) {
        // Retrieves a user by their email address 
        const sql = `
                SELECT user_id, user_email, user_phone,
                       user_role, isactive, created_at, updated_at 
                FROM users 
                WHERE user_email=$1
        `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) {
            return null; // No users found
        }

        return User.fromEntity(rows[0]);
    }

    /**
     * Retrieve user by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns User if found.
     * - Returns null if not found.
    */
    async getUserByPhone(user_phone) {
        // Retrieves a user by their phone number
        const sql = `
                SELECT user_id, user_email, user_phone,
                       user_role, isactive, created_at, updated_at 
                FROM users 
                WHERE user_phone=$1
        `;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) {
            return null; // No users found
        }

        return User.fromEntity(rows[0]);
    }

    /**
     * Retrieve users by role.
     *
     * PRE-CONDITIONS:
     * - user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Returns users with given role.
     * - Returns empty array if none found.
    */
    async getUsersByRole(user_role) {
        // Retrieves all users by a specific role
        const sql = `
                SELECT user_id, user_email, user_phone,
                       user_role, isactive, created_at, updated_at 
                FROM users 
                WHERE user_role=$1
        `;
        const { rows } = await pool.query(sql, [user_role]);
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => User.fromEntity(row));
    }

    /**
     * Retrieve active users.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Returns users where isactive = true.
     * - Returns empty array if none found.
    */
    async getActiveUsers() {
        // Retrieves all active users
        const sql = `
                SELECT user_id, user_email, user_phone,
                       user_role, isactive, created_at, updated_at 
                FROM users 
                WHERE isactive=true
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => User.fromEntity(row));
    }

    /**
     * Retrieve inactive users.
     *
     * PRE-CONDITIONS:
     * - None.
     *
     * POST-CONDITIONS:
     * - Returns users where isactive = false.
     * - Returns empty array if none found.
    */
    async getInActiveUsers() {
        // Retrieves all inactive users
        const sql = `
                SELECT user_id, user_email, user_phone, 
                       user_role, isactive, created_at, updated_at 
                FROM users 
                WHERE isactive=false`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => User.fromEntity(row));
    }

    /**
     * Retrieve active user by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns active user if found.
     * - Returns null otherwise.
    */
    async getUserByEmailAndActive(user_email) {
        // Retrieves a user by email only if active 
        const sql = `
            SELECT user_id, user_email, user_password, user_phone,
                   user_role, isactive, created_at, updated_at 
            FROM users 
            WHERE user_email = $1 AND isactive = true 
        `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) {
            return null;
        }

        return User.fromEntity(rows[0]);
    }

    /**
     * Update user fields dynamically.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     * - data may include email, phone, role, password, or status.
     *
     * POST-CONDITIONS:
     * - Updates provided fields.
     * - Returns updated User entity.
     * - Returns null if user not found or no update performed.
    */
    async updateUser(user_id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Add fields dynamically if provided
        if (data.user_email) {
            fields.push(`user_email = $${idx++}`);
            values.push(data.user_email);
        }
        if (data.user_phone) {
            fields.push(`user_phone = $${idx++}`);
            values.push(data.user_phone);
        }
        if (data.user_role) {
            fields.push(`user_role = $${idx++}`);
            values.push(data.user_role);
        }
        if (data.isactive !== undefined) {
            fields.push(`isactive = $${idx++}`);
            values.push(data.isactive);
        }
        if (data.user_password) {
            fields.push(`user_password = $${idx++}`);
            values.push(data.user_password);
        }

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run update if there are fields to change
        if (fields.length > 0) {
            const sql = ` 
                    UPDATE users SET ${fields.join(', ')} 
                    WHERE user_id = $${idx} 
                    RETURNING user_id, user_email, user_password, user_phone, 
                              user_role, isactive,
                              created_at AS user_created_at,
                              updated_at AS user_updated_at
            `;
            values.push(user_id);
            const { rows } = await pool.query(sql, values);
            if (rows.length === 0) {
                return null; // No user found 
            }
            return User.fromEntity(rows[0]);
        }
        return null; // nothing to update
    }

    /**
     * Update user role.
     *
     * PRE-CONDITIONS:
     * - user_id and user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Updates user role.
     * - Returns updated User entity.
     * - Returns null if user not found.
    */
    async updateUserRole(user_id, user_role) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Add role update
        if (user_role) {
            fields.push(`user_role = $${idx++}`);
            values.push(user_role);
        }

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Step 2: Run update if fields exist
        if (fields.length > 0) {
            const sql = `
                UPDATE users
                SET ${fields.join(', ')}
                WHERE user_id = $${idx}
                RETURNING user_id, user_email, user_password, user_phone, user_role, isactive, created_at, updated_at
            `;
            values.push(user_id);

            const { rows } = await pool.query(sql, values);
            if (rows.length === 0) {
                return null; // No user found
            }

            return User.fromEntity(rows[0]);
        }
        return null; // nothing to update
    }

    /**
     * Update user active status.
     *
     * PRE-CONDITIONS:
     * - user_id and user_status must be provided.
     *
     * POST-CONDITIONS:
     * - Updates isactive field.
     * - Returns updated User entity.
     * - Returns null if user not found.
    */
    async updateUserStatus(user_id, user_status) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Add status update if provided
        if (user_status !== undefined) {
            fields.push(`isactive = $${idx++}`);
            values.push(user_status);
        }

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Step 2: Run update if fields exist
        if (fields.length > 0) {
            const sql = `
                UPDATE users
                SET ${fields.join(', ')}
                WHERE user_id = $${idx}
                RETURNING user_id, user_email, user_password, user_phone, user_role, isactive, created_at, updated_at
            `;
            values.push(user_id);

            const { rows } = await pool.query(sql, values);
            if (rows.length === 0) {
                return null; // No user found
            }

            return User.fromEntity(rows[0]);
        }

        return null; // nothing to update
    }

    /**
     * Update last login timestamp.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Updates updated_at timestamp.
     * - Returns updated User entity.
     * - Returns null if user not found.
    */
    async updateLastLogin(user_id) {
        // Updates the last login timestamp for a user
        const sql = `
            UPDATE users
            SET updated_at = NOW()
            WHERE user_id = $1
            RETURNING user_id, user_email, user_password, user_phone, user_role, isactive, created_at, updated_at
        `;
        const { rows } = await pool.query(sql, [user_id]);

        if (rows.length === 0) {
            return null;
        }

        return User.fromEntity(rows[0]);
    }

    /**
     * Deactivate user.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Sets isactive to false.
     * - Returns true if successful.
     * - Returns false if user not found.
    */
    async deactivateUser(user_id) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Add deactivation
        fields.push(`isactive = false`);

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Step 2: Build SQL
        const sql = `
            UPDATE users
            SET ${fields.join(', ')}
            WHERE user_id = $${idx}
            RETURNING user_id, user_email, user_password, user_phone, user_role, isactive, created_at, updated_at
        `;
        values.push(user_id);

        // Step 3: Execute query
        const { rows } = await pool.query(sql, values);
        if (rows.length === 0) {
            return false; // No user found
        }

        return true;
    }

    /**
     * Filter users with pagination.
     *
     * PRE-CONDITIONS:
     * - filters and pagination are optional.
     *
     * POST-CONDITIONS:
     * - Returns filtered users.
     * - Applies limit and offset.
    */
    async filterUsers(filters = {}, pagination = { limit: 10, offset: 0 }) {
        const conditions = [];
        const values = [];
        let idx = 1;

        // Step 1: Add filters dynamically
        if (filters.role) {
            conditions.push(`user_role = $${idx++}`);
            values.push(filters.role);
        }
        if (filters.isactive !== undefined) {
            conditions.push(`isactive = $${idx++}`);
            values.push(filters.isactive);
        }

        // Step 2: Build SQL with dynamic conditions
        let sql = `
            SELECT user_id, user_email, user_password, user_phone, user_role, isactive, created_at, updated_at
            FROM users
            WHERE 1=1
        `;
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }
        sql += ` ORDER BY created_at DESC LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;

        // Step 3: Execute query
        const { rows: userRows } = await pool.query(sql, values);

        // Step 4: Return entities 
        return userRows.map(row => User.fromEntity(row));
    }

    /**
     * Count users with filters.
     *
     * PRE-CONDITIONS:
     * - filters are optional.
     *
     * POST-CONDITIONS:
     * - Returns number of matching users.
    */
    async countUsers(filters = {}) {
        const conditions = [];
        const values = [];
        let idx = 1;

        // Step 1: Add filters dynamically
        if (filters.role) {
            conditions.push(`user_role = $${idx++}`);
            values.push(filters.role);
        }
        if (filters.isactive !== undefined) {
            conditions.push(`isactive = $${idx++}`);
            values.push(filters.isactive);
        }

        // Step 2: Build SQL with dynamic conditions
        let sql = `SELECT COUNT(*) FROM users WHERE 1=1`;
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }

        // Step 3: Execute query
        const { rows } = await pool.query(sql, values);

        // Step 4: Return count
        return parseInt(rows[0].count, 10);
    }

    /**
     * Save FCM token for a user.
     *
     * PRE-CONDITIONS:
     * - user_id and fcm_token must be provided.
     *
     * POST-CONDITIONS:
     * - Updates user's FCM token.
     * - Returns updated user row or null.
    */
    async saveFcmToken(user_id, fcm_token) {
        const sql = `
            UPDATE users
            SET fcm_token = $1, updated_at = NOW()
            WHERE user_id = $2
            RETURNING *;
        `;
        const { rows } = await pool.query(sql, [fcm_token, user_id]);
        return rows[0] || null;
    }

    /**
     * Clear FCM token for a user.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Removes FCM token.
     * - Returns true if successful.
    */
    async clearFcmToken(user_id) {
        const sql = `
            UPDATE users
            SET fcm_token = NULL, updated_at = NOW()
            WHERE user_id = $1
            RETURNING user_id;
        `;
        const { rows } = await pool.query(sql, [user_id]);
        return rows.length > 0;
    }

    /**
     * Retrieve users with FCM tokens by role.
     *
     * PRE-CONDITIONS:
     * - user_role must be provided.
     *
     * POST-CONDITIONS:
     * - Returns users with non-null FCM tokens.
     * - Returns empty array if none found.
    */
    async getUsersWithFcmByRole(user_role) {
        let sql;

        if (user_role === 'Municipality') {
            sql = `
            SELECT 
                u.user_id,
                u.user_role,
                u.fcm_token,
                ST_AsText(m.municipality_location::geometry) AS municipality_location
            FROM users u
            JOIN municipalitydetails m
                ON u.user_id = m.municipality_id
            WHERE u.user_role = $1
            AND u.isactive = true
            AND u.fcm_token IS NOT NULL;
        `;
        } else if (user_role === 'Resident') {
            sql = `
            SELECT 
                u.user_id,
                u.user_role,
                u.fcm_token,
                ST_AsText(res.last_known_location::geometry) AS last_known_location
            FROM users u
            JOIN residentdetails res
                ON u.user_id = res.resident_id
            WHERE u.user_role = $1
            AND u.isactive = true
            AND u.fcm_token IS NOT NULL;
        `;
        } else if (user_role === 'Responder') {
            sql = `
            SELECT 
                u.user_id,
                u.user_role,
                u.fcm_token,
                ST_AsText(r.last_known_location::geometry) AS last_known_location
            FROM users u
            JOIN responderdetails r
                ON u.user_id = r.responder_id
            WHERE u.user_role = $1
            AND u.isactive = true
            AND u.fcm_token IS NOT NULL;
        `;
        } else {
            return [];
        }

        const { rows } = await pool.query(sql, [user_role]);
        return rows;
    }
    
    /**
     * Retrieve FCM token by user ID.
     *
     * PRE-CONDITIONS:
     * - user_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns FCM token if exists.
     * - Returns null otherwise.
    */
    async getFcmTokenByUserId(user_id) {
        const sql = `
            SELECT fcm_token
            FROM users
            WHERE user_id = $1
            AND isactive = true
            AND fcm_token IS NOT NULL
            LIMIT 1;
        `;
        const { rows } = await pool.query(sql, [user_id]);
        return rows[0]?.fcm_token || null;
    }

    /**
     * Remove FCM token by token value.
     *
     * PRE-CONDITIONS:
     * - token must be provided.
     *
     * POST-CONDITIONS:
     * - Removes token from users.
     * - Returns true if any record updated.
    */
    async removeFcmToken(token) {
        const sql = `
            UPDATE users
            SET fcm_token = NULL, updated_at = NOW()
            WHERE fcm_token = $1
        `;
        const { rows } = await pool.query(sql, [token]);
        return rows.length > 0;
    }
}
