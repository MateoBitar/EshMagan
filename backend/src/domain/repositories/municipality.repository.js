// src/domain/repositories/municipality.repository.js

import { pool } from '../../config/db.js';
import { Municipality } from '../entities/municipality.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

export class MunicipalityRepository {
    async createMunicipality(data) {
        const {
            municipality_id,
            municipality_name,
            region_name,
            municipality_code,
            municipality_location,
            user
        } = data;

        const municipalitySql = `
            INSERT INTO municipalitydetails (
                municipality_id, municipality_name, region_name,
                municipality_code, municipality_location
            )
            VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326)::geography)
            RETURNING municipality_id, municipality_name, region_name,
                      municipality_code,
                      ST_AsGeoJSON(municipality_location) AS municipality_location
        `;
        const municipalityValues = [
            municipality_id,
            municipality_name,
            region_name,
            municipality_code,
            `POINT(${municipality_location.longitude} ${municipality_location.latitude})`
        ];

        const { rows: municipalityRows } = await pool.query(municipalitySql, municipalityValues);

        return Municipality.fromEntity({
            ...municipalityRows[0],
            municipality_location,
            user: User.fromEntity(user)
        });
    }

    async getAllMunicipalities() {
        const sql = `
            SELECT municipality_id, municipality_name, region_name, municipality_code,
                   ST_AsGeoJSON(municipality_location) AS municipality_location,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM municipalitydetails
            JOIN users ON municipalitydetails.municipality_id = users.user_id
            WHERE isactive = true
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const location = JSON.parse(row.municipality_location);
            return Municipality.fromEntity({
                municipality_id: row.municipality_id,
                municipality_name: row.municipality_name,
                region_name: row.region_name,
                municipality_code: row.municipality_code,
                municipality_location: {
                    longitude: location.coordinates[0],
                    latitude: location.coordinates[1]
                },
                user: User.fromEntity(row)
            });
        });
    }

    async getMunicipalityById(municipality_id) {
        const sql = `
            SELECT municipality_id, municipality_name, region_name, municipality_code,
                   ST_AsGeoJSON(municipality_location) AS municipality_location,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM municipalitydetails
            JOIN users ON municipalitydetails.municipality_id = users.user_id
            WHERE municipality_id = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [municipality_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: User.fromEntity(row)
        });
    }

    async getMunicipalitiesByName(municipality_name) {
        const sql = `
            SELECT municipality_id, municipality_name, region_name, municipality_code,
                   ST_AsGeoJSON(municipality_location) AS municipality_location,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM municipalitydetails
            JOIN users ON municipalitydetails.municipality_id = users.user_id
            WHERE municipality_name ILIKE $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [`%${municipality_name}%`]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const location = JSON.parse(row.municipality_location);
            return Municipality.fromEntity({
                municipality_id: row.municipality_id,
                municipality_name: row.municipality_name,
                region_name: row.region_name,
                municipality_code: row.municipality_code,
                municipality_location: {
                    longitude: location.coordinates[0],
                    latitude: location.coordinates[1]
                },
                user: User.fromEntity(row)
            });
        });
    }

    async getMunicipalityByRegion(region_name) {
        const sql = `
        SELECT municipality_id, municipality_name, region_name, municipality_code, municipality_location,
               user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
        FROM municipalitydetails
        JOIN users ON municipalitydetails.municipality_id = users.user_id
        WHERE region_name = $1 AND isactive = true
    `;
        const { rows } = await pool.query(sql, [region_name]);
        if (rows.length === 0) return [];

        return rows.map(row => Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: row.municipality_location,
            user: User.fromEntity(row)
        }));
    }

    async getMunicipalityByCode(municipality_code) {
        const sql = `
            SELECT municipality_id, municipality_name, region_name, municipality_code,
                   ST_AsGeoJSON(municipality_location) AS municipality_location,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM municipalitydetails
            JOIN users ON municipalitydetails.municipality_id = users.user_id
            WHERE municipality_code = $1 AND isactive = true
        `;
        const { rows } = await pool.query(sql, [municipality_code]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: User.fromEntity(row)
        });
    }

    async getMunicipalityByLocation(municipality_location) {
        const sql = `
            SELECT municipality_id, municipality_name, region_name, municipality_code,
                   ST_AsGeoJSON(municipality_location) AS municipality_location,
                   user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
            FROM municipalitydetails
            JOIN users ON municipalitydetails.municipality_id = users.user_id
            WHERE ST_DWithin(
                municipality_location,
                ST_GeomFromText($1, 4326)::geography,
                1000
            ) AND isactive = true
        `;
        const locationWKT = `POINT(${municipality_location.longitude} ${municipality_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: User.fromEntity(row)
        });
    }

    async getMunicipalityByEmail(user_email) {
        const sql = `
        SELECT municipality_id, municipality_name, region_name, municipality_code,
               ST_AsGeoJSON(municipality_location) AS municipality_location,
               user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
        FROM municipalitydetails
        JOIN users ON municipalitydetails.municipality_id = users.user_id
        WHERE user_email = $1 AND isactive = true
    `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: User.fromEntity(row)
        });
    }

    async getMunicipalityByPhone(user_phone) {
        const sql = `
        SELECT municipality_id, municipality_name, region_name, municipality_code,
               ST_AsGeoJSON(municipality_location) AS municipality_location,
               user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
        FROM municipalitydetails
        JOIN users ON municipalitydetails.municipality_id = users.user_id
        WHERE user_phone = $1 AND isactive = true
    `;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: User.fromEntity(row)
        });
    }

    async updateMunicipality(municipality_id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Update municipality fields if provided
        if (data.municipality_name) {
            fields.push(`municipality_name = $${idx++}`);
            values.push(data.municipality_name);
        }
        if (data.region_name) {
            fields.push(`region_name = $${idx++}`);
            values.push(data.region_name);
        }
        if (data.municipality_code) {
            fields.push(`municipality_code = $${idx++}`);
            values.push(data.municipality_code);
        }
        if (data.municipality_location) {
            fields.push(`municipality_location = ST_GeomFromText($${idx++}, 4326)::geography`);
            values.push(`POINT(${data.municipality_location.longitude} ${data.municipality_location.latitude})`);
        }

        // Update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run municipality update if there are fields to change and not just updated_at
        if (fields.length > 1) {
            const sql = `
            UPDATE municipalitydetails
            SET ${fields.join(', ')}
            WHERE municipality_id = $${idx} AND isactive = true
            RETURNING municipality_id, municipality_name, region_name, municipality_code,
                      ST_AsGeoJSON(municipality_location) AS municipality_location
        `;
            values.push(municipality_id);
            await pool.query(sql, values);
        }

        // Step 2: Update user fields if provided
        const userRepository = new UserRepository();
        if (data.user) {
            await userRepository.updateUser(municipality_id, data.user);
        }

        // Step 3: Fetch full municipality + user joined
        const joinSql = `
        SELECT municipality_id, municipality_name, region_name, municipality_code,
               ST_AsGeoJSON(municipality_location) AS municipality_location,
               user_id, user_email, user_phone, user_role, isactive, created_at, updated_at
        FROM municipalitydetails
        JOIN users ON municipalitydetails.municipality_id = users.user_id
        WHERE municipality_id = $1 AND isactive = true
    `;
        const { rows } = await pool.query(joinSql, [municipality_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return Municipality.fromEntity({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: User.fromEntity(row)
        });
    }

    async deactivateMunicipality(municipality_id) {
        const userRepository = new UserRepository();
        return await userRepository.deactivateUser(municipality_id);
    }
}
