// src/events/publishers/fireSpread.publisher.js
//
// Publish when a fire's severity/radius/affected area changes (spread).
// Triggers: fireAssignment subscriber (already consumes fire.spread) and other downstream systems.

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';

/**
 * Publish a fire.spread event.
 *
 * PRE-CONDITIONS:
 * - data must include fire_id, fire_location, and fire_severitylevel.
 * - Optionally include updated_fields describing what changed (e.g., severity, radius).
 * - NATS connection must be initialized.
 *
 * POST-CONDITIONS:
 * - Encodes and publishes the fire.spread event to JetStream.
 * - Triggers downstream subscribers (e.g., alert creation logic).
 * - Throws error if publishing fails.
 */
export async function publishFireSpread(data) {
    try {
        const js = getJetStream();

        const payload = sc.encode(JSON.stringify({
            fire_id:            data.fire_id,
            fire_location:      data.fire_location,   // WKT POINT or geo object
            fire_severitylevel: data.fire_severitylevel,
            updated_fields:     data.updated_fields ?? null,
            timestamp:          new Date().toISOString(),
        }));

        await js.publish(SUBJECTS.FIRE_SPREAD, payload);
        console.log(`[NATS] Published fire.spread for fire_id: ${data.fire_id}`);
    } catch (err) {
        console.error(`[NATS] Failed to publish fire.spread: ${err.message}`);
        throw err;
    }
}