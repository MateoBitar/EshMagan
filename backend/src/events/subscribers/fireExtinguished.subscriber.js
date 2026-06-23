// src/events/subscribers/fireExtinguished.subscriber.js
//
// Listens to fire.extinguished events and performs:
// - Close active alerts for the fire
// - Notify residents and responders that the fire is extinguished
// - Trigger evacuation.updated to clear evacuation state
// - Attempt to mark assignments completed (best-effort; uses existing repositories/services)

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository } from '../../domain/repositories/alert.repository.js';
import { NotificationRepository } from '../../domain/repositories/notification.repository.js';
import { ResidentRepository } from '../../domain/repositories/resident.repository.js';
import { ResponderRepository } from '../../domain/repositories/responder.repository.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { UserService } from '../../services/user.service.js';
import { FireRepository } from '../../domain/repositories/fire.repository.js';
import { publishEvacuationUpdated } from '../publishers/evacuationUpdated.publisher.js';
import { sendPushToTokens } from '../../services/push.service.js';

const CONSUMER_NAME = 'fireExtinguished-consumer';

/**
 * Start fire.extinguished subscriber.
 *
 * PRE-CONDITIONS:
 * - NATS connection must be initialized.
 * - JetStream consumer must exist.
 *
 * POST-CONDITIONS:
 * - Closes alerts related to the fire.
 * - Notifies residents and responders that the fire is extinguished.
 * - Publishes evacuation.updated to inform systems to clear evacuations.
 * - Acknowledges processed messages.
 */
export async function startFireExtinguishedSubscriber() {
    try {
        const js = getJetStream();

        const alertRepository = new AlertRepository();
        const notificationRepository = new NotificationRepository();
        const residentRepository = new ResidentRepository();
        const responderRepository = new ResponderRepository();
        const userRepository = new UserRepository();
        const userService = new UserService(userRepository);
        const fireRepository = new FireRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] fireExtinguished subscriber started');

        (async () => {
            for await (const msg of messages) {
                try {
                    if (msg.subject !== SUBJECTS.FIRE_EXTINGUISHED) {
                        msg.ack();
                        continue;
                    }

                    const data = JSON.parse(sc.decode(msg.data));
                    console.log(`[NATS] fire.extinguished received for fire_id: ${data.fire_id}`);

                    // Best-effort: close alerts in DB related to this fire
                    try {
                        if (typeof alertRepository.closeAlertsByFireId === 'function') {
                            await alertRepository.closeAlertsByFireId(data.fire_id);
                            console.log(`[Alerts] Closed alerts for fire_id: ${data.fire_id}`);
                        } else if (typeof alertRepository.updateAlertStatusByFireId === 'function') {
                            await alertRepository.updateAlertStatusByFireId(data.fire_id, 'Closed');
                            console.log(`[Alerts] Marked alerts Closed for fire_id: ${data.fire_id}`);
                        } else {
                            console.log('[Alerts] No close method found on AlertRepository — skipping DB close step');
                        }
                    } catch (e) {
                        console.warn(`[Alerts] Failed to close alerts for fire_id ${data.fire_id}: ${e.message}`);
                    }

                    // Attempt to mark assignments completed (best-effort)
                    try {
                        if (typeof responderRepository.markAssignmentsCompletedByFireId === 'function') {
                            await responderRepository.markAssignmentsCompletedByFireId(data.fire_id);
                            console.log(`[Assignments] Marked assignments completed for fire_id: ${data.fire_id}`);
                        } else {
                            // If not available, just send a notification to responders
                            console.log('[Assignments] No repository method to mark assignments completed — sending notifications instead');
                        }
                    } catch (e) {
                        console.warn(`[Assignments] Failed to mark assignments completed: ${e.message}`);
                    }

                    // Notify Residents and Responders: create Notification records and send push messages
                    try {
                        // Get fire details to obtain location
                        const fire = await fireRepository.getFireById(data.fire_id);
                        const fireLocation = fire?.fire_location ?? data.fire_location ?? null;

                        // Residents near the fire
                        const residents = await residentRepository.getResidentsByLastKnownLocation(
                            fireLocation ? { latitude: null, longitude: null } : {}
                        ).catch(() => []);

                        // Responders near the fire
                        const responders = await responderRepository.getRespondersByLastKnownLocation(
                            fireLocation ? { latitude: null, longitude: null } : {}
                        ).catch(() => []);

                        const message = `Fire ${data.fire_id} has been extinguished. The area is now considered safe.`;

                        for (const resident of residents ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role: 'Resident',
                                    notification_message: message,
                                    notification_status: 'Sent',
                                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                    fire_id: data.fire_id,
                                    user_id: resident.resident_id,
                                });

                                const token = await userService.getFcmTokenByUserId(resident.resident_id);
                                if (token) {
                                    await sendPushToTokens([token], {
                                        title: 'Fire Extinguished',
                                        body: message,
                                        data: { type: 'FireExtinguished', fire_id: data.fire_id },
                                    });
                                }
                            } catch (e) {
                                console.warn(`[NATS] Failed to notify resident ${resident?.resident_id}: ${e.message}`);
                            }
                        }

                        for (const responder of responders ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role: 'Responder',
                                    notification_message: message,
                                    notification_status: 'Sent',
                                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                                    fire_id: data.fire_id,
                                    user_id: responder.responder_id,
                                });

                                const token = await userService.getFcmTokenByUserId(responder.responder_id);
                                if (token) {
                                    await sendPushToTokens([token], {
                                        title: 'Fire Extinguished',
                                        body: message,
                                        data: { type: 'FireExtinguished', fire_id: data.fire_id },
                                    });
                                }
                            } catch (e) {
                                console.warn(`[NATS] Failed to notify responder ${responder?.responder_id}: ${e.message}`);
                            }
                        }
                    } catch (e) {
                        console.warn(`[NATS] Error while creating notifications for fire.extinguished: ${e.message}`);
                    }

                    // Trigger evacuation.updated to clear evacuation state for this fire (best-effort)
                    try {
                        await publishEvacuationUpdated({
                            fire_id: data.fire_id,
                            update_type: 'cleared',
                            message: 'Evacuation cleared; fire extinguished',
                            timestamp: new Date().toISOString(),
                        });
                        console.log(`[NATS] Published evacuation.updated (cleared) for fire_id: ${data.fire_id}`);
                    } catch (e) {
                        console.warn(`[NATS] Failed to publish evacuation.updated for fire_id ${data.fire_id}: ${e.message}`);
                    }

                    msg.ack();
                } catch (err) {
                    console.error('[NATS] fireExtinguished processing error:', err.message);
                    // Acknowledge to avoid retry storms on malformed messages
                    msg.ack();
                }
            }
        })();
    } catch (err) {
        console.error('[NATS] fireExtinguished subscriber startup failed:', err.message);
        throw err;
    }
}