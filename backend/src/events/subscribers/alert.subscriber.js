// src/events/subscribers/alert.subscriber.js
//
// Responsible for creating ALERTS only.
// Listens to: alert.created
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository } from '../../domain/repositories/alert.repository.js';
import { sendPushToTokens } from '../../services/push.service.js';
import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { FireRepository } from '../../domain/repositories/fire.repository.js';

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

function isValidCoordPair(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng);
}

function getUserAnchorForPush(user, targetRole) {
    if (!user) return null;

    if (targetRole === 'Municipality') {
        return parsePoint(
            user.municipality_location ??
            user.location ??
            user.last_known_location
        );
    }

    if (targetRole === 'Resident' || targetRole === 'Responder') {
        const lat = Number(user?.last_known_location?.latitude);
        const lng = Number(user?.last_known_location?.longitude);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }

        return parsePoint(user?.last_known_location);
    }

    return parsePoint(user?.last_known_location);
}

function parsePoint(value) {
    if (!value) return null;

    if (typeof value === 'object') {
        const lat = Number(
            value.latitude ?? value.lat ?? value.y ?? value?.coordinates?.[1]
        );
        const lng = Number(
            value.longitude ?? value.lng ?? value.lon ?? value.x ?? value?.coordinates?.[0]
        );

        if (isValidCoordPair(lat, lng)) return { lat, lng };

        if (value?.type === 'Point' && Array.isArray(value.coordinates) && value.coordinates.length === 2) {
            const geoLat = Number(value.coordinates[1]);
            const geoLng = Number(value.coordinates[0]);
            if (isValidCoordPair(geoLat, geoLng)) return { lat: geoLat, lng: geoLng };
        }
    }

    try {
        const geo = typeof value === 'string' ? JSON.parse(value) : value;
        if (geo?.type === 'Point' && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
            const lat = Number(geo.coordinates[1]);
            const lng = Number(geo.coordinates[0]);
            if (isValidCoordPair(lat, lng)) return { lat, lng };
        }
    } catch { }

    const match = String(value).match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (match) {
        const lng = Number(match[1]);
        const lat = Number(match[2]);
        if (isValidCoordPair(lat, lng)) return { lat, lng };
    }

    return null;
}

const CONSUMER_NAME = 'alert-consumer';

export async function startAlertSubscriber() {
    try {
        const js = getJetStream();
        const alertRepository = new AlertRepository();
        const userRepository = new UserRepository();
        const userService = new UserService(userRepository);
        const fireRepository = new FireRepository();

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

                        const fireCoords = parsePoint(fire.fire_location);

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
                            const anchor = getUserAnchorForPush(u, data.target_role);
                            if (!anchor) return false;

                            const distance = getDistanceMeters(
                                anchor.lat,
                                anchor.lng,
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
