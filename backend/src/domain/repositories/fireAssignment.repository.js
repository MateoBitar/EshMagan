// src/domain/repositories/fireAssignment.repository.js 

import { pool } from '../../config/db.js'; 
import { FireAssignment } from '../entities/fireAssignment.entity.js'; 

export class FireAssignmentRepository { 
    async createAssignment(data) { 
        // Creates a new fire assignment record 
        const fireAssignmentSql = `INSERT INTO firerespondassignments (assignment_status, fire_id, responder_id, assigned_at) 
        VALUES ($1,$2,$3,NOW()) RETURNING assignment_id, assigned_at,
        assignment_status, fire_id, responder_id`;
        const fireAssignmentValues = [data.assignment_status, data.fire_id, data.responder_id]; 
        const { rows } = await pool.query(fireAssignmentSql, fireAssignmentValues);

        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows[0] ? new FireAssignment(rows[0]) : null; 
    }

    async getAllAssignments() { 
        // Retrieves all fire assignments 
        const sql = `SELECT assignment_id, assigned_at, assignment_status,
                    fire_id, responder_id FROM firerespondassignments`;
        const { rows } = await pool.query(sql); 
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireAssignment({ 
            assignment_id: row.assignment_id,
            assigned_at: row.assigned_at,
            assignment_status: row.assignment_status,
            fire_id: row.fire_id,
            responder_id: row.responder_id 
        })); 
    }

    async getAssignmentById(assignment_id) {
        const sql = `SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id
                    FROM firerespondassignments WHERE assignment_id = $1`;
        const { rows } = await pool.query(sql, [assignment_id]);
        if (rows.length === 0) return null;
        return FireAssignment.fromEntity(rows[0]);
    }

    async getAssignmentsByFireId(fire_id) {
        const sql = `SELECT assignment_id, assigned_at, assignment_status, fire_id, responder_id
                    FROM firerespondassignments WHERE fire_id = $1 ORDER BY assigned_at DESC`;
        const { rows } = await pool.query(sql, [fire_id]);
        if (rows.length === 0) return [];
        return rows.map(row => FireAssignment.fromEntity(row));
    }

    async getAssignmentsByResponderId(responder_id) { 
        // Retrieves all assignments for a specific responder 
        const sql = `SELECT assignment_id, assigned_at, assignment_status,
                    fire_id, responder_id FROM firerespondassignments 
                    WHERE responder_id=$1`; 
        const { rows } = await pool.query(sql, [responder_id]); 
        if (rows.length === 0) {
            return []; // No fire found 
        }

        return rows.map(row => new FireAssignment({ 
            assignment_id: row.assignment_id,
            assigned_at: row.assigned_at,
            assignment_status: row.assignment_status,
            fire_id: row.fire_id,
            responder_id: row.responder_id 
        })); 
    }

    async countAssignmentsByFire(fire_id) { 
        // Counts assignments for a specific fire 
        const sql = `SELECT COUNT(*) FROM firerespondassignments WHERE fire_id=$1`; 
        const { rows } = await pool.query(sql, [fire_id]); 
        return parseInt(rows[0].count, 10); 
    } 
    
    async countAssignmentsByResponder(responder_id) { 
        // Counts assignments for a specific responder 
        const sql = `SELECT COUNT(*) FROM firerespondassignments WHERE responder_id=$1`; 
        const { rows } = await pool.query(sql, [responder_id]); 
        return parseInt(rows[0].count, 10); 
    }
}