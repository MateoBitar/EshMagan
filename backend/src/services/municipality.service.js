// src/services/municipality.service.js

import { Municipality } from '../domain/entities/municipality.entity.js';

/**
 * This file defines the MunicipalityService class.
 * It manages municipality-related business logic including
 * creation, retrieval, updates, and deactivation.
 */
export class MunicipalityService {
    /**
     * Initialize MunicipalityService.
     *
     * PRE-CONDITIONS:
     * - municipalityRepository and userService must be provided.
     *
     * POST-CONDITIONS:
     * - Service is ready to handle municipality operations.
     */
    constructor(municipalityRepository, userService) {
        this.municipalityRepository = municipalityRepository;
        this.userService = userService;
    }

    /**
     * Create a municipality.
     *
     * PRE-CONDITIONS:
     * - municipality_name, region_name, municipality_code, and municipality_location must be provided.
     *
     * POST-CONDITIONS:
     * - User is retrieved or created.
     * - Municipality entity is created and stored.
     * - Returns municipality DTO.
     */
    async createMunicipality(data) {
        try {
            if (!data.municipality_name) throw new Error("Missing required field: Municipality Name");
            if (!data.region_name) throw new Error("Missing required field: Region Name");
            if (!data.municipality_code) throw new Error("Missing required field: Municipality Code");
            if (!data.municipality_location) throw new Error("Missing required field: Municipality Location");

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
                    user_role: 'Municipality',
                    isactive: true
                });
            }

            // Step 4: Create Municipality entity linked to user_id
            const municipality = new Municipality({
                municipality_id: user.user_id,
                municipality_name: data.municipality_name,
                region_name: data.region_name,
                municipality_code: data.municipality_code,
                municipality_location: data.municipality_location,
                user: user
            });

            // Step 5: Persist via repository
            const createdMunicipality = await this.municipalityRepository.createMunicipality(municipality);
            return createdMunicipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to create municipality: ${err.message}`);
        }
    }

    /**
     * Retrieve all municipalities.
     *
     * PRE-CONDITIONS:
     * - Repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of municipality DTOs.
     */
    async getAllMunicipalities() {
        try {
            // Fetch all municipalities from repository
            const municipalities = await this.municipalityRepository.getAllMunicipalities();
            // Expose safe outward-facing data
            return municipalities.map(m => m.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch municipalities: ${err.message}`);
        }
    }

    /**
     * Retrieve municipality by ID.
     *
     * PRE-CONDITIONS:
     * - municipality_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns municipality DTO if found.
     * - Returns null if not found.
     */
    async getMunicipalityById(municipality_id) {
        try {
            // Fetch municipality by ID
            const municipality = await this.municipalityRepository.getMunicipalityById(municipality_id);
            if (!municipality) return null; // Not found or inactive
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by ID: ${err.message}`);
        }
    }

    /**
     * Retrieve municipalities by name.
     *
     * PRE-CONDITIONS:
     * - municipality_name must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching municipalities.
     * - Returns empty array if none found.
     */
    async getMunicipalitiesByName(municipality_name) {
        try {
            // Fetch municipalities by name (partial match)
            const municipalities = await this.municipalityRepository.getMunicipalitiesByName(municipality_name);
            if (!municipalities || municipalities.length === 0) return []; // None found or inactive
            return municipalities.map(m => m.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch municipalities by name: ${err.message}`);
        }
    }

    /**
     * Retrieve municipalities by region.
     *
     * PRE-CONDITIONS:
     * - region_name must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching municipalities.
     */
    async getMunicipalityByRegion(region_name) {
        try {
            // Fetch municipalities by region
            const municipalities = await this.municipalityRepository.getMunicipalityByRegion(region_name);
            if (!municipalities || municipalities.length === 0) return []; // None found or inactive
            return municipalities.map(m => m.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch municipalities by region: ${err.message}`);
        }
    }

    /**
     * Retrieve municipality by code.
     *
     * PRE-CONDITIONS:
     * - municipality_code must be provided.
     *
     * POST-CONDITIONS:
     * - Returns municipality DTO if found.
     * - Returns null if not found.
     */
    async getMunicipalityByCode(municipality_code) {
        try {
            // Fetch municipality by unique code
            const municipality = await this.municipalityRepository.getMunicipalityByCode(municipality_code);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by code: ${err.message}`);
        }
    }

    /**
     * Retrieve municipality by location.
     *
     * PRE-CONDITIONS:
     * - municipality_location must be valid WKT string or coordinate object.
     *
     * POST-CONDITIONS:
     * - Returns matching municipality DTO.
     * - Returns null if not found.
     */
    async getMunicipalityByLocation(municipality_location) {
        try {
            const coords = typeof municipality_location === 'string'
                ? (() => {
                    const match = municipality_location.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
                    if (!match) throw new Error("Invalid format. Expected POINT(lng lat)");
                    return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
                })()
                : municipality_location;
            const municipality = await this.municipalityRepository.getMunicipalityByLocation(coords);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by location: ${err.message}`);
        }
    }

    /**
     * Retrieve municipality by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns municipality DTO if found.
     * - Returns null if not found.
     */
    async getMunicipalityByEmail(user_email) {
        try {
            // Fetch municipality by associated user email
            const municipality = await this.municipalityRepository.getMunicipalityByEmail(user_email);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by email: ${err.message}`);
        }
    }

    /**
     * Retrieve municipality by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns municipality DTO if found.
     * - Returns null if not found.
     */
    async getMunicipalityByPhone(user_phone) {
        try {
            // Fetch municipality by associated user phone
            const municipality = await this.municipalityRepository.getMunicipalityByPhone(user_phone);
            if (!municipality) return null;
            return municipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch municipality by phone: ${err.message}`);
        }
    }

    /**
     * Update municipality.
     *
     * PRE-CONDITIONS:
     * - municipality_id must be provided.
     *
     * POST-CONDITIONS:
     * - Municipality is updated.
     * - Returns updated DTO.
     */
    async updateMunicipality(municipality_id, data) {
        try {
            // Update municipality fields
            const updatedMunicipality = await this.municipalityRepository.updateMunicipality(municipality_id, data);
            if (!updatedMunicipality) return null;
            return updatedMunicipality.toDTO();
        } catch (err) {
            throw new Error(`Failed to update municipality: ${err.message}`);
        }
    }

    /**
     * Deactivate municipality.
     *
     * PRE-CONDITIONS:
     * - municipality_id must be provided.
     *
     * POST-CONDITIONS:
     * - Municipality is deactivated.
     */
    async deactivateMunicipality(municipality_id) {
        try {
            // Deactivate municipality
            return await this.municipalityRepository.deactivateMunicipality(municipality_id);
        } catch (err) {
            throw new Error(`Failed to deactivate municipality: ${err.message}`);
        }
    }
}
