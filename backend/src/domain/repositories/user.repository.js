// src/domain/repositories/user.repository.js

import { pool } from '../../config/db.js';
import { User } from '../entities/user.entity.js';

export class UserRepository {
    async createUser(data) {
        // Creates a new user record in the database
        const userSql = `INSERT INTO users (user_id, user_email, user_password,
                        user_phone, user_role, isactive, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
                        RETURNING *;`;
        const userValues = [data.user_id, data.user_email, data.user_password, data.user_phone, data.user_role, true];
        const { rows } = await pool.query(userSql, userValues);

        return rows[0] ? new User(rows[0]) : null; 
    }

    async getAllUsers() {
        // Retrieves all users without filters
        const sql = `SELECT user_id, user_email, user_phone, user_role,
                    isactive, created_at, updated_at 
                    FROM users ORDER BY created_at DESC`; 
        const { rows } = await pool.query(sql); 
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => new User({
            user_id: row.user_id,
            user_email: row.user_email,
            user_phone: row.user_phone,
            user_role: row.user_role,
            isactive: row.isactive,
            created_at: row.created_at,
            updated_at: row.updated_at 
        }));
    }

    async getUserById(user_id) { 
        // Retrieves a user by their unique ID
        const sql = `SELECT user_id, user_email, user_phone, user_role,
                    isactive, created_at, updated_at FROM users 
                    WHERE user_id=$1`; 
        const { rows } = await pool.query(sql, [user_id]); 
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => new User({
            user_id: row.user_id,
            user_email: row.user_email,
            user_phone: row.user_phone,
            user_role: row.user_role,
            isactive: row.isactive,
            created_at: row.created_at,
            updated_at: row.updated_at 
        }));   
    }

    async getUserByEmail(user_email) { 
        // Retrieves a user by their email address 
        const sql = `SELECT user_id, user_email, user_phone,
                    user_role, isactive, created_at, updated_at 
                    FROM users WHERE user_email=$1`; 
        const { rows } = await pool.query(sql, [user_email]); 
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => new User({
            user_id: row.user_id,
            user_email: row.user_email,
            user_phone: row.user_phone,
            user_role: row.user_role,
            isactive: row.isactive,
            created_at: row.created_at,
            updated_at: row.updated_at 
        }));   
    }

    async getUserByPhone(user_phone) { 
        // Retrieves a user by their phone number
        const sql = `SELECT user_id, user_email, user_phone, user_role,
                    isactive, created_at, updated_at FROM users 
                    WHERE user_phone=$1`;
        const { rows } = await pool.query(sql, [user_phone]); 
        if (rows.length === 0) {
            return []; // No users found
        }

        return rows.map(row => new User({
            user_id: row.user_id,
            user_email: row.user_email,
            user_phone: row.user_phone,
            user_role: row.user_role,
            isactive: row.isactive,
            created_at: row.created_at,
            updated_at: row.updated_at 
        }));  
    }

    async getUsersByRole(user_role) {
        // Retrieves all users by a specific role
        const sql = `SELECT user_id, user_email, user_phone, user_role,
                    isactive, created_at, updated_at FROM users 
                    WHERE user_role=$1`;
        const { rows } = await pool.query(sql, [user_role]);
        if (rows.length === 0) {
                return null; // User not found
        }

        return rows.map(row => new User(row));
    }

    async getActiveUsers() {
        // Retrieves all active users
        const sql = `SELECT user_id, user_email, user_phone, user_role, 
                    isactive, created_at, updated_at FROM users 
                    WHERE isactive=true`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
                return null; // User not found
        }

        return rows.map(row => new User(row));
    }

    async getInActiveUsers() {
        // Retrieves all inactive users
        const sql = `SELECT user_id, user_email, user_phone, user_role,
                    isactive, created_at, updated_at FROM users 
                    WHERE isactive=false`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
                return null; // User not found
        }
        
        return rows.map(row => new User(row));
    }

    async updateUser(user_id, updates) { 
        // Updates a user's details (email, phone, role, status)
        const sql = `UPDATE users SET user_email=$2, user_phone=$3,
                    user_role=$4, isactive=$5, updated_at=NOW() 
                    WHERE user_id=$1 RETURNING user_id, user_email, 
                    user_phone, user_role, isactive, created_at, updated_at`; 
        const values = [user_id, updates.user_email, updates.user_phone, updates.user_role, updates.isactive]; 
        const { rows } = await pool.query(sql, values); 
        if (rows.length === 0) {
                return null; // User not found
        }
        
        return new User(rows[0]); 
    }
    
    async updateUserRole(user_id, user_role) { 
        // Updates only the role of a user 
        const sql = `UPDATE users SET user_role=$2, updated_at=NOW() 
                    WHERE user_id=$1 RETURNING user_id, user_email, 
                    user_phone, user_role, isactive, created_at, updated_at`; 
        const { rows } = await pool.query(sql, [user_id, user_role]); 
        if (rows.length === 0) {
                return null; // User not found
        }
        
        return new User(rows[0]); 
    } 

    async updateUserStatus(user_id, user_status) { 
        // Updates only the active/inactive status of a user 
        const sql = `UPDATE users SET isactive=$2, updated_at=NOW() 
                    WHERE user_id=$1 RETURNING user_id, user_email, user_phone,
                    user_role, isactive, created_at, updated_at`; 
        const { rows } = await pool.query(sql, [user_id, user_status]);
        if (rows.length === 0) {
                return null; // User not found
        }
        
        return new User(rows[0]); 
    }

    async deactivateUser(user_id) {
    const sql = `UPDATE users SET isactive=false, updated_at=NOW()
                WHERE user_id=$1`;
    const result = await pool.query(sql, [user_id]);
    return result.rowCount > 0;
    }

    async filterUsers(filters={}, pagination={limit:10, offset:0}) { 
        // Retrieves all users with optional filters and pagination 
        let sql = `SELECT user_id, user_email, user_phone, user_role,
                isactive, created_at, updated_at FROM users WHERE 1=1`; 
        const values = []; 
        if (filters.role) { 
            values.push(filters.role); 
            sql += ` AND user_role=$${values.length}`; 
        } 
        if (filters.isactive !== undefined) { 
            values.push(filters.isactive); 
            sql += ` AND isactive=$${values.length}`; 
        } 
        sql += `LIMIT ${pagination.limit} OFFSET ${pagination.offset}`; 
        const { rows } = await pool.query(sql, values); 
        
        return rows.map(row => new User(row)); 
    }

    async countUsers(filters={}) {
        // Counts users based on optional filters
        let sql = `SELECT COUNT(*) FROM users WHERE 1=1`;
        const values = [];
        if (filters.role) { values.push(filters.role); 
            sql += ` AND user_role=$${values.length}`; 
        }
        if (filters.isactive !== undefined) { 
            values.push(filters.isactive); 
            sql += ` AND isactive=$${values.length}`; 
        }
        const { rows } = await pool.query(sql, values);

        return parseInt(rows[0].count, 10);
    }
}
