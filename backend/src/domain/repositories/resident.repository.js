// src/domain/repositories/resident.repository.js

import { pool } from '../../config/db.js';
import { Resident } from '../entities/resident.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';
import { EncryptionService } from '../../services/encryption.service.js';

const encryption = new EncryptionService();

/**
 * This repository manages all database operations related to residents,
 * including creation, retrieval, spatial queries, updates, encryption handling,
 * and deactivation. Sensitive fields are encrypted/decrypted transparently.
 */

// SHARED HELPER
// Parses a DB row into a Resident entity, decrypting sensitive fields transparently.

/**
 * Convert raw DB row into Resident entity.
 *
 * PRE-CONDITIONS:
 * - row must contain resident and location fields.
 * - encrypted fields must be valid for decryption.
 *
 * POST-CONDITIONS:
 * - Returns a fully constructed Resident entity.
 * - Sensitive fields are decrypted.
 */
function toResident(row, userEntity) {
    const homeLocation = row.home_location ? JSON.parse(row.home_location) : null;
    const workLocation = row.work_location ? JSON.parse(row.work_location) : null;
    const lastKnownLocation = row.last_known_location ? JSON.parse(row.last_known_location) : null;

    return Resident.fromEntity({
        resident_id: row.resident_id,
        resident_fname: row.resident_fname,
        resident_lname: row.resident_lname,
        resident_dob: row.resident_dob,
        resident_idnb: encryption.decrypt(row.resident_idnb),
        resident_idpic: encryption.decrypt(row.resident_idpic),
        home_location: homeLocation
            ? {
                longitude: homeLocation.coordinates[0],
                latitude: homeLocation.coordinates[1]
              }
            : null,
        work_location: workLocation
            ? {
                longitude: workLocation.coordinates[0],
                latitude: workLocation.coordinates[1]
              }
            : null,
        last_known_location: lastKnownLocation
            ? {
                longitude: lastKnownLocation.coordinates[0],
                latitude: lastKnownLocation.coordinates[1]
              }
            : null,
        updated_at: row.resident_updated_at,
        user: userEntity
    });
}

export class ResidentRepository {
    /**
     * Create a new resident.
     *
     * PRE-CONDITIONS:
     * - data must include all required resident fields.
     * - last_known_location must be provided.
     *
     * POST-CONDITIONS:
     * - Inserts resident into DB.
     * - Sensitive fields are encrypted.
     * - Returns created Resident entity.
     */
    async createResident(data) {
        const {
            resident_id, // comes from user.user_id
            resident_fname, resident_lname, resident_dob,
            resident_idnb, resident_idpic,
            home_location, work_location, last_known_location,
            user
        } = data;

        // Encrypt sensitive fields
        const encryptedIdNb = encryption.encrypt(resident_idnb);
        const encryptedIdPic = encryption.encrypt(resident_idpic);

        // Build WKT safely
        const homeWKT = home_location
            ? `POINT(${home_location.longitude} ${home_location.latitude})`
            : null;
        const workWKT = work_location
            ? `POINT(${work_location.longitude} ${work_location.latitude})`
            : null;
        const lastKnownWKT = `POINT(${last_known_location.longitude} ${last_known_location.latitude})`;

        // Build params dynamically to avoid PostgreSQL null type inference error
        // PostgreSQL can't determine the type of a null parameter for geometry columns
        const residentValues = [
            resident_id,      // $1
            resident_fname,   // $2
            resident_lname,   // $3
            resident_dob,     // $4
            encryptedIdNb,    // $5
            encryptedIdPic,   // $6
        ];

        let idx = 7;
        const homeParam    = homeWKT  ? (residentValues.push(homeWKT),  `ST_GeomFromText($${idx++}, 4326)`) : 'NULL';
        const workParam    = workWKT  ? (residentValues.push(workWKT),  `ST_GeomFromText($${idx++}, 4326)`) : 'NULL';
        residentValues.push(lastKnownWKT);
        const lastParam    = `ST_GeomFromText($${idx}, 4326)`;

        const residentSql = `
            INSERT INTO residentdetails (
            resident_id, resident_fname, resident_lname, resident_dob,
            resident_idnb, resident_idpic,
            home_location, work_location, last_known_location
            ) VALUES (
            $1, $2, $3, $4, $5, $6,
            ${homeParam},
            ${workParam},
            ${lastParam}
            )
            RETURNING resident_id, resident_fname, resident_lname, resident_dob,
                    resident_idnb, resident_idpic,
                    ST_AsGeoJSON(home_location)       AS home_location,
                    ST_AsGeoJSON(work_location)       AS work_location,
                    ST_AsGeoJSON(last_known_location) AS last_known_location
        `;

        const { rows: residentRows } = await pool.query(residentSql, residentValues);

        return Resident.fromEntity({
            ...residentRows[0],
            user: User.fromEntity(user)
        });
    }

    /**
     * Retrieve all residents.
     *
     * PRE-CONDITIONS:
     * - Database connection must be available.
     *
     * POST-CONDITIONS:
     * - Returns an array of Resident entities.
     * - Returns empty array if no residents exist.
     */
    async getAllResidents() {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE u.isactive = true;
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) return [];
        const result = rows.map(row => toResident(row, User.fromEntity(row)));
        return result;
    }

    /**
     * Retrieve resident by ID.
     *
     * PRE-CONDITIONS:
     * - resident_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns Resident if found.
     * - Returns null if not found.
     */
    async getResidentById(resident_id) {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE r.resident_id = $1 AND u.isactive = true;
        `;
        const { rows } = await pool.query(sql, [resident_id]);
        if (rows.length === 0) return null;
        return toResident(rows[0], User.fromEntity(rows[0]));
    }

    /**
     * Retrieve residents by first name.
     *
     * PRE-CONDITIONS:
     * - resident_fname must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching residents.
     * - Returns empty array if none found.
     */
    async getResidentsByFName(resident_fname) {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE r.resident_fname ILIKE $1 AND u.isactive = true
        `;
        const { rows } = await pool.query(sql, [`%${resident_fname}%`]);
        if (rows.length === 0) return [];
        return rows.map(row => toResident(row, User.fromEntity(row)));
    }

    /**
     * Retrieve residents by last name.
     *
     * PRE-CONDITIONS:
     * - resident_lname must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching residents.
     * - Returns empty array if none found.
     */
    async getResidentsByLName(resident_lname) {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE r.resident_lname ILIKE $1 AND u.isactive = true
        `;
        const { rows } = await pool.query(sql, [`%${resident_lname}%`]);
        if (rows.length === 0) return [];
        return rows.map(row => toResident(row, User.fromEntity(row)));
    }

    /**
     * Retrieve resident by ID number (encrypted).
     *
     * PRE-CONDITIONS:
     * - resident_idnb must be provided.
     *
     * POST-CONDITIONS:
     * - Decrypts all records and compares.
     * - Returns matching resident or null.
     */
    async getResidentByIdNb(resident_idnb) {
        // resident_idnb is stored encrypted with a random IV per call,
        // so we cannot do a direct SQL WHERE match on the ciphertext.
        // Solution: fetch all active residents, decrypt in memory, compare.
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE u.isactive = true
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) return null;

        const match = rows.find(row => {
            try {
                return encryption.decrypt(row.resident_idnb) === String(resident_idnb);
            } catch {
                return false;
            }
        });

        if (!match) return null;
        return toResident(match, User.fromEntity(match));
    }

    /**
     * Retrieve residents by proximity to last known location.
     *
     * PRE-CONDITIONS:
     * - last_known_location must contain longitude and latitude.
     *
     * POST-CONDITIONS:
     * - Returns residents within 10km radius.
     * - Returns empty array if none found.
     */
    async getResidentsByLastKnownLocation(last_known_location) {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE ST_DWithin(
                last_known_location,
                ST_GeomFromText($1, 4326)::geography,
                10000
            ) AND u.isactive = true
        `;
        const locationWKT = `POINT(${last_known_location.longitude} ${last_known_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) return [];
        return rows.map(row => toResident(row, User.fromEntity(row)));
    }

    /**
     * Retrieve resident by email.
     *
     * PRE-CONDITIONS:
     * - user_email must be provided.
     *
     * POST-CONDITIONS:
     * - Returns Resident if found.
     * - Returns null if not found.
     */
    async getResidentByEmail(user_email) {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE u.user_email = $1 AND u.isactive = true
        `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) return null;
        return toResident(rows[0], User.fromEntity(rows[0]));
    }

    /**
     * Retrieve resident by phone.
     *
     * PRE-CONDITIONS:
     * - user_phone must be provided.
     *
     * POST-CONDITIONS:
     * - Returns Resident if found.
     * - Returns null if not found.
     */
    async getResidentByPhone(user_phone) {
        const sql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE u.user_phone = $1 AND u.isactive = true
        `;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) return null;
        return toResident(rows[0], User.fromEntity(rows[0]));
    }

    /**
     * Update resident information.
     *
     * PRE-CONDITIONS:
     * - resident_id must be provided.
     * - data may contain any updatable fields.
     *
     * POST-CONDITIONS:
     * - Updates provided fields.
     * - Encrypts sensitive fields if updated.
     * - Returns updated Resident entity.
     * - Returns null if resident does not exist.
     */
    async updateResident(resident_id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        if (data.resident_fname) {
            fields.push(`resident_fname = $${idx++}`);
            values.push(data.resident_fname);
        }
        if (data.resident_lname) {
            fields.push(`resident_lname = $${idx++}`);
            values.push(data.resident_lname);
        }
        if (data.resident_dob) {
            fields.push(`resident_dob = $${idx++}`);
            values.push(data.resident_dob);
        }
        if (data.resident_idnb) {
            fields.push(`resident_idnb = $${idx++}`);
            values.push(encryption.encrypt(data.resident_idnb));   // encrypt on update
        }
        if (data.resident_idpic) {
            fields.push(`resident_idpic = $${idx++}`);
            values.push(encryption.encrypt(data.resident_idpic));  // encrypt on update
        }
        if (data.home_location) {
            fields.push(`home_location = ST_GeomFromText($${idx++}, 4326)`);
            values.push(`POINT(${data.home_location.longitude} ${data.home_location.latitude})`);
        }
        if (data.work_location) {
            fields.push(`work_location = ST_GeomFromText($${idx++}, 4326)`);
            values.push(`POINT(${data.work_location.longitude} ${data.work_location.latitude})`);
        }
        if (data.last_known_location) {
            fields.push(`last_known_location = ST_GeomFromText($${idx++}, 4326)`);
            values.push(`POINT(${data.last_known_location.longitude} ${data.last_known_location.latitude})`);
        }

        fields.push(`updated_at = NOW()`);

        if (fields.length > 1) {
            const sql = `
                UPDATE residentdetails
                SET ${fields.join(', ')}
                WHERE resident_id = $${idx}
                RETURNING resident_id
            `;
            values.push(resident_id);
            await pool.query(sql, values);
        }

        // Update user fields if provided
        const userRepository = new UserRepository();
        if (data.user) {
            await userRepository.updateUser(resident_id, data.user);
        }

        // Fetch full resident + user joined
        const joinSql = `
            SELECT 
                r.resident_id,
                r.resident_fname,
                r.resident_lname,
                r.resident_dob,
                r.resident_idnb,
                r.resident_idpic,
                ST_AsGeoJSON(r.home_location)       AS home_location,
                ST_AsGeoJSON(r.work_location)       AS work_location,
                ST_AsGeoJSON(r.last_known_location) AS last_known_location,
                r.updated_at AS resident_updated_at,
                u.user_id,
                u.user_email,
                u.user_phone,
                u.user_role,
                u.isactive,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at
            FROM residentdetails r
            JOIN users u ON r.resident_id = u.user_id
            WHERE r.resident_id = $1 AND u.isactive = true
        `;
        const { rows } = await pool.query(joinSql, [resident_id]);
        if (rows.length === 0) return null;
        return toResident(rows[0], User.fromEntity(rows[0]));
    }

    /**
     * Deactivate resident.
     *
     * PRE-CONDITIONS:
     * - resident_id must be provided.
     *
     * POST-CONDITIONS:
     * - Deactivates associated user.
     * - Returns result of deactivation.
     */
    async deactivateResident(resident_id) {
        const userRepository = new UserRepository();
        return await userRepository.deactivateUser(resident_id);
    }
}
