// src/events/subscribers/fireDetected.subscriber.js
//
// Listens to fire.detected events.
// When a fire is confirmed by infrared and created in the DB:
//   1. Parses the fire location
//   2. Publishes alert.created → alert.subscriber handles creating Alerts for all roles
//
// NO DB writes here — alert.subscriber is solely responsible for creating Alerts.
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { publishAlertCreated }        from '../publishers/alertCreated.publisher.js';

const CONSUMER_NAME = 'fireDetected-consumer';

export async function startFireDetectedSubscriber() {
    try {
        const js = getJetStream();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] fireDetected subscriber started');

        (async () => {
            for await (const msg of messages) {
                if (msg.subject !== SUBJECTS.FIRE_DETECTED) {
                    msg.ack();
                    continue;
                }

                try {
                    const data = JSON.parse(sc.decode(msg.data));
                    console.log(`[NATS] fire.detected received for fire_id: ${data.fire_id}`);

                    // Publish alert.created — alert.subscriber will create
                    // one FireAlert per role (Resident, Responder, Municipality)
                    await publishAlertCreated({
                        fire_id:            data.fire_id,
                        fire_location:      data.fire_location,
                        fire_severitylevel: data.fire_severitylevel,
                        alert_type:         'FireAlert',
                        alert_message:      `Fire detected. Severity: ${data.fire_severitylevel}. All roles in the area should take immediate action.`,
                        expires_at:         new Date(Date.now() + 24 * 60 * 60 * 1000),
                    });

                    console.log(`[NATS] alert.created published for fire_id: ${data.fire_id}`);
                    msg.ack();

                } catch (err) {
                    console.error(`[NATS] Error processing fire.detected: ${err.message}`);
                    // Do not ack — JetStream will redeliver
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start fireDetected subscriber: ${err.message}`);
        throw err;
    }
}
