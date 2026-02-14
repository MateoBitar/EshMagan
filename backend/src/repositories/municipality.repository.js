// src/repositories/municipality.repository.js

import { pool } from '../config/db.js';
import { Municipality } from '../entities/municipality.entity.js';
import { User } from '../entities/User.js';
import { UserRepository } from './user.repository.js';

export class MunicipalityRepository {
    async createMunicipality(data) {
        const { municipality_name, region_name, municipality_code, municipality_location,
             user } = data;
        
        // Step 1: Create the user first
        const userRepository = new UserRepository();
        const createdUser = await userRepository.createUser(user);

        // Step 2: Create the municipality with the user_id
        const municipalitySql = `INSERT INTO municipalitydetails (municipality_id,
                            municipality_name, region_name, municipality_code, municipality_location)
                            VALUES ($1, $2, $3, $4, ST_GeomFromText($5, 4326)::geography)
                            RETURNING municipality_id, municipality_name, region_name,
                            municipality_code, municipality_location`;
        const municipalityValues = [createdUser.user_id, municipality_name, region_name,
            municipality_code, `POINT(${municipality_location.longitude} ${municipality_location.latitude})`];
        const { rows: municipalityRows } = await pool.query(municipalitySql, municipalityValues);

        return new Municipality({ ...municipalityRows[0], user: createdUser });
    }

    async getAllMunicipalities() {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE isactive = true`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No municipalities found or none are active
        }

        return rows.map(row => {
            const location = JSON.parse(row.municipality_location);

            return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        })});
    }

    async getMunicipalityById(municipality_id) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE municipality_id = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [municipality_id]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getMunicipalityByName(municipality_name) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE municipality_name = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [municipality_name]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getMunicipalityByCode(municipality_code) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE municipality_code = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [municipality_code]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getMunicipalityByLocation(municipality_location) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE ST_DWithin(municipality_location, ST_GeomFromText($1, 4326)::geography, 1000) AND isactive = true`;
        const locationWKT = `POINT(${municipality_location.longitude} ${municipality_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getMunicipalityByEmail(user_email) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE user_email = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getMunicipalityByPhone(user_phone) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE user_phone = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getMunicipalityByCreationDate(created_at) {
        const sql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                    ST_AsGeoJSON(municipality_location) AS municipality_location, user_email,
                    user_phone, user_role, isactive FROM municipalitydetails
                    JOIN users ON municipalitydetails.municipality_id = users.user_id
                    WHERE users.created_at::date = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [created_at]);
        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }
        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
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

        // Only run municipality update if there are fields to change
        if (fields.length > 0) {
            const sql = `UPDATE municipalitydetails SET ${fields.join(', ')}
                        WHERE municipality_id = $${idx} AND isactive = true
                        RETURNING municipality_id, municipality_name, region_name, municipality_code,
                        ST_AsGeoJSON(municipality_location) AS municipality_location
            `;
            values.push(municipality_id);
            await pool.query(sql, values);
        }

        // Step 2: Update user fields if provided
        let updatedUser;
        const userRepository = new UserRepository();
        if (data.user) {
            await userRepository.updateUser(municipality_id, data.user);
        }
        // Fetch fresh user from DB to ensure consistency
        updatedUser = await userRepository.getUserById(municipality_id);

        // Step 3: Fetch full municipality + user joined
        const joinSql = `SELECT municipality_id, municipality_name, region_name, municipality_code,
                        ST_AsGeoJSON(municipality_location) AS municipality_location,
                        user_email, user_phone, user_role, isactive
                        FROM municipalitydetails
                        JOIN users ON municipalitydetails.municipality_id = users.user_id
                        WHERE m.municipality_id = $1 AND isactive = true`;
        const { rows } = await pool.query(joinSql, [municipality_id]);

        if (rows.length === 0) {
            return null; // Municipality not found or not active
        }

        const row = rows[0];
        const location = JSON.parse(row.municipality_location);

        return new Municipality({
            municipality_id: row.municipality_id,
            municipality_name: row.municipality_name,
            region_name: row.region_name,
            municipality_code: row.municipality_code,
            municipality_location: {
                longitude: location.coordinates[0],
                latitude: location.coordinates[1]
            },
            user: new User({
                user_id: row.municipality_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async deactivateMunicipality(municipality_id) {
        const userRepository = new UserRepository();
        const result = await userRepository.deactivateUser(municipality_id);
        return result ? true : false;
    }
}
