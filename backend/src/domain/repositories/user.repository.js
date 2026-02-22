// src/domain/repositories/user.repository.js

import { pool } from '../../config/db.js';
import { User } from '../entities/user.entity.js';
import { generateUserId } from '../../utils/id.utils.js';

export class UserRepository {
    async createUser(data) {
        // Generate sequential role-prefixed ID (R for resident, P for responder, M for municipality, A for admin)
        const user_id = await generateUserId(data.user_role);
        const { user_email, user_password, user_phone, user_role } = data;

        const userSql = `
                    INSERT INTO users (user_id, user_email, user_password,
                                       user_phone, user_role, isactive, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
                    RETURNING *;
        `;
        const userValues = [user_id, user_email, user_password, user_phone, user_role, true];
        const { rows: userRows } = await pool.query(userSql, userValues);

        return User.fromEntity(userRows[0]);
    }

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

    async getUserById(user_id) { 
        // Retrieves a user by their unique ID
        const sql = `
                SELECT user_id, user_email, user_phone,
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

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run update if there are fields to change
        if (fields.length > 1) {
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

    async updateLastLogin(user_id) {
        // Updates the last login timestamp for a user
        const sql = `
            UPDATE users
            SET last_login = NOW(), updated_at = NOW()
            WHERE user_id = $1
            RETURNING user_id, user_email, user_password, user_phone, user_role, isactive, created_at, updated_at, last_login
        `;
        const { rows } = await pool.query(sql, [user_id]);

        if (rows.length === 0) {
            return null;
        }

        return User.fromEntity(rows[0]);
    }

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
}
