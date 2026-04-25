// src/services/evacuation.service.js

import { Evacuation } from '../domain/entities/evacuation.entity.js';

/**
 * This file defines the EvacuationService class.
 * It contains the business logic for evacuation route management,
 * including creation, retrieval, updates, and deletion.
 */
export class EvacuationService {

    /**
     * Initialize EvacuationService.
     *
     * PRE-CONDITIONS:
     * - evacuationRepository must be provided.
     *
     * POST-CONDITIONS:
     * - EvacuationService is ready to handle evacuation-related operations.
     */
    constructor(evacuationRepository) {
        this.evacuationRepository = evacuationRepository;
    }

    /**
     * Create a new evacuation route.
     *
     * PRE-CONDITIONS:
     * - All required evacuation fields must be provided.
     *
     * POST-CONDITIONS:
     * - Creates Evacuation entity.
     * - Persists evacuation via repository.
     * - Returns evacuation DTO.
     */
    async createEvacuation(data) {
        try {
            // Evacuation-specific checks
            if (!data.route_status)   throw new Error("Missing required field: Route Status");
            if (!data.route_priority) throw new Error("Missing required field: Route Priority");
            if (!data.route_path)     throw new Error("Missing required field: Route Path");
            if (!data.safe_zone)      throw new Error("Missing required field: Safe Zone");
            if (!data.distance_km)    throw new Error("Missing required field: Distance (km)");
            if (!data.estimated_time) throw new Error("Missing required field: Estimated Time");
            if (!data.fire_id)        throw new Error("Missing required field: Fire ID");

            // Create Evacuation entity
            const evacuation = new Evacuation({
                route_status:   data.route_status,
                route_priority: data.route_priority,
                route_path:     data.route_path,
                safe_zone:      data.safe_zone,
                distance_km:    data.distance_km,
                estimated_time: data.estimated_time,
                fire_id:        data.fire_id
            });

            // Persist via repository
            const createdEvacuation = await this.evacuationRepository.createEvacuation(evacuation);
            return createdEvacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to create evacuation route: ${err.message}`);
        }
    }

    /**
     * Retrieve all evacuation routes.
     *
     * PRE-CONDITIONS:
     * - evacuationRepository must be available.
     *
     * POST-CONDITIONS:
     * - Returns array of evacuation DTOs.
     */
    async getAllEvacuations() {
        try {
            const evacuations = await this.evacuationRepository.getAllEvacuations();
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes: ${err.message}`);
        }
    }

    /**
     * Retrieve evacuation route by ID.
     *
     * PRE-CONDITIONS:
     * - route_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns evacuation DTO if found.
     * - Returns null if not found.
     */
    async getEvacuationById(route_id) {
        try {
            const evacuation = await this.evacuationRepository.getEvacuationById(route_id);
            if (!evacuation) return null;
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch evacuation route by ID: ${err.message}`);
        }
    }

    /**
     * Retrieve evacuation routes by status.
     */
    async getEvacuationsByStatus(route_status) {
        try {
            const evacuations = await this.evacuationRepository.getEvacuationsByStatus(route_status);
            if (!evacuations || evacuations.length === 0) return [];
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by status: ${err.message}`);
        }
    }

    /**
     * Retrieve evacuation routes by priority.
     */
    async getEvacuationsByPriority(route_priority) {
        try {
            const evacuations = await this.evacuationRepository.getEvacuationsByPriority(route_priority);
            if (!evacuations || evacuations.length === 0) return [];
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by priority: ${err.message}`);
        }
    }

    /**
     * Retrieve evacuation routes by safe zone.
     *
     * PRE-CONDITIONS:
     * - safe_zone must be valid WKT string or coordinate object.
     *
     * POST-CONDITIONS:
     * - Returns matching evacuation routes.
     */
    async getEvacuationsByZone(safe_zone) {
        try {
            const coords = typeof safe_zone === 'string'
                ? (() => {
                    const match = safe_zone.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
                    if (!match) throw new Error("Invalid format. Expected POINT(lng lat)");
                    return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
                })()
                : safe_zone;

            const evacuations = await this.evacuationRepository.getEvacuationsByZone(coords);
            if (!evacuations || evacuations.length === 0) return [];
            return evacuations.map(e => e.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuations by zone: ${err.message}`);
        }
    }

    /**
     * Retrieve evacuation routes by fire ID.
     */
    async getEvacuationsByFireId(fire_id) {
        try {
            const evacuations = await this.evacuationRepository.getEvacuationsByFireId(fire_id);
            if (!evacuations || evacuations.length === 0) return [];
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by fire ID: ${err.message}`);
        }
    }

    /**
     * Retrieve nearest evacuation route.
     *
     * PRE-CONDITIONS:
     * - latitude and longitude must be provided.
     *
     * POST-CONDITIONS:
     * - Returns nearest evacuation route or null.
     */
    async getNearestEvacuation(latitude, longitude) {
        try {
            if (latitude  === undefined || latitude  === null) throw new Error("Missing required field: Latitude");
            if (longitude === undefined || longitude === null) throw new Error("Missing required field: Longitude");

            const evacuation = await this.evacuationRepository.getNearestEvacuation(latitude, longitude);
            if (!evacuation) return null;
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch nearest evacuation route: ${err.message}`);
        }
    }

    /**
     * Update evacuation route status.
     */
    async updateEvacuationStatus(route_id, new_status) {
        try {
            if (!new_status) throw new Error("Missing required field: New Status");

            const evacuation = await this.evacuationRepository.updateEvacuationStatus(route_id, new_status);
            if (!evacuation) return null;
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to update evacuation route status: ${err.message}`);
        }
    }

    /**
     * Update evacuation route priority.
     */
    async updateEvacuationPriority(route_id, new_priority) {
        try {
            if (new_priority === undefined || new_priority === null)
                throw new Error("Missing required field: New Priority");

            const evacuation = await this.evacuationRepository.updateEvacuationPriority(route_id, new_priority);
            if (!evacuation) return null;
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to update evacuation route priority: ${err.message}`);
        }
    }

    /**
     * Update evacuation route geometry.
     */
    async updateEvacuationGeometry(route_id, new_route_path, new_safe_zone) {
        try {
            if (!new_route_path) throw new Error("Missing required field: New Route Path");
            if (!new_safe_zone)  throw new Error("Missing required field: New Safe Zone");

            const evacuation = await this.evacuationRepository.updateEvacuationGeometry(route_id, new_route_path, new_safe_zone);
            if (!evacuation) return null;
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to update evacuation route geometry: ${err.message}`);
        }
    }

    /**
     * Delete evacuation route.
     */
    async deleteEvacuation(route_id) {
        try {
            return await this.evacuationRepository.deleteEvacuation(route_id);
        } catch (err) {
            throw new Error(`Failed to delete evacuation route: ${err.message}`);
        }
    }

    /**
     * Delete evacuation routes by fire ID.
     */
    async deleteEvacuationsByFireId(fire_id) {
        try {
            return await this.evacuationRepository.deleteEvacuationsByFireId(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete evacuation routes by fire ID: ${err.message}`);
        }
    }
}