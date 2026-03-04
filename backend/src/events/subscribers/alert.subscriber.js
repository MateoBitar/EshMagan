// src/events/subscribers/alert.subscriber.js
//
// Responsible for creating ALERTS only.
// Listens to: alert.created
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository } from '../../domain/repositories/alert.repository.js';

const CONSUMER_NAME = 'alert-consumer';

export async function startAlertSubscriber() {
    try {
        const js = getJetStream();
        const alertRepository = new AlertRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] alert subscriber started');

        (async () => {
            for await (const msg of messages) {
                try {
                    if (msg.subject !== SUBJECTS.ALERT_CREATED) {
                        msg.ack();
                        continue;
                    }

                    const data = JSON.parse(sc.decode(msg.data));
                    console.log(`[NATS] alert.created received for fire_id: ${data.fire_id}`);

                    await alertRepository.createAlert({
                        alert_type: data.alert_type,
                        target_role: data.target_role,
                        alert_message: data.alert_message,
                        expires_at: new Date(
                            data.expires_at ?? Date.now() + 24 * 60 * 60 * 1000
                        ),
                        fire_id: data.fire_id,
                    });
                    msg.ack();

                } catch (err) {
                    console.error(`[NATS] Error processing alert.created: ${err.message}`);
                    // no ack → JetStream retry
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start alert subscriber: ${err.message}`);
        throw err;
    }
}
