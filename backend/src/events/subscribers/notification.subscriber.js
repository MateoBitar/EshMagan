// src/events/subscribers/notification.subscriber.js
//
// Responsible for creating NOTIFICATIONS only.
//
// Listens to one subject:
//
//   fire.risk.predicted  → FireLab predicts high fire risk in next 6 days
//                          → Residents near the danger zone    → individual Notification
//                          → Responders near the danger zone   → individual Notification
//                          → All municipalities in the DB      → individual Notification
//                            (municipalities are government bodies — all are informed
//                             and filter by fire_id on the client side)
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { NotificationRepository }     from '../../domain/repositories/notification.repository.js';
import { ResidentRepository }         from '../../domain/repositories/resident.repository.js';
import { ResponderRepository }        from '../../domain/repositories/responder.repository.js';
import { MunicipalityRepository }     from '../../domain/repositories/municipality.repository.js';

const CONSUMER_NAME = 'notification-consumer';

export async function startNotificationSubscriber() {
    try {
        const js                     = getJetStream();
        const notificationRepository = new NotificationRepository();
        const residentRepository     = new ResidentRepository();
        const responderRepository    = new ResponderRepository();
        const municipalityRepository = new MunicipalityRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] notification subscriber started');

        (async () => {
            for await (const msg of messages) {

                if (msg.subject === SUBJECTS.FIRE_RISK_PREDICTED) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));
                        console.log(`[NATS] fire.risk.predicted received for zone: ${data.zone_location}`);

                        const coords = parseWKTPoint(data.zone_location);
                        if (!coords) {
                            console.warn(`[NATS] Could not parse zone location: ${data.zone_location}`);
                            msg.ack();
                            continue;
                        }

                        const locationQuery = { latitude: coords.latitude, longitude: coords.longitude };
                        const message    = `High fire risk predicted in your area within the next 6 days. Risk level: ${data.risk_level}. Please prepare and follow safety guidelines.`;
                        const expires_at = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); // 6 days
                        const fire_id    = data.fire_id ?? null;
                        let   total      = 0;

                        // Residents near danger zone
                        const residents = await residentRepository.getResidentsByLastKnownLocation(locationQuery);
                        for (const resident of residents ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role:          'Resident',
                                    notification_message: message,
                                    notification_status:  'Sent',
                                    expires_at,
                                    fire_id,
                                    user_id: resident.resident_id,
                                });
                                total++;
                            } catch (e) {
                                console.warn(`[NATS] Failed notification for resident ${resident.resident_id}: ${e.message}`);
                            }
                        }

                        // Responders near danger zone
                        const responders = await responderRepository.getRespondersByLastKnownLocation(locationQuery);
                        for (const responder of responders ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role:          'Responder',
                                    notification_message: message,
                                    notification_status:  'Sent',
                                    expires_at,
                                    fire_id,
                                    user_id: responder.responder_id,
                                });
                                total++;
                            } catch (e) {
                                console.warn(`[NATS] Failed notification for responder ${responder.responder_id}: ${e.message}`);
                            }
                        }

                        // All municipalities in DB
                        // Municipalities are government bodies — all are informed.
                        // Client filters by fire_id to determine regional relevance.
                        const municipalities = await municipalityRepository.getAllMunicipalities();
                        for (const municipality of municipalities ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role:          'Municipality',
                                    notification_message: message,
                                    notification_status:  'Sent',
                                    expires_at,
                                    fire_id,
                                    user_id: municipality.municipality_id,
                                });
                                total++;
                            } catch (e) {
                                console.warn(`[NATS] Failed notification for municipality ${municipality.municipality_id}: ${e.message}`);
                            }
                        }

                        console.log(`[NATS] Prediction notifications created for ${total} user(s) across all roles`);
                        msg.ack();

                    } catch (err) {
                        console.error(`[NATS] Error processing fire.risk.predicted: ${err.message}`);
                        // Do not ack — JetStream will redeliver
                    }
                }

                else {
                    msg.ack();
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start notification subscriber: ${err.message}`);
        throw err;
    }
}

// HELPERS
function parseWKTPoint(wkt) {
    const match = wkt?.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
    if (!match) return null;
    return {
        longitude: parseFloat(match[1]),
        latitude:  parseFloat(match[2]),
    };
}
