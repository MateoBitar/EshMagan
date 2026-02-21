// src/services/admin.service.js

import { Admin } from '../domain/entities/admin.entity.js';

export class AdminService {
    constructor(adminRepository, userService) {
        this.adminRepository = adminRepository;
        this.userService = userService;
    }

    async createAdmin(data) {
        try {
            // Admin specific checks
            if (!data.admin_fname) throw new Error("Missing required field: Admin First Name");
            if (!data.admin_lname) throw new Error("Missing required field: Admin Last Name");

            // Step 1: Create User via UserService
            const user = await this.userService.createUser({
                user_email: data.user_email,
                user_password: data.user_password,
                user_phone: data.user_phone,
                user_role: 'admin',
                isactive: true
            });

            // Step 2: Create Admin record linked to user_id
            const admin = new Admin({
                admin_id: user.user_id,
                admin_fname: data.admin_fname,
                admin_lname: data.admin_lname,
                user: user
            });

            const createdAdmin = await this.adminRepository.createAdmin(admin);
            return createdAdmin.toDTO();
        } catch (err) {
            throw new Error(`Failed to create admin: ${err.message}`);
        }
    }

    async getAllAdmins() {
        try {
            const admins = await this.adminRepository.getAllAdmins();
            return admins.map(admin => admin.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch admins: ${err.message}`);
        }
    }

    async getAdminById(admin_id) {

    }
}