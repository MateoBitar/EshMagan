// src/events/publishers/evacuationUpdated.publisher.js
//
// Published when an evacuation route status or priority is updated.
// Triggers: notification.subscriber to notify affected residents of route changes.
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

export async function publishEvacuationUpdated(data) {
    try {
        const js = getJetStream();

        const payload = sc.encode(JSON.stringify({
            route_id:       data.route_id,
            route_status:   data.route_status,
            route_priority: data.route_priority,
            fire_id:        data.fire_id,
            timestamp:      new Date().toISOString(),
        }));

        await js.publish(SUBJECTS.EVACUATION_UPDATED, payload);
        console.log(`[NATS] Published evacuation.updated for route_id: ${data.route_id}`);
    } catch (err) {
        console.error(`[NATS] Failed to publish evacuation.updated: ${err.message}`);
        throw err;
    }
}
