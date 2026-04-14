// src/events/subscribers/alert.subscriber.js
//
// Responsible for creating ALERTS only.
// Listens to: alert.created
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository } from '../../domain/repositories/alert.repository.js';
import { sendPushToTokens } from '../../services/push.service.js';
import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';

function getDistanceMeters(lat1, lng1, lat2, lng2) {
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371000;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

                        // 🔥 get fire location
                        const fire = await fireRepository.getFireById(data.fire_id);

                        if (!fire) {
                            console.log('No fire found → skip push');
                            msg.ack();
                            return;
                        }

                        const fireGeo = typeof fire.fire_location === 'string'
                            ? JSON.parse(fire.fire_location)
                            : fire.fire_location;

                        const fireCoords = fireGeo?.coordinates
                            ? { lat: fireGeo.coordinates[1], lng: fireGeo.coordinates[0] }
                            : null;

                        if (!fireCoords) {
                            console.log('No fire coords → skip push');
                            msg.ack();
                            return;
                        }

                        // 🎯 same radius logic as frontend
                        const RADIUS_BY_ROLE = {
                            Resident: 10000,
                            Responder: 25000,
                            Municipality: 10000,
                        };

                        const radius = RADIUS_BY_ROLE[data.target_role] || 10000;

                        // 🔥 filter users
                        const validUsers = users.filter(u => {
                            if (!u.last_known_location) return false;

                            const { latitude, longitude } = u.last_known_location;

                            if (!latitude || !longitude) return false;

                            const distance = getDistanceMeters(
                                latitude,
                                longitude,
                                fireCoords.lat,
                                fireCoords.lng
                            );

                            return distance <= radius;
                        });

                        const tokens = validUsers
                            .map(u => u.fcm_token)
                            .filter(Boolean);

                        if (tokens.length > 0) {
                            await sendPushToTokens(tokens, {
                                title: '🔥 Fire Alert',
                                body: data.alert_message || 'Fire detected near you',
                                data: {
                                    fire_id: data.fire_id,
                                    type: 'FireAlert',
                                },
                            });

                            console.log(`✅ Push sent to ${tokens.length} nearby users`);
                        } else {
                            console.log('⚠️ No nearby users to notify');
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
