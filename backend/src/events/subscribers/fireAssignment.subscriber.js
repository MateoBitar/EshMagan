// src/events/subscribers/fireAssignment.subscriber.js
//
// Handles:
// 1. assignment.created → notify assigned Responder ONLY
// 2. fire.spread → create alert for Resident, Responder, Municipality
//
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

import { NotificationRepository } from '../../domain/repositories/notification.repository.js';
import { ResponderRepository } from '../../domain/repositories/responder.repository.js';
import { AlertRepository }    from '../../domain/repositories/alert.repository.js';
import { ResidentRepository } from '../../domain/repositories/resident.repository.js';

const CONSUMER_NAME = 'fireAssignment-consumer';

export async function startFireAssignmentSubscriber() {
    try {
        const js = getJetStream();

        const notificationRepository = new NotificationRepository();
        const alertRepository = new AlertRepository();
        const residentRepository = new ResidentRepository();
        const responderRepository = new ResponderRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] fireAssignment subscriber started');

        for await (const msg of messages) {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                
                if (msg.subject === SUBJECTS.ASSIGNMENT_CREATED) {
                    console.log(`[NATS] assignment.created received: ${data.assignment_id}`);

                    const responder = await responderRepository.getResponderById(data.responder_id);
                    if (!responder) {
                        console.warn(`[NATS] responder not found: ${data.responder_id}`);
                        msg.ack();
                        continue;
                    }

                    await notificationRepository.createNotification({
                        target_role: 'Responder',
                        notification_message:
                            `You have been assigned to fire incident ${data.fire_id}. Respond immediately.`,
                        notification_status: 'Sent',
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        fire_id: data.fire_id,
                        user_id: responder.responder_id

                    });

                    console.log(`[NATS] responder notified: ${responder.responder_id}`);
                    msg.ack();
                    continue;
                }

                if (msg.subject === SUBJECTS.FIRE_SPREAD) {
                    console.log(`[NATS] fire.spread received: fire_id=${data.fire_id}`);

                    const coords = parseWKTPoint(data.fire_location);
                    if (!coords) {
                        console.warn('[NATS] invalid fire location');
                        msg.ack();
                        continue;
                    }

                    const residents =
                        await residentRepository.getResidentsByLastKnownLocation({
                            latitude: coords.latitude,
                            longitude: coords.longitude
                        });

                    if (!residents.length) {
                        console.log('[NATS] no residents in spread zone');
                        msg.ack();
                        continue;
                    }

                    const roles = ['Resident', 'Responder', 'Municipality'];

                    for (const role of roles) {
                        const createdAlert =
                            await alertRepository.createAlert({
                                alert_type: 'FireAlert',
                                target_role: role,
                                alert_message:
                                    `Fire spreading nearby. Severity: ${data.fire_severitylevel}. Evacuate immediately.`,
                                fire_id: data.fire_id,
                                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
                            });
                        console.log(`[NATS] alert created for role: ${role}`);
                    }
                    msg.ack();
                    continue;
                }
                msg.ack();
            }
            catch (err) {
                console.error('[NATS] fireAssignment processing error:', err.message);
                // no ack → JetStream retry
            }
        }
    }
    catch (err) {
        console.error('[NATS] fireAssignment subscriber startup failed:', err.message);
        throw err;
    }
}
