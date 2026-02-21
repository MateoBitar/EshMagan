// src/utils/id.utils.js

import { pool } from '../config/db.js';

/**
 * Sequence names mapped per role.
 * Each sequence lives in the DB and auto-increments — no duplicates even under concurrent inserts.
 */
const ROLE_SEQUENCE_MAP = {
    Resident:     'resident_seq',
    Responder:    'responder_seq',
    Municipality: 'municipality_seq',
    Admin:        'admin_seq',
};

/**
 * Prefix per role.
 * Resident     → R000001
 * Responder    → P000001
 * Municipality → M000001
 * Admin        → A000001
 */
const ROLE_PREFIX_MAP = {
    Resident:     'R',
    Responder:    'P',
    Municipality: 'M',
    Admin:        'A',
};

const PADDING = 6; // Total digit width: R000001, M000001, etc.

/**
 * Generates a sequential, role-prefixed user ID.
 * Pulls the next value from the appropriate PostgreSQL sequence.
 *
 * @param {string} role - One of: 'Resident', 'Responder', 'Municipality', 'Admin'
 * @returns {Promise<string>} - e.g. 'R000001', 'P000002', 'M000001', 'A000003'
 */
export async function generateUserId(role) {
    const seq = ROLE_SEQUENCE_MAP[role];
    const prefix = ROLE_PREFIX_MAP[role];

    if (!seq || !prefix) {
        throw new Error(`Unknown role "${role}" — cannot generate user ID.`);
    }

    const { rows } = await pool.query(`SELECT nextval('${seq}') AS next_id`);
    const padded = rows[0].next_id.toString().padStart(PADDING, '0');
    return `${prefix}${padded}`;
}