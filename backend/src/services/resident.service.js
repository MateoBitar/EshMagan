// src/services/resident.service.js

import { Resident } from '../domain/entities/resident.entity.js';

/**
 * This file defines the ResidentService class.
 * It manages resident-related business logic including
 * creation, retrieval, updates, and deactivation.
 */
export class ResidentService {
    /**
     * Initialize ResidentService.
     *
     * PRE-CONDITIONS:
     * - residentRepository and userService must be provided.
     *
     * POST-CONDITIONS:
     * - Service is ready to handle resident operations.
     */
    constructor(residentRepository, userService) {
        this.residentRepository = residentRepository;
        this.userService = userService;
    }

    /**
     * Create a resident.
     *
     * PRE-CONDITIONS:
     * - resident_fname, resident_lname, resident_dob,
     *   resident_idnb, resident_idpic, and last_known_location must be provided.
     *
     * POST-CONDITIONS:
     * - User is retrieved or created.
     * - Resident entity is created and stored.
     * - Returns resident DTO.
     */
    async createResident(data) {
        try {
            // Resident-specific checks
            if (!data.resident_fname) throw new Error("Missing required field: Resident First Name");
            if (!data.resident_lname) throw new Error("Missing required field: Resident Last Name");
            if (!data.resident_dob) throw new Error("Missing required field: Resident Date of Birth");
            if (!data.resident_idnb) throw new Error("Missing required field: Resident ID Number");
            if (!data.resident_idpic) throw new Error("Missing required field: Resident ID Picture");
            if (!data.last_known_location) throw new Error("Missing required field: Last Known Location");

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
                    user_role: 'Resident',
                    isactive: true
                });
            }

            // Step 4: Create Resident entity linked to user_id
            const resident = new Resident({
                resident_id: user.user_id,
                resident_fname: data.resident_fname,
                resident_lname: data.resident_lname,
                resident_dob: data.resident_dob,
                resident_idnb: data.resident_idnb,
                resident_idpic: data.resident_idpic,
                home_location: data.home_location || null,
                work_location: data.work_location || null,
                last_known_location: data.last_known_location,
                user: user
            });

            // Step 5: Persist via repository
            const createdResident = await this.residentRepository.createResident(resident);
            return createdResident.toDTO();
        } catch (err) {
            throw new Error(`Failed to create resident: ${err.message}`);
        }
    }

    /**
     * Retrieve all residents.
     *
     * PRE-CONDITIONS:
     * - Repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of resident DTOs.
     */
    async getAllResidents() {
        try {
            // Fetch all residents from repository
            const residents = await this.residentRepository.getAllResidents();
            // Expose safe outward-facing data
            return residents.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch residents: ${err.message}`);
        }
    }

    /**
     * Retrieve resident by ID.
     *
     * PRE-CONDITIONS:
     * - resident_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns resident DTO if found.
     * - Returns null if not found.
     */
    async getResidentById(resident_id) {
        try {
            // Fetch resident by ID
            const resident = await this.residentRepository.getResidentById(resident_id);
            if (!resident) return null; // Not found or inactive
            return resident.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch resident by ID: ${err.message}`);
        }
    }

    /**
     * Retrieve residents by first name.
     *
     * PRE-CONDITIONS:
     * - resident_fname must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching residents.
     * - Returns empty array if none found.
     */
    async getResidentsByFName(resident_fname) {
        try {
            // Fetch residents by first name (partial match)
            const residents = await this.residentRepository.getResidentsByFName(resident_fname);
            if (!residents || residents.length === 0) return []; // None found or inactive
            return residents.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch residents by first name: ${err.message}`);
        }
    }

    /**
     * Retrieve residents by last name.
     *
     * PRE-CONDITIONS:
     * - resident_lname must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching residents.
     * - Returns empty array if none found.
     */
    async getResidentsByLName(resident_lname) {
        try {
            // Fetch residents by last name (partial match)
            const residents = await this.residentRepository.getResidentsByLName(resident_lname);
            if (!residents || residents.length === 0) return []; // None found or inactive
            return residents.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch residents by last name: ${err.message}`);
        }
    }

    /**
     * Retrieve resident by ID number.
     *
     * PRE-CONDITIONS:
     * - resident_idnb must be provided.
     *
     * POST-CONDITIONS:
     * - Returns resident DTO if found.
     * - Returns null if not found.
     */
    async getResidentByIdNb(resident_idnb) {
        try {
            // Fetch resident by ID number
            const resident = await this.residentRepository.getResidentByIdNb(resident_idnb);
            if (!resident) return null; // Not found or inactive
            return resident.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch resident by ID number: ${err.message}`);
        }
    }

    /**
     * Retrieve residents by last known location.
     *
     * PRE-CONDITIONS:
     * - last_known_location must be valid WKT string or coordinate object.
     *
     * POST-CONDITIONS:
     * - Returns matching residents.
     * - Returns empty array if none found.
     */
    async getResidentsByLastKnownLocation(last_known_location) {
        try {
            const coords = typeof last_known_location === 'string'
                ? (() => {
                    const match = last_known_location.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
                    if (!match) throw new Error("Invalid format. Expected POINT(lng lat)");
                    return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
                })()
                : last_known_location;
            const residents = await this.residentRepository.getResidentsByLastKnownLocation(coords);
            if (!residents || residents.length === 0) return [];
            return residents.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch residents by last known location: ${err.message}`);
        }
    }

    /**
     * Retrieve resident by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns resident DTO if found.
     * - Returns null if not found.
     */
    async getResidentByEmail(user_email) {
        try {
            // Fetch resident by associated user email
            const resident = await this.residentRepository.getResidentByEmail(user_email);
            if (!resident) return null; // Not found or inactive
            return resident.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch resident by email: ${err.message}`);
        }
    }

    /**
     * Retrieve resident by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns resident DTO if found.
     * - Returns null if not found.
     */
    async getResidentByPhone(user_phone) {
        try {
            // Fetch resident by associated user phone
            const resident = await this.residentRepository.getResidentByPhone(user_phone);
            if (!resident) return null; // Not found or inactive
            return resident.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch resident by phone: ${err.message}`);
        }
    }

    /**
     * Update resident.
     *
     * PRE-CONDITIONS:
     * - resident_id must be provided.
     *
     * POST-CONDITIONS:
     * - Resident is updated.
     * - Returns updated DTO.
     */
    async updateResident(resident_id, data) {
        try {
            // Update resident fields (handled in repository)
            const updatedResident = await this.residentRepository.updateResident(resident_id, data);
            if (!updatedResident) return null; // Not found or inactive
            return updatedResident.toDTO();
        } catch (err) {
            throw new Error(`Failed to update resident: ${err.message}`);
        }
    }

    /**
     * Deactivate resident.
     *
     * PRE-CONDITIONS:
     * - resident_id must be provided.
     *
     * POST-CONDITIONS:
     * - Resident is deactivated.
     */
    async deactivateResident(resident_id) {
        try {
            // Deactivate resident in repository
            return await this.residentRepository.deactivateResident(resident_id);
        } catch (err) {
            throw new Error(`Failed to deactivate resident: ${err.message}`);
        }
    }
}
