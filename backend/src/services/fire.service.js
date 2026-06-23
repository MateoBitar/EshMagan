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
     * - If new fire, nearest responder is dispatched and assigned.
     * - Evacuation routes are created or updated if provided.
     * - NATS events are published for fire detection, assignment, and evacuation updates.
     * - Returns created or updated fire DTO.
     * - If any step fails, logs the error and continues with best effort to complete workflow.
     */
    async createFireAndTriggerSystem(data) {
        try {
            // Validate required fields
            if (!data.fire_source) throw new Error("Missing required field: Fire Source");
            if (!data.fire_location) throw new Error("Missing required field: Fire Location");
            if (!data.fire_severitylevel) throw new Error("Missing required field: Fire Severity Level");

            // Parse incoming fire location
            const incomingCoords = this._parseFireLocation(data.fire_location);
            if (!incomingCoords) throw new Error("Invalid fire_location format");

            // Check for nearby active fires to determine if this is a new fire or an update to an existing fire
            const nearbyActiveFires = await this.fireRepository.getFiresRadius(
                incomingCoords.latitude,
                incomingCoords.longitude,
                100
            );

            // If there is an existing active fire nearby, we consider this an update to that fire rather than a new fire event
            const existingFire = nearbyActiveFires.find(f => !f.is_extinguished);

            let activeFire;
            let isNewFire = false;

            // If an existing fire is found, we update it with the new information. Otherwise, we create a new fire record.
            if (existingFire) {
                // Update existing fire record
                activeFire = await this.fireRepository.updateFire(existingFire.fire_id, {
                    fire_source: data.fire_source,
                    fire_location: data.fire_location,
                    fire_severitylevel: Math.max(
                        Number(existingFire.fire_severitylevel || 0),
                        Number(data.fire_severitylevel || 0)
                    ),
                    is_verified: data.is_verified ?? existingFire.is_verified,
                });

                // Detect which fields changed (minimal: severity)
                try {
                    const updatedFields = [];
                    const prevSeverity = Number(existingFire.fire_severitylevel || 0);
                    const newSeverity = Number(data.fire_severitylevel || prevSeverity);
                    if (newSeverity > prevSeverity) updatedFields.push('severity');

                    // If fire_location string changed, mark location updated
                    if (data.fire_location && data.fire_location !== existingFire.fire_location) {
                        updatedFields.push('location');
                    }

                    if (updatedFields.length > 0) {
                        // Best-effort publish fire.spread so subscribers react to the update
                        await this.natsPublisher.publish('fireSpread', {
                            fire_id: activeFire.fire_id,
                            fire_location: activeFire.fire_location,
                            fire_severitylevel: activeFire.fire_severitylevel,
                            updated_fields: updatedFields,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (spreadErr) {
                    console.warn(`Failed to publish fire.spread for fire ${activeFire.fire_id}: ${spreadErr.message}`);
                }

            } else {
                const fire = new FireEvent({
                    fire_source: data.fire_source,
                    fire_location: data.fire_location,
                    fire_severitylevel: data.fire_severitylevel,
                    is_extinguished: false,
                    is_verified: data.is_verified ?? false
                });

                activeFire = await this.fireRepository.createFire(fire);
                isNewFire = true;
            }

            let assignment = null;
            // If this is a new fire, we attempt to dispatch the closest responder and create an assignment. If this fails, we log the error but continue with the workflow.
            if (isNewFire) {
                try {
                    assignment = await this.dispatchClosestResponder(activeFire.fire_id);

                    await this.natsPublisher.publish('assignmentCreated', {
                        assignment_id: assignment.assignment_id,
                        assignment_status: assignment.assignment_status,
                        fire_id: activeFire.fire_id,
                        responder_id: assignment.responder_id
                    });
                } catch (dispatchErr) {
                    console.warn(`Responder dispatch failed for fire ${activeFire.fire_id}: ${dispatchErr.message}`);
                }
            }
            // If evacuation routes are provided in the input, we create or update them accordingly. If this fails, we log the error but continue with the workflow.
            try {
                const aiRoutes =
                    Array.isArray(data.evacuation_routes)
                        ? data.evacuation_routes
                        : Array.isArray(data.routes)
                            ? data.routes
                            : [];

                if (aiRoutes.length > 0) {
                    const existingRoutes = await this.evacuationRepository.getEvacuationsByFireId(
                        activeFire.fire_id
                    );
                    // If there are existing routes, we update them with the new information. Otherwise, we create new evacuation routes based on the AI-generated data.
                    if (existingRoutes.length > 0) {
                        for (let i = 0; i < Math.min(existingRoutes.length, aiRoutes.length); i++) {
                            const route = aiRoutes[i];
                            const existingRoute = existingRoutes[i];

                            if (!route.route_path || !route.safe_zone) {
                                console.warn(
                                    `Skipping invalid evacuation route update for fire ${activeFire.fire_id}: missing route_path or safe_zone`
                                );
                                continue;
                            }
                            // Update geometry, status, and priority of existing evacuation route
                            await this.evacuationRepository.updateEvacuationGeometry(
                                existingRoute.route_id,
                                route.route_path,
                                route.safe_zone
                            );
                            // If the route status or priority is provided in the input, we update those as well. Otherwise, we keep the existing values.
                            await this.evacuationRepository.updateEvacuationStatus(
                                existingRoute.route_id,
                                route.route_status || 'Open'
                            );

                            await this.evacuationRepository.updateEvacuationPriority(
                                existingRoute.route_id,
                                route.route_priority ?? activeFire.fire_severitylevel
                            );
                            // Publish NATS event for evacuation update
                            await this.natsPublisher.publish('evacuationUpdated', {
                                route_id: existingRoute.route_id,
                                route_status: route.route_status || 'Open',
                                route_priority: route.route_priority ?? activeFire.fire_severitylevel,
                                fire_id: activeFire.fire_id,
                            });
                        }
                    } else {
                        // No existing routes, create new evacuation routes based on AI-generated data
                        for (const route of aiRoutes) {
                            if (!route.route_path || !route.safe_zone) {
                                console.warn(
                                    `Skipping invalid evacuation route for fire ${activeFire.fire_id}: missing route_path or safe_zone`
                                );
                                continue;
                            }

                            const evacuation = await this.evacuationRepository.createEvacuation({
                                route_status: route.route_status || 'Open',
                                route_priority: route.route_priority ?? activeFire.fire_severitylevel,
                                route_path: route.route_path,
                                safe_zone: route.safe_zone,
                                distance_km: route.distance_km ?? 0,
                                estimated_time: route.estimated_time ?? 0,
                                fire_id: activeFire.fire_id,
                            });

                            await this.natsPublisher.publish('evacuationUpdated', {
                                route_id: evacuation.route_id,
                                route_status: evacuation.route_status,
                                route_priority: evacuation.route_priority,
                                fire_id: activeFire.fire_id,
                            });
                        }
                    }
                }
            } catch (evacErr) {
                console.warn(`Evacuation route handling failed for fire ${activeFire.fire_id}: ${evacErr.message}`);
            }
            // If this is a new fire, we publish a NATS event to trigger downstream systems such as alerting and AI analysis. If this fails, we log the error but continue with the workflow.
            if (isNewFire) {
                try {
                    await this.natsPublisher.publish('fireDetected', {
                        fire_id: activeFire.fire_id,
                        fire_location: activeFire.fire_location,
                        fire_severitylevel: activeFire.fire_severitylevel,
                        is_verified: activeFire.is_verified,
                        assignment_id: assignment?.assignment_id ?? null,
                        timestamp: new Date().toISOString()
                    });
                } catch (natsErr) {
                    console.warn(`NATS publish failed for fire ${activeFire.fire_id}: ${natsErr.message}`);
                }
            }

            return activeFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to create fire and trigger system: ${err.message}`);
        }
    }

    /**
     * Publish a fire risk prediction.
     * 
     * PRE-CONDITIONS:
     * - zone_location and risk_level must be provided in the data.
     * 
     * POST-CONDITIONS:
     * - Publishes a fire.risk.predicted event to NATS with the provided data.
     */
    async publishFireRiskPrediction(data) {
        try {
            if (!data.zone_location) throw new Error("Missing required field: Zone Location");
            if (!data.risk_level) throw new Error("Missing required field: Risk Level");

            // Publish fire risk prediction event to NATS
            await this.natsPublisher.publish('fireRiskPredicted', {
                zone_location: data.zone_location,
                risk_level: data.risk_level,
                fire_id: data.fire_id ?? null,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                message: "Fire risk prediction notification published"
            };
        } catch (err) {
            throw new Error(`Failed to publish fire risk prediction: ${err.message}`);
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
                const radius = this._getFireZoneRadiusMeters();

                return dist <= radius;
            });

            return nearbyFires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch nearby fires: ${err.message}`);
        }
    }

    // Find all residents located near a specific fire.
    // radiusMeters defaults to 10km around the fire's location.
    /**
     * Find residents near a fire.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns residents within radius of fire.
     */
    async findResidentsNearFire(fire_id, radiusMeters = 10000) {
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
     * Determine fire alert radius.
     *
     * PRE-CONDITIONS:
     * - No input required.
     *
     * POST-CONDITIONS:
     * - Returns fixed alert radius (10km).
     */
    _getFireZoneRadiusMeters() {
        return 10000;
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
            } catch { }
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