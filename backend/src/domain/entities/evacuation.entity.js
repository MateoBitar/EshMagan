// src/domain/entities/evacuation.entity.js

// This entity represents an evacuation route generated for a fire incident.
export class Evacuation {
    constructor({route_id, route_status, route_priority, route_path, safe_zone, distance_km, 
            estimated_time, created_at, updated_at, fire_id}) {

        this.route_id = route_id;
        this.route_status = route_status;
        this.route_priority = route_priority;
        this.route_path = route_path;
        this.safe_zone = safe_zone;
        this.distance_km = distance_km;
        this.estimated_time = estimated_time; // In minutes
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.fire_id = fire_id;
    }

    // Static factory method
    static fromEntity(raw) {
        return new Evacuation({
            route_id: raw.route_id,
            route_status: raw.route_status,
            route_priority: raw.route_priority,
            route_path: raw.route_path,
            safe_zone: raw.safe_zone,
            distance_km: raw.distance_km,
            estimated_time: raw.estimated_time,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            fire_id: raw.fire_id
        });
    }

    // Expose a DTO for controllers
    toDTO() {
        return {
            route_id: this.route_id,
            route_status: this.route_status,
            route_priority: this.route_priority,
            route_path: this.route_path,
            safe_zone: this.safe_zone,
            distance_km: this.distance_km,
            estimated_time: this.estimated_time,
            created_at: this.created_at,
            updated_at: this.updated_at,
            fire_id: this.fire_id
        }
    }
}
