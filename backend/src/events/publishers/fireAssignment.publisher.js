// src/events/publishers/fireAssignment.publisher.js
//
// Published when a responder is assigned to a fire.
// Triggers: fireAssignment.subscriber to notify the assigned responder.

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

/**
 * This file defines the publisher responsible for emitting the "assignment.created"
 * event to the NATS JetStream system. It is used to notify downstream services
 * that a responder has been assigned to a fire event.
 */

export async function publishAssignmentCreated(data) {

    /**
     * Publish an assignment.created event.
     *
     * PRE-CONDITIONS:
     * - data must include assignment_id, assignment_status, fire_id, and responder_id.
     * - NATS connection must be initialized.
     *
     * POST-CONDITIONS:
     * - Encodes and publishes the assignment.created event to JetStream.
     * - Triggers downstream subscribers (e.g., assignment notification logic).
     * - Throws error if publishing fails.
     */

    try {
        const js = getJetStream();

        const payload = sc.encode(JSON.stringify({
            assignment_id:     data.assignment_id,
            assignment_status: data.assignment_status,
            fire_id:           data.fire_id,
            responder_id:      data.responder_id,
            timestamp:         new Date().toISOString(),
        }));

        await js.publish(SUBJECTS.ASSIGNMENT_CREATED, payload);
        console.log(`[NATS] Published assignment.created for assignment_id: ${data.assignment_id}`);
    } catch (err) {
        console.error(`[NATS] Failed to publish assignment.created: ${err.message}`);
        throw err;
    }
}