// src/events/subscribers/fireAssignment.subscriber.js
//
// Handles:
// 1. assignment.created → notify assigned Responder ONLY
// 2. fire.spread → create alert for Resident, Responder, Municipality
//
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { NotificationRepository } from '../../domain/repositories/notification.repository.js';
import { ResponderRepository } from '../../domain/repositories/responder.repository.js';
import { publishAlertCreated } from '../publishers/alertCreated.publisher.js';

const CONSUMER_NAME = 'fireAssignment-consumer';

export async function startFireAssignmentSubscriber() {
    try {
        const js = getJetStream();

        const notificationRepository = new NotificationRepository();
        const responderRepository = new ResponderRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] fireAssignment subscriber started');

        for await (const msg of messages) {
            try {
                const data = JSON.parse(sc.decode(msg.data));

                // assignment.created
                if (msg.subject === SUBJECTS.ASSIGNMENT_CREATED) {
                    const responder = await responderRepository.getResponderById(data.responder_id);
                    if (!responder) {
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
                    msg.ack();
                    continue;
                }

                // fire.spread
                if (msg.subject === SUBJECTS.FIRE_SPREAD) {

                    const roles = ['Resident', 'Responder', 'Municipality'];

                    for (const role of roles) {
                        await publishAlertCreated({
                            fire_id: data.fire_id,
                            fire_location: data.fire_location,
                            fire_severitylevel: data.fire_severitylevel,
                            alert_type: 'FireAlert',
                            target_role: role,
                            alert_message:
                                `Fire has spread. Severity: ${data.fire_severitylevel}. All ${role}s in the area should take immediate action.`,
                            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        });
                    }
                    msg.ack();
                    continue;
                }
                msg.ack();

            } catch (err) {
                console.error('[NATS] fireAssignment processing error:', err.message);
                // no ack → JetStream retry
            }
        }
    } catch (err) {
        console.error('[NATS] fireAssignment subscriber startup failed:', err.message);
        throw err;
    }
}
