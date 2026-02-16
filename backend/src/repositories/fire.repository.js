// src/repositories/fire.repository.js 

import { pool } from '../config/db.js'; 
import { FireEvent } from '../entities/Fire.js'; 

export class FireRepository { 
    async createFire(data) { 
        // Creates a new fire event record 
        const fireSql = `INSERT INTO fireevents (fire_id, fire_source, fire_location, fire_severitylevel,
                    is_extinguished, is_verified, created_at, updated_at) 
                    VALUES ($1,$2,ST_GeogFromText($3),$4,$5,$6,NOW(),NOW()) 
                    RETURNING fire_id, fire_source, ST_AsText(fire_location) as fire_location, fire_severitylevel,
                    is_extinguished, is_verified, created_at, updated_at`; 
        const fireValues = [data.fire_id, data.fire_source, data.fire_location, data.fire_severitylevel, data.is_extinguished, data.is_verified];
        const { rows } = await pool.query(fireSql, fireValues); 
        
        return rows[0] ? new FireEvent(rows[0]) : null; 
    }

    async getAllFires() { 
        // Retrieves all fire events 
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, 
                    fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
                    FROM fireevents`; 
        const { rows } = await pool.query(sql); 
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireEvent({
            fire_id: row.fire_id,
            fire_source: row.fire_source,
            fire_location: row.fire_location,
            fire_severitylevel: row.fire_severitylevel,
            is_extinguished: row.is_extinguished,
            is_verified: row.is_verified,
            created_at: row.created_at,
            updated_at: row.updated_at
        })); 
    }

    async getFireById(fire_id) { 
        // Retrieves a fire event by its unique ID 
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location,
                    fire_severitylevel,is_extinguished, is_verified, created_at, updated_at
                    FROM fireevents WHERE fire_id=$1`; 
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return []; // No fire found 
        }
        
        return rows.map(row => new FireEvent({ 
            fire_id: row.fire_id, 
            fire_source: row.fire_source,
            fire_location: row.fire_location, 
            fire_severitylevel: row.fire_severitylevel, 
            is_extinguished: row.is_extinguished, 
            is_verified: row.is_verified, 
            created_at: row.created_at, 
            updated_at: row.updated_at
        })); 
    }

    async updateFire(fire_id, updates) { 
        // Updates fire event details 
        const sql = `UPDATE fireevents SET fire_source=$2, fire_location=ST_GeogFromText($3),
                    fire_severitylevel=$4, is_extinguished=$5, is_verified=$6, updated_at=NOW() 
                    WHERE fire_id=$1 RETURNING fire_id, fire_source, ST_AsText(fire_location) as fire_location,
                    fire_severitylevel, is_extinguished, is_verified, created_at, updated_at`; 
        const values = [fire_id, updates.fire_source, updates.fire_location, updates.fire_severitylevel,
            updates.is_extinguished, updates.is_verified]; 
        const { rows } = await pool.query(sql, values); 
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireEvent({ 
            fire_id: row.fire_id, 
            fire_source: row.fire_source, 
            fire_location: row.fire_location, 
            fire_severitylevel: row.fire_severitylevel, 
            is_extinguished: row.is_extinguished, 
            is_verified: row.is_verified, 
            created_at: row.created_at, 
            updated_at: row.updated_at 
        })); 
    }

    async updateFireStatus(fire_id, fire_status) { 
        // Updates extinguished status of a fire 
        const sql = `UPDATE fireevents SET is_extinguished=$2, updated_at=NOW() 
                    WHERE fire_id=$1 RETURNING fire_id, fire_source, ST_AsText(fire_location) as fire_location,
                    fire_severitylevel, is_extinguished, is_verified, created_at, updated_at`; 
        const { rows } = await pool.query(sql, [fire_id, fire_status]); 
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireEvent({
            fire_id: row.fire_id, 
            fire_source: row.fire_source, 
            fire_location: row.fire_location, 
            fire_severitylevel: row.fire_severitylevel, 
            is_extinguished: row.is_extinguished, 
            is_verified: row.is_verified, 
            created_at: row.created_at, 
            updated_at: row.updated_at 
        })); 
    }

    async deleteFire(fire_id) { 
        // Deletes a fire event record 
        const sql = `DELETE FROM fireevents WHERE fire_id=$1`; 
        await pool.query(sql, [fire_id]); 
        return true;
    }

    async getActiveFires() {
        // Retrieves all fires that are not extinguished
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, 
                    fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
                    FROM fireevents WHERE is_extinguished=false`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireEvent({
            fire_id: row.fire_id, 
            fire_source: row.fire_source, 
            fire_location: row.fire_location, 
            fire_severitylevel: row.fire_severitylevel, 
            is_extinguished: row.is_extinguished, 
            is_verified: row.is_verified, 
            created_at: row.created_at, 
            updated_at: row.updated_at 
        })); 
    }

    async getFiresByStatus(fire_status) {
        // Retrieves fires by verification status
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, 
                    fire_severitylevel, is_extinguished, is_verified, created_at, updated_at 
                    FROM fireevents WHERE is_verified=$1`;
        const { rows } = await pool.query(sql, [fire_status]);
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireEvent({
            fire_id: row.fire_id, 
            fire_source: row.fire_source, 
            fire_location: row.fire_location, 
            fire_severitylevel: row.fire_severitylevel, 
            is_extinguished: row.is_extinguished, 
            is_verified: row.is_verified, 
            created_at: row.created_at, 
            updated_at: row.updated_at 
        })); 
    }

    async getFiresByMunicipality(municipality_id) {
        // Retrieves fires within a municipality boundary
        const sql = `SELECT f.fire_id, f.fire_source, ST_AsText(f.fire_location) as fire_location, 
                    f.fire_severitylevel, f.is_extinguished, f.is_verified, f.created_at, f.updated_at
                    FROM fireevents f
                    JOIN municipalitydetails m ON ST_Within(f.fire_location, m.municipality_location)
                    WHERE m.municipality_id=$1`;
        const { rows } = await pool.query(sql, [municipality_id]);
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireEvent({
            fire_id: row.fire_id, 
            fire_source: row.fire_source, 
            fire_location: row.fire_location, 
            fire_severitylevel: row.fire_severitylevel, 
            is_extinguished: row.is_extinguished, 
            is_verified: row.is_verified, 
            created_at: row.created_at, 
            updated_at: row.updated_at 
        })); 
    }

    async getFiresRadius(lat, lng, radiusMeters) {
        // Retrieves fires within a radius from a point
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, fire_severitylevel, 
                    is_extinguished, is_verified, created_at, updated_at
                    FROM fireevents
                    WHERE ST_DWithin(fire_location, ST_MakePoint($1,$2)::geography, $3)`;
        const { rows } = await pool.query(sql, [lng, lat, radiusMeters]);
        return rows.map(row => new FireEvent(row));
    }

    async getFiresWithinPolygon(polygonGeoJSON) {
        // Retrieves fires within a polygon area
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, fire_severitylevel, 
                    is_extinguished, is_verified, created_at, updated_at
                    FROM fireevents WHERE ST_Within(fire_location, ST_GeomFromGeoJSON($1)::geography)`;
        const { rows } = await pool.query(sql, [polygonGeoJSON]);
        return rows.map(row => new FireEvent(row));
    }

    async getRecentFires(limit) {
        // Retrieves most recent fires
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, fire_severitylevel, 
                            is_extinguished, is_verified, created_at, updated_at
                     FROM fireevents ORDER BY created_at DESC LIMIT $1`;
        const { rows } = await pool.query(sql, [limit]);
        return rows.map(row => new FireEvent(row));
    }

    async getFiresByDate(startDate, endDate) {
        // Retrieves fires created between two dates
        const sql = `SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, fire_severitylevel, 
                            is_extinguished, is_verified, created_at, updated_at
                     FROM fireevents WHERE created_at BETWEEN $1 AND $2`;
        const { rows } = await pool.query(sql, [startDate, endDate]);
        return rows.map(row => new FireEvent(row));
    }

    async countFiresByStatus(fire_status) {
        // Counts fires by verification status
        const sql = `SELECT COUNT(*) FROM fireevents WHERE is_verified=$1`;
        const { rows } = await pool.query(sql, [fire_status]);
        return parseInt(rows[0].count, 10);
    }

    async getFireStatistics(startDate, endDate) {
        // Retrieves fire statistics (total fires, extinguished, active) between two dates
        const sql = `SELECT 
                        COUNT(*) as total_fires,
                        SUM(CASE WHEN is_extinguished=true THEN 1 ELSE 0 END) as extinguished_fires,
                        SUM(CASE WHEN is_extinguished=false THEN 1 ELSE 0 END) as active_fires
                     FROM fireevents WHERE created_at BETWEEN $1 AND $2`;
        const { rows } = await pool.query(sql, [startDate, endDate]);
        return rows[0];
    }
}