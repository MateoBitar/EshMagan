// src/events/publishers/nats.publisher.js
//
// The real natsPublisher object injected into FireService via context.js.
// Replaces the stub { publish: async () => null } used during development.
//
// FireService calls:
//   natsPublisher.publish('fireDetected', data)
//   natsPublisher.publish('fireExtinguished', data)
//
// This maps those calls to the correct typed publisher functions.
import { publishFireDetected }      from './fireDetected.publisher.js';
import { publishAssignmentCreated } from './fireAssignment.publisher.js';
import { publishAlertCreated }      from './alertCreated.publisher.js';
import { publishEvacuationUpdated } from './evacuationUpdated.publisher.js';
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

export const natsPublisher = {
    publish: async (event, data) => {
        switch (event) {
            case 'fireDetected':
                return await publishFireDetected(data);

            case 'fireExtinguished':
                return await publishFireExtinguished(data);

            case 'assignmentCreated':
                return await publishAssignmentCreated(data);

            case 'alertCreated':
                return await publishAlertCreated(data);

            case 'evacuationUpdated':
                return await publishEvacuationUpdated(data);

            default:
                console.warn(`[NATS] Unknown event: ${event}`);
        }
    }
};

// FIRE EXTINGUISHED
// Inline since it's simple and only used from natsPublisher
async function publishFireExtinguished(data) {
    try {
        const js = getJetStream();
        const payload = sc.encode(JSON.stringify({
            fire_id:   data.fire_id,
            timestamp: new Date().toISOString(),
        }));
        await js.publish(SUBJECTS.FIRE_EXTINGUISHED, payload);
        console.log(`[NATS] Published fire.extinguished for fire_id: ${data.fire_id}`);
    } catch (err) {
        console.error(`[NATS] Failed to publish fire.extinguished: ${err.message}`);
        throw err;
    }
}
