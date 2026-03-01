// src/events/publishers/fireAssignment.publisher.js
//
// Published when a responder is assigned to a fire.
// Triggers: fireAssignment.subscriber to notify the assigned responder.
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

export async function publishAssignmentCreated(data) {
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
