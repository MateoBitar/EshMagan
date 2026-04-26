// src/events/subscribers/alert.subscriber.js
//
// This subscriber listens for "alert.created" events from NATS JetStream.

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository } from '../../domain/repositories/alert.repository.js';
import { sendPushToTokens } from '../../services/push.service.js';
import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';
import { FireRepository } from '../../domain/repositories/fire.repository.js';

const CONSUMER_NAME = 'alert-consumer';

/**
 * This file defines the alert subscriber responsible for consuming
 * "alert.created" events from NATS JetStream. It stores alerts in the database
 * and triggers push notifications to users within a geographic radius of the fire.
 */

/* -------------------- GEO HELPERS -------------------- */

/**
 * Calculate distance between two coordinates.
 *
 * PRE-CONDITIONS:
 * - lat/lng values must be valid numbers.
 *
 * POST-CONDITIONS:
 * - Returns distance in meters.
 */
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

/**
 * Validate coordinate pair.
 *
 * PRE-CONDITIONS:
 * - lat and lng must be provided.
 *
 * POST-CONDITIONS:
 * - Returns true if valid, false otherwise.
 */
function isValidCoordPair(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng);
}

/**
 * Parse location value into coordinates.
 *
 * PRE-CONDITIONS:
 * - value may be object, JSON string, or WKT string.
 *
 * POST-CONDITIONS:
 * - Returns { lat, lng } if valid.
 * - Returns null if parsing fails.
 */
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

        if (value?.type === 'Point' && Array.isArray(value.coordinates)) {
            const geoLat = Number(value.coordinates[1]);
            const geoLng = Number(value.coordinates[0]);
            if (isValidCoordPair(geoLat, geoLng)) return { lat: geoLat, lng: geoLng };
        }
    }

    try {
        const geo = typeof value === 'string' ? JSON.parse(value) : value;
        if (geo?.type === 'Point' && Array.isArray(geo.coordinates)) {
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

/**
 * Get user's anchor location for push notifications.
 *
 * PRE-CONDITIONS:
 * - user must be provided.
 *
 * POST-CONDITIONS:
 * - Returns parsed coordinates depending on role.
 * - Returns null if no valid location.
 */
function getUserAnchorForPush(user, targetRole) {
    if (!user) return null;

    if (targetRole === 'Municipality') {
        return parsePoint(
            user.municipality_location ??
            user.location ??
            user.last_known_location
        );
    }

    return parsePoint(user.last_known_location);
}

/* -------------------- SUBSCRIBER -------------------- */

/**
 * Start alert subscriber.
 *
 * PRE-CONDITIONS:
 * - NATS connection must be initialized.
 * - JetStream consumer must exist.
 *
 * POST-CONDITIONS:
 * - Listens to alert.created events.
 * - Stores alerts in database.
 * - Sends push notifications to relevant users.
 * - Acknowledges processed messages.
 */
export async function startAlertSubscriber() {
    try {
        const js = getJetStream();

        const alertRepository = new AlertRepository();
        const userService = new UserService(new UserRepository());
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

                    /* -------------------- SAVE ALERT -------------------- */

                    await alertRepository.createAlert({
                        alert_type: data.alert_type,
                        target_role: data.target_role,
                        alert_message: data.alert_message,
                        expires_at: new Date(
                            data.expires_at ?? Date.now() + 24 * 60 * 60 * 1000
                        ),
                        fire_id: data.fire_id,
                    });

                    /* -------------------- PUSH LOGIC -------------------- */

                    try {

                        const users = await userService.getUsersWithFcmByRole(data.target_role);
                        const fire = await fireRepository.getFireById(data.fire_id);

                        if (!fire) {
                            msg.ack();
                            continue;
                        }

                        const fireCoords = parsePoint(fire.fire_location);

                        if (!fireCoords) {
                            msg.ack();
                            continue;
                        }

                        const RADIUS_BY_ROLE = {
                            Resident: 10000,
                            Responder: 25000,
                            Municipality: 10000,
                        };

                        const radius = RADIUS_BY_ROLE[data.target_role] || 10000;

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
                                    type: data.alert_type || 'FireAlert',
                                },
                            });
                        } else {
                            console.log('⚠️ No users matched → no push sent');
                        }
                    } catch (pushErr) {
                        console.error('❌ Push error:', pushErr.message);
                    }

                    msg.ack();

                } catch (err) {
                    console.error(`[NATS] Error processing alert.created: ${err.message}`);
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start alert subscriber: ${err.message}`);
        throw err;
    }
}