// src/domain/repositories/resident.repository.js

import { pool } from '../../config/db.js';
import { Resident } from '../entities/resident.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

export class ResidentRepository {
    async createResident(data) {
        const { resident_fname, resident_lname, resident_dob, resident_idnb, resident_idpic,
            home_location, work_location, last_known_location, user } = data;

        // Step 1: Create the user first
        const userRepository = new UserRepository();
        const createdUser = await userRepository.createUser(user);

        // Step 2: Create the resident with the user_id
        const residentSql = `
            INSERT INTO residentdetails (
                resident_id, resident_fname, resident_lname, resident_dob,
                resident_idnb, resident_idpic, home_location, work_location, last_known_location
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                ST_GeomFromText($7, 4326),
                ST_GeomFromText($8, 4326),
                ST_GeomFromText($9, 4326)
            )
            RETURNING resident_id, resident_fname, resident_lname, resident_dob,
                      resident_idnb, resident_idpic,
                      ST_AsGeoJSON(home_location) AS home_location,
                      ST_AsGeoJSON(work_location) AS work_location,
                      ST_AsGeoJSON(last_known_location) AS last_known_location
        `;
        const residentValues = [
            createdUser.user_id,
            resident_fname,
            resident_lname,
            resident_dob,
            resident_idnb,
            resident_idpic,
            `POINT(${home_location.longitude} ${home_location.latitude})`,
            `POINT(${work_location.longitude} ${work_location.latitude})`,
            `POINT(${last_known_location.longitude} ${last_known_location.latitude})`
        ];
        const { rows: residentRows } = await pool.query(residentSql, residentValues);

        const row = residentRows[0];
        const homeLocation = JSON.parse(row.home_location);
        const workLocation = JSON.parse(row.work_location);
        const lastKnownLocation = JSON.parse(row.last_known_location);

        return Resident.fromEntity({
            resident_id: row.resident_id,
            resident_fname: row.resident_fname,
            resident_lname: row.resident_lname,
            resident_dob: row.resident_dob,
            resident_idnb: row.resident_idnb,
            resident_idpic: row.resident_idpic,
            home_location: {
                latitude: homeLocation.coordinates[1],
                longitude: homeLocation.coordinates[0]
            },
            work_location: {
                latitude: workLocation.coordinates[1],
                longitude: workLocation.coordinates[0]
            },
            last_known_location: {
                latitude: lastKnownLocation.coordinates[1],
                longitude: lastKnownLocation.coordinates[0]
            },
            user: User.fromEntity(createdUser)
        });
    }

    async getAllResidents() {
        const sql = `
            SELECT resident_id, resident_fname, resident_lname, resident_dob,
                   resident_idnb, resident_idpic,
                   ST_AsGeoJSON(home_location) AS home_location,
                   ST_AsGeoJSON(work_location) AS work_location,
                   ST_AsGeoJSON(last_known_location) AS last_known_location,
                   user_id, user_email, user_phone, user_role, isactive
            FROM residentdetails
            JOIN users ON residentdetails.resident_id = users.user_id
            WHERE users.isactive = true
        `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const homeLocation = JSON.parse(row.home_location);
            const workLocation = JSON.parse(row.work_location);
            const lastKnownLocation = JSON.parse(row.last_known_location);

            return Resident.fromEntity({
                resident_id: row.resident_id,
                resident_fname: row.resident_fname,
                resident_lname: row.resident_lname,
                resident_dob: row.resident_dob,
                resident_idnb: row.resident_idnb,
                resident_idpic: row.resident_idpic,
                home_location: {
                    latitude: homeLocation.coordinates[1],
                    longitude: homeLocation.coordinates[0]
                },
                work_location: {
                    latitude: workLocation.coordinates[1],
                    longitude: workLocation.coordinates[0]
                },
                last_known_location: {
                    latitude: lastKnownLocation.coordinates[1],
                    longitude: lastKnownLocation.coordinates[0]
                },
                user: User.fromEntity(row)
            });
        });
    }

    async getResidentById(resident_id) {
        const sql = `
            SELECT resident_id, resident_fname, resident_lname, resident_dob,
                   resident_idnb, resident_idpic,
                   ST_AsGeoJSON(home_location) AS home_location,
                   ST_AsGeoJSON(work_location) AS work_location,
                   ST_AsGeoJSON(last_known_location) AS last_known_location,
                   user_id, user_email, user_phone, user_role, isactive
            FROM residentdetails
            JOIN users ON residentdetails.resident_id = users.user_id
            WHERE resident_id = $1 AND users.isactive = true
        `;
        const { rows } = await pool.query(sql, [resident_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const homeLocation = JSON.parse(row.home_location);
        const workLocation = JSON.parse(row.work_location);
        const lastKnownLocation = JSON.parse(row.last_known_location);

        return Resident.fromEntity({
            resident_id: row.resident_id,
            resident_fname: row.resident_fname,
            resident_lname: row.resident_lname,
            resident_dob: row.resident_dob,
            resident_idnb: row.resident_idnb,
            resident_idpic: row.resident_idpic,
            home_location: {
                latitude: homeLocation.coordinates[1],
                longitude: homeLocation.coordinates[0]
            },
            work_location: {
                latitude: workLocation.coordinates[1],
                longitude: workLocation.coordinates[0]
            },
            last_known_location: {
                latitude: lastKnownLocation.coordinates[1],
                longitude: lastKnownLocation.coordinates[0]
            },
            user: User.fromEntity(row)
        });
    }

    async getResidentsByFName(resident_fname) {
        const sql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE resident_fname ILIKE $1 AND users.isactive = true
    `;
        const { rows } = await pool.query(sql, [`%${resident_fname}%`]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const homeLocation = JSON.parse(row.home_location);
            const workLocation = JSON.parse(row.work_location);
            const lastKnownLocation = JSON.parse(row.last_known_location);

            return Resident.fromEntity({
                resident_id: row.resident_id,
                resident_fname: row.resident_fname,
                resident_lname: row.resident_lname,
                resident_dob: row.resident_dob,
                resident_idnb: row.resident_idnb,
                resident_idpic: row.resident_idpic,
                home_location: {
                    latitude: homeLocation.coordinates[1],
                    longitude: homeLocation.coordinates[0]
                },
                work_location: {
                    latitude: workLocation.coordinates[1],
                    longitude: workLocation.coordinates[0]
                },
                last_known_location: {
                    latitude: lastKnownLocation.coordinates[1],
                    longitude: lastKnownLocation.coordinates[0]
                },
                user: User.fromEntity(row)
            });
        });
    }

    async getResidentsByLName(resident_lname) {
        const sql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE resident_lname ILIKE $1 AND users.isactive = true
    `;
        const { rows } = await pool.query(sql, [`%${resident_lname}%`]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const homeLocation = JSON.parse(row.home_location);
            const workLocation = JSON.parse(row.work_location);
            const lastKnownLocation = JSON.parse(row.last_known_location);

            return Resident.fromEntity({
                resident_id: row.resident_id,
                resident_fname: row.resident_fname,
                resident_lname: row.resident_lname,
                resident_dob: row.resident_dob,
                resident_idnb: row.resident_idnb,
                resident_idpic: row.resident_idpic,
                home_location: {
                    latitude: homeLocation.coordinates[1],
                    longitude: homeLocation.coordinates[0]
                },
                work_location: {
                    latitude: workLocation.coordinates[1],
                    longitude: workLocation.coordinates[0]
                },
                last_known_location: {
                    latitude: lastKnownLocation.coordinates[1],
                    longitude: lastKnownLocation.coordinates[0]
                },
                user: User.fromEntity(row)
            });
        });
    }

    async getResidentByIdNb(resident_idnb) {
        const sql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE resident_idnb = $1 AND users.isactive = true
    `;
        const { rows } = await pool.query(sql, [resident_idnb]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const homeLocation = JSON.parse(row.home_location);
        const workLocation = JSON.parse(row.work_location);
        const lastKnownLocation = JSON.parse(row.last_known_location);

        return Resident.fromEntity({
            resident_id: row.resident_id,
            resident_fname: row.resident_fname,
            resident_lname: row.resident_lname,
            resident_dob: row.resident_dob,
            resident_idnb: row.resident_idnb,
            resident_idpic: row.resident_idpic,
            home_location: {
                latitude: homeLocation.coordinates[1],
                longitude: homeLocation.coordinates[0]
            },
            work_location: {
                latitude: workLocation.coordinates[1],
                longitude: workLocation.coordinates[0]
            },
            last_known_location: {
                latitude: lastKnownLocation.coordinates[1],
                longitude: lastKnownLocation.coordinates[0]
            },
            user: User.fromEntity(row)
        });
    }

    async getResidentsByLastKnownLocation(last_known_location) {
        const sql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE ST_DWithin(
            last_known_location,
            ST_GeomFromText($1, 4326)::geography,
            1000
        ) AND users.isactive = true
    `;
        const locationWKT = `POINT(${last_known_location.longitude} ${last_known_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const homeLocation = JSON.parse(row.home_location);
            const workLocation = JSON.parse(row.work_location);
            const lastKnownLocation = JSON.parse(row.last_known_location);

            return Resident.fromEntity({
                resident_id: row.resident_id,
                resident_fname: row.resident_fname,
                resident_lname: row.resident_lname,
                resident_dob: row.resident_dob,
                resident_idnb: row.resident_idnb,
                resident_idpic: row.resident_idpic,
                home_location: {
                    latitude: homeLocation.coordinates[1],
                    longitude: homeLocation.coordinates[0]
                },
                work_location: {
                    latitude: workLocation.coordinates[1],
                    longitude: workLocation.coordinates[0]
                },
                last_known_location: {
                    latitude: lastKnownLocation.coordinates[1],
                    longitude: lastKnownLocation.coordinates[0]
                },
                user: User.fromEntity(row)
            });
        });
    }

    async getResidentByEmail(user_email) {
        const sql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE user_email = $1 AND users.isactive = true
    `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const homeLocation = JSON.parse(row.home_location);
        const workLocation = JSON.parse(row.work_location);
        const lastKnownLocation = JSON.parse(row.last_known_location);

        return Resident.fromEntity({
            resident_id: row.resident_id,
            resident_fname: row.resident_fname,
            resident_lname: row.resident_lname,
            resident_dob: row.resident_dob,
            resident_idnb: row.resident_idnb,
            resident_idpic: row.resident_idpic,
            home_location: {
                latitude: homeLocation.coordinates[1],
                longitude: homeLocation.coordinates[0]
            },
            work_location: {
                latitude: workLocation.coordinates[1],
                longitude: workLocation.coordinates[0]
            },
            last_known_location: {
                latitude: lastKnownLocation.coordinates[1],
                longitude: lastKnownLocation.coordinates[0]
            },
            user: User.fromEntity(row)
        });
    }

    async getResidentByPhone(user_phone) {
        const sql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE user_phone = $1 AND users.isactive = true
    `;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const homeLocation = JSON.parse(row.home_location);
        const workLocation = JSON.parse(row.work_location);
        const lastKnownLocation = JSON.parse(row.last_known_location);

        return Resident.fromEntity({
            resident_id: row.resident_id,
            resident_fname: row.resident_fname,
            resident_lname: row.resident_lname,
            resident_dob: row.resident_dob,
            resident_idnb: row.resident_idnb,
            resident_idpic: row.resident_idpic,
            home_location: {
                latitude: homeLocation.coordinates[1],
                longitude: homeLocation.coordinates[0]
            },
            work_location: {
                latitude: workLocation.coordinates[1],
                longitude: workLocation.coordinates[0]
            },
            last_known_location: {
                latitude: lastKnownLocation.coordinates[1],
                longitude: lastKnownLocation.coordinates[0]
            },
            user: User.fromEntity(row)
        });
    }

    async updateResident(resident_id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Update resident fields if provided
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
            values.push(data.resident_idnb);
        }
        if (data.resident_idpic) {
            fields.push(`resident_idpic = $${idx++}`);
            values.push(data.resident_idpic);
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

        // Update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run resident update if there are fields to change
        if (fields.length > 0) {
            const sql = `
            UPDATE residentdetails
            SET ${fields.join(', ')}
            WHERE resident_id = $${idx} AND isactive = true
            RETURNING resident_id, resident_fname, resident_lname, resident_dob,
                      resident_idnb, resident_idpic,
                      ST_AsGeoJSON(home_location) AS home_location,
                      ST_AsGeoJSON(work_location) AS work_location,
                      ST_AsGeoJSON(last_known_location) AS last_known_location
        `;
            values.push(resident_id);
            await pool.query(sql, values);
        }

        // Step 2: Update user fields if provided
        const userRepository = new UserRepository();
        if (data.user) {
            await userRepository.updateUser(resident_id, data.user);
        }

        // Step 3: Fetch full resident + user joined
        const joinSql = `
        SELECT resident_id, resident_fname, resident_lname, resident_dob,
               resident_idnb, resident_idpic,
               ST_AsGeoJSON(home_location) AS home_location,
               ST_AsGeoJSON(work_location) AS work_location,
               ST_AsGeoJSON(last_known_location) AS last_known_location,
               user_id, user_email, user_phone, user_role, isactive
        FROM residentdetails
        JOIN users ON residentdetails.resident_id = users.user_id
        WHERE resident_id = $1 AND users.isactive = true
    `;
        const { rows } = await pool.query(joinSql, [resident_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const homeLocation = JSON.parse(row.home_location);
        const workLocation = JSON.parse(row.work_location);
        const lastKnownLocation = JSON.parse(row.last_known_location);

        return Resident.fromEntity({
            resident_id: row.resident_id,
            resident_fname: row.resident_fname,
            resident_lname: row.resident_lname,
            resident_dob: row.resident_dob,
            resident_idnb: row.resident_idnb,
            resident_idpic: row.resident_idpic,
            home_location: {
                latitude: homeLocation.coordinates[1],
                longitude: homeLocation.coordinates[0]
            },
            work_location: {
                latitude: workLocation.coordinates[1],
                longitude: workLocation.coordinates[0]
            },
            last_known_location: {
                latitude: lastKnownLocation.coordinates[1],
                longitude: lastKnownLocation.coordinates[0]
            },
            user: User.fromEntity(row)
        });
    }

    async deactivateResident(resident_id) {
        const userRepository = new UserRepository();
        return await userRepository.deactivateUser(resident_id);
    }
}
