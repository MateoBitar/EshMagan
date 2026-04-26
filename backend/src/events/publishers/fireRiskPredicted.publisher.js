// src/events/publishers/fireRiskPredicted.publisher.js
//
// Published when a fire risk prediction is made for a specific zone.
// Triggers: notification.subscriber to create notifications for nearby residents/responders and municipalities.

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

/**
 * Publish fire.risk.predicted.
 *
 * This is for forecast/risk warnings, not active fire alerts.
 * It triggers notification.subscriber to create notifications
 * for nearby residents/responders and municipalities.
 */
export async function publishFireRiskPredicted(data) {
    try {
        if (!data.zone_location) {
            throw new Error('Missing required field: zone_location');
        }

        if (!data.risk_level) {
            throw new Error('Missing required field: risk_level');
        }

        const js = getJetStream();

        const payload = sc.encode(JSON.stringify({
            zone_location: data.zone_location, // WKT POINT(lng lat)
            risk_level: data.risk_level,
            fire_id: data.fire_id ?? null,
            timestamp: new Date().toISOString(),
        }));

        await js.publish(SUBJECTS.FIRE_RISK_PREDICTED, payload);

        console.log(
            `[NATS] Published fire.risk.predicted for zone: ${data.zone_location}`
        );
    } catch (err) {
        console.error(`[NATS] Failed to publish fire.risk.predicted: ${err.message}`);
        throw err;
    }
}