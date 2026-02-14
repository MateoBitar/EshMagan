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

    async getAllAdmins() {}
}