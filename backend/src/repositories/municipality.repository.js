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
}