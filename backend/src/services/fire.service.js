// src/services/fire.service.js

import { FireEvent } from '../domain/entities/fire.entity.js';

/**
 * This file defines the FireService class.
 * It orchestrates the full fire lifecycle including detection,
 * AI validation, responder dispatching, evacuation generation,
 * alert triggering, and system cleanup.
 */
export class FireService {
    /**
     * Initialize FireService.
     *
     * PRE-CONDITIONS:
     * - All required repositories, services, engines, and publisher must be provided.
     *
     * POST-CONDITIONS:
     * - FireService is fully initialized and ready to manage fire workflows.
     */
    constructor(
        fireRepository,
        residentRepository,
        fireAssignmentService,
        evacuationRepository,
        alertRepository,
        responderService,
        infraredEngine,
        firePredictionEngine,
        fireSpreadEngine,
        natsPublisher
    ) {
        this.fireRepository = fireRepository;
        this.residentRepository = residentRepository;
        this.fireAssignmentService = fireAssignmentService;
        this.evacuationRepository = evacuationRepository;
        this.alertRepository = alertRepository;
        this.responderService = responderService;
        this.infraredEngine = infraredEngine;
        this.firePredictionEngine = firePredictionEngine;
        this.fireSpreadEngine = fireSpreadEngine;
        this.natsPublisher = natsPublisher;
    }

    /**
     * Create fire and trigger full system workflow.
     *
     * PRE-CONDITIONS:
     * - fire_source, fire_location, and fire_severitylevel must be provided.
     *
     * POST-CONDITIONS:
     * - Fire is stored in the database.
     * - Infrared and prediction engines are executed.
     * - Fire may be auto-verified.
     * - Responder is dispatched and assignment created.
     * - Evacuation route is generated.
     * - Alerts are triggered via NATS events.
     * - Returns created fire DTO.
     */
    async createFireAndTriggerSystem(data) {
        try {
            if (!data.fire_source) throw new Error("Missing required field: Fire Source");
            if (!data.fire_location) throw new Error("Missing required field: Fire Location");
            if (!data.fire_severitylevel) throw new Error("Missing required field: Fire Severity Level");

            // Step 1: Save fire
            const fire = new FireEvent({
                fire_source: data.fire_source,
                fire_location: data.fire_location,
                fire_severitylevel: data.fire_severitylevel,
                is_extinguished: false,
                is_verified: false
            });
            const createdFire = await this.fireRepository.createFire(fire);

            // Step 2: Run infrared analysis
            let infraredResult = null;
            try {
                infraredResult = await this.infraredEngine.analyze(createdFire);
            } catch (aiErr) {
                console.warn(`Infrared analysis failed for fire ${createdFire.fire_id}: ${aiErr.message}`);
            }

            // Step 3: Run fire prediction
            let predictionResult = null;
            try {
                predictionResult = await this.firePredictionEngine.predict(createdFire);
                if (predictionResult?.spread_prediction) {
                    await this.fireRepository.updateFireSpreadPrediction(
                        createdFire.fire_id,
                        predictionResult.spread_prediction
                    );
                }
            } catch (aiErr) {
                console.warn(`Fire prediction failed for fire ${createdFire.fire_id}: ${aiErr.message}`);
            }

            // Step 4: Auto-verify if infrared confirms fire
            if (infraredResult?.confirmed === true) {
                await this.fireRepository.updateFire(createdFire.fire_id, { is_verified: true });
                createdFire.is_verified = true;
            }

            // Step 5: Dispatch nearest available responder
            // Step 6: Publish assignment.created → fireAssignment.subscriber notifies the responder
            let assignment = null;
            try {
                assignment = await this.dispatchClosestResponder(createdFire.fire_id);

                await this.natsPublisher.publish('assignmentCreated', {
                    assignment_id: assignment.assignment_id,
                    assignment_status: assignment.assignment_status,
                    fire_id: createdFire.fire_id,
                    responder_id: assignment.responder_id
                });
            } catch (dispatchErr) {
                console.warn(`Responder dispatch failed for fire ${createdFire.fire_id}: ${dispatchErr.message}`);
            }

            // Step 7: Generate evacuation route
            // Step 8: Publish evacuation.updated → alert.subscriber creates EvacuationAlerts for all roles
            try {
                if (data) {
                    const evacuation = await this.evacuationRepository.createEvacuation({
                        route_status: 'Open',
                        route_priority: createdFire.fire_severitylevel,
                        route_geometry: data.suggested_route_path,
                        safe_zone: data.suggested_safe_zone ?? null,
                        distance_km: data.distance_km ?? 0,
                        estimated_time: data.estimated_time ?? 0,
                        fire_id: createdFire.fire_id
                    });

                    await this.natsPublisher.publish('evacuationUpdated', {
                        route_id: evacuation.route_id,
                        route_status: evacuation.route_status,
                        route_priority: evacuation.route_priority,
                        fire_id: createdFire.fire_id
                    });
                }
            } catch (evacErr) {
                console.warn(`Evacuation route creation failed for fire ${createdFire.fire_id}: ${evacErr.message}`);
            }

            // Step 9: Publish fire.detected → fireDetected.subscriber → alert.created x3 → 3 FireAlerts in DB
            try {
                await this.natsPublisher.publish('fireDetected', {
                    fire_id: createdFire.fire_id,
                    fire_location: createdFire.fire_location,
                    fire_severitylevel: createdFire.fire_severitylevel,
                    is_verified: createdFire.is_verified,
                    assignment_id: assignment?.assignment_id ?? null,
                    timestamp: new Date().toISOString()
                });
            } catch (natsErr) {
                console.warn(`NATS publish failed for fire ${createdFire.fire_id}: ${natsErr.message}`);
            }

            return createdFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to create fire and trigger system: ${err.message}`);
        }
    }

    /**
     * Create a fire without triggering system orchestration.
     *
     * PRE-CONDITIONS:
     * - fire_source and fire_location must be provided.
     *
     * POST-CONDITIONS:
     * - Fire is stored in the database.
     * - Returns fire DTO.
     */
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

    /**
     * Retrieve all fires.
     *
     * PRE-CONDITIONS:
     * - fireRepository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of fire DTOs.
     */
    async getAllFires() {
        try {
            // Fetch all fires from repository
            const fires = await this.fireRepository.getAllFires();
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires: ${err.message}`);
        }
    }

    /**
     * Retrieve fire by ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns fire DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve active fires.
     *
     * PRE-CONDITIONS:
     * - fireRepository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of active fire DTOs.
     */
    async getActiveFires() {
        try {
            // Fetch active fires from repository
            const fires = await this.fireRepository.getActiveFires();
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch active fires: ${err.message}`);
        }
    }

    /**
     * Retrieve fires by status.
     *
     * PRE-CONDITIONS:
     * - fire_status must be provided.
     *
     * POST-CONDITIONS:
     * - Returns list of matching fire DTOs.
     * - Returns empty array if none found.
     */
    async getFiresByStatus(fire_status) {
        try {
            // Fetch fires by status from repository
            const fires = await this.fireRepository.getFiresByStatus(fire_status);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by status: ${err.message}`);
        }
    }

    /**
     * Retrieve fires by municipality.
     *
     * PRE-CONDITIONS:
     * - municipality_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns list of fire DTOs.
     */
    async getFiresByMunicipality(municipality_id) {
        try {
            // Fetch fires by municipality from repository
            const fires = await this.fireRepository.getFiresByMunicipality(municipality_id);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by municipality: ${err.message}`);
        }
    }

    /**
     * Retrieve fires within radius.
     *
     * PRE-CONDITIONS:
     * - lat and lng must be provided.
     *
     * POST-CONDITIONS:
     * - Returns fires within radius.
     */
    async getFiresRadius(lat, lng, radiusMeters) {
        try {
            if (lat === undefined || lng === undefined) throw new Error("Missing required fields: lat and lng");
            // Fetch fires within radius from repository
            const fires = await this.fireRepository.getFiresRadius(lat, lng, radiusMeters);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by radius: ${err.message}`);
        }
    }

    /**
     * Retrieve fires within polygon.
     *
     * PRE-CONDITIONS:
     * - polygonGeoJSON must be provided.
     *
     * POST-CONDITIONS:
     * - Returns fires inside polygon.
     */
    async getFiresWithinPolygon(polygonGeoJSON) {
        try {
            if (!polygonGeoJSON) throw new Error("Missing required field: Polygon GeoJSON");
            // Fetch fires within polygon from repository
            const fires = await this.fireRepository.getFiresWithinPolygon(polygonGeoJSON);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires within polygon: ${err.message}`);
        }
    }

    /**
     * Retrieve recent fires.
     *
     * PRE-CONDITIONS:
     * - limit may be provided.
     *
     * POST-CONDITIONS:
     * - Returns recent fires.
     */
    async getRecentFires(limit) {
        try {
            // Fetch recent fires from repository
            const fires = await this.fireRepository.getRecentFires(limit);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch recent fires: ${err.message}`);
        }
    }

    /**
     * Retrieve fires by date range.
     *
     * PRE-CONDITIONS:
     * - startDate and endDate must be provided.
     *
     * POST-CONDITIONS:
     * - Returns fires within date range.
     */
    async getFiresByDate(startDate, endDate) {
        try {
            //  Fetch fires by date range from repository
            const fires = await this.fireRepository.getFiresByDate(startDate, endDate);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by date: ${err.message}`);
        }
    }

    /**
     * Retrieve fire statistics.
     *
     * PRE-CONDITIONS:
     * - startDate and endDate must be provided.
     *
     * POST-CONDITIONS:
     * - Returns aggregated fire statistics.
     */
    async getFireStatistics(startDate, endDate) {
        try {
            // Fetch fire statistics from repository
            return await this.fireRepository.getFireStatistics(startDate, endDate);
        } catch (err) {
            throw new Error(`Failed to fetch fire statistics: ${err.message}`);
        }
    }

    /**
     * Retrieve fires by location and time.
     *
     * PRE-CONDITIONS:
     * - lat and lng must be provided.
     *
     * POST-CONDITIONS:
     * - Returns fires matching criteria.
     */
    async getFiresByLocationAndTime(lat, lng, startDate, endDate, radiusMeters) {
        try {
            if (lat === undefined || lng === undefined) throw new Error("Missing required fields: lat and lng");
            // Fetch fires by location and time from repository
            const fires = await this.fireRepository.getFireByLocationAndTime(lat, lng, startDate, endDate, radiusMeters);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by location and time: ${err.message}`);
        }
    }

    /**
     * Verify a fire.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Fire is marked as verified.
     * - Returns updated fire DTO.
     */
    async verifyFire(fire_id) {
        try {
            const fire = await this.fireRepository.updateFire(fire_id, { is_verified: true });
            if (!fire) return null;
            return fire.toDTO();
        } catch (err) {
            throw new Error(`Failed to verify fire: ${err.message}`);
        }
    }

    /**
     * Extinguish a fire and clean system.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Fire is marked as extinguished.
     * - Assignments are completed.
     * - Responders moved to Standby.
     * - Evacuations and alerts are deleted.
     * - NATS event is published.
     */
    async extinguishFire(fire_id) {
        try {
            // Mark fire as extinguished
            const fire = await this.fireRepository.updateFireStatus(fire_id, true);
            if (!fire) return null;

            // Complete all assignments linked to this fire
            try {
                const assignments = await this.fireAssignmentService.getAssignmentsByFireId(fire_id);

                for (const assignment of assignments) {

                    // 1. Complete assignment if needed
                    if (!['Completed', 'Cancelled'].includes(assignment.assignment_status)) {
                        await this.fireAssignmentService.updateAssignmentStatus(
                            assignment.assignment_id,
                            'Completed'
                        );
                    }

                    // 2. Move responder to Standby
                    try {
                        await this.responderService.updateResponderStatus(
                            assignment.responder_id,
                            'Standby'
                        );
                    } catch (statusErr) {
                        console.warn(
                            `Failed to update responder ${assignment.responder_id} to Standby: ${statusErr.message}`
                        );
                    }
                }
            } catch (assignmentErr) {
                console.warn(
                    `Failed to complete assignments for fire ${fire_id}: ${assignmentErr.message}`
                );
            }

            // Deactivate evacuation routes for this fire
            try {
                await this.evacuationRepository.deleteEvacuationsByFireId(fire_id);
            } catch (evacErr) {
                console.warn(`Failed to clean up evacuations for fire ${fire_id}: ${evacErr.message}`);
            }

            // Clean up alerts for this fire
            try {
                await this.alertRepository.deleteAlertsByFireId(fire_id);
            } catch (alertErr) {
                console.warn(`Failed to clean up alerts for fire ${fire_id}: ${alertErr.message}`);
            }

            // Publish NATS event
            try {
                await this.natsPublisher.publish('fireExtinguished', {
                    fire_id,
                    timestamp: new Date().toISOString()
                });
            } catch (natsErr) {
                console.warn(`NATS publish failed for fire extinguished ${fire_id}: ${natsErr.message}`);
            }

            return fire.toDTO();
        } catch (err) {
            throw new Error(`Failed to extinguish fire: ${err.message}`);
        }
    }

    /**
     * Dispatch nearest responder to a fire.
     *
     * PRE-CONDITIONS:
     * - fire_id must exist.
     *
     * POST-CONDITIONS:
     * - Nearest responder is assigned.
     * - Responder status updated if needed.
     * - Returns assignment.
     */
    async dispatchClosestResponder(fire_id) {
        try {
            const fire = await this.fireRepository.getFireById(fire_id);
            if (!fire) throw new Error("Fire not found");

            const nearestResponder = await this.responderService.getNearestResponder(fire.fire_location);
            if (!nearestResponder) throw new Error("No available responders found");

            const assignment = await this.fireAssignmentService.createAssignment({
                assignment_status: 'Assigned',
                fire_id,
                responder_id: nearestResponder.responder_id
            });

            // If responder was Standby, move them to Active once assigned.
            // If already Active, keep them Active.
            // Never force assigned responders to Unavailable.
            if (nearestResponder.responder_status === 'Standby') {
                await this.responderService.updateResponderStatus(
                    nearestResponder.responder_id,
                    'Active'
                );
            }

            return assignment;

        } catch (err) {
            throw new Error(`Failed to dispatch closest responder: ${err.message}`);
        }
    }

    /**
     * Update fire details.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Fire is updated.
     * - Returns updated DTO.
     */
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

    /**
     * Update fire status.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Fire status updated.
     */
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

    /**
     * Update fire severity.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Fire severity updated.
     */
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

    /**
     * Delete fire.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Fire deleted from database.
     */
    async deleteFire(fire_id) {
        try {
            // Delete fire by ID
            return await this.fireRepository.deleteFire(fire_id);
        } catch (err) {
            throw new Error(`Failed to delete fire: ${err.message}`);
        }
    }

    /**
     * Count fires.
     *
     * PRE-CONDITIONS:
     * - filters may be provided.
     *
     * POST-CONDITIONS:
     * - Returns number of fires.
     */
    async countFires(filters) {
        try {
            // Count fires based on filters
            return await this.fireRepository.countFires(filters);
        } catch (err) {
            throw new Error(`Failed to count fires: ${err.message}`);
        }
    }

    /**
     * Get nearby fires.
     *
     * PRE-CONDITIONS:
     * - latitude and longitude must be provided.
     *
     * POST-CONDITIONS:
     * - Returns fires within dynamic danger radius.
     */
    async getNearbyFires(latitude, longitude) {
        try {
            if (latitude === undefined || longitude === undefined) {
                throw new Error("Missing required fields: latitude and longitude");
            }

            const userLocation = { latitude, longitude };
            const fires = await this.fireRepository.getActiveFires();

            if (!fires || fires.length === 0) return [];

            const nearbyFires = fires.filter(fire => {
                const fireCoords = this._parseFireLocation(fire.fire_location);
                if (!fireCoords) return false;

                const dist = this._distanceInMeters(userLocation, fireCoords);
                const radius = this._getFireZoneRadiusMeters(fire.fire_severitylevel);

                return dist <= radius;
            });

            return nearbyFires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch nearby fires: ${err.message}`);
        }
    }

    // Find all residents located near a specific fire.
    // radiusMeters defaults to 1km around the fire's location.
    /**
     * Find residents near a fire.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns residents within radius of fire.
     */
    async findResidentsNearFire(fire_id, radiusMeters = 1000) {
        try {
            if (!fire_id) throw new Error("Missing required field: Fire ID");

            // Step 1: Get fire location
            const fire = await this.fireRepository.getFireById(fire_id);
            if (!fire) throw new Error("Fire not found");

            // Step 2: Parse coordinates from WKT string
            const coords = this._parseWKTPoint(fire.fire_location);
            if (!coords) throw new Error("Could not parse fire location coordinates");

            // Step 3: Find residents within radius
            const residents =
                await this.residentRepository.getResidentsByLastKnownLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    radiusMeters
                });

            return residents.map(r => r.toDTO ? r.toDTO() : r);

        } catch (err) {
            throw new Error(`Failed to find residents near fire: ${err.message}`);
        }
    }

    /**
     * Determine fire danger radius based on severity.
     *
     * PRE-CONDITIONS:
     * - severity level must be provided.
     *
     * POST-CONDITIONS:
     * - Returns radius in meters.
     */
    _getFireZoneRadiusMeters(level) {
        if (level >= 8) return 1000;
        if (level >= 6) return 800;
        if (level >= 3) return 500;
        return 400;
    }

    /**
     * Calculate distance between two coordinates.
     *
     * PRE-CONDITIONS:
     * - coordinates must be valid.
     *
     * POST-CONDITIONS:
     * - Returns distance in meters.
     */
    _distanceInMeters(a, b) {
        if (!a || !b) return Infinity;

        const toRad = deg => (deg * Math.PI) / 180;
        const R = 6371000;

        const dLat = toRad(b.latitude - a.latitude);
        const dLng = toRad(b.longitude - a.longitude);
        const lat1 = toRad(a.latitude);
        const lat2 = toRad(b.latitude);

        const x =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
        return R * y;
    }

    /**
     * Parse fire location.
     *
     * PRE-CONDITIONS:
     * - raw location must be provided.
     *
     * POST-CONDITIONS:
     * - Returns coordinates or null.
     */
    _parseFireLocation(raw) {
        if (!raw) return null;

        if (typeof raw === 'string' && raw.startsWith('{')) {
            try {
                const g = JSON.parse(raw);
                if (g.type === 'Point' && Array.isArray(g.coordinates)) {
                    return {
                        longitude: g.coordinates[0],
                        latitude: g.coordinates[1]
                    };
                }
            } catch {}
        }

        return this._parseWKTPoint(raw);
    }

    /**
     * Parse WKT POINT.
     *
     * PRE-CONDITIONS:
     * - wkt must be valid.
     *
     * POST-CONDITIONS:
     * - Returns coordinates or null.
     */
    _parseWKTPoint(wkt) {
        const match = wkt?.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
        if (!match) return null;
        return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
    }
}