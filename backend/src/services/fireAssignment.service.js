// src/services/fireAssignment.service.js

import { FireAssignment } from '../domain/entities/fireAssignment.entity.js';

export class FireAssignmentService {
    constructor(fireAssignmentRepository) {
        this.fireAssignmentRepository = fireAssignmentRepository;
    }

    async createAssignment(data) {
        try {
            // Validate required fields
            if (!data.fire_id) throw new Error("Missing required field: Fire ID");
            if (!data.responder_id) throw new Error("Missing required field: Responder ID");
            if (!data.assignment_status) throw new Error("Missing required field: Assignment Status");

            // Step 1: Create a new FireAssignment entity
            const assignment = new FireAssignment({
                fire_id: data.fire_id,
                responder_id: data.responder_id,
                assignment_status: data.assignment_status
            });

            // Step 2: Save the assignment to the database
            const createdAssignment = await this.fireAssignmentRepository.createAssignment(assignment);
            return createdAssignment.toDTO();
        } catch (err) {
            throw new Error(`Failed to create assignment: ${err.message}`);
        }
    }

    async getAllAssignments() {
        try {
            // Fetch all assignments from the database
            const assignments = await this.fireAssignmentRepository.getAllAssignments();
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch assignments: ${err.message}`);
        }
    }

    async getAssignmentById(assignment_id) {
        try {
            // Fetch a single assignment by its ID
            const assignment = await this.fireAssignmentRepository.getAssignmentById(assignment_id);
            if (!assignment) return null;
            return assignment.toDTO();
        } catch (err) {
            throw new Error(`Failed to fetch assignment by ID: ${err.message}`);
        }
    }

    async getAssignmentsByFireId(fire_id) {
        try {
            // Fetch all assignments associated with a specific fire ID
            const assignments = await this.fireAssignmentRepository.getAssignmentsByFireId(fire_id);
            if (!assignments || assignments.length === 0) return [];
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch assignments by fire ID: ${err.message}`);
        }
    }

    async getAssignmentsByResponderId(responder_id) {
        try {
            // Fetch all assignments associated with a specific responder ID
            const assignments = await this.fireAssignmentRepository.getAssignmentsByResponderId(responder_id);
            if (!assignments) return []; // Not found
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch assignments by responder ID: ${err.message}`);
        }
    }

    async getActiveAssignments() {
        try {
            // Fetch all active assignments (e.g., those with status 'active')
            const assignments = await this.fireAssignmentRepository.getActiveAssignments();
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch active assignments: ${err.message}`);
        }
    }

    async updateAssignmentStatus(assignment_id, status) {
        try {
            // Update the status of an existing assignment
            const updatedAssignment = await this.fireAssignmentRepository.updateAssignmentStatus(assignment_id, status);
            if (!updatedAssignment) return null; // Not found
            return updatedAssignment.toDTO();
        } catch (err) {
            throw new Error(`Failed to update assignment status: ${err.message}`);
        }
    }

    async deleteAssignment(assignment_id) {
        try {
            // Delete an assignment by its ID
            return await this.fireAssignmentRepository.deleteAssignment(assignment_id);
        } catch (err) {
            throw new Error(`Failed to delete assignment: ${err.message}`);
        }
    }

    async countAssignments(filters) {
        try {
            // Count the number of assignments based on provided filters (e.g., by fire_id, responder_id, status)
            return await this.fireAssignmentRepository.countAssignments(filters);
        } catch (err) {
            throw new Error(`Failed to count assignments: ${err.message}`);
        }
    }

    async countAssignmentsByFire(fire_id) {
        try {
            // Count the number of assignments associated with a specific fire ID
            return await this.fireAssignmentRepository.countAssignmentsByFire(fire_id);
        } catch (err) {
            throw new Error(`Failed to count assignments by fire: ${err.message}`);
        }
    }

    async countAssignmentsByResponder(responder_id) {
        try {
            // Count the number of assignments associated with a specific responder ID
            return await this.fireAssignmentRepository.countAssignmentsByResponder(responder_id);
        } catch (err) {
            throw new Error(`Failed to count assignments by responder: ${err.message}`);
        }
    }
}
