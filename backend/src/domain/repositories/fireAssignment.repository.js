import { pool } from '../../config/db.js'; 
import { FireAssignment } from '../entities/fireAssignment.entity.js'; 

export class FireAssignmentRepository { 
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
