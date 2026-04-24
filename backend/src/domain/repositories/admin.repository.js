// src/domain/repositories/admin.repository.js

import { pool } from '../../config/db.js';
import { Admin } from '../entities/admin.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

/**
 * This file defines the AdminRepository class.
 * It handles all database operations related to Admin entities,
 * including creation, retrieval, and deactivation.
 */
export class AdminRepository {

    /**
     * Create a new admin record
     * 
     * PRE-CONDITIONS:
     * - admin_id, admin_fname, admin_lname must be provided
     * - Corresponding user must already exist
     * 
     * POST-CONDITIONS:
     * - Inserts new admin into database
     * - Returns Admin entity
     */
    async createAdmin(data) {
        const { admin_id, admin_fname, admin_lname, user } = data;

        const adminSql = `
            INSERT INTO admins (admin_id, admin_fname, admin_lname)
            VALUES ($1, $2, $3)
            RETURNING admin_id, admin_fname, admin_lname
        `;
        const adminValues = [admin_id, admin_fname, admin_lname];
        const { rows: adminRows } = await pool.query(adminSql, adminValues);

        return Admin.fromEntity({
            ...adminRows[0],
            user: user
        });
    }

    /**
     * Retrieve all active admins
     * 
     * PRE-CONDITIONS:
     * - Database must contain admin records
     * 
     * POST-CONDITIONS:
     * - Returns list of Admin entities
     */
    async getAllAdmins() {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE isactive = true
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) return [];

        return rows.map(row => Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        }));
    }

    /**
     * Retrieve admin by ID
     * 
     * PRE-CONDITIONS:
     * - admin_id must be provided
     * 
     * POST-CONDITIONS:
     * - Returns Admin entity or null
     */
    async getAdminById(admin_id) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE admin_id = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [admin_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        });
    }

    /**
     * Retrieve admin by first name
     * 
     * PRE-CONDITIONS:
     * - admin_fname must be provided
     * 
     * POST-CONDITIONS:
     * - Returns Admin entity or null
     */
    async getAdminByFName(admin_fname) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE admin_fname = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [admin_fname]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        });
    }

    /**
     * Retrieve admin by last name
     * 
     * PRE-CONDITIONS:
     * - admin_lname must be provided
     * 
     * POST-CONDITIONS:
     * - Returns Admin entity or null
     */
    async getAdminByLName(admin_lname) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE admin_lname = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [admin_lname]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        });
    }

    /**
     * Retrieve admin by email
     * 
     * PRE-CONDITIONS:
     * - user_email must be provided
     * 
     * POST-CONDITIONS:
     * - Returns Admin entity or null
     */
    async getAdminByEmail(user_email) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE user_email = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        });
    }

    /**
     * Retrieve admin by phone
     * 
     * PRE-CONDITIONS:
     * - user_phone must be provided
     * 
     * POST-CONDITIONS:
     * - Returns Admin entity or null
     */
    async getAdminByPhone(user_phone) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE user_phone = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        });
    }

    /**
     * Retrieve admins by creation date
     * 
     * PRE-CONDITIONS:
     * - created_at date must be provided
     * 
     * POST-CONDITIONS:
     * - Returns list of Admin entities
     */
    async getAdminsByCreationDate(created_at) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM admins
            JOIN users ON admins.admin_id = users.user_id
            WHERE created_at >= $1::date
              AND created_at < ($1::date + interval '1 day')
              AND isactive = true
        `;
        const { rows } = await pool.query(sql, [created_at]);
        if (rows.length === 0) return [];

        return rows.map(row => Admin.fromEntity({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: User.fromEntity(row)
        }));
    }

    /**
     * Deactivate admin
     * 
     * PRE-CONDITIONS:
     * - admin_id must be provided
     * 
     * POST-CONDITIONS:
     * - Delegates deactivation to UserRepository
     * - Returns result of deactivation
     */
    async deactivateAdmin(admin_id) {
        const userRepository = new UserRepository();
        return await userRepository.deactivateUser(admin_id);
    }
}