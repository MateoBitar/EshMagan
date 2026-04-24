// src/services/responder.service.js

import { Responder } from '../domain/entities/responder.entity.js';

/**
 * This file defines the ResponderService class.
 * It manages responder-related business logic including
 * creation, retrieval, updates, location tracking, and deactivation.
 */
export class ResponderService {
    /**
     * Initialize ResponderService.
     *
     * PRE-CONDITIONS:
     * - responderRepository and userService must be provided.
     *
     * POST-CONDITIONS:
     * - Service is ready to handle responder operations.
     */
    constructor(responderRepository, userService) {
        this.responderRepository = responderRepository;
        this.userService = userService;
    }

    /**
     * Create a responder.
     *
     * PRE-CONDITIONS:
     * - unit_nb, unit_location, assigned_region,
     *   responder_status, and last_known_location must be provided.
     *
     * POST-CONDITIONS:
     * - User is retrieved or created.
     * - Responder entity is created and stored.
     * - Returns responder DTO.
     */
    async createResponder(data) {
        try {
            if (!data.unit_nb) throw new Error("Missing required field: Unit Number");
            if (!data.unit_location) throw new Error("Missing required field: Unit Location");
            if (!data.assigned_region) throw new Error("Missing required field: Assigned Region");
            if (!data.responder_status) throw new Error("Missing required field: Responder Status");
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
                    user_role: 'Responder',
                    isactive: true
                });
            }

            // Step 4: Create Responder entity linked to user_id
            const responder = new Responder({
                responder_id: user.user_id,
                unit_nb: data.unit_nb,
                unit_location: data.unit_location,
                assigned_region: data.assigned_region,
                responder_status: data.responder_status,
                last_known_location: data.last_known_location,
                user: user
            });

            // Step 5: Persist via repository
            const createdResponder = await this.responderRepository.createResponder(responder);
            return createdResponder.toDTO();
        } catch (err) {
            throw new Error(`Failed to create responder: ${err.message}`);
        }
    }

    /**
     * Retrieve all responders.
     *
     * PRE-CONDITIONS:
     * - Repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of responder DTOs.
     */
    async getAllResponders() {
        try {
            // Fetch all responders from repository
            const responders = await this.responderRepository.getAllResponders();
            // Expose safe outward-facing data
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders: ${err.message}`);
        }
    }

    /**
     * Retrieve responder by ID.
     *
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns responder DTO if found.
     * - Returns null if not found.
     */
    async getResponderById(responder_id) {
        try {
            // Fetch responder by ID
            const responder = await this.responderRepository.getResponderById(responder_id);
            if (!responder) return null; // Not found or inactive
            return responder.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch responder by ID: ${err.message}`);
        }
    }

    /**
     * Retrieve responders by unit number.
     *
     * PRE-CONDITIONS:
     * - unit_nb must be provided.
     *
     * POST-CONDITIONS:
     * - Returns list of matching responder DTOs.
     * - Returns empty array if none found.
     */

    async getRespondersByUnitNb(unit_nb) {
        try {
            // Fetch responders by unit number (could be multiple)
            const responders = await this.responderRepository.getRespondersByUnitNb(unit_nb);
            if (!responders || responders.length === 0) return []; // None found or inactive
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by unit number: ${err.message}`);
        }
    }

    /**
     * Retrieve responders by unit location.
     *
     * PRE-CONDITIONS:
     * - unit_location must be valid WKT string or coordinate object.
     *
     * POST-CONDITIONS:
     * - Returns matching responders.
     * - Returns empty array if none found.
     */
    async getRespondersByUnitLocation(unit_location) {
        try {
            const coords = typeof unit_location === 'string'
                ? (() => {
                    const match = unit_location.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
                    if (!match) throw new Error("Invalid format. Expected POINT(lng lat)");
                    return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
                })()
                : unit_location;
            const responders = await this.responderRepository.getRespondersByUnitLocation(coords);
            if (!responders || responders.length === 0) return [];
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by unit location: ${err.message}`);
        }
    }

    /**
     * Retrieve responders by assigned region.
     *
     * PRE-CONDITIONS:
     * - assigned_region must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching responders.
     * - Returns empty array if none found.
     */
    async getRespondersByAssignedRegion(assigned_region) {
        try {
            // Fetch responders by assigned region
            const responders = await this.responderRepository.getRespondersByAssignedRegion(assigned_region);
            if (!responders || responders.length === 0) return []; // None found or inactive
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by assigned region: ${err.message}`);
        }
    }

    /**
     * Retrieve responders by status.
     *
     * PRE-CONDITIONS:
     * - responder_status must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching responders.
     * - Returns empty array if none found.
     */
    async getRespondersByResponderStatus(responder_status) {
        try {
            // Fetch responders by current status
            const responders = await this.responderRepository.getRespondersByResponderStatus(responder_status);
            if (!responders || responders.length === 0) return []; // None found or inactive
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by status: ${err.message}`);
        }
    }

    /**
     * Retrieve responders by last known location.
     *
     * PRE-CONDITIONS:
     * - last_known_location must be valid WKT string or coordinate object.
     *
     * POST-CONDITIONS:
     * - Returns matching responders.
     * - Returns empty array if none found.
     */
    async getRespondersByLastKnownLocation(last_known_location) {
        try {
            const coords = typeof last_known_location === 'string'
                ? (() => {
                    const match = last_known_location.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
                    if (!match) throw new Error("Invalid format. Expected POINT(lng lat)");
                    return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
                })()
                : last_known_location;
            const responders = await this.responderRepository.getRespondersByLastKnownLocation(coords);
            if (!responders || responders.length === 0) return [];
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by last known location: ${err.message}`);
        }
    }

    /**
     * Retrieve responder by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns responder DTO if found.
     * - Returns null if not found.
     */
    async getResponderByEmail(user_email) {
        try {
            // Fetch responder by associated user email
            const responder = await this.responderRepository.getResponderByEmail(user_email);
            if (!responder) return null; // Not found or inactive
            return responder.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch responder by email: ${err.message}`);
        }
    }

    /**
     * Retrieve responder by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns responder DTO if found.
     * - Returns null if not found.
     */
    async getResponderByPhone(user_phone) {
        try {
            // Fetch responder by associated user phone
            const responder = await this.responderRepository.getResponderByPhone(user_phone);
            if (!responder) return null; // Not found or inactive
            return responder.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch responder by phone: ${err.message}`);
        }
    }

    /**
     * Retrieve nearest responder.
     *
     * PRE-CONDITIONS:
     * - fire_location must be provided.
     *
     * POST-CONDITIONS:
     * - Returns nearest responder DTO.
     * - Returns null if none found.
     */
    async getNearestResponder(fire_location) {
        try {
            if (!fire_location) throw new Error("Missing required field: Fire Location");
            const responder = await this.responderRepository.getNearestResponder(fire_location);
            if (!responder) return null;
            return responder.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch nearest responder: ${err.message}`);
        }
    }

    /**
     * Update responder.
     *
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     *
     * POST-CONDITIONS:
     * - Responder is updated.
     * - Returns updated DTO.
     */
    async updateResponder(responder_id, data) {
        try {
            // Update responder fields (handled in repository)
            const updatedResponder = await this.responderRepository.updateResponder(responder_id, data);
            if (!updatedResponder) return null; // Not found or inactive
            return updatedResponder.toDTO();
        } catch (err) {
            throw new Error(`Failed to update responder: ${err.message}`);
        }
    }

    /**
     * Update responder status.
     *
     * PRE-CONDITIONS:
     * - responder_id and responder_status must be provided.
     *
     * POST-CONDITIONS:
     * - Status is updated.
     * - Returns updated responder DTO.
     */
    async updateResponderStatus(responder_id, responder_status) {
        try {
            if (!responder_status) throw new Error("Missing required field: Responder Status");
            const responder = await this.responderRepository.updateResponderStatus(responder_id, responder_status);
            if (!responder) return null;
            return responder.toDTO();
        } catch (err) {
            throw new Error(`Failed to update responder status: ${err.message}`);
        }
    }

    /**
     * Update responder location.
     *
     * PRE-CONDITIONS:
     * - responder_id, latitude, and longitude must be provided.
     *
     * POST-CONDITIONS:
     * - Responder location is updated.
     * - Returns updated location data.
     */
    async updateResponderLocation(responder_id, latitude, longitude) {
        try {
            if (latitude === undefined || latitude === null) throw new Error("Missing required field: Latitude");
            if (longitude === undefined || longitude === null) throw new Error("Missing required field: Longitude");
            // Returns bare { responder_id, last_known_location, updated_at } — not a full entity
            return await this.responderRepository.updateResponderLocation(responder_id, latitude, longitude);
        } catch (err) {
            throw new Error(`Failed to update responder location: ${err.message}`);
        }
    }

    /**
     * Deactivate responder.
     *
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     *
     * POST-CONDITIONS:
     * - Responder is deactivated.
     */
    async deactivateResponder(responder_id) {
        try {
            // Deactivate responder in repository
            return await this.responderRepository.deactivateResponder(responder_id);
        } catch (err) {
            throw new Error(`Failed to deactivate responder: ${err.message}`);
        }
    }
}
