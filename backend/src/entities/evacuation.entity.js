// src/entities/evacuation.entity.js

// This entity represents an evacuation route generated for a fire incident.
export class Evacuation {
    static STATUSES = ['Open', 'Closed', 'InProgress'];  // Possible statuses for an evacuation route

    constructor({
        route_id,
        route_status,
        route_priority,
        route_path,
        safe_zone,
        distance_km,
        estimated_time,
        created_at = new Date(),
        updated_at = new Date(),
        fire_id
    }) {
        if (!route_id) throw new Error("route_id is required");

        if (route_status && !Evacuation.STATUSES.includes(route_status)) {
            throw new Error(`Invalid route_status: ${route_status}`);
        }

        if (route_priority !== undefined && typeof route_priority !== 'number') {
            throw new Error("route_priority must be a number");
        }

        if (distance_km !== undefined && typeof distance_km !== 'number') {
            throw new Error("distance_km must be a number");
        }

        this.route_id = route_id;
        this.route_status = route_status;
        this.route_priority = route_priority;
        this.route_path = route_path;
        this.safe_zone = safe_zone;
        this.distance_km = distance_km;
        this.estimated_time = estimated_time; // In minutes
        this.created_at = new Date(created_at);
        this.updated_at = new Date(updated_at);
        this.fire_id = fire_id;
    }
}
