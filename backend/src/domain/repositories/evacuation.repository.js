// src/domain/repositories/evacuation.repository.js

import { pool } from '../../config/db.js';
import { Evacuation } from '../entities/evacuation.entity.js';
import { FireRepository } from './fire.repository.js';

export class EvacuationRepository {
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
            RETURNING route_id, route_status, route_priority, route_path, safe_zone, distance_km, estimated_time, created_at, fire_id
        `;

        // route_path and safe_zone must be WKT strings like 'LINESTRING(...)' and 'POLYGON(...)'
        const evacuationValues = [route_status, route_priority, route_path, safe_zone, distance_km, estimated_time, fire_id];
        const { rows: evacuationRows } = await pool.query(evacuationSql, evacuationValues);

        return new Evacuation(evacuationRows[0]);
    }

    async getAllEvacuations() {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, ST_AsGeoJSON(safe_zone) AS safe_zone,
            distance_km, estimated_time, created_at, updated_at, fire_id FROM evacuationroutes ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No evacuation routes found
        }

        return rows.map(row => new Evacuation(row));
    }

    async getEvacuationById(route_id) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes WHERE route_id = $1
        `;
        const { rows } = await pool.query(sql, [route_id]);
        if (rows.length === 0) {
            return null; // Evacuation route not found
        }

        return new Evacuation(rows[0]);
    }

    async getEvacuationsByStatus(route_status) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes WHERE route_status = $1
        `;
        const { rows } = await pool.query(sql, [route_status]);
        if (rows.length === 0) {
            return []; // No evacuation routes found for this status
        }

        return rows.map(row => new Evacuation(row));
    }

    async getEvacuationsByPriority(route_priority) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes WHERE route_priority = $1
        `;
        const { rows } = await pool.query(sql, [route_priority]);
        if (rows.length === 0) {
            return []; // No evacuation routes found for this priority
        }

        return rows.map(row => new Evacuation(row));
    }

    async getEvacuationsByZone(safe_zone) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes 
            WHERE ST_DWithin(safe_zone::geography, ST_GeogFromText($1), 1000) -- Within 1km of the given safe_zone
        `;
        const { rows } = await pool.query(sql, [`POINT(${safe_zone.longitude} ${safe_zone.latitude})`]);
        if (rows.length === 0) {
            return []; // No evacuation routes found near this safe zone
        }

        return rows.map(row => new Evacuation(row));
    }

    async getEvacuationsByFireId(fire_id) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, 
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id
            FROM evacuationroutes WHERE fire_id = $1
        `;
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return []; // No evacuation routes found for this fire_id
        }

        return rows.map(row => new Evacuation(row));
    }

    async getNearestEvacuation(latitude, longitude) {
        const sql = `
            SELECT route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path,
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id,
            ST_Distance(route_path::geography, ST_GeogFromText($1)::geography) AS distance_to_route
            FROM evacuationroutes
            ORDER BY distance_to_route ASC
            LIMIT 1
        `;
        const { rows } = await pool.query(sql, [`POINT(${longitude} ${latitude})`]);
        if (rows.length === 0) {
            return null; // No evacuation routes found
        }

        return new Evacuation(rows[0]);
    }

    async updateEvacuationStatus(route_id, new_status) {
        const sql = `UPDATE evacuationroutes SET route_status = $1, updated_at = NOW() WHERE route_id = $2 RETURNING route_id,
            route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, ST_AsGeoJSON(safe_zone) AS safe_zone,
            distance_km, estimated_time, created_at, updated_at, fire_id`;
        const { rows } = await pool.query(sql, [new_status, route_id]);
        if (rows.length === 0) {
            return null; // Evacuation route not found
        }

        return new Evacuation(rows[0]);
    }

    async updateEvacuationPriority(route_id, new_priority) {
        const sql = `UPDATE evacuationroutes SET route_priority = $1, updated_at = NOW() WHERE route_id = $2 RETURNING route_id,
            route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path, ST_AsGeoJSON(safe_zone) AS safe_zone,
            distance_km, estimated_time, created_at, updated_at, fire_id`;
        const { rows } = await pool.query(sql, [new_priority, route_id]);
        if (rows.length === 0) {
            return null; // Evacuation route not found
        }
        
        return new Evacuation(rows[0]);
    }

    async updateEvacuationGeometry(route_id, new_route_path, new_safe_zone) {
        const sql = `UPDATE evacuationroutes SET route_path = ST_GeogFromText($1), safe_zone = ST_GeogFromText($2), updated_at = NOW() 
            WHERE route_id = $3 RETURNING route_id, route_status, route_priority, ST_AsGeoJSON(route_path) AS route_path,
            ST_AsGeoJSON(safe_zone) AS safe_zone, distance_km, estimated_time, created_at, updated_at, fire_id`;
        const { rows } = await pool.query(sql, [new_route_path, new_safe_zone, route_id]);
        if (rows.length === 0) {
            return null; // Evacuation route not found
        }

        return new Evacuation(rows[0]);
    }

    async deleteEvacuation(route_id) {
        const sql = `DELETE FROM evacuationroutes WHERE route_id = $1 RETURNING route_id`;
        const { rows } = await pool.query(sql, [route_id]);
        if (rows.length === 0) {
            return false; // Evacuation route not found
        }

        return true; // Successfully deleted
    }

    async deleteEvacuationsByFireId(fire_id) {
        const sql = `DELETE FROM evacuationroutes WHERE fire_id = $1 RETURNING route_id`;
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return false; // No evacuation routes found for this fire_id
        }

        return true; // Successfully deleted evacuation routes for this fire_id
    }
}
