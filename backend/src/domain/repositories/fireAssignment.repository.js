import { pool } from '../../config/db.js'; 
import { FireAssignment } from '../entities/fireAssignment.entity.js'; 

/**
 * This file defines the FireAssignmentRepository class.
 * It manages all database operations related to assigning responders to fires,
 * including creation, retrieval, updates, deletion, and counting operations.
 */
export class FireAssignmentRepository { 

    /**
     * Creates a new fire assignment.
     * 
     * PRE-CONDITIONS:
     * - data must contain assignment_status, fire_id, and responder_id.
     * 
     * POST-CONDITIONS:
     * - Inserts a new assignment into the database.
     * - Returns the created FireAssignment entity.
     * - Returns null if insertion fails.
     */
    async createAssignment(data) { 
        // Creates a new fire assignment record 
        const { assignment_status, fire_id, responder_id } = data;
        const sql = `
            INSERT INTO firerespondassignments (assignment_status, fire_id, responder_id, assigned_at) 
            VALUES ($1,$2,$3,NOW()) 
            RETURNING assignment_id, assigned_at, assignment_status, fire_id, responder_id
        `;
        const values = [assignment_status, fire_id, responder_id]; 
        const { rows } = await pool.query(sql, values);
        if (rows.length === 0) {
            return null;
        }
        return FireAssignment.fromEntity(rows[0]); 
    }

    /**
     * Retrieves all fire assignments.
     * 
     * PRE-CONDITIONS:
     * - Database connection must be available.
     * 
     * POST-CONDITIONS:
     * - Returns an array of FireAssignment entities.
     * - Returns an empty array if no assignments exist.
     */
    async getAllAssignments() { 
        // Retrieves all fire assignments 
        const sql = `
            SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id 
            FROM firerespondassignments
        `;
        const { rows } = await pool.query(sql); 
        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => FireAssignment.fromEntity(row)); 
    }

    /**
     * Retrieves a fire assignment by its ID.
     * 
     * PRE-CONDITIONS:
     * - assignment_id must be provided.
     * 
     * POST-CONDITIONS:
     * - Returns FireAssignment entity if found.
     * - Returns null if not found.
     */
    async getAssignmentById(assignment_id) {
        // Retrieves a fire assignment by its ID
        const sql = `
            SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id
            FROM firerespondassignments 
            WHERE assignment_id = $1
        `;
        const { rows } = await pool.query(sql, [assignment_id]);
        if (rows.length === 0) {
            return null;
        }

        return FireAssignment.fromEntity(rows[0]);
    }

    /**
     * Retrieves assignments by fire ID.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     * 
     * POST-CONDITIONS:
     * - Returns assignments linked to the fire.
     * - Returns empty array if none found.
     */
    async getAssignmentsByFireId(fire_id) {
        // Retrieves all assignments for a specific fire incident
        const sql = `
            SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id
            FROM firerespondassignments 
            WHERE fire_id = $1 
            ORDER BY assigned_at DESC
        `;
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => FireAssignment.fromEntity(row));
    }

    /**
     * Retrieves assignments by responder ID.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     * 
     * POST-CONDITIONS:
     * - Returns assignments linked to the responder.
     * - Returns empty array if none found.
     */
    async getAssignmentsByResponderId(responder_id) { 
        // Retrieves all assignments for a specific responder 
        const sql = `
            SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id 
            FROM firerespondassignments 
            WHERE responder_id=$1
        `; 
        const { rows } = await pool.query(sql, [responder_id]); 
        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => FireAssignment.fromEntity(row)); 
    }

    /**
     * Retrieves active assignments.
     * 
     * PRE-CONDITIONS:
     * - None.
     * 
     * POST-CONDITIONS:
     * - Returns assignments where status = 'active'.
     * - Returns empty array if none exist.
     */
    async getActiveAssignments() {
        // Retrieves all active assignments (status = 'active')
        const sql = `
            SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id
            FROM firerespondassignments
            WHERE assignment_status = 'active'
            ORDER BY assigned_at DESC
        `;
        const { rows } = await pool.query(sql);

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => FireAssignment.fromEntity(row));
    }

    /**
     * Updates assignment status.
     * 
     * PRE-CONDITIONS:
     * - assignment_id and status must be provided.
     * 
     * POST-CONDITIONS:
     * - Updates assignment_status and timestamp.
     * - Returns updated FireAssignment entity if found.
     * - Returns null if assignment does not exist.
     */
    async updateAssignmentStatus(assignment_id, status) {
        // Updates the status of a fire assignment
        const sql = `
            UPDATE firerespondassignments
            SET assignment_status = $2,
                assigned_at = NOW()
            WHERE assignment_id = $1
            RETURNING assignment_id, assigned_at, assignment_status, fire_id, responder_id
        `;
        const { rows } = await pool.query(sql, [assignment_id, status]);

        if (rows.length === 0) {
            return null;
        }

        return FireAssignment.fromEntity(rows[0]);
    }

    /**
     * Deletes a fire assignment.
     * 
     * PRE-CONDITIONS:
     * - assignment_id must be provided.
     * 
     * POST-CONDITIONS:
     * - Deletes assignment if it exists.
     * - Returns true if deleted.
     * - Returns false if not found.
     */
    async deleteAssignment(assignment_id) {
        // Deletes a fire assignment record
        const sql = `
            DELETE FROM firerespondassignments 
            WHERE assignment_id=$1 
            RETURNING assignment_id`;
        const { rows } = await pool.query(sql, [assignment_id]);

        if (rows.length === 0) {
            return false; // Assignment not found
        }

        return true; // Assignment deleted successfully
    }

    /**
     * Counts assignments with filters.
     * 
     * PRE-CONDITIONS:
     * - filters may include fire_id, responder_id, assignment_status.
     * 
     * POST-CONDITIONS:
     * - Returns number of matching assignments.
     */
    async countAssignments(filters = {}) { 
        // Counts assignments with optional filters
        const conditions = [];
        const values = [];
        let idx = 1;

        if (filters.fire_id) {
            conditions.push(`fire_id = $${idx++}`);
            values.push(filters.fire_id);
        }
        if (filters.responder_id) {
            conditions.push(`responder_id = $${idx++}`);
            values.push(filters.responder_id);
        }
        if (filters.assignment_status) {
            conditions.push(`assignment_status = $${idx++}`);
            values.push(filters.assignment_status);
        }

        let sql = `SELECT COUNT(*) FROM firerespondassignments WHERE 1=1`;
        if (conditions.length > 0) {
            sql += ` AND ${conditions.join(' AND ')}`;
        }

        const { rows } = await pool.query(sql, values);
        return parseInt(rows[0].count, 10);
    }

    /**
     * Counts assignments by fire.
     * 
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     * 
     * POST-CONDITIONS:
     * - Returns number of assignments linked to fire.
     */
    async countAssignmentsByFire(fire_id) {
        // Counts assignments for a specific fire
        const sql = `
            SELECT COUNT(*) 
            FROM firerespondassignments 
            WHERE fire_id = $1
        `;
        const { rows } = await pool.query(sql, [fire_id]);

        return parseInt(rows[0].count, 10);
    }

    /**
     * Counts assignments by responder.
     * 
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     * 
     * POST-CONDITIONS:
     * - Returns number of assignments linked to responder.
     */
    async countAssignmentsByResponder(responder_id) {
        // Counts assignments for a specific responder
        const sql = `
            SELECT COUNT(*) 
            FROM firerespondassignments 
            WHERE responder_id = $1
        `;
        const { rows } = await pool.query(sql, [responder_id]);

        return parseInt(rows[0].count, 10);
    }
}