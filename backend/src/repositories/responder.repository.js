// src/repositories/responder.repository.js

import { pool } from '../config/db.js';
import { Responder } from '../entities/responder.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

export class ResponderRepository {
    async createResponder(data) {
        const { unit_nb, unit_location, assigned_region, responder_status, last_known_location,
            updated_at, user } = data;

        // Step 1: Create the user first
        const userRepository = new UserRepository();
        const createdUser = await userRepository.createUser(user);

        // Step 2: Create the responder with the user_id
        const responderSql = `INSERT INTO responderdetails (responder_id, unit_nb,
                            unit_location, assigned_region, responder_status,
                            last_known_location) VALUES ($1, $2, ST_GeoFromText($3,4326)::geography,
                            $4, $5, ST_GeomFromText($6, 4326)::geography)
                            RETURNING responder_id, unit_nb, unit_location,
                            assigned_region, responder_status, last_known_location`;
        const responderValues = [createdUser.user_id, unit_nb,
        `POINT(${unit_location.longitude} ${unit_location.latitude})`,
            assigned_region, responder_status,
        `POINT(${last_known_location.longitude} ${last_known_location.latitude})`];
        const { rows: responderRows } = await pool.query(responderSql, responderValues);

        return new Responder({ ...responderRows[0], user: createdUser });
    }

    async getAllResponders() {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE isactive = true`;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return []; // No responders found or none are active
        }

        return rows.map(row => {
            const unit_location = JSON.parse(row.unit_location);
            const last_known_location = JSON.parse(row.last_known_location);

            return new Responder({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    latitude: unit_location.coordinates[1],
                    longitude: unit_location.coordinates[0]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    latitude: last_known_location.coordinates[1],
                    longitude: last_known_location.coordinates[0]
                },
                user: new User({
                    user_id: row.responder_id,
                    user_email: row.user_email,
                    user_phone: row.user_phone,
                    user_role: row.user_role,
                    isactive: row.isactive
                })
            });
        });
    }

    async getResponderById(responder_id) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE responder_id = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [responder_id]);
        if (rows.length === 0) {
            return null; // Responder not found or not active
        }
        const row = rows[0];
        const unit_location = JSON.parse(row.unit_location);
        const last_known_location = JSON.parse(row.last_known_location);

        return new Responder({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                latitude: unit_location.coordinates[1],
                longitude: unit_location.coordinates[0]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                latitude: last_known_location.coordinates[1],
                longitude: last_known_location.coordinates[0]
            },
            user: new User({
                user_id: row.responder_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getResponderByUnitNb(unit_nb) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE unit_nb = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [unit_nb]);
        if (rows.length === 0) {
            return null; // Responder not found or not active
        }
        const row = rows[0];
        const unit_location = JSON.parse(row.unit_location);
        const last_known_location = JSON.parse(row.last_known_location);

        return new Responder({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                latitude: unit_location.coordinates[1],
                longitude: unit_location.coordinates[0]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                latitude: last_known_location.coordinates[1],
                longitude: last_known_location.coordinates[0]
            },
            user: new User({
                user_id: row.responder_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getResponderByUnitLocation(unit_location) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE ST_DWithin(unit_location, ST_GeomFromText($1, 4326)::geography, 1000) AND isactive = true`;
        const locationWKT = `POINT(${unit_location.longitude} ${unit_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) {
            return null; // Responder not found or not active
        }
        const row = rows[0];
        const unit_location = JSON.parse(row.unit_location);
        const last_known_location = JSON.parse(row.last_known_location);

        return new Responder({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                latitude: unit_location.coordinates[1],
                longitude: unit_location.coordinates[0]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                latitude: last_known_location.coordinates[1],
                longitude: last_known_location.coordinates[0]
            },
            user: new User({
                user_id: row.responder_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getResponderByAssignedRegion(assigned_region) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE assigned_region = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [assigned_region]);
        if (rows.length === 0) {
            return []; // No responders found or none are active
        }

        return rows.map(row => {
            const unit_location = JSON.parse(row.unit_location);
            const last_known_location = JSON.parse(row.last_known_location);

            return new Responder({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    latitude: unit_location.coordinates[1],
                    longitude: unit_location.coordinates[0]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    latitude: last_known_location.coordinates[1],
                    longitude: last_known_location.coordinates[0]
                },
                user: new User({
                    user_id: row.responder_id,
                    user_email: row.user_email,
                    user_phone: row.user_phone,
                    user_role: row.user_role,
                    isactive: row.isactive
                })
            });
        });
    }

    async getResponderByResponderStatus(responder_status) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE responder_status = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [responder_status]);
        if (rows.length === 0) {
            return []; // No responders found or none are active
        }

        return rows.map(row => {
            const unit_location = JSON.parse(row.unit_location);
            const last_known_location = JSON.parse(row.last_known_location);

            return new Responder({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    latitude: unit_location.coordinates[1],
                    longitude: unit_location.coordinates[0]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    latitude: last_known_location.coordinates[1],
                    longitude: last_known_location.coordinates[0]
                },
                user: new User({
                    user_id: row.responder_id,
                    user_email: row.user_email,
                    user_phone: row.user_phone,
                    user_role: row.user_role,
                    isactive: row.isactive
                })
            });
        });
    }

    async getRespondersByLastKnownLocation(last_known_location) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE ST_DWithin(last_known_location, ST_GeomFromText($1, 4326)::geography, 1000) AND isactive = true`;
        const locationWKT = `POINT(${last_known_location.longitude} ${last_known_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) {
            return []; // Responder not found or not active
        }

        return rows.map(row => {
            const unit_location = JSON.parse(row.unit_location);
            const last_known_location = JSON.parse(row.last_known_location);

            return new Responder({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    latitude: unit_location.coordinates[1],
                    longitude: unit_location.coordinates[0]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    latitude: last_known_location.coordinates[1],
                    longitude: last_known_location.coordinates[0]
                },
                user: new User({
                    user_id: row.responder_id,
                    user_email: row.user_email,
                    user_phone: row.user_phone,
                    user_role: row.user_role,
                    isactive: row.isactive
                })
            });
        });
    }

    async getResponderByEmail(user_email) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE user_email = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) {
            return null; // Responder not found or not active
        }
        const row = rows[0];
        const unit_location = JSON.parse(row.unit_location);
        const last_known_location = JSON.parse(row.last_known_location);

        return new Responder({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                latitude: unit_location.coordinates[1],
                longitude: unit_location.coordinates[0]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                latitude: last_known_location.coordinates[1],
                longitude: last_known_location.coordinates[0]
            },
            user: new User({
                user_id: row.responder_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async getResponderByPhone(user_phone) {
        const sql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE user_phone = $1 AND isactive = true`;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) {
            return null; // Responder not found or not active
        }
        const row = rows[0];
        const unit_location = JSON.parse(row.unit_location);
        const last_known_location = JSON.parse(row.last_known_location);

        return new Responder({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                latitude: unit_location.coordinates[1],
                longitude: unit_location.coordinates[0]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                latitude: last_known_location.coordinates[1],
                longitude: last_known_location.coordinates[0]
            },
            user: new User({
                user_id: row.responder_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async updateResponder(responder_id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        // Step 1: Update responder fields if provided
        if (data.unit_nb) {
            fields.push(`unit_nb = $${idx++}`);
            values.push(data.unit_nb);
        }
        if (data.unit_location) {
            fields.push(`unit_location = ST_GeomFromText($${idx++}, 4326)::geography`);
            values.push(`POINT(${data.unit_location.longitude} ${data.unit_location.latitude})`);
        }
        if (data.assigned_region) {
            fields.push(`assigned_region = $${idx++}`);
            values.push(data.assigned_region);
        }
        if (data.responder_status) {
            fields.push(`responder_status = $${idx++}`);
            values.push(data.responder_status);
        }
        if (data.last_known_location) {
            fields.push(`last_known_location = ST_GeomFromText($${idx++}, 4326)::geography`);
            values.push(`POINT(${data.last_known_location.longitude} ${data.last_known_location.latitude})`);
        }

        // Update timestamp
        fields.push(`updated_at = NOW()`);

        // Only run responder update if there are fields to change
        if (fields.length > 0) {
            const sql = `UPDATE responderdetails SET ${fields.join(', ')}
                        WHERE responder_id = $${idx} AND isactive = true
                        RETURNING responder_id, unit_nb, ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                        responder_status, ST_AsGeoJSON(last_known_location) AS last_known_location`;
            values.push(responder_id);
            await pool.query(sql, values);
        }

        // Step 2: Update user fields if provided
        let updatedUser;
        const userRepository = new UserRepository();
        if (data.user) {
            await userRepository.updateUser(responder_id, data.user);
        }
        // Fetch fresh user from DB to ensure consistency
        updatedUser = await userRepository.getUserById(responder_id);

        // Step 3: Fetch full responder + user joined
        const joinSql = `SELECT responder_id, unit_nb,
                    ST_AsGeoJSON(unit_location) AS unit_location, assigned_region,
                    responder_status,
                    ST_AsGeoJSON(last_known_location) AS last_known_location, user_email,
                    user_phone, user_role, isactive FROM responderdetails
                    JOIN users ON responderdetails.responder_id = users.user_id
                    WHERE responder_id = $1 AND isactive = true`;
        const { rows } = await pool.query(joinSql, [responder_id]);

        if (rows.length === 0) {
            return null; // Responder not found or not active
        }

        const row = rows[0];
        const unit_location = JSON.parse(row.unit_location);
        const last_known_location = JSON.parse(row.last_known_location);

        return new Responder({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                latitude: unit_location.coordinates[1],
                longitude: unit_location.coordinates[0]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                latitude: last_known_location.coordinates[1],
                longitude: last_known_location.coordinates[0]
            },
            user: new User({
                user_id: row.responder_id,
                user_email: row.user_email,
                user_phone: row.user_phone,
                user_role: row.user_role,
                isactive: row.isactive
            })
        });
    }

    async deactivateResponder(responder_id) {
        const userRepository = new UserRepository();
        const result = await userRepository.deactivateUser(responder_id);
        return result ? true : false;
    }
}
