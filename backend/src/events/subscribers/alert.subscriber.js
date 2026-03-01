// src/events/subscribers/alert.subscriber.js
//
// Responsible for creating ALERTS only.
//
// Listens to two subjects:
//
//   alert.created      → a fire was confirmed and created in the DB
//                        → creates one FireAlert per role (Resident, Responder, Municipality)
//                           each role gets their own alert for the same fire_id
//                           client filters by GPS proximity to fire_id
//
//   evacuation.updated → evacuation route status/priority changed
//                        → creates one EvacuationAlert per role
//                           client filters by GPS proximity to fire_id
//
// Alerts have no user_id — they are broadcasts by target_role.
// Proximity filtering is handled on the client side using the fire_id.
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository }            from '../../domain/repositories/alert.repository.js';

const CONSUMER_NAME = 'alert-consumer';
const TARGET_ROLES  = ['Resident', 'Responder', 'Municipality'];

export async function startAlertSubscriber() {
    try {
        const js              = getJetStream();
        const alertRepository = new AlertRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] alert subscriber started');

        (async () => {
            for await (const msg of messages) {

                // alert.created
                // Fire confirmed — create one FireAlert per role
                if (msg.subject === SUBJECTS.ALERT_CREATED) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));
                        console.log(`[NATS] alert.created received for fire_id: ${data.fire_id}`);

                        for (const role of TARGET_ROLES) {
                            try {
                                await alertRepository.createAlert({
                                    alert_type:    'FireAlert',
                                    target_role:   role,
                                    alert_message: `Fire detected. Severity: ${data.fire_severitylevel}. All ${role}s in the area should take immediate action.`,
                                    expires_at:    new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                                    fire_id:       data.fire_id,
                                });
                            } catch (roleErr) {
                                console.warn(`[NATS] Failed to create FireAlert for role ${role}: ${roleErr.message}`);
                            }
                        }

                        console.log(`[NATS] FireAlerts created for all roles — fire_id: ${data.fire_id}`);
                        msg.ack();

                    } catch (err) {
                        console.error(`[NATS] Error processing alert.created: ${err.message}`);
                        // Do not ack — JetStream will redeliver
                    }
                }

                // evacuation.updated
                // Evacuation route changed — create one EvacuationAlert per role
                else if (msg.subject === SUBJECTS.EVACUATION_UPDATED) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));
                        console.log(`[NATS] evacuation.updated received for route_id: ${data.route_id}`);

                        for (const role of TARGET_ROLES) {
                            try {
                                await alertRepository.createAlert({
                                    alert_type:    'EvacuationAlert',
                                    target_role:   role,
                                    alert_message: `Evacuation route update: Route ${data.route_id} is now ${data.route_status} (Priority: ${data.route_priority}). All ${role}s in the area should check the latest evacuation instructions immediately.`,
                                    expires_at:    new Date(Date.now() + 24 * 60 * 60 * 1000),
                                    fire_id:       data.fire_id,
                                });
                            } catch (roleErr) {
                                console.warn(`[NATS] Failed to create EvacuationAlert for role ${role}: ${roleErr.message}`);
                            }
                        }

                        console.log(`[NATS] EvacuationAlerts created for all roles — fire_id: ${data.fire_id}`);
                        msg.ack();

                    } catch (err) {
                        console.error(`[NATS] Error processing evacuation.updated: ${err.message}`);
                        // Do not ack — JetStream will redeliver
                    }
                }

                else {
                    msg.ack();
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start alert subscriber: ${err.message}`);
        throw err;
    }
}
