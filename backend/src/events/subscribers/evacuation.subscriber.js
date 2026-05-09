// src/events/subscribers/evacuation.subscriber.js
//
// Responsible for converting evacuation.updated → alert.created

import { getJetStream, sc, SUBJECTS } from '../../config/nats.js';
import { publishAlertCreated } from '../publishers/alertCreated.publisher.js';

const CONSUMER_NAME = 'evacuation-consumer';

const ALERT_ROLES = ['Resident', 'Responder', 'Municipality'];

// Small debounce window so route 1, 2, 3 updates become 1 grouped alert per role.
const EVACUATION_ALERT_DEBOUNCE_MS = 2500;

// Cooldown prevents repeated grouped alerts for the same fire when the backend
// publishes evacuation.updated in multiple waves.
const EVACUATION_ALERT_COOLDOWN_MS = 10 * 60 * 1000;

// fire_id -> pending evacuation summary
const pendingEvacuationAlerts = new Map();

// fire_id -> timestamp of last published grouped evacuation alert
const lastEvacuationAlertByFire = new Map();

/**
 * Flush one grouped evacuation alert for a fire.
 *
 * This sends one alert per role for the whole fire evacuation update,
 * not one alert per route.
 */
async function flushEvacuationAlert(fireId) {
    const pending = pendingEvacuationAlerts.get(fireId);

    if (!pending) {
        return;
    }

    pendingEvacuationAlerts.delete(fireId);

    const now = Date.now();
    const lastPublishedAt = lastEvacuationAlertByFire.get(fireId) || 0;

    if (now - lastPublishedAt < EVACUATION_ALERT_COOLDOWN_MS) {
        console.log(
            `[NATS] skipped duplicate evacuation alert for fire_id: ${fireId}`
        );
        return;
    }

    lastEvacuationAlertByFire.set(fireId, now);

    const routeCount = pending.routeIds.size;
    const priorities = [...pending.priorities]
        .filter(priority => Number.isFinite(priority))
        .sort((a, b) => a - b);

    const displayedRouteCount = routeCount > 0 ? routeCount : pending.updateCount;

    const routeText =
        displayedRouteCount === 1
            ? '1 evacuation route is available'
            : `${displayedRouteCount} evacuation routes are available`;

    const priorityText =
        priorities.length > 0
            ? ` Priorities: ${priorities.join(', ')}.`
            : '';

    const alertMessage =
        `${routeText} for this fire. Open the evacuation screen to view the safest route options.${priorityText}`;

    for (const role of ALERT_ROLES) {
        await publishAlertCreated({
            fire_id: fireId,
            alert_type: 'EvacuationAlert',
            target_role: role,
            alert_message: alertMessage,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
    }

    console.log(
        `[NATS] grouped evacuation alert published for fire_id: ${fireId}, routes: ${displayedRouteCount}`
    );
}

/**
 * Queue route update into a grouped fire-level alert.
 */
function queueEvacuationAlert(data) {
    const fireId = data.fire_id;

    if (!fireId) {
        console.warn('[NATS] evacuation.updated missing fire_id. Skipping alert grouping.');
        return;
    }

    let pending = pendingEvacuationAlerts.get(fireId);

    if (!pending) {
        pending = {
            routeIds: new Set(),
            priorities: new Set(),
            updateCount: 0,
            timer: null,
        };

        pendingEvacuationAlerts.set(fireId, pending);
    }

    pending.updateCount += 1;

    if (data.route_id) {
        pending.routeIds.add(data.route_id);
    }

    if (data.route_priority !== undefined && data.route_priority !== null) {
        const priority = Number(data.route_priority);

        if (Number.isFinite(priority)) {
            pending.priorities.add(priority);
        }
    }

    if (pending.timer) {
        clearTimeout(pending.timer);
    }

    pending.timer = setTimeout(() => {
        flushEvacuationAlert(fireId).catch((err) => {
            console.error(
                `[NATS] Failed to flush grouped evacuation alert for fire_id ${fireId}: ${err.message}`
            );
        });
    }, EVACUATION_ALERT_DEBOUNCE_MS);
}

/**
 * This file defines the evacuation subscriber.
 * It listens for evacuation.updated events from NATS JetStream
 * and converts them into grouped alert.created events for affected user roles.
 */

/**
 * Start evacuation subscriber.
 *
 * PRE-CONDITIONS:
 * - NATS connection must be initialized.
 * - JetStream consumer must exist.
 * - evacuation.updated events must be published to the stream.
 *
 * POST-CONDITIONS:
 * - Consumes evacuation.updated events.
 * - Groups multiple route updates for the same fire into one alert per role.
 * - Suppresses duplicate grouped evacuation alerts for the same fire during cooldown.
 * - Publishes alert.created events for Resident, Responder, and Municipality roles.
 * - Acknowledges successfully queued messages.
 * - Leaves failed messages unacknowledged so JetStream can retry.
 */
export async function startEvacuationSubscriber() {
    try {
        const js = getJetStream();

        const consumer = await js.consumers.get('ESHMAGAN', CONSUMER_NAME);
        const messages = await consumer.consume();

        console.log('[NATS] evacuation subscriber started');

        (async () => {
            for await (const msg of messages) {
                try {
                    if (msg.subject !== SUBJECTS.EVACUATION_UPDATED) {
                        msg.ack();
                        continue;
                    }

                    const data = JSON.parse(sc.decode(msg.data));

                    console.log(
                        `[NATS] evacuation.updated received for route_id: ${data.route_id}, fire_id: ${data.fire_id}`
                    );

                    queueEvacuationAlert(data);

                    msg.ack();

                } catch (err) {
                    console.error(`[NATS] Error processing evacuation.updated: ${err.message}`);
                    // no ack → JetStream retry
                }
            }
        })();
    } catch (err) {
        console.error(`[NATS] Failed to start evacuation subscriber: ${err.message}`);
        throw err;
    }
}