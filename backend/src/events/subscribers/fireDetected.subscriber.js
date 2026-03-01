// src/events/subscribers/fireDetected.subscriber.js
//
// Listens to fire.detected events.
// When a fire is confirmed by infrared and created in the DB:
//   1. Finds all residents near the fire location (within 5km)
//   2. Creates an Alert targeting Resident role
//   3. Publishes alert.created so notification.subscriber picks it up
import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { AlertRepository }            from '../../domain/repositories/alert.repository.js';
import { ResidentRepository }         from '../../domain/repositories/resident.repository.js';
import { publishAlertCreated }        from '../publishers/alertCreated.publisher.js';

const CONSUMER_NAME   = 'fireDetected-consumer';
const RADIUS_METERS   = 5000; // 5km danger zone around fire

export async function startFireDetectedSubscriber() {
    try {
        const js                = getJetStream();
        const alertRepository   = new AlertRepository();
        const residentRepository = new ResidentRepository();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);

        const messages = await consumer.consume();

        console.log('[NATS] fireDetected subscriber started');

        (async () => {
            for await (const msg of messages) {
                if (msg.subject !== SUBJECTS.FIRE_DETECTED) {
                    msg.ack();
                    continue;
                }

                try {
                    const data = JSON.parse(sc.decode(msg.data));
                    console.log(`[NATS] fireDetected received for fire_id: ${data.fire_id}`);

                    // Step 1: Parse fire location from WKT — "POINT(lng lat)"
                    const coords = parseWKTPoint(data.fire_location);
                    if (!coords) {
                        console.warn(`[NATS] Could not parse fire location: ${data.fire_location}`);
                        msg.ack();
                        continue;
                    }

                    // Step 2: Find residents within danger zone
                    const residents = await residentRepository.getResidentsByLastKnownLocation({
                        latitude:  coords.latitude,
                        longitude: coords.longitude,
                    });

                    if (!residents || residents.length === 0) {
                        console.log(`[NATS] No residents found near fire ${data.fire_id}`);
                        msg.ack();
                        continue;
                    }

                    console.log(`[NATS] ${residents.length} resident(s) near fire ${data.fire_id} — creating alert`);

                    // Step 3: Create a single alert targeting Resident role
                    const alert = await alertRepository.createAlert({
                        alert_type:    'FireAlert',
                        target_role:   'Resident',
                        alert_message: `Fire detected near your location. Severity: ${data.fire_severitylevel}. Please follow evacuation instructions immediately.`,
                        expires_at:    new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                        fire_id:       data.fire_id,
                    });

                    // Step 4: Publish alert.created so notification.subscriber creates
                    // individual notifications for each affected resident
                    await publishAlertCreated({
                        ...alert,
                        fire_location: data.fire_location,
                        radius_meters: RADIUS_METERS,
                    });

                    msg.ack();
                } catch (err) {
                    console.error(`[NATS] Error processing fire.detected: ${err.message}`);
                    // Do not ack — JetStream will redeliver after timeout
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start fireDetected subscriber: ${err.message}`);
        throw err;
    }
}

// HELPERS
function parseWKTPoint(wkt) {
    // Handles: "POINT(lng lat)"
    const match = wkt?.match(/POINT\(([^\s]+)\s+([^\)]+)\)/i);
    if (!match) return null;
    return {
        longitude: parseFloat(match[1]),
        latitude:  parseFloat(match[2]),
    };
}
