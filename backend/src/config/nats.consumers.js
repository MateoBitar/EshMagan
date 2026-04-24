// src/config/nats.consumers.js
//
// Creates all JetStream durable consumers for the ESHMAGAN stream
// and starts all subscribers.
//
// Called once from app.js after connectNATS() completes.
// Each consumer is idempotent — safe to call on every startup.
// If a consumer already exists it is reused, not duplicated.

import { getJetStreamManager, SUBJECTS }  from './nats.js';
import { startFireDetectedSubscriber }    from '../events/subscribers/fireDetected.subscriber.js';
import { startAlertSubscriber }           from '../events/subscribers/alert.subscriber.js';
import { startNotificationSubscriber }    from '../events/subscribers/notification.subscriber.js';
import { startFireAssignmentSubscriber }  from '../events/subscribers/fireAssignment.subscriber.js';
import { startEvacuationSubscriber }      from '../events/subscribers/evacuation.subscriber.js';
import { AckPolicy, DeliverPolicy }       from 'nats';

/**
 * This file defines and initializes all NATS JetStream consumers.
 * It ensures consumers are created (if not existing) and starts
 * all event subscribers for the system.
 */

/**
 * Configuration of NATS consumers
 * 
 * PRE-CONDITIONS:
 * - SUBJECTS must be defined
 * 
 * POST-CONDITIONS:
 * - Provides consumer definitions used for setup
 */
const CONSUMERS = [
    {
        // Listens to fire.detected → publishes alert.created only (no DB write)
        name:           'fireDetected-consumer',
        filter_subject:  SUBJECTS.FIRE_DETECTED,
    },
    {
        name: 'alert-consumer',
        filter_subject: SUBJECTS.ALERT_CREATED,
    },
    {
        name: 'evacuation-consumer',
        filter_subject: SUBJECTS.EVACUATION_UPDATED,
    },
    {
        // Listens to fire.risk.predicted → creates Notifications per user near zone
        name:           'notification-consumer',
        filter_subject:  SUBJECTS.FIRE_RISK_PREDICTED,
    },
    {
        // Listens to assignment.created + fire.spread
        name:            'fireAssignment-consumer',
        filter_subjects: [SUBJECTS.ASSIGNMENT_CREATED, SUBJECTS.FIRE_SPREAD],
    },
];

/**
 * Setup and initialize all NATS consumers and subscribers
 * 
 * PRE-CONDITIONS:
 * - NATS connection must be established
 * - JetStream manager must be available
 * 
 * POST-CONDITIONS:
 * - All consumers are created or reused
 * - All subscribers are started
 */
export async function setupNATSConsumers() {
    const jsm = getJetStreamManager();

    for (const consumer of CONSUMERS) {
        try {
            // Check if consumer already exists
            await jsm.consumers.info('ESHMAGAN', consumer.name);
            console.log(`[NATS] Consumer "${consumer.name}" already exists`);
        } catch {
            // Create consumer if it does not exist
            const config = {
                durable_name:   consumer.name,
                ack_policy:     AckPolicy.Explicit,
                deliver_policy: DeliverPolicy.All,
            };

            if (consumer.filter_subject)  config.filter_subject  = consumer.filter_subject;
            if (consumer.filter_subjects) config.filter_subjects = consumer.filter_subjects;

            await jsm.consumers.add('ESHMAGAN', config);
            console.log(`[NATS] Consumer "${consumer.name}" created`);
        }
    }

    /**
     * Start all event subscribers
     * 
     * PRE-CONDITIONS:
     * - Consumers must be available
     * 
     * POST-CONDITIONS:
     * - All subscribers are actively listening to events
     */
    await startFireDetectedSubscriber();
    await startAlertSubscriber();
    await startNotificationSubscriber();
    await startFireAssignmentSubscriber();
    await startEvacuationSubscriber();

    console.log('[NATS] All subscribers started');
}