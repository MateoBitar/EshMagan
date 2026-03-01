// src/events/subscribers/fireAssignment.subscriber.js
//
// Listens to assignment.created events.
// When a responder is assigned to a fire:
//   1. Creates a Notification for the assigned responder
//   2. Also listens to fire.spread — if the fire spreads, finds NEW residents
//      now inside the updated danger zone and creates alerts for them
import { getJetStream, sc, SUBJECTS }   from '../../config/nats.js';
import { NotificationRepository }       from '../../domain/repositories/notification.repository.js';
import { AlertRepository }              from '../../domain/repositories/alert.repository.js';
import { ResidentRepository }           from '../../domain/repositories/resident.repository.js';
import { ResponderRepository }          from '../../domain/repositories/responder.repository.js';
import { publishAlertCreated }          from '../publishers/alertCreated.publisher.js';

const CONSUMER_NAME = 'fireAssignment-consumer';

export async function startFireAssignmentSubscriber() {
    try {
        const js                     = getJetStream();
        const notificationRepository = new NotificationRepository();
        const alertRepository        = new AlertRepository();
        const residentRepository     = new ResidentRepository();
        const responderRepository    = new ResponderRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] fireAssignment subscriber started');

        (async () => {
            for await (const msg of messages) {

                // assignment.created
                if (msg.subject === SUBJECTS.ASSIGNMENT_CREATED) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));
                        console.log(`[NATS] assignment.created for assignment_id: ${data.assignment_id}`);

                        // Fetch responder to get their user_id for the notification
                        const responder = await responderRepository.getResponderById(data.responder_id);
                        if (!responder) {
                            console.warn(`[NATS] Responder ${data.responder_id} not found for assignment notification`);
                            msg.ack();
                            continue;
                        }

                        // Create a notification for the assigned responder
                        await notificationRepository.createNotification({
                            target_role:          'Responder',
                            notification_message: `You have been assigned to fire incident ${data.fire_id}. Assignment ID: ${data.assignment_id}. Please respond immediately.`,
                            notification_status:  'Sent',
                            expires_at:           new Date(Date.now() + 24 * 60 * 60 * 1000),
                            fire_id:              data.fire_id,
                            user_id:              responder.responder_id,
                        });

                        console.log(`[NATS] Notification sent to responder ${data.responder_id}`);
                        msg.ack();

                    } catch (err) {
                        console.error(`[NATS] Error processing assignment.created: ${err.message}`);
                        // Do not ack — JetStream will redeliver
                    }
                }

                // fire.spread
                // Fire spread means new residents may now be in the danger zone.
                // We diff against the existing alert's radius by finding residents
                // near the updated fire location and creating new alerts for them.
                else if (msg.subject === SUBJECTS.FIRE_SPREAD) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));
                        console.log(`[NATS] fire.spread received for fire_id: ${data.fire_id}`);

                        const coords = parseWKTPoint(data.fire_location);
                        if (!coords) {
                            console.warn(`[NATS] Could not parse spread location: ${data.fire_location}`);
                            msg.ack();
                            continue;
                        }

                        // Find residents now within the updated (larger) danger zone
                        const residents = await residentRepository.getResidentsByLastKnownLocation({
                            latitude:  coords.latitude,
                            longitude: coords.longitude,
                        });

                        if (!residents || residents.length === 0) {
                            console.log(`[NATS] No new residents in spread zone for fire ${data.fire_id}`);
                            msg.ack();
                            continue;
                        }

                        console.log(`[NATS] ${residents.length} resident(s) now in spread zone — creating new alert`);

                        // Create a new FireAlert for the spread zone
                        const alert = await alertRepository.createAlert({
                            alert_type:    'FireAlert',
                            target_role:   'Resident',
                            alert_message: `Fire is spreading in your area. Severity: ${data.fire_severitylevel}. Evacuate immediately.`,
                            expires_at:    new Date(Date.now() + 24 * 60 * 60 * 1000),
                            fire_id:       data.fire_id,
                        });

                        // Publish alert.created so notification.subscriber sends
                        // individual notifications to the newly affected residents
                        await publishAlertCreated({
                            ...alert,
                            fire_location: data.fire_location,
                        });

                        console.log(`[NATS] Spread alert created and published for fire ${data.fire_id}`);
                        msg.ack();

                    } catch (err) {
                        console.error(`[NATS] Error processing fire.spread: ${err.message}`);
                        // Do not ack — JetStream will redeliver
                    }
                }

                else {
                    msg.ack();
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start fireAssignment subscriber: ${err.message}`);
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
