// src/domain/repositories/evacuation.repository.js

import { pool } from '../../config/db.js';
import { Evacuation } from '../entities/evacuation.entity.js';
import { FireRepository } from './fire.repository.js';

/**
 * This file defines the EvacuationRepository class.
 * It handles all database operations for evacuation routes,
 * including creation, retrieval, spatial search, updates, and deletion.
 */
export class EvacuationRepository {
    /**
     * Creates a new evacuation route linked to an existing fire incident.
     *
     * PRE-CONDITIONS:
     * - data must contain route_status, route_priority, route_path, safe_zone, distance_km, estimated_time, and fire_id.
     * - fire_id must refer to an existing fire incident.
     * - route_path and safe_zone must be valid WKT strings.
     *
     * POST-CONDITIONS:
     * - Inserts a new evacuation route into the database.
     * - Returns the created Evacuation entity.
     * - Throws an error if the fire_id does not exist.
     */
    async createEvacuation(data) {
        const { route_status, route_priority, route_path, safe_zone, distance_km, estimated_time, fire_id } = data;

        // Step 1: Validate fire_id exists
        const fireRepository = new FireRepository();
        const fire = await fireRepository.getFireById(fire_id);
        if (!fire) {
            throw new Error('Fire incident not found for the given fire_id');
        }

        // Step 2: Insert the evacuation route
        const evacuationSql = `
            INSERT INTO evacuationroutes 
            (route_status, route_priority, route_path, safe_zone, distance_km, estimated_time, created_at, fire_id)
            VALUES ($1, $2, ST_GeogFromText($3), ST_GeogFromText($4), $5, $6, NOW(), $7)
            RETURNING route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, fire_id
        `;

        // route_path and safe_zone must be WKT strings like 'LINESTRING(...)' and 'POLYGON(...)'
        const evacuationValues = [route_status, route_priority, route_path, safe_zone, distance_km, estimated_time, fire_id];
        const { rows: evacuationRows } = await pool.query(evacuationSql, evacuationValues);

        return Evacuation.fromEntity(evacuationRows[0]);
    }

    /**
     * Retrieves all evacuation routes from the database.
     *
     * PRE-CONDITIONS:
     * - Database connection must be available.
     *
     * POST-CONDITIONS:
     * - Returns an array of Evacuation entities.
     * - Returns an empty array if no evacuation routes exist.
     */
    async getAllEvacuations() {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id 
            FROM evacuationroutes 
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql);

        if (rows.length === 0) {
            return []; // No evacuation routes found
        }

        return rows.map(row => Evacuation.fromEntity(row));
    }

    /**
     * Retrieves one evacuation route by its route ID.
     *
     * PRE-CONDITIONS:
     * - route_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns an Evacuation entity if found.
     * - Returns null if no route exists with the given ID.
     */
    async getEvacuationById(route_id) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes 
            WHERE route_id = $1
        `;
        const { rows } = await pool.query(sql, [route_id]);

        if (rows.length === 0) {
            return null; // Evacuation route not found
        }

        return Evacuation.fromEntity(rows[0]);
    }

    /**
     * Retrieves evacuation routes filtered by route status.
     *
     * PRE-CONDITIONS:
     * - route_status must be provided.
     *
     * POST-CONDITIONS:
     * - Returns an array of Evacuation entities matching the status.
     * - Returns an empty array if no matching routes are found.
     */
    async getEvacuationsByStatus(route_status) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes 
            WHERE route_status = $1
        `;
        const { rows } = await pool.query(sql, [route_status]);

        if (rows.length === 0) {
            return []; // No evacuation routes found for this status
        }

        return rows.map(row => Evacuation.fromEntity(row));
    }

    /**
     * Retrieves evacuation routes filtered by priority level.
     *
     * PRE-CONDITIONS:
     * - route_priority must be provided.
     *
     * POST-CONDITIONS:
     * - Returns an array of Evacuation entities matching the priority.
     * - Returns an empty array if no matching routes are found.
     */
    async getEvacuationsByPriority(route_priority) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes 
            WHERE route_priority = $1
        `;
        const { rows } = await pool.query(sql, [route_priority]);

        if (rows.length === 0) {
            return []; // No evacuation routes found for this priority
        }

        return rows.map(row => Evacuation.fromEntity(row));
    }

    /**
     * Retrieves evacuation routes near a given safe zone location.
     *
     * PRE-CONDITIONS:
     * - safe_zone must contain longitude and latitude.
     *
     * POST-CONDITIONS:
     * - Returns evacuation routes within 1km of the given safe zone point.
     * - Returns an empty array if no nearby routes are found.
     */
    async getEvacuationsByZone(safe_zone) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes 
            WHERE ST_DWithin(safe_zone::geography, ST_GeogFromText($1), 1000) -- Within 1km of the given safe_zone
        `;
        const { rows } = await pool.query(sql, [`POINT(${safe_zone.longitude} ${safe_zone.latitude})`]);

        if (rows.length === 0) {
            return []; // No evacuation routes found near this safe zone
        }

        return rows.map(row => Evacuation.fromEntity(row));
    }

    /**
     * Retrieves evacuation routes linked to a specific fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns an array of Evacuation entities linked to the fire.
     * - Returns an empty array if no routes are linked to the fire.
     */
    async getEvacuationsByFireId(fire_id) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes WHERE fire_id = $1
        `;
        const { rows } = await pool.query(sql, [fire_id]);

        if (rows.length === 0) {
            return []; // No evacuation routes found for this fire_id
        }

        return rows.map(row => Evacuation.fromEntity(row));
    }

    /**
     * Retrieves the nearest evacuation route to a given coordinate.
     *
     * PRE-CONDITIONS:
     * - latitude and longitude must be provided.
     *
     * POST-CONDITIONS:
     * - Returns the nearest Evacuation entity.
     * - Returns null if no evacuation routes exist.
     */
    async getNearestEvacuation(latitude, longitude) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path,
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id,
            ST_Distance(route_path::geography, ST_GeogFromText($1)::geography) AS distance_to_route
            FROM evacuationroutes
            ORDER BY distance_to_route ASC
            LIMIT 1
        `;
        const { rows } = await pool.query(sql, [`POINT(${longitude} ${latitude})`]);

        if (rows.length === 0) {
            return null; // No evacuation routes found
        }

        return Evacuation.fromEntity(rows[0]);
    }

    /**
     * Updates the status of an evacuation route.
     *
     * PRE-CONDITIONS:
     * - route_id and new_status must be provided.
     *
     * POST-CONDITIONS:
     * - Updates route_status and updated_at.
     * - Returns updated Evacuation entity if found.
     * - Returns null if route does not exist.
     */
    async updateEvacuationStatus(route_id, new_status) {
        const sql = `
            UPDATE evacuationroutes SET route_status = $1, updated_at = NOW()
            WHERE route_id = $2
            RETURNING route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path,
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
        `;
        const { rows } = await pool.query(sql, [new_status, route_id]);

        if (rows.length === 0) {
            return null; // Evacuation route not found
        }

        return Evacuation.fromEntity(rows[0]);
    }

    /**
     * Updates the priority of an evacuation route.
     *
     * PRE-CONDITIONS:
     * - route_id and new_priority must be provided.
     *
     * POST-CONDITIONS:
     * - Updates route_priority and updated_at.
     * - Returns updated Evacuation entity if found.
     * - Returns null if route does not exist.
     */
    async updateEvacuationPriority(route_id, new_priority) {
        const sql = `
            UPDATE evacuationroutes SET route_priority = $1, updated_at = NOW()
            WHERE route_id = $2 RETURNING route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path,
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
        `;
        const { rows } = await pool.query(sql, [new_priority, route_id]);

        if (rows.length === 0) {
            return null; // Evacuation route not found
        }
        
        return Evacuation.fromEntity(rows[0]);
    }

    /**
     * Updates the geometry of an evacuation route.
     *
     * PRE-CONDITIONS:
     * - route_id must be provided.
     * - new_route_path and new_safe_zone must be valid WKT strings.
     *
     * POST-CONDITIONS:
     * - Updates route_path, safe_zone, and updated_at.
     * - Returns updated Evacuation entity if found.
     * - Returns null if route does not exist.
     */
    async updateEvacuationGeometry(route_id, new_route_path, new_safe_zone) {
        const sql = `
            UPDATE evacuationroutes SET route_path = ST_GeogFromText($1), safe_zone = ST_GeogFromText($2), updated_at = NOW() 
            WHERE route_id = $3 RETURNING route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path,
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time::text AS estimated_time, created_at, updated_at, fire_id
        `;
        const { rows } = await pool.query(sql, [new_route_path, new_safe_zone, route_id]);

        if (rows.length === 0) {
            return null; // Evacuation route not found
        }

        return Evacuation.fromEntity(rows[0]);
    }

    /**
     * Deletes an evacuation route by ID.
     *
     * PRE-CONDITIONS:
     * - route_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes the route if it exists.
     * - Returns true if deleted.
     * - Returns false if route does not exist.
     */
    async deleteEvacuation(route_id) {
        const sql = `
            DELETE FROM evacuationroutes 
            WHERE route_id = $1 
            RETURNING route_id
        `;
        const { rows } = await pool.query(sql, [route_id]);

        if (rows.length === 0) {
            return false; // Evacuation route not found
        }

        return true; // Successfully deleted
    }

    /**
     * Deletes evacuation routes associated with a specific fire.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deletes matching evacuation routes.
     * - Returns true if at least one route was deleted.
     * - Returns false if no routes were found for the fire.
     */
    async deleteEvacuationsByFireId(fire_id) {
        const sql = `
            DELETE FROM evacuationroutes 
            WHERE fire_id = $1 
            RETURNING route_id
        `;
        const { rows } = await pool.query(sql, [fire_id]);

        if (rows.length === 0) {
            return false; // No evacuation routes found for this fire_id
        }

        return true; // Successfully deleted evacuation routes for this fire_id
    }
}