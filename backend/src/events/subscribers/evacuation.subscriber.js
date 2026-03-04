// src/events/subscribers/evacuation.subscriber.js
//
// Responsible for converting evacuation.updated → alert.created
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { publishAlertCreated } from '../publishers/alertCreated.publisher.js';

const CONSUMER_NAME = 'evacuation-consumer';

export async function startEvacuationSubscriber() {
    try {
        const js = getJetStream();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] evacuation subscriber started');

        (async () => {
            for await (const msg of messages) {
                try {
                    if (msg.subject !== SUBJECTS.EVACUATION_UPDATED) {
                        msg.ack();
                        continue;
                    }

                    const data = JSON.parse(sc.decode(msg.data));

                    console.log(`[NATS] evacuation.updated received for route_id: ${data.route_id}`);

                    const roles = ['Resident', 'Responder', 'Municipality'];
                    for (const role of roles) {
                        await publishAlertCreated({
                            fire_id: data.fire_id,
                            alert_type: 'EvacuationAlert',
                            target_role: role,
                            alert_message:
                                `Evacuation route update: Route ${data.route_id} is now ${data.route_status} (Priority: ${data.route_priority}).`,
                            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        });
                    }
                    msg.ack();

                } catch (err) {
                    console.error(`[NATS] Error processing evacuation.updated: ${err.message}`);
                    // no ack → JetStream retry
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start evacuation subscriber: ${err.message}`);
        throw err;
    }
}
