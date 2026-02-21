// src/domain/repositories/fire.repository.js 

import { pool } from '../../config/db.js'; 
import { FireEvent } from '../entities/fire.entity.js'; 

export class FireRepository { 
    async createFire(data) { 
        // Creates a new fire event record 
        const { fire_source, fire_location, fire_severitylevel, is_extinguished, is_verified } = data;

        const fireSql = `
                INSERT INTO fireevents (fire_source, fire_location, fire_severitylevel,
                                        is_extinguished, is_verified, created_at, updated_at) 
                VALUES ($1,ST_GeogFromText($2),$3,$4,$5,NOW(),NOW()) 
                RETURNING fire_id, fire_source, ST_AsText(fire_location) as fire_location, fire_severitylevel,
                is_extinguished, is_verified, created_at, updated_at
        `; 
        const fireValues = [fire_source, fire_location, fire_severitylevel, is_extinguished, is_verified];
        const { rows } = await pool.query(fireSql, fireValues); 
        
        return FireEvent.fromEntity(rows[0]); 
    }

    async getAllFires() { 
        // Retrieves all fire events 
        const sql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, 
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
                FROM fireevents
        `; 
        const { rows } = await pool.query(sql); 
        if (rows.length === 0) {
            return []; // No fire events found
        }
                        
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFireById(fire_id) { 
        // Retrieves a fire event by its unique ID 
        const sql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location,
                       fire_severitylevel,is_extinguished, is_verified, created_at, updated_at
                FROM fireevents 
                WHERE fire_id=$1
        `; 
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return []; // No fire events found
        }
                        
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getActiveFires() {
        // Retrieves all fires that are not extinguished
        const sql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, 
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
                FROM fireevents 
                WHERE is_extinguished=false
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No fire events found
        }
                        
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFiresByStatus(fire_status) {
        // Retrieves fires by verification status
        const sql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) as fire_location, 
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at 
                FROM fireevents 
                WHERE is_verified=$1
        `;
        const { rows } = await pool.query(sql, [fire_status]);
        if (rows.length === 0) {
            return []; // No fire events found
        }
                        
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFiresByMunicipality(municipality_id) { 
        // Retrieves fires within a municipality boundary 
        const sql = `
                SELECT f.fire_id, f.fire_source, ST_AsText(f.fire_location) AS fire_location,
                       f.fire_severitylevel, f.is_extinguished, f.is_verified, f.created_at, f.updated_at 
                FROM fireevents f 
                JOIN municipalitydetails m 
                ON ST_Within(f.fire_location, m.municipality_location) 
                WHERE m.municipality_id=$1 
        `; 
        const { rows } = await pool.query(sql, [municipality_id]); 
        if (rows.length === 0) { 
            return []; 
        }
        
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFiresRadius(lat, lng, radiusMeters) { 
        // Retrieves fires within a radius from a point 
        const sql = ` 
                SELECT fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at 
                FROM fireevents 
                WHERE ST_DWithin(fire_location, ST_MakePoint($1,$2)::geography, $3) 
        `; 
        const { rows } = await pool.query(sql, [lng, lat, radiusMeters]); 
        if (rows.length === 0) {
            return [];
        }
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFiresWithinPolygon(polygonGeoJSON) { 
        // Retrieves fires within a polygon area 
        const sql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at 
                FROM fireevents 
                WHERE ST_Within(fire_location, ST_GeomFromGeoJSON($1)::geography) 
        `; 
        const { rows } = await pool.query(sql, [polygonGeoJSON]); 
        if (rows.length === 0) {
            return [];
        }
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getRecentFires(limit) { 
        // Retrieves most recent fires 
        const fireSql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) AS fire_location, 
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at 
                FROM fireevents 
                ORDER BY created_at DESC LIMIT $1 
        `; 
        const { rows } = await pool.query(fireSql, [limit]); 
        if (rows.length === 0) {
            return [];
        }
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFiresByDate(startDate, endDate) { 
        // Retrieves fires created between two dates 
        const sql = `
                SELECT fire_id, fire_source, ST_AsText(fire_location) AS fire_location, 
                       fire_severitylevel, is_extinguished, is_verified, created_at, updated_at 
                FROM fireevents 
                WHERE created_at BETWEEN $1 AND $2 
        `; 
        const { rows } = await pool.query(sql, [startDate, endDate]); 
        if (rows.length === 0) {
            return [];
        }
        return rows.map(row => FireEvent.fromEntity(row));
    }

    async getFireStatistics(startDate, endDate) { 
        // Retrieves fire statistics (total fires, extinguished, active) between two dates 
        const sql = `
                SELECT COUNT(*) AS total_fires, 
                SUM(CASE WHEN is_extinguished=true THEN 1 ELSE 0 END) AS extinguished_fires, 
                SUM(CASE WHEN is_extinguished=false THEN 1 ELSE 0 END) AS active_fires 
                FROM fireevents 
                WHERE created_at BETWEEN $1 AND $2 `; 
        const { rows } = await pool.query(sql, [startDate, endDate]); 
        if (rows.length === 0) {
            return null; 
        }

        return rows[0]; 
    }

    async getFireByLocationAndTime(lat, lng, startDate, endDate, radiusMeters = 1000) {
        // Retrieves fires near a location within a time range
        const sql = `
            SELECT fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
            FROM fireevents
            WHERE ST_DWithin(fire_location, ST_MakePoint($1,$2)::geography, $3)
            AND created_at BETWEEN $4 AND $5
        `;
        const { rows } = await pool.query(sql, [lng, lat, radiusMeters, startDate, endDate]);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => FireEvent.fromEntity(row));
    }

    async updateFire(fire_id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Add fields dynamically if provided
        if (data.fire_source) {
            fields.push(`fire_source = $${idx++}`);
            values.push(data.fire_source);
        }
        if (data.fire_location) {
            fields.push(`fire_location = ST_GeogFromText($${idx++})`);
            values.push(data.fire_location);
        }
        if (data.fire_severitylevel) {
            fields.push(`fire_severitylevel = $${idx++}`);
            values.push(data.fire_severitylevel);
        }
        if (data.is_extinguished !== undefined) {
            fields.push(`is_extinguished = $${idx++}`);
            values.push(data.is_extinguished);
        }
        if (data.is_verified !== undefined) {
            fields.push(`is_verified = $${idx++}`);
            values.push(data.is_verified);
        }

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run update if there are fields to change
        if (fields.length > 0) {
            const sql = `
                UPDATE fireevents
                SET ${fields.join(', ')}
                WHERE fire_id = $${idx}
                RETURNING fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                        fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
            `;
            values.push(fire_id);

            const { rows } = await pool.query(sql, values);
            if (rows.length === 0) return null;

            return FireEvent.fromEntity({ ...rows[0] });
        }

        return null; // nothing to update
    }

    async updateFireStatus(fire_id, fire_status) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Add extinguished status update if provided
        if (fire_status !== undefined) {
            fields.push(`is_extinguished = $${idx++}`);
            values.push(fire_status);
        }

        // Always update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run update if there are fields to change
        if (fields.length > 0) {
            const sql = `
                UPDATE fireevents
                SET ${fields.join(', ')}
                WHERE fire_id = $${idx}
                RETURNING fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                        fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
            `;
            values.push(fire_id);

            const { rows } = await pool.query(sql, values);
            if (rows.length === 0) return null;

            return FireEvent.fromEntity({ ...rows[0] });
        }

        return null; // nothing to update
    }

    async updateFireSeverity(fire_id, severityLevel) {
        // Updates the severity level of a fire
        const sql = `
            UPDATE fireevents
            SET fire_severitylevel = $2,
                updated_at = NOW()
            WHERE fire_id = $1
            RETURNING fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                    fire_severitylevel, is_extinguished, is_verified, created_at, updated_at
        `;
        const { rows } = await pool.query(sql, [fire_id, severityLevel]);

        if (rows.length === 0) {
            return null;
        }

        return FireEvent.fromEntity(rows[0]);
    }

    async updateFireSpreadPrediction(fire_id, spreadPrediction) {
        // Updates the spread prediction field for a fire
        const sql = `
            UPDATE fireevents
            SET spread_prediction = $2,
                updated_at = NOW()
            WHERE fire_id = $1
            RETURNING fire_id, fire_source, ST_AsText(fire_location) AS fire_location,
                    fire_severitylevel, is_extinguished, is_verified, spread_prediction, created_at, updated_at
        `;
        const { rows } = await pool.query(sql, [fire_id, spreadPrediction]);

        if (rows.length === 0) {
            return null;
        }

        return FireEvent.fromEntity(rows[0]);
    }

    async deleteFire(fire_id) {
        // Deletes a fire event record
        const sql = `DELETE FROM fireevents WHERE fire_id = $1 RETURNING fire_id`;
        const { rows } = await pool.query(sql, [fire_id]);

        if (rows.length === 0) {
            return false; // Fire not found
        }

        return true; // Fire deleted successfully
    }

    async countFires(filters = {}) {
        const conditions = [];
        const values = [];
        let idx = 1;

        // Step 1: Add filters dynamically
        if (filters.is_extinguished !== undefined) {
            conditions.push(`is_extinguished = $${idx++}`);
            values.push(filters.is_extinguished);
        }
        if (filters.is_verified !== undefined) {
            conditions.push(`is_verified = $${idx++}`);
            values.push(filters.is_verified);
        }
        if (filters.fire_severitylevel) {
            conditions.push(`fire_severitylevel = $${idx++}`);
            values.push(filters.fire_severitylevel);
        }

        // Step 2: Build SQL with dynamic conditions
        let sql = `SELECT COUNT(*) FROM fireevents WHERE 1=1`;
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }

        // Step 3: Execute query
        const { rows } = await pool.query(sql, values);

        // Step 4: Return count
        return parseInt(rows[0].count, 10);
    }
}
