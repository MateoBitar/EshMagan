// src/services/evacuation.service.js

import { Evacuation } from '../domain/entities/evacuation.repository.js';

class EvacuationService {
    constructor(evacuationRepository) {
        this.evacuationRepository = evacuationRepository;
    }

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

            // Persist via repository (repo handles fire_id FK validation internally)
            const createdEvacuation = await this.evacuationRepository.createEvacuation(evacuation);
            return createdEvacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to create evacuation route: ${err.message}`);
        }
    }

    async getAllEvacuations() {
        try {
            // Fetch all evacuation routes from repository
            const evacuations = await this.evacuationRepository.getAllEvacuations();
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes: ${err.message}`);
        }
    }

    async getEvacuationById(route_id) {
        try {
            // Fetch evacuation route by ID
            const evacuation = await this.evacuationRepository.getEvacuationById(route_id);
            if (!evacuation) return null;  // Not found
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch evacuation route by ID: ${err.message}`);
        }
    }

    async getEvacuationsByStatus(route_status) {
        try {
            // Fetch evacuation routes by status
            const evacuations = await this.evacuationRepository.getEvacuationsByStatus(route_status);
            if (!evacuations || evacuations.length === 0) return [];  // No evacuation routes found for this status
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by status: ${err.message}`);
        }
    }

    async getEvacuationsByPriority(route_priority) {
        try {
            // Fetch evacuation routes by priority
            const evacuations = await this.evacuationRepository.getEvacuationsByPriority(route_priority);
            if (!evacuations || evacuations.length === 0) return [];  // No evacuation routes found for this priority
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by priority: ${err.message}`);
        }
    }

    async getEvacuationsByZone(safe_zone) {
        try {
            // Validate safe zone input
            if (!safe_zone?.latitude || !safe_zone?.longitude)
                throw new Error("Missing required fields: Safe Zone latitude and longitude");

            // Fetch evacuation routes by safe zone
            const evacuations = await this.evacuationRepository.getEvacuationsByZone(safe_zone);
            if (!evacuations || evacuations.length === 0) return [];  // No evacuation routes found for this zone
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by zone: ${err.message}`);
        }
    }

    async getEvacuationsByFireId(fire_id) {
        try {
            // Fetch evacuation routes by associated fire ID
            const evacuations = await this.evacuationRepository.getEvacuationsByFireId(fire_id);
            if (!evacuations || evacuations.length === 0) return [];  // No evacuation routes found for this fire ID
            return evacuations.map(evac => evac.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch evacuation routes by fire ID: ${err.message}`);
        }
    }

    async getNearestEvacuation(latitude, longitude) {
        try {
            // Validate input coordinates
            if (latitude  === undefined || latitude  === null) throw new Error("Missing required field: Latitude");
            if (longitude === undefined || longitude === null) throw new Error("Missing required field: Longitude");

            // Fetch nearest evacuation route to the given coordinates
            const evacuation = await this.evacuationRepository.getNearestEvacuation(latitude, longitude);
            if (!evacuation) return null;  // No evacuation routes found
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch nearest evacuation route: ${err.message}`);
        }
    }

    async updateEvacuationStatus(route_id, new_status) {
        try {
            // Validate new status
            if (!new_status) throw new Error("Missing required field: New Status");

            // Update evacuation route status
            const evacuation = await this.evacuationRepository.updateEvacuationStatus(route_id, new_status);
            if (!evacuation) return null;  // Evacuation route not found or update failed
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to update evacuation route status: ${err.message}`);
        }
    }

    async updateEvacuationPriority(route_id, new_priority) {
        try {
            // Validate new priority
            if (new_priority === undefined || new_priority === null)
                throw new Error("Missing required field: New Priority");

            // Update evacuation route priority
            const evacuation = await this.evacuationRepository.updateEvacuationPriority(route_id, new_priority);
            if (!evacuation) return null;  // Evacuation route not found or update failed
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to update evacuation route priority: ${err.message}`);
        }
    }

    async updateEvacuationGeometry(route_id, new_route_path, new_safe_zone) {
        try {
            // Validate new geometry inputs
            if (!new_route_path) throw new Error("Missing required field: New Route Path");
            if (!new_safe_zone)  throw new Error("Missing required field: New Safe Zone");

            // Update evacuation route geometry (path and safe zone)
            const evacuation = await this.evacuationRepository.updateEvacuationGeometry(route_id, new_route_path, new_safe_zone);
            if (!evacuation) return null;  // Evacuation route not found or update failed
            return evacuation.toDTO();
        } catch (err) {
            throw new Error(`Failed to update evacuation route geometry: ${err.message}`);
        }
    }

    async deleteEvacuation(route_id) {
        try {
            // Delete evacuation route by ID
            return await this.evacuationRepository.deleteEvacuation(route_id);
        } catch (err) {
            throw new Error(`Failed to delete evacuation route: ${err.message}`);
        }
    }

    async deleteEvacuationsByFireId(fire_id) {
        try {
            // Delete all evacuation routes associated with a specific fire ID
            return await this.evacuationRepository.deleteEvacuationsByFireId(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete evacuation routes by fire ID: ${err.message}`);
        }
    }
}