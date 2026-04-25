// src/services/admin.service.js

import { Admin } from '../domain/entities/admin.entity.js';

/**
 * This file defines the AdminService class.
 * It contains the business logic for admin operations,
 * including admin creation, retrieval, and deactivation.
 */
export class AdminService {
    /**
     * Initialize AdminService.
     *
     * PRE-CONDITIONS:
     * - adminRepository must be provided.
     * - userService must be provided.
     *
     * POST-CONDITIONS:
     * - AdminService is ready to handle admin-related business logic.
     */
    constructor(adminRepository, userService) {
        this.adminRepository = adminRepository;
        this.userService = userService;
    }

    /**
     * Create a new admin.
     *
     * PRE-CONDITIONS:
     * - admin_fname and admin_lname must be provided.
     * - User may already exist by user_id or user_email.
     *
     * POST-CONDITIONS:
     * - Creates user if needed.
     * - Creates admin linked to user.
     * - Returns admin DTO.
     */
    async createAdmin(data) {
        try {
            if (!data.admin_fname) throw new Error("Missing required field: Admin First Name");
            if (!data.admin_lname) throw new Error("Missing required field: Admin Last Name");

            let user;

            // Step 1: Try to find user by ID if provided
            if (data.user_id) {
                user = await this.userService.getUserById(data.user_id);
            }

            // Step 2: If not found by ID, check by email
            if (!user && data.user_email) {
                user = await this.userService.getUserByEmail(data.user_email);
            }

            // Step 3: If still not found, create new user
            if (!user) {
                user = await this.userService.createUser({
                    user_email: data.user_email,
                    user_password: data.user_password,
                    user_phone: data.user_phone,
                    user_role: 'Admin',
                    isactive: true
                });
            }

            // Step 4: Create Admin entity linked to user_id
            const admin = new Admin({
                admin_id: user.user_id,
                admin_fname: data.admin_fname,
                admin_lname: data.admin_lname,
                user: user
            });

            // Step 5: Persist via repository
            const createdAdmin = await this.adminRepository.createAdmin(admin);
            return createdAdmin.toDTO();
        } catch (err) {
            throw new Error(`Failed to create admin: ${err.message}`);
        }
    }

    /**
     * Retrieve all admins.
     *
     * PRE-CONDITIONS:
     * - Admin repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns array of admin DTOs.
     */
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

    /**
     * Retrieve admin by ID.
     *
     * PRE-CONDITIONS:
     * - admin_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns admin DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve admin by first name.
     *
     * PRE-CONDITIONS:
     * - admin_fname must be provided.
     *
     * POST-CONDITIONS:
     * - Returns admin DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve admin by last name.
     *
     * PRE-CONDITIONS:
     * - admin_lname must be provided.
     *
     * POST-CONDITIONS:
     * - Returns admin DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve admin by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns admin DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve admin by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns admin DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve admins by creation date.
     *
     * PRE-CONDITIONS:
     * - created_at must be provided.
     *
     * POST-CONDITIONS:
     * - Returns array of admin DTOs.
     * - Returns empty array if none found.
     */
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

    /**
     * Deactivate admin.
     *
     * PRE-CONDITIONS:
     * - admin_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deactivates admin through repository.
     * - Returns deactivation result.
     */
    async deactivateAdmin(admin_id) {
        try {
            // Deactivate admin in repository
            return await this.adminRepository.deactivateAdmin(admin_id);
        } catch (err) {
            throw new Error(`Failed to deactivate admin: ${err.message}`);
        }
    }
}