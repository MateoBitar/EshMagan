// src/services/fireAssignment.service.js

import { FireAssignment } from '../domain/entities/fireAssignment.entity.js';

/**
 * This file defines the FireAssignmentService class.
 * It manages the lifecycle of fire-responder assignments,
 * including creation, retrieval, updates, deletion, and counting.
 */
export class FireAssignmentService {
    /**
     * Initialize FireAssignmentService.
     *
     * PRE-CONDITIONS:
     * - fireAssignmentRepository must be provided.
     *
     * POST-CONDITIONS:
     * - Service is ready to manage assignment operations.
     */
    constructor(fireAssignmentRepository) {
        this.fireAssignmentRepository = fireAssignmentRepository;
    }

    /**
     * Create a fire assignment.
     *
     * PRE-CONDITIONS:
     * - fire_id, responder_id, and assignment_status must be provided.
     *
     * POST-CONDITIONS:
     * - Assignment entity is created and stored.
     * - Returns assignment DTO.
     */
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

    /**
     * Retrieve all assignments.
     *
     * PRE-CONDITIONS:
     * - Repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns list of assignment DTOs.
     */
    async getAllAssignments() {
        try {
            // Fetch all assignments from the database
            const assignments = await this.fireAssignmentRepository.getAllAssignments();
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch assignments: ${err.message}`);
        }
    }

    /**
     * Retrieve assignment by ID.
     *
     * PRE-CONDITIONS:
     * - assignment_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns assignment DTO if found.
     * - Returns null if not found.
     */
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

    /**
     * Retrieve assignments by fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching assignments.
     * - Returns empty array if none found.
     */
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

    /**
     * Retrieve assignments by responder ID.
     *
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns matching assignments.
     * - Returns empty array if none found.
     */
    async getAssignmentsByResponderId(responder_id) {
        try {
            // Fetch all assignments associated with a specific responder ID
            const assignments = await this.fireAssignmentRepository.getAssignmentsByResponderId(responder_id);
            if (!assignments || assignments.length === 0) return []; // Not found
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch assignments by responder ID: ${err.message}`);
        }
    }

    /**
     * Retrieve active assignments.
     *
     * PRE-CONDITIONS:
     * - Repository must be available.
     *
     * POST-CONDITIONS:
     * - Returns active assignments.
     */
    async getActiveAssignments() {
        try {
            // Fetch all active assignments (e.g., those with status 'active')
            const assignments = await this.fireAssignmentRepository.getActiveAssignments();
            if (!assignments || assignments.length === 0) return []; // Not found
            return assignments.map(a => a.toDTO());
        } catch (err) {
            throw new Error(`Failed to fetch active assignments: ${err.message}`);
        }
    }

    /**
     * Update assignment status.
     *
     * PRE-CONDITIONS:
     * - assignment_id and status must be provided.
     *
     * POST-CONDITIONS:
     * - Assignment status updated.
     * - Returns updated assignment DTO.
     */
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

    /**
     * Delete assignment.
     *
     * PRE-CONDITIONS:
     * - assignment_id must be provided.
     *
     * POST-CONDITIONS:
     * - Assignment removed from database.
     */
    async deleteAssignment(assignment_id) {
        try {
            // Delete an assignment by its ID
            return await this.fireAssignmentRepository.deleteAssignment(assignment_id);
        } catch (err) {
            throw new Error(`Failed to delete assignment: ${err.message}`);
        }
    }

    /**
     * Count assignments with filters.
     *
     * PRE-CONDITIONS:
     * - filters may be provided.
     *
     * POST-CONDITIONS:
     * - Returns number of matching assignments.
     */
    async countAssignments(filters) {
        try {
            // Count the number of assignments based on provided filters (e.g., by fire_id, responder_id, status)
            return await this.fireAssignmentRepository.countAssignments(filters);
        } catch (err) {
            throw new Error(`Failed to count assignments: ${err.message}`);
        }
    }

    /**
     * Count assignments by fire ID.
     *
     * PRE-CONDITIONS:
     * - fire_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns number of assignments linked to fire.
     */
    async countAssignmentsByFire(fire_id) {
        try {
            // Count the number of assignments associated with a specific fire ID
            return await this.fireAssignmentRepository.countAssignmentsByFire(fire_id);
        } catch (err) {
            throw new Error(`Failed to count assignments by fire: ${err.message}`);
        }
    }

    /**
     * Count assignments by responder ID.
     *
     * PRE-CONDITIONS:
     * - responder_id must be provided.
     *
     * POST-CONDITIONS:
     * - Returns number of assignments linked to responder.
     */
    async countAssignmentsByResponder(responder_id) {
        try {
            // Count the number of assignments associated with a specific responder ID
            return await this.fireAssignmentRepository.countAssignmentsByResponder(responder_id);
        } catch (err) {
            throw new Error(`Failed to count assignments by responder: ${err.message}`);
        }
    }
}
