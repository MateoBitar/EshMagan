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
import { NotificationRepository } from '../../domain/repositories/notification.repository.js';
import { ResidentRepository } from '../../domain/repositories/resident.repository.js';
import { ResponderRepository } from '../../domain/repositories/responder.repository.js';
import { MunicipalityRepository } from '../../domain/repositories/municipality.repository.js';
import { sendPushToTokens } from '../../services/push.service.js';
import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../domain/repositories/user.repository.js';

const CONSUMER_NAME = 'notification-consumer';
const PREDICTION_NOTIFICATION_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000; // 6 days
const recentPredictionNotifications = new Map();

/**
 * This file defines the notification subscriber.
 * It listens for fire.risk.predicted events and generates notifications
 * for residents, responders, and municipalities based on proximity and system rules.
 */

/**
 * Start notification subscriber.
 *
 * PRE-CONDITIONS:
 * - NATS connection must be initialized.
 * - JetStream consumer must exist.
 * - fire.risk.predicted events must be published.
 *
 * POST-CONDITIONS:
 * - Creates notifications for residents, responders, and municipalities.
 * - Sends push notifications if FCM tokens are available.
 * - Acknowledges successfully processed messages.
 * - Leaves failed messages unacknowledged for retry.
 */
export async function startNotificationSubscriber() {
    try {
        const js = getJetStream();
        const notificationRepository = new NotificationRepository();
        const residentRepository = new ResidentRepository();
        const responderRepository = new ResponderRepository();
        const municipalityRepository = new MunicipalityRepository();
        const userRepository = new UserRepository();
        const userService = new UserService(userRepository);

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] notification subscriber started');

        (async () => {
            for await (const msg of messages) {
                if (msg.subject === SUBJECTS.FIRE_RISK_PREDICTED) {
                    try {
                        const data = JSON.parse(sc.decode(msg.data));

                        /**
                         * Parse WKT location and prepare notification context.
                         *
                         * PRE-CONDITIONS:
                         * - zone_location must be a valid WKT POINT.
                         *
                         * POST-CONDITIONS:
                         * - Extracts coordinates or skips processing if invalid.
                         */
                        const coords = parseWKTPoint(data.zone_location);
                        if (!coords) {
                            console.warn(`[NATS] Could not parse zone location: ${data.zone_location}`);
                            msg.ack();
                            continue;
                        }

                        const locationQuery = { latitude: coords.latitude, longitude: coords.longitude };
                        const message = `High fire risk predicted in your area within the next 6 days. Risk level: ${data.risk_level}. Please prepare and follow safety guidelines.`;
                        const expires_at = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
                        const fire_id = data.fire_id ?? null;
                        let total = 0;
                        const dedupeLat = Math.round(coords.latitude * 10) / 10;
                        const dedupeLon = Math.round(coords.longitude * 10) / 10;
                        const dedupeKey = `${dedupeLat}:${dedupeLon}:${data.risk_level}`;
                        const lastSentAt = recentPredictionNotifications.get(dedupeKey);

                        if (lastSentAt && Date.now() - lastSentAt < PREDICTION_NOTIFICATION_COOLDOWN_MS) {
                            console.log(`[NATS] Skipping duplicate fire risk prediction notification: ${dedupeKey}`);
                            msg.ack();
                            continue;
                        }

                        recentPredictionNotifications.set(dedupeKey, Date.now());

                        /**
                         * Notify residents near danger zone.
                         *
                         * PRE-CONDITIONS:
                         * - ResidentRepository must return valid residents.
                         *
                         * POST-CONDITIONS:
                         * - Creates notification per resident.
                         * - Sends push notification if token exists.
                         */
                        const residents = await residentRepository.getResidentsByLastKnownLocation(locationQuery);
                        for (const resident of residents ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role: 'Resident',
                                    notification_message: message,
                                    notification_status: 'Sent',
                                    expires_at,
                                    fire_id,
                                    user_id: resident.resident_id,
                                });

                                const token = await userService.getFcmTokenByUserId(resident.resident_id);
                                if (token) {
                                    await sendPushToTokens([token], {
                                        title: 'EshMagan Notification',
                                        body: message,
                                        data: {
                                            type: 'GeneralNotification',
                                            user_id: resident.resident_id,
                                            fire_id: fire_id || '',
                                        },
                                        android: {
                                            priority: 'normal',
                                            notification: {
                                                channelId: 'notifications',
                                                sound: null,
                                            },
                                        },
                                    });
                                }
                                total++;
                            } catch (e) {
                                console.warn(`[NATS] Failed notification for resident ${resident.resident_id}: ${e.message}`);
                            }
                        }

                        /**
                         * Notify responders near danger zone.
                         */
                        const responders = await responderRepository.getRespondersByLastKnownLocation(locationQuery);
                        for (const responder of responders ?? []) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role: 'Responder',
                                    notification_message: message,
                                    notification_status: 'Sent',
                                    expires_at,
                                    fire_id,
                                    user_id: responder.responder_id,
                                });

                                const token = await userService.getFcmTokenByUserId(responder.responder_id);

                                if (token) {
                                    await sendPushToTokens([token], {
                                        title: 'EshMagan Notification',
                                        body: message,
                                        data: {
                                            type: 'GeneralNotification',
                                            user_id: responder.responder_id,
                                            fire_id: fire_id || '',
                                        },
                                        android: {
                                            priority: 'normal',
                                            notification: {
                                                channelId: 'notifications',
                                                sound: null,
                                            },
                                        },
                                    });
                                }
                                total++;
                            } catch (e) {
                                console.warn(`[NATS] Failed notification for responder ${responder.responder_id}: ${e.message}`);
                            }
                        }

                        /**
                         * Notify municipalities near danger zone.
                         */
                        const allMunicipalities = await municipalityRepository.getAllMunicipalities();

                        const municipalities = (allMunicipalities ?? []).filter(municipality => {
                            const loc = municipality.municipality_location;
                            if (!loc) return false;

                            const dist = distanceInMeters(locationQuery, {
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                            });

                            return dist <= 10000;
                        });

                        for (const municipality of municipalities) {
                            try {
                                await notificationRepository.createNotification({
                                    target_role: 'Municipality',
                                    notification_message: message,
                                    notification_status: 'Sent',
                                    expires_at,
                                    fire_id,
                                    user_id: municipality.municipality_id,
                                });

                                const token = await userService.getFcmTokenByUserId(municipality.municipality_id);
                                if (token) {
                                    await sendPushToTokens([token], {
                                        title: 'EshMagan Notification',
                                        body: message,
                                        data: {
                                            type: 'GeneralNotification',
                                            user_id: municipality.municipality_id,
                                            fire_id: fire_id || '',
                                        },
                                        android: {
                                            priority: 'normal',
                                            notification: {
                                                channelId: 'notifications',
                                                sound: null,
                                            },
                                        },
                                    });
                                }
                                total++;
                            } catch (e) {
                                console.warn(`[NATS] Failed notification for municipality ${municipality.municipality_id}: ${e.message}`);
                            }
                        }

                        msg.ack();

                    } catch (err) {
                        console.error(`[NATS] Error processing fire.risk.predicted: ${err.message}`);
                    }
                } else {
                    msg.ack();
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start notification subscriber: ${err.message}`);
        throw err;
    }
}

/**
 * Parse WKT POINT string.
 *
 * PRE-CONDITIONS:
 * - wkt must be a valid POINT string.
 *
 * POST-CONDITIONS:
 * - Returns coordinates object or null if invalid.
 */
function parseWKTPoint(wkt) {
    const match = wkt?.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
    if (!match) return null;
    return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2]),
    };
}

/**
 * Calculate distance in meters between two coordinate pairs.
 *
 * PRE-CONDITIONS:
 * - a and b must be objects with latitude and longitude properties.
 *
 * POST-CONDITIONS:
 * - Returns distance in meters or Infinity if invalid.
 */
function distanceInMeters(a, b) {
    if (!a || !b) return Infinity;

    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371000;

    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * y;
}