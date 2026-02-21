// src/domain/repositories/admin.repository.js

import { pool } from '../../config/db.js';
import { Admin } from '../entities/admin.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

export class AdminRepository {
    async createAdmin(data) {
        const { admin_fname, admin_lname, user } = data;

        // Step 1: Create the user first
        const userRepository = new UserRepository();
        const createdUser = await userRepository.createUser(user);

        // Step 2: Create the admin with the user_id
        const adminSql = `
            INSERT INTO admins (admin_id, admin_fname, admin_lname)
            VALUES ($1, $2, $3)
            RETURNING admin_id, admin_fname, admin_lname
        `;
        const adminValues = [createdUser.user_id, admin_fname, admin_lname];
        const { rows: adminRows } = await pool.query(adminSql, adminValues);

        return Admin.fromEntity({
            ...adminRows[0],
            user: createdUser
        });
    }

    async getAllAdmins() {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive
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

    async getAdminById(admin_id) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive
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

    async getAdminByFName(admin_fname) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive
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

    async getAdminByLName(admin_lname) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive
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

    async getAdminByEmail(user_email) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive
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

    async getAdminByPhone(user_phone) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive
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

    async getAdminsByCreationDate(created_at) {
        const sql = `
            SELECT admin_id, admin_fname, admin_lname,
                   user_id, user_email, user_phone, user_role, isactive, created_at
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

    async deactivateAdmin(admin_id) {
        const userRepository = new UserRepository();
        return await userRepository.deactivateUser(admin_id);
    }
}
