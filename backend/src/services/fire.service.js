// src/services/fire.service.js

import { FireEvent } from '../domain/entities/fire.entity.js';

export class FireService {
    constructor(
        fireRepository,
        fireAssignmentService,
        evacuationRepository,
        alertRepository,
        responderService,
        infraredEngine,
        firePredictionEngine,
        fireSpreadEngine,
        natsPublisher
    ) {
        this.fireRepository         = fireRepository;
        this.fireAssignmentService  = fireAssignmentService;
        this.evacuationRepository   = evacuationRepository;
        this.alertRepository        = alertRepository;
        this.responderService       = responderService;
        this.infraredEngine         = infraredEngine;
        this.firePredictionEngine   = firePredictionEngine;
        this.fireSpreadEngine       = fireSpreadEngine;
        this.natsPublisher          = natsPublisher;
    }

    // CORE ORCHESTRATION METHOD
    //
    // Full fire lifecycle trigger — called when a new fire is detected.
    // Steps:
    //   1. Save fire to DB
    //   2. Run infrared analysis to validate authenticity
    //   3. Run fire prediction engine
    //   4. Auto-verify fire if infrared confirms it
    //   5. Dispatch nearest available responder
    //   6. Create fire assignment
    //   7. Generate evacuation route
    //   8. Broadcast alert to all roles
    //   9. Publish NATS event
    //
    async createFireAndTriggerSystem(data) {
        try {
            if (!data.fire_source)       throw new Error("Missing required field: Fire Source");
            if (!data.fire_location)     throw new Error("Missing required field: Fire Location");
            if (!data.fire_severitylevel) throw new Error("Missing required field: Fire Severity Level");

            // Step 1: Save fire
            const fire = new FireEvent({
                fire_source:        data.fire_source,
                fire_location:      data.fire_location,
                fire_severitylevel: data.fire_severitylevel,
                is_extinguished:    false,
                is_verified:        false
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
            let assignment = null;
            try {
                const nearestResponder = await this.responderService.getNearestResponder(
                    createdFire.fire_location
                );
                if (nearestResponder) {
                    // Step 6: Create fire assignment
                    assignment = await this.fireAssignmentService.createAssignment({
                        assignment_status: 'active',
                        fire_id:           createdFire.fire_id,
                        responder_id:      nearestResponder.responder_id
                    });
                    // Mark responder as dispatched
                    await this.responderService.updateResponderStatus(
                        nearestResponder.responder_id,
                        'dispatched'
                    );
                }
            } catch (dispatchErr) {
                console.warn(`Responder dispatch failed for fire ${createdFire.fire_id}: ${dispatchErr.message}`);
            }

            // Step 7: Generate evacuation route
            try {
                await this.evacuationRepository.createEvacuation({
                    route_status:   'active',
                    route_priority: createdFire.fire_severitylevel,
                    route_path:     data.suggested_route_path ?? createdFire.fire_location,
                    safe_zone:      data.suggested_safe_zone  ?? createdFire.fire_location,
                    distance_km:    data.distance_km          ?? 0,
                    estimated_time: data.estimated_time       ?? 0,
                    fire_id:        createdFire.fire_id
                });
            } catch (evacErr) {
                console.warn(`Evacuation route creation failed for fire ${createdFire.fire_id}: ${evacErr.message}`);
            }

            // Step 8: Broadcast alert
            try {
                await this.alertRepository.createAlert({
                    alert_type:    'fire',
                    target_role:   'all',
                    alert_message: `Fire reported at ${createdFire.fire_location}. Severity: ${createdFire.fire_severitylevel}.`,
                    expires_at:    new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
                    fire_id:       createdFire.fire_id
                });
            } catch (alertErr) {
                console.warn(`Alert broadcast failed for fire ${createdFire.fire_id}: ${alertErr.message}`);
            }

            // Step 9: Publish NATS event
            try {
                await this.natsPublisher.publish('fireDetected', {
                    fire_id:            createdFire.fire_id,
                    fire_location:      createdFire.fire_location,
                    fire_severitylevel: createdFire.fire_severitylevel,
                    is_verified:        createdFire.is_verified,
                    assignment_id:      assignment?.assignment_id ?? null,
                    timestamp:          new Date().toISOString()
                });
            } catch (natsErr) {
                console.warn(`NATS publish failed for fire ${createdFire.fire_id}: ${natsErr.message}`);
            }

            return createdFire.toDTO();
        } catch (err) {
            throw new Error(`Failed to create fire and trigger system: ${err.message}`);
        }
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
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by status: ${err.message}`);
        }
    }

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
            if (lat === undefined || lng === undefined) throw new Error("Missing required fields: lat and lng");
            // Fetch fires by location and time from repository
            const fires = await this.fireRepository.getFireByLocationAndTime(lat, lng, startDate, endDate, radiusMeters);
            if (!fires || fires.length === 0) return [];
            return fires.map(fire => fire.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch fires by location and time: ${err.message}`);
        }
    }

    async verifyFire(fire_id) {
        try {
            const fire = await this.fireRepository.updateFire(fire_id, { is_verified: true });
            if (!fire) return null;
            return fire.toDTO();
        } catch (err) {
            throw new Error(`Failed to verify fire: ${err.message}`);
        }
    }

    async extinguishFire(fire_id) {
        try {
            // Mark fire as extinguished
            const fire = await this.fireRepository.updateFireStatus(fire_id, true);
            if (!fire) return null;

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

    async dispatchClosestResponder(fire_id) {
        try {
            const fire = await this.fireRepository.getFireById(fire_id);
            if (!fire) throw new Error("Fire not found");

            const nearestResponder = await this.responderService.getNearestResponder(fire.fire_location);
            if (!nearestResponder) throw new Error("No available responders found");

            const assignment = await this.fireAssignmentService.createAssignment({
                assignment_status: 'active',
                fire_id,
                responder_id: nearestResponder.responder_id
            });

            await this.responderService.updateResponderStatus(nearestResponder.responder_id, 'dispatched');

            return assignment;
        } catch (err) {
            throw new Error(`Failed to dispatch closest responder: ${err.message}`);
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

    // Find all residents located near a specific fire.
    // radiusMeters defaults to 1km around the fire's location.
    async findResidentsNearFire(fire_id, radiusMeters = 1000) {
        try {
            if (!fire_id) throw new Error("Missing required field: Fire ID");

            // Step 1: Get fire location
            const fire = await this.fireService.getFireById(fire_id);
            if (!fire) throw new Error("Fire not found");

            // Step 2: Parse coordinates from WKT string
            const coords = this._parseWKTPoint(fire.fire_location);
            if (!coords) throw new Error("Could not parse fire location coordinates");

            // Step 3: Find residents within radius via repository
            // residentRepository.getResidentsByLastKnownLocation does a ST_DWithin.
            const residents = await this.residentRepository.getResidentsByLastKnownLocation({
                latitude:  coords.latitude,
                longitude: coords.longitude
            });

            return residents.map(r => r.toDTO ? r.toDTO() : r);
        } catch (err) {
            throw new Error(`Failed to find residents near fire: ${err.message}`);
        }
    }
}
