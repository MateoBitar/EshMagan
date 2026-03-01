// src/events/publishers/alertCreated.publisher.js
//
// Published after an alert is created for a fire event.
// Triggers: notification.subscriber to create individual notifications
// for all residents targeted by the alert.
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

export async function publishAlertCreated(data) {
    try {
        const js = getJetStream();

        const payload = sc.encode(JSON.stringify({
            alert_type:    data.alert_type,
            target_role:   data.target_role,
            alert_message: data.alert_message,
            fire_id:       data.fire_id,
            expires_at:    data.expires_at,
            timestamp:     new Date().toISOString(),
        }));

        await js.publish(SUBJECTS.ALERT_CREATED, payload);
        console.log(`[NATS] Published alert.created for alert_id: ${data.alert_id}`);
    } catch (err) {
        console.error(`[NATS] Failed to publish alert.created: ${err.message}`);
        throw err;
    }
}
