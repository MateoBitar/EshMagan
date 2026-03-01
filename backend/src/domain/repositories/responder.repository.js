// src/domain/repositories/responder.repository.js

import { pool } from '../../config/db.js';
import { Responder } from '../entities/responder.entity.js';
import { User } from '../entities/user.entity.js';
import { UserRepository } from './user.repository.js';

export class ResponderRepository {
    async createResponder(data) {
        const {
            responder_id,
            unit_nb,
            unit_location,
            assigned_region,
            responder_status,
            last_known_location,
            user
        } = data;

        const responderSql = `
            INSERT INTO responderdetails (
                responder_id, unit_nb, unit_location, assigned_region,
                responder_status, last_known_location
            )
            VALUES (
                $1, $2, ST_GeomFromText($3, 4326)::geography, $4, $5,
                ST_GeomFromText($6, 4326)::geography
            )
            RETURNING responder_id, unit_nb,
                      ST_AsGeoJSON(unit_location) AS unit_location,
                      assigned_region, responder_status,
                      ST_AsGeoJSON(last_known_location) AS last_known_location
        `;
        const responderValues = [
            responder_id,
            unit_nb,
            `POINT(${unit_location.longitude} ${unit_location.latitude})`,
            assigned_region,
            responder_status,
            `POINT(${last_known_location.longitude} ${last_known_location.latitude})`
        ];

        const { rows: responderRows } = await pool.query(responderSql, responderValues);
        const row = responderRows[0];

        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return Responder.fromEntity({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            user: User.fromEntity(user)
        });
    }

    async getAllResponders() {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE u.isactive = true
    `;
        const { rows } = await pool.query(sql);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const unitLoc = JSON.parse(row.unit_location);
            const lastLoc = JSON.parse(row.last_known_location);

            return Responder.fromEntity({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    longitude: unitLoc.coordinates[0],
                    latitude: unitLoc.coordinates[1]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    longitude: lastLoc.coordinates[0],
                    latitude: lastLoc.coordinates[1]
                },
                updated_at: row.responder_updated_at,
                user: User.fromEntity({
                    ...row,
                    created_at: row.user_created_at,
                    updated_at: row.user_updated_at
                })
            });
        });
    }

    async getResponderById(responder_id) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE r.responder_id = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(sql, [responder_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return Responder.fromEntity({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            updated_at: row.responder_updated_at,
            user: User.fromEntity({
                ...row,
                created_at: row.user_created_at,
                updated_at: row.user_updated_at
            })
        });
    }

    async getRespondersByUnitNb(unit_nb) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE r.unit_nb = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(sql, [unit_nb]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const unitLoc = JSON.parse(row.unit_location);
            const lastLoc = JSON.parse(row.last_known_location);

            return Responder.fromEntity({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    longitude: unitLoc.coordinates[0],
                    latitude: unitLoc.coordinates[1]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    longitude: lastLoc.coordinates[0],
                    latitude: lastLoc.coordinates[1]
                },
                updated_at: row.responder_updated_at,
                user: User.fromEntity({
                    ...row,
                    created_at: row.user_created_at,
                    updated_at: row.user_updated_at
                })
            });
        });
    }

    async getRespondersByUnitLocation(unit_location) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE ST_DWithin(r.unit_location, ST_GeomFromText($1, 4326)::geography, 1000)
          AND u.isactive = true
    `;
        const locationWKT = `POINT(${unit_location.longitude} ${unit_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const unitLoc = JSON.parse(row.unit_location);
            const lastLoc = JSON.parse(row.last_known_location);

            return Responder.fromEntity({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    longitude: unitLoc.coordinates[0],
                    latitude: unitLoc.coordinates[1]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    longitude: lastLoc.coordinates[0],
                    latitude: lastLoc.coordinates[1]
                },
                updated_at: row.responder_updated_at,
                user: User.fromEntity({
                    ...row,
                    created_at: row.user_created_at,
                    updated_at: row.user_updated_at
                })
            });
        });
    }

    async getRespondersByAssignedRegion(assigned_region) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE r.assigned_region = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(sql, [assigned_region]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const unitLoc = JSON.parse(row.unit_location);
            const lastLoc = JSON.parse(row.last_known_location);

            return Responder.fromEntity({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    longitude: unitLoc.coordinates[0],
                    latitude: unitLoc.coordinates[1]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    longitude: lastLoc.coordinates[0],
                    latitude: lastLoc.coordinates[1]
                },
                updated_at: row.responder_updated_at,
                user: User.fromEntity({
                    ...row,
                    created_at: row.user_created_at,
                    updated_at: row.user_updated_at
                })
            });
        });
    }

    async getRespondersByResponderStatus(responder_status) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE r.responder_status = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(sql, [responder_status]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const unitLoc = JSON.parse(row.unit_location);
            const lastLoc = JSON.parse(row.last_known_location);

            return Responder.fromEntity({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    longitude: unitLoc.coordinates[0],
                    latitude: unitLoc.coordinates[1]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    longitude: lastLoc.coordinates[0],
                    latitude: lastLoc.coordinates[1]
                },
                updated_at: row.responder_updated_at,
                user: User.fromEntity({
                    ...row,
                    created_at: row.user_created_at,
                    updated_at: row.user_updated_at
                })
            });
        });
    }

    async getRespondersByLastKnownLocation(last_known_location) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE ST_DWithin(
            r.last_known_location,
            ST_GeomFromText($1, 4326)::geography,
            1000
        ) AND u.isactive = true
    `;
        const locationWKT = `POINT(${last_known_location.longitude} ${last_known_location.latitude})`;
        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) return [];

        return rows.map(row => {
            const unitLoc = JSON.parse(row.unit_location);
            const lastLoc = JSON.parse(row.last_known_location);

            return Responder.fromEntity({
                responder_id: row.responder_id,
                unit_nb: row.unit_nb,
                unit_location: {
                    longitude: unitLoc.coordinates[0],
                    latitude: unitLoc.coordinates[1]
                },
                assigned_region: row.assigned_region,
                responder_status: row.responder_status,
                last_known_location: {
                    longitude: lastLoc.coordinates[0],
                    latitude: lastLoc.coordinates[1]
                },
                updated_at: row.responder_updated_at,
                user: User.fromEntity({
                    ...row,
                    created_at: row.user_created_at,
                    updated_at: row.user_updated_at
                })
            });
        });
    }

    async getResponderByEmail(user_email) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE u.user_email = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(sql, [user_email]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return Responder.fromEntity({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            updated_at: row.responder_updated_at,
            user: User.fromEntity({
                ...row,
                created_at: row.user_created_at,
                updated_at: row.user_updated_at
            })
        });
    }

    async getResponderByPhone(user_phone) {
        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE u.user_phone = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(sql, [user_phone]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return Responder.fromEntity({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            updated_at: row.responder_updated_at,
            user: User.fromEntity({
                ...row,
                created_at: row.user_created_at,
                updated_at: row.user_updated_at
            })
        });
    }

    // Get nearest available responder to a fire location
    //
    // fire_location is the raw WKT string as stored on the FireEvent entity
    // (returned by ST_AsText from the DB). It can be either:
    //   - POINT(lng lat)          → ignition source
    //   - POLYGON((lng lat, ...)) → fire spread area from fireSpread.engine.js
    //
    // ST_Distance handles both correctly:
    //   - POINT   → straight-line distance to the ignition point
    //   - POLYGON → distance to the nearest edge of the polygon
    async getNearestResponder(fire_location) {
        // Convert LocationInput into WKT string
        const locationWKT = `POINT(${fire_location.longitude} ${fire_location.latitude})`;

        const sql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location)       AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at,
               ST_Distance(
                   r.last_known_location::geography,
                   ST_GeomFromText($1, 4326)::geography
               ) AS distance_meters
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE r.responder_status = 'Active'
          AND u.isactive = true
        ORDER BY distance_meters ASC
        LIMIT 1
    `;

        const { rows } = await pool.query(sql, [locationWKT]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return Responder.fromEntity({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            updated_at: row.responder_updated_at,
            distance_meters: parseFloat(row.distance_meters),
            user: User.fromEntity({
                ...row,
                created_at: row.user_created_at,
                updated_at: row.user_updated_at
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

        // Only run responder update if there are fields to change and not just updated_at
        if (fields.length > 1) {
            const sql = `
            UPDATE responderdetails
            SET ${fields.join(', ')}
            WHERE responder_id = $${idx}
            RETURNING responder_id
        `;
            values.push(responder_id);
            await pool.query(sql, values);
        }

        // Step 2: Update user fields if provided
        const userRepository = new UserRepository();
        if (data.user) {
            await userRepository.updateUser(responder_id, data.user);
        }

        // Step 3: Fetch full responder + user joined
        const joinSql = `
        SELECT r.responder_id, r.unit_nb,
               ST_AsGeoJSON(r.unit_location) AS unit_location,
               r.assigned_region, r.responder_status,
               ST_AsGeoJSON(r.last_known_location) AS last_known_location,
               r.updated_at AS responder_updated_at,
               u.user_id, u.user_email, u.user_phone, u.user_role,
               u.isactive,
               u.created_at AS user_created_at,
               u.updated_at AS user_updated_at
        FROM responderdetails r
        JOIN users u ON r.responder_id = u.user_id
        WHERE r.responder_id = $1 AND u.isactive = true
    `;
        const { rows } = await pool.query(joinSql, [responder_id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return Responder.fromEntity({
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            updated_at: row.responder_updated_at,
            user: User.fromEntity({
                ...row,
                created_at: row.user_created_at,
                updated_at: row.user_updated_at
            })
        });
    }

    // Wrapper for quick status updates
    async updateResponderStatus(responder_id, responder_status) {
        return this.updateResponder(responder_id, { responder_status });
    }

    // Called at high frequency from the gRPC GPS stream so it deliberately
    // skips the full JOIN re-fetch that updateResponder() does. It updates
    // a single column and returns only the bare coordinates + timestamp,
    // which is all the gRPC handler needs to confirm the write.
    async updateResponderLocation(responder_id, latitude, longitude) {
        await pool.query(`
            UPDATE responderdetails
            SET last_known_location = ST_GeomFromText($1, 4326)::geography,
                updated_at = NOW()
            WHERE responder_id = $2
        `, [`POINT(${longitude} ${latitude})`, responder_id]);

        const { rows } = await pool.query(`
            SELECT 
            r.responder_id,
            r.unit_nb,
            r.responder_status,
            r.updated_at AS responder_updated_at,
            ST_AsGeoJSON(r.unit_location) AS unit_location,
            ST_AsGeoJSON(r.last_known_location) AS last_known_location,
            u.user_id,
            u.user_email,
            u.user_phone,
            u.user_role,
            u.created_at AS user_created_at,
            u.updated_at AS user_updated_at
            FROM responderdetails r
            JOIN users u ON r.responder_id = u.user_id
            WHERE r.responder_id = $1`
            , [responder_id]);

        if (rows.length === 0) return null;

        const row = rows[0];
        const unitLoc = JSON.parse(row.unit_location);
        const lastLoc = JSON.parse(row.last_known_location);

        return {
            responder_id: row.responder_id,
            unit_nb: row.unit_nb,
            unit_location: {
                longitude: unitLoc.coordinates[0],
                latitude: unitLoc.coordinates[1]
            },
            assigned_region: row.assigned_region,
            responder_status: row.responder_status,
            last_known_location: {
                longitude: lastLoc.coordinates[0],
                latitude: lastLoc.coordinates[1]
            },
            updated_at: row.responder_updated_at,
            user: User.fromEntity({
                ...row,
                created_at: row.user_created_at,
                updated_at: row.user_updated_at
            })
        };
    }

    async deactivateResponder(responder_id) {
        const userRepository = new UserRepository();
        return await userRepository.deactivateUser(responder_id);
    }
}
