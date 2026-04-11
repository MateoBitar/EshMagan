// src/events/subscribers/alert.subscriber.js
//
// Responsible for creating ALERTS only.
// Listens to: alert.created
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository } from '../../domain/repositories/alert.repository.js';
import { sendPushToTokens } from '../../services/push.service.js';
import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';

const CONSUMER_NAME = 'alert-consumer';

export async function startAlertSubscriber() {
    try {
        const js = getJetStream();
        const alertRepository = new AlertRepository();
        const userRepository = new UserRepository();
        const userService = new UserService(userRepository);

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

                    // 🔥 SEND PUSH NOTIFICATIONS
                    try {
                        console.log(`[NATS] Fetching users with role: ${data.target_role} for push notifications`);
                        const users = await userService.getUsersWithFcmByRole(data.target_role);

                        const tokens = users
                            .map(u => u.fcm_token)
                            .filter(Boolean);

                        if (tokens.length > 0) {
                            await sendPushToTokens(tokens, {
                                title: '🔥 Fire Alert',
                                body: data.alert_message || 'A fire has been detected near your location.',
                                data: {
                                    type: 'FireAlert',
                                    fire_id: data.fire_id,
                                    target_role: data.target_role,
                                },
                            });

                            console.log(`✅ Push sent to ${tokens.length} users (${data.target_role})`);
                        } else {
                            console.log('⚠️ No FCM tokens found for role:', data.target_role);
                        }
                    } catch (pushErr) {
                        console.error('❌ Push error:', pushErr.message);
                    }
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
