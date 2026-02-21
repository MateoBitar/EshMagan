// src/services/responder.service.js

import { Responder } from '../domain/entities/responder.entity.js';

export class ResponderService {
    constructor(responderRepository, userService) {
        this.responderRepository = responderRepository;
        this.userService = userService;
    }

    async createResponder(data) {
        try {
            // Responder-specific checks
            if (!data.unit_nb) throw new Error("Missing required field: Unit Number");
            if (!data.unit_location) throw new Error("Missing required field: Unit Location");
            if (!data.assigned_region) throw new Error("Missing required field: Assigned Region");
            if (!data.responder_status) throw new Error("Missing required field: Responder Status");
            if (!data.last_known_location) throw new Error("Missing required field: Last Known Location");

            // Step 1: Create User via UserService
            const user = await this.userService.createUser({
                user_email: data.user_email,
                user_password: data.user_password,
                user_phone: data.user_phone,
                user_role: 'responder',
                isactive: true
            });

            // Step 2: Create Responder entity linked to user_id
            const responder = new Responder({
                responder_id: user.user_id,
                unit_nb: data.unit_nb,
                unit_location: data.unit_location,
                assigned_region: data.assigned_region,
                responder_status: data.responder_status,
                last_known_location: data.last_known_location,
                user: user
            });

            // Step 3: Persist via repository
            const createdResponder = await this.responderRepository.createResponder(responder);
            return createdResponder.toDTO();
        } catch (err) {
            throw new Error(`Failed to create responder: ${err.message}`);
        }
    }

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

    async getRespondersByUnitLocation(unit_location) {
        try {
            // Fetch responders by spatial unit location (within radius)
            const responders = await this.responderRepository.getRespondersByUnitLocation(unit_location);
            if (!responders || responders.length === 0) return []; // None found or inactive
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by unit location: ${err.message}`);
        }
    }

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

    async getRespondersByLastKnownLocation(last_known_location) {
        try {
            // Fetch responders by spatial last known location (within radius)
            const responders = await this.responderRepository.getRespondersByLastKnownLocation(last_known_location);
            if (!responders || responders.length === 0) return []; // None found or inactive
            return responders.map(r => r.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch responders by last known location: ${err.message}`);
        }
    }

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

    async deactivateResponder(responder_id) {
        try {
            // Deactivate responder in repository
            return await this.responderRepository.deactivateResponder(responder_id);
        } catch (err) {
            throw new Error(`Failed to deactivate responder: ${err.message}`);
        }
    }
}
