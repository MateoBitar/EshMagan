import { pool } from '../config/db.js';
import { Admin } from '../entities/Admin.js';
import { User } from '../entities/User.js';

export class AdminRepository {
    async createAdmin(data) {
        const { admin_fname, admin_lname, user } = data;
        
        // Step 1: Create the user first
        const userSql = `INSERT INTO users (user_email, user_password, user_phone,
            user_role, isactive, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) 
            RETURNING user_id, user_email, user_phone, user_role, isactive`;
        const userValues = [user.user_email, user.user_password, user.user_phone, 'admin', true];
        const { rows: userRows } = await pool.query(userSql, userValues);
        const createdUser = new User(userRows[0]);

        // Step 2: Create the admin with the user_id
        const adminSql = `INSERT INTO admins (admin_id, admin_fname, admin_lname)
            VALUES ($1, $2, $3) RETURNING admin_id, admin_fname, admin_lname`;
        const adminValues = [createdUser.user_id, admin_fname, admin_lname];
        const { rows: adminRows } = await pool.query(adminSql, adminValues);
        return new Admin({ ...adminRows[0], user: createdUser });
    }

    async getAllAdmins() {
        const sql = `SELECT admin_id, admin_fname, admin_lname, user_email,
            user_phone, user_role, isactive FROM admins JOIN users ON admins.admin_id = users.user_id`;
        const { rows } = await pool.query(sql);
        return rows.map(row => new Admin({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: new User({
                user_id: row.admin_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        }));
    }

    async getAdminById(admin_id) {
        const sql = `SELECT admin_id, admin_fname, admin_lname, user_email,
            user_phone, user_role, isactive FROM admins JOIN users ON admins.admin_id = users.user_id
            WHERE admin_id = $1`;
        const { rows } = await pool.query(sql, [admin_id]);
        if (rows.length === 0) {
            return null; // Admin not found
        }
        const row = rows[0];
        return new Admin({
            admin_id: row.admin_id,
            admin_fname: row.admin_fname,
            admin_lname: row.admin_lname,
            user: new User({
                user_id: row.admin_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }
}