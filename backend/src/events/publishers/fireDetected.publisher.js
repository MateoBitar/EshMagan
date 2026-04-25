// src/events/publishers/fireDetected.publisher.js
//
// Published when an infrared camera confirms a fire and a fire event is created in the DB.
// Triggers: alert creation for residents near the fire location.

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

/**
 * This file defines the publisher responsible for emitting the "fire.detected"
 * event to the NATS JetStream system. It is used to notify downstream services
 * that a fire has been detected and stored, triggering alert generation workflows.
 */

export async function publishFireDetected(data) {

    /**
     * Publish a fire.detected event.
     *
     * PRE-CONDITIONS:
     * - data must include fire_id, fire_location, fire_severitylevel, and is_verified.
     * - assignment_id is optional.
     * - NATS connection must be initialized.
     *
     * POST-CONDITIONS:
     * - Encodes and publishes the fire.detected event to JetStream.
     * - Triggers downstream subscribers (e.g., alert creation logic).
     * - Throws error if publishing fails.
     */

    try {
        const js = getJetStream();

        const payload = sc.encode(JSON.stringify({
            fire_id:            data.fire_id,
            fire_location:      data.fire_location,   // WKT POINT string
            fire_severitylevel: data.fire_severitylevel,
            is_verified:        data.is_verified,
            assignment_id:      data.assignment_id ?? null,
            timestamp:          new Date().toISOString(),
        }));

        await js.publish(SUBJECTS.FIRE_DETECTED, payload);
        console.log(`[NATS] Published fire.detected for fire_id: ${data.fire_id}`);
    } catch (err) {
        console.error(`[NATS] Failed to publish fire.detected: ${err.message}`);
        throw err;
    }
}