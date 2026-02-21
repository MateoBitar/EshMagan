// src/services/admin.service.js

import { Admin } from '../domain/entities/admin.entity.js';

export class AdminService {
    constructor(adminRepository, userService) {
        this.adminRepository = adminRepository;
        this.userService = userService;
    }

    async createAdmin(data) {
        try {
            // Admin-specific checks
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

            // Step 2: Create Admin entity linked to user_id
            const admin = new Admin({
                admin_id: user.user_id,
                admin_fname: data.admin_fname,
                admin_lname: data.admin_lname,
                user: user
            });

            // Step 3: Persist via repository
            const createdAdmin = await this.adminRepository.createAdmin(admin);
            return createdAdmin.toDTO();
        } catch (err) {
            throw new Error(`Failed to create admin: ${err.message}`);
        }
    }

    async getAllAdmins() {
        try {
            // Fetch all admins from repository
            const admins = await this.adminRepository.getAllAdmins();
            // Expose safe outward-facing data
            return admins.map(admin => admin.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch admins: ${err.message}`);
        }
    }

    async getAdminById(admin_id) {
        try {
            // Fetch admin by ID
            const admin = await this.adminRepository.getAdminById(admin_id);
            if (!admin) return null; // Not found or inactive
            return admin.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch admin by ID: ${err.message}`);
        }
    }

    async getAdminByFName(admin_fname) {
        try {
            // Fetch admin by first name
            const admin = await this.adminRepository.getAdminByFName(admin_fname);
            if (!admin) return null; // Not found or inactive
            return admin.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch admin by first name: ${err.message}`);
        }
    }

    async getAdminByLName(admin_lname) {
        try {
            // Fetch admin by last name
            const admin = await this.adminRepository.getAdminByLName(admin_lname);
            if (!admin) return null; // Not found or inactive
            return admin.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch admin by last name: ${err.message}`);
        }
    }

    async getAdminByEmail(user_email) {
        try {
            // Fetch admin by associated user email
            const admin = await this.adminRepository.getAdminByEmail(user_email);
            if (!admin) return null; // Not found or inactive
            return admin.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch admin by email: ${err.message}`);
        }
    }

    async getAdminByPhone(user_phone) {
        try {
            // Fetch admin by associated user phone
            const admin = await this.adminRepository.getAdminByPhone(user_phone);
            if (!admin) return null; // Not found or inactive
            return admin.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch admin by phone: ${err.message}`);
        }
    }

    async getAdminsByCreationDate(created_at) {
        try {
            // Fetch admins by creation date
            const admins = await this.adminRepository.getAdminsByCreationDate(created_at);
            if (!admins || admins.length === 0) return []; // None found or inactive
            return admins.map(admin => admin.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch admins by creation date: ${err.message}`);
        }
    }

    async deactivateAdmin(admin_id) {
        try {
            // Deactivate admin in repository
            return await this.adminRepository.deactivateAdmin(admin_id);
        } catch (err) {
            throw new Error(`Failed to deactivate admin: ${err.message}`);
        }
    }
}
