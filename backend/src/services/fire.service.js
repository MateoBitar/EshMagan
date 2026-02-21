// src/services/fire.service.js

import { FireEvent } from '../domain/entities/fire.entity.js';

export class FireService {
    constructor(fireRepository) {
        this.fireRepository = fireRepository;
    }

    async createFire(data) {
        try {
            // Validate required fields
            if (!data.fire_source) throw new Error("Missing required field: Fire Source");
            if (!data.fire_location) throw new Error("Missing required field: Fire Location");

            // Step 1: Build FireEvent entity
            const fire = new FireEvent({
                fire_source: data.fire_source,
                fire_location: data.fire_location,
                fire_severitylevel: data.fire_severitylevel || 'low',
                is_extinguished: data.is_extinguished !== undefined ? data.is_extinguished : false,
                is_verified: data.is_verified !== undefined ? data.is_verified : false
            });

            // Step 2: Persist via repository
            const createdFire = await this.fireRepository.createFire(fire);
            return createdFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to create fire: ${err.message}`);
        }
    }

    async getAllFires() {
        try {
            // Fetch all fires from repository
            const fires = await this.fireRepository.getAllFires();
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires: ${err.message}`);
        }
    }

    async getFireById(fire_id) {
        try {
            // Fetch fire by ID
            const fire = await this.fireRepository.getFireById(fire_id);
            if (!fire) return null; // Not found
            return fire.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch fire by ID: ${err.message}`);
        }
    }

    async getActiveFires() {
        try {
            // Fetch active fires from repository
            const fires = await this.fireRepository.getActiveFires();
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch active fires: ${err.message}`);
        }
    }

    async getFiresByStatus(fire_status) {
        try {
            // Fetch fires by status from repository
            const fires = await this.fireRepository.getFiresByStatus(fire_status);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by status: ${err.message}`);
        }
    }

    async getFiresByMunicipality(municipality_id) {
        try {
            // Fetch fires by municipality from repository
            const fires = await this.fireRepository.getFiresByMunicipality(municipality_id);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by municipality: ${err.message}`);
        }
    }

    async getFiresRadius(lat, lng, radiusMeters) {
        try {
            // Fetch fires within radius from repository
            const fires = await this.fireRepository.getFiresRadius(lat, lng, radiusMeters);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by radius: ${err.message}`);
        }
    }

    async getFiresWithinPolygon(polygonGeoJSON) {
        try {
            // Fetch fires within polygon from repository
            const fires = await this.fireRepository.getFiresWithinPolygon(polygonGeoJSON);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires within polygon: ${err.message}`);
        }
    }

    async getRecentFires(limit) {
        try {
            // Fetch recent fires from repository
            const fires = await this.fireRepository.getRecentFires(limit);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch recent fires: ${err.message}`);
        }
    }

    async getFiresByDate(startDate, endDate) {
        try {
            //  Fetch fires by date range from repository
            const fires = await this.fireRepository.getFiresByDate(startDate, endDate);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by date: ${err.message}`);
        }
    }

    async getFireStatistics(startDate, endDate) {
        try {
            // Fetch fire statistics from repository
            return await this.fireRepository.getFireStatistics(startDate, endDate);
        } catch (err) {
            throw new Error(`Failed to fetch fire statistics: ${err.message}`);
        }
    }

    async getFiresByLocationAndTime(lat, lng, startDate, endDate, radiusMeters) {
        try {
            // Fetch fires by location and time from repository
            const fires = await this.fireRepository.getFireByLocationAndTime(lat, lng, startDate, endDate, radiusMeters);
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by location and time: ${err.message}`);
        }
    }

    async updateFire(fire_id, data) {
        try {
            // Update fire details
            const updatedFire = await this.fireRepository.updateFire(fire_id, data);
            if (!updatedFire) return null;
            return updatedFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to update fire: ${err.message}`);
        }
    }

    async updateFireStatus(fire_id, fire_status) {
        try {
            // Update fire status
            const updatedFire = await this.fireRepository.updateFireStatus(fire_id, fire_status);
            if (!updatedFire) return null;
            return updatedFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to update fire status: ${err.message}`);
        }
    }

    async updateFireSeverity(fire_id, severityLevel) {
        try {
            // Update fire severity level
            const updatedFire = await this.fireRepository.updateFireSeverity(fire_id, severityLevel);
            if (!updatedFire) return null;
            return updatedFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to update fire severity: ${err.message}`);
        }
    }

    async updateFireSpreadPrediction(fire_id, spreadPrediction) {
        try {
            // Update fire spread prediction
            const updatedFire = await this.fireRepository.updateFireSpreadPrediction(fire_id, spreadPrediction);
            if (!updatedFire) return null;
            return updatedFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to update fire spread prediction: ${err.message}`);
        }
    }

    async deleteFire(fire_id) {
        try {
            // Delete fire by ID
            return await this.fireRepository.deleteFire(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete fire: ${err.message}`);
        }
    }

    async countFires(filters) {
        try {
            // Count fires based on filters
            return await this.fireRepository.countFires(filters);
        } catch (err) {
            throw new Error(`Failed to count fires: ${err.message}`);
        }
    }
}
