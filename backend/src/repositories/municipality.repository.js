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

    async getMunicipalityByCode(municipality_code) {}

    async getMunicipalityByLocation(municipality_location) {}

    async getMunicipalityByEmail(user_email) {}

    async getMunicipalityByPhone(user_phone) {}

    async getMunicipalityByCreationDate(created_at) {}

    async updateMunicipality(municipality_id, data) {}

    async deactivateMunicipality(municipality_id) {}
}
